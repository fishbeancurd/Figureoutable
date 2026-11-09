// Pure app-state logic: defaults, several-dogs helpers, XP totals and the sample pup.
// No React or native imports here, so it can be tested in plain Node.

import type { AppState, Dog, DogData, Food, LogEntry, Owner, RoutineItem } from './types';
import { uid, isoDate } from './util';
import { XP_FOR, computeXp, snapshot, dayKey } from './dogmath';
import { buildRoutine } from './routine';
import { LESSONS } from '@/data/learn';

export const DEFAULT_OWNER: Owner = {
  name: '',
  wake: '07:00',
  bed: '22:30',
  workStart: '09:00',
  workEnd: '17:30',
  workDays: [1, 2, 3, 4, 5],
  worksFromHome: false,
};

export const DEFAULT_FOODS = (): Food[] => [
  { id: uid(), name: 'Puppy kibble', kind: 'meal', kcalPerUnit: 380, unit: 'cup', liking: 'likes', reaction: 'none', notes: 'Check your bag for the exact kcal per cup.' },
  { id: uid(), name: 'Soft training treats', kind: 'treat', kcalPerUnit: 3, unit: 'piece', liking: 'loves', treatValue: 'medium', reaction: 'none' },
  { id: uid(), name: 'Plain cooked chicken', kind: 'treat', kcalPerUnit: 1.6, unit: 'g', liking: 'loves', treatValue: 'high', reaction: 'none' },
  { id: uid(), name: 'Carrot sticks', kind: 'fresh', kcalPerUnit: 4, unit: 'piece', liking: 'meh', treatValue: 'low', reaction: 'none' },
];

export const initialState = (): AppState => ({
  version: 1,
  onboarded: false,
  owner: DEFAULT_OWNER,
  dog: null,
  foods: DEFAULT_FOODS(),
  logs: [],
  routine: [],
  routineDone: {},
  lessonSteps: {},
  checklists: {},
  milestones: {},
  chat: [],
  aiMode: 'demo',
  aiProxyUrl: '',
  aiToken: '',
  remindersOn: true,
  customSkills: [],
  unlockedLevels: [],
  otherDogs: [],
  dogOrder: [],
});

// ---------- Several dogs ----------

export const DOG_FIELDS = ['dog', 'foods', 'logs', 'routine', 'routineDone', 'lessonSteps', 'checklists', 'milestones', 'chat', 'customSkills', 'unlockedLevels'] as const;

/** The active dog's data, lifted out of the top level of the state. */
export function activeDogData(s: AppState): DogData | null {
  if (!s.dog) return null;
  return {
    dog: s.dog,
    foods: s.foods,
    logs: s.logs,
    routine: s.routine,
    routineDone: s.routineDone,
    lessonSteps: s.lessonSteps,
    checklists: s.checklists,
    milestones: s.milestones,
    chat: s.chat,
    customSkills: s.customSkills,
    unlockedLevels: s.unlockedLevels,
  };
}

/** All dogs in display order, with the active dog's latest data. */
export function allDogs(s: AppState): DogData[] {
  const active = activeDogData(s);
  const list = [...(active ? [active] : []), ...s.otherDogs];
  const order = s.dogOrder.length ? s.dogOrder : list.map((d) => d.dog.id);
  const rank = (id: string) => (order.includes(id) ? order.indexOf(id) : order.length);
  return list.sort((a, b) => rank(a.dog.id) - rank(b.dog.id));
}

export function freshDogData(dog: Dog, routine: RoutineItem[]): DogData {
  return { dog, foods: DEFAULT_FOODS(), logs: [], routine, routineDone: {}, lessonSteps: {}, checklists: {}, milestones: {}, chat: [], customSkills: [], unlockedLevels: [] };
}

/** Makes another dog the active one: the current dog's data moves into otherDogs. */
export function switchDogState(s: AppState, id: string): AppState {
  if (!s.dog || s.dog.id === id) return s;
  const target = s.otherDogs.find((d) => d.dog.id === id);
  if (!target) return s;
  const current = activeDogData(s)!;
  const dogOrder = s.dogOrder.length ? s.dogOrder : [current.dog.id, ...s.otherDogs.map((d) => d.dog.id)];
  return { ...s, ...target, otherDogs: [...s.otherDogs.filter((d) => d.dog.id !== id), current], dogOrder };
}

/** Adds a dog and makes it active. */
export function addDogState(s: AppState, data: DogData): AppState {
  const current = activeDogData(s);
  const order = s.dogOrder.length ? s.dogOrder : current ? [current.dog.id] : [];
  return {
    ...s,
    ...data,
    onboarded: true,
    otherDogs: current ? [...s.otherDogs, current] : s.otherDogs,
    dogOrder: [...order.filter((x) => x !== data.dog.id), data.dog.id],
  };
}

