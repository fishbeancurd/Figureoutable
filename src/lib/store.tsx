import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppState, Dog, Food, LogEntry, Owner } from './types';
import { uid, isoDate } from './util';
import { XP_FOR, computeXp, levelFromXp, snapshot, streakDays, dayKey } from './dogmath';
import { buildRoutine } from './routine';
import { LESSONS } from '@/data/learn';

const KEY = 'pawgress:state:v1';

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
});

export function totalXp(s: AppState): number {
  const fromLogs = s.logs.reduce((n, l) => n + (l.xp ?? XP_FOR[l.type]), 0);
  const fromLessons = Object.values(s.lessonSteps).reduce((n, steps) => n + steps.length * 10, 0);
  const fromChecklists = Object.values(s.checklists).reduce((n, items) => n + items.length * 5, 0);
  const fromMilestones = Object.keys(s.milestones).length * 50;
  const fromRoutine = Object.values(s.routineDone).reduce((n, ids) => n + ids.length * 5, 0);
  return fromLogs + fromLessons + fromChecklists + fromMilestones + fromRoutine;
}

interface Store {
  ready: boolean;
  state: AppState;
  update: (fn: (s: AppState) => AppState) => void;
  addLog: (entry: Omit<LogEntry, 'id' | 'at'> & { at?: string }) => { xp: number; leveledUp: boolean };
  reset: () => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [ready, setReady] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          // Older saves had only a server address: treat a saved address as "server" mode.
          if (!saved.aiMode) saved.aiMode = saved.aiProxyUrl ? 'server' : 'demo';
          setState({ ...initialState(), ...saved });
        }
      } catch {
        // Corrupt or unreadable storage: start fresh rather than crash.
      }
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
    }, 300);
  }, [state, ready]);

  const update = useCallback((fn: (s: AppState) => AppState) => setState((s) => fn(s)), []);

  const addLog: Store['addLog'] = useCallback((entry) => {
    const log: LogEntry = { ...entry, id: uid(), at: entry.at ?? new Date().toISOString() } as LogEntry;
    const apply = (s: AppState): AppState => {
      const next = { ...s, logs: [log, ...s.logs] };
      if (log.type === 'weight' && log.kg && next.dog) {
        const d = isoDate(new Date(log.at));
        next.dog = { ...next.dog, weights: [...next.dog.weights.filter((w) => w.date !== d), { date: d, kg: log.kg }] };
      }
      return next;
    };
    const before = levelFromXp(totalXp(stateRef.current)).level;
    const next = apply(stateRef.current);
    stateRef.current = next; // keeps rapid back-to-back logs from overwriting each other
    setState(apply);
    const after = levelFromXp(totalXp(next)).level;
    return { xp: log.xp ?? XP_FOR[log.type], leveledUp: after > before };
  }, []);

  const reset = useCallback(() => {
    AsyncStorage.removeItem(KEY).catch(() => {});
    setState(initialState());
  }, []);

  const value = useMemo(() => ({ ready, state, update, addLog, reset }), [ready, state, update, addLog, reset]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside StoreProvider');
  return s;
}

export function useGame() {
  const { state } = useStore();
  return useMemo(() => {
    const xp = totalXp(state);
    return { xp, ...levelFromXp(xp), streak: streakDays(state.logs) };
  }, [state]);
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