/** Removes a dog. If it was active, the next dog becomes active. Never removes the last dog. */
export function removeDogState(s: AppState, id: string): AppState {
  const dogs = allDogs(s);
  if (dogs.length < 2) return s;
  const dogOrder = s.dogOrder.filter((x) => x !== id);
  if (s.dog?.id !== id) return { ...s, otherDogs: s.otherDogs.filter((d) => d.dog.id !== id), dogOrder };
  const next = dogs.find((d) => d.dog.id !== id)!;
  return { ...s, ...next, otherDogs: s.otherDogs.filter((d) => d.dog.id !== next.dog.id), dogOrder };
}

/** Applies a change to one dog's data, whether it is the active dog or not. */
export function updateDogData(s: AppState, id: string, fn: (d: DogData) => DogData): AppState {
  if (s.dog?.id === id) return { ...s, ...fn(activeDogData(s)!) };
  return { ...s, otherDogs: s.otherDogs.map((d) => (d.dog.id === id ? fn(d) : d)) };
}

function dogXp(d: Pick<DogData, 'logs' | 'lessonSteps' | 'checklists' | 'milestones' | 'routineDone'>): number {
  const fromLogs = d.logs.reduce((n, l) => n + (l.xp ?? XP_FOR[l.type]), 0);
  const fromLessons = Object.values(d.lessonSteps).reduce((n, steps) => n + steps.length * 10, 0);
  const fromChecklists = Object.values(d.checklists).reduce((n, items) => n + items.length * 5, 0);
  const fromMilestones = Object.keys(d.milestones).length * 50;
  const fromRoutine = Object.values(d.routineDone).reduce((n, ids) => n + ids.length * 5, 0);
  return fromLogs + fromLessons + fromChecklists + fromMilestones + fromRoutine;
}

/** XP belongs to you, the owner: caring for every dog in the household counts. */
export function totalXp(s: AppState): number {
  return dogXp(s) + s.otherDogs.reduce((n, d) => n + dogXp(d), 0);
}

// ---------- Sample pup ----------

/** Fills two weeks of realistic logs so a new user can explore every screen before adding their own dog. */
export function sampleState(): AppState {
  const now = new Date();
  const birth = new Date(now);
  birth.setDate(birth.getDate() - 7 * 14 - 3);
  const home = new Date(now);
  home.setDate(home.getDate() - 7 * 5);
  const dog: Dog = {
    id: uid(),
    name: 'Mochi',
    breed: 'Shiba Inu',
    size: 'medium',
    sex: 'female',
    birthDate: isoDate(birth),
    homecomingDate: isoDate(home),
    adultWeightKg: 9.5,
    neutered: false,
    activity: 'normal',
    allergies: ['Chicken (itchy skin)'],
    furColor: '#E9B48C',
    weights: [],
  };
  const owner: Owner = { ...DEFAULT_OWNER, name: 'Sam' };
  const foods: Food[] = [
    { id: uid(), name: 'Salmon puppy kibble', kind: 'meal', kcalPerUnit: 390, unit: 'cup', liking: 'likes', reaction: 'none' },
    { id: uid(), name: 'Freeze-dried liver', kind: 'treat', kcalPerUnit: 4, unit: 'piece', liking: 'loves', treatValue: 'high', reaction: 'none', notes: 'Jackpot for recall' },
    { id: uid(), name: 'Plain cooked chicken', kind: 'treat', kcalPerUnit: 1.6, unit: 'g', liking: 'loves', treatValue: 'high', reaction: 'allergy', notes: 'Itchy paws the next day' },
    { id: uid(), name: 'Soft training treats', kind: 'treat', kcalPerUnit: 3, unit: 'piece', liking: 'likes', treatValue: 'medium', reaction: 'none' },
    { id: uid(), name: 'Blueberries', kind: 'fresh', kcalPerUnit: 1, unit: 'piece', liking: 'likes', treatValue: 'low', reaction: 'none' },
    { id: uid(), name: 'Carrot sticks', kind: 'fresh', kcalPerUnit: 4, unit: 'piece', liking: 'dislikes', treatValue: 'low', reaction: 'none' },
    { id: uid(), name: 'Yak chew', kind: 'chew', kcalPerUnit: 60, unit: 'piece', liking: 'loves', treatValue: 'high', reaction: 'upset', notes: 'Soft stool if more than one a week' },
  ];
  const [kibble, liver, chicken, soft, blue] = foods;
  const logs: LogEntry[] = [];
  const at = (daysAgo: number, h: number, m = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };
  const rnd = (seed: number) => {
    const x = Math.sin(seed * 9301 + 49297) * 233280;
    return x - Math.floor(x);
  };
  for (let day = 13; day >= 0; day--) {
    const isToday = day === 0;
    const hoursLimit = isToday ? now.getHours() : 24;
    const mealsTimes = [7.3, 12, 17.5];
    mealsTimes.forEach((t, i) => {
      if (t > hoursLimit) return;
      const amt = 0.55 + rnd(day * 7 + i) * 0.12;
      logs.push({ id: uid(), type: 'meal', at: at(day, Math.floor(t), (t % 1) * 60), foodId: kibble.id, foodName: kibble.name, amount: +amt.toFixed(2), kcal: Math.round(amt * kibble.kcalPerUnit), liking: 'likes', reaction: 'none' });
    });
    const treats = [liver, soft, blue];
    for (let i = 0; i < 3; i++) {
      const t = 9 + i * 4;
      if (t > hoursLimit) continue;
      const f = treats[i];
      const n = 2 + Math.floor(rnd(day * 3 + i) * 4);
      logs.push({ id: uid(), type: 'treat', at: at(day, t, 30), foodId: f.id, foodName: f.name, amount: n, kcal: Math.round(n * f.kcalPerUnit), liking: f.liking, reaction: 'none' });
    }
    if (day === 9) logs.push({ id: uid(), type: 'treat', at: at(day, 15), foodId: chicken.id, foodName: chicken.name, amount: 20, kcal: 32, liking: 'loves', reaction: 'allergy', note: 'Scratching paws the next morning' });
    if (8 <= hoursLimit) logs.push({ id: uid(), type: 'walk', at: at(day, 8), minutes: 12 + Math.floor(rnd(day) * 8) });
    if (18 <= hoursLimit) logs.push({ id: uid(), type: 'walk', at: at(day, 18), minutes: 15 + Math.floor(rnd(day + 50) * 10) });
    if (10 <= hoursLimit) logs.push({ id: uid(), type: 'training', at: at(day, 10), minutes: 5, skill: ['Sit', 'Name game', 'Come when called', 'Down'][day % 4], rating: day % 3 === 0 ? 'nailed' : day % 3 === 1 ? 'okay' : 'struggled' });
    if (20 <= hoursLimit && day % 2 === 0) logs.push({ id: uid(), type: 'play', at: at(day, 20), minutes: 15 });
    for (let p = 0; p < 6; p++) {
      const t = 7 + p * 2.5;
      if (t > hoursLimit) continue;
      const accident = day > 7 && p === 3 && rnd(day) > 0.5;
      logs.push({ id: uid(), type: 'potty', at: at(day, Math.floor(t), 15), potty: p % 2 === 0 ? 'both' : 'pee', accident, stool: p % 2 === 0 ? (day === 4 ? 'soft' : 'firm') : undefined });
    }
    if (day % 3 === 0 && 21 <= hoursLimit) logs.push({ id: uid(), type: 'grooming', at: at(day, 21), groom: day % 6 === 0 ? 'brush' : 'teeth' });
    if (day === 4) logs.push({ id: uid(), type: 'health', at: at(day, 16), symptom: 'Soft stool', note: 'After yak chew' });
  }
  // Weekly weigh-ins
  const weights = [12, 13, 14].map((wk, i) => {
    const d = new Date(birth);
    d.setDate(d.getDate() + wk * 7);
    return { date: isoDate(d), kg: [2.8, 3.1, 3.45][i] };
  });
  dog.weights = weights;
  weights.forEach((w) => logs.push({ id: uid(), type: 'weight', at: new Date(w.date + 'T09:00:00').toISOString(), kg: w.kg }));

  // Give the sample logs the same effort-based XP that real logs earn.
  const cal = snapshot(dog, now).cal;
  for (const l of logs) l.xp = computeXp(l, { perMeal: cal.perMeal, treatBudgetLeft: cal.treatBudget }).xp;

  const routine = buildRoutine(dog, owner);
  const todayKey = dayKey(now);
  const doneToday = routine.filter((r) => r.time < `${String(now.getHours()).padStart(2, '0')}:00`).map((r) => r.id);

  return {
    ...initialState(),
    onboarded: true,
    owner,
    dog,
    foods,
    logs: logs.sort((a, b) => b.at.localeCompare(a.at)),
    routine,
    routineDone: { [todayKey]: doneToday },
    lessonSteps: { name: [0, 1, 2, 3, 4], sit: [0, 1, 2, 3], potty: [0, 1, 2, 3], crate: [0, 1], come: [0, 1] },
    checklists: {
      supplies: ['crate', 'bowls', 'food', 'collar', 'harness', 'treats', 'chews', 'enzyme', 'bags'],
      admin: ['vet', 'firstvisit', 'chip', 'vax'],
      social: ['kids', 'hats', 'cars', 'vacuum', 'doorbell'],
    },
    milestones: { home: isoDate(home), night: isoDate(new Date(home.getTime() + 3 * 86400000)), vet1: isoDate(new Date(home.getTime() + 5 * 86400000)), name: isoDate(new Date(home.getTime() + 9 * 86400000)), sit: isoDate(new Date(home.getTime() + 16 * 86400000)) },
    chat: [],
  };
}

export const lessonProgress = (s: AppState, id: string) => {
  const lesson = LESSONS.find((l) => l.id === id)!;
  return { done: (s.lessonSteps[id] ?? []).length, total: lesson.steps.length };
};
