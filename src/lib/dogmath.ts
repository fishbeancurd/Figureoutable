import type { Dog, LogEntry, SizeClass } from './types';
import { ADULT_AT_WEEKS, exerciseTargetMinutes, mealsPerDay, stageFor, type Stage } from '@/data/stages';

const DAY = 24 * 60 * 60 * 1000;

export function ageWeeks(birthISO: string, now = new Date()): number {
  return Math.max(0, (now.getTime() - new Date(birthISO).getTime()) / (7 * DAY));
}

export function ageLabel(weeks: number): string {
  if (weeks < 17) return `${Math.floor(weeks)} weeks`;
  const months = Math.floor(weeks / 4.345);
  if (months < 24) return `${months} months`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m ? `${y} yr ${m} mo` : `${y} years`;
}

// Fraction of adult weight reached at a given age in weeks, by size class.
// Larger breeds grow for longer. These are smoothed population averages, not a diagnosis.
const GROWTH: Record<SizeClass, [number, number][]> = {
  toy: [[0, 0.05], [8, 0.22], [12, 0.35], [16, 0.5], [26, 0.78], [36, 0.93], [43, 1]],
  small: [[0, 0.05], [8, 0.2], [12, 0.32], [16, 0.46], [26, 0.74], [36, 0.9], [47, 1]],
  medium: [[0, 0.04], [8, 0.15], [12, 0.27], [16, 0.4], [26, 0.65], [39, 0.86], [52, 0.97], [56, 1]],
  large: [[0, 0.03], [8, 0.12], [12, 0.22], [16, 0.33], [26, 0.55], [39, 0.75], [52, 0.9], [70, 1]],
  giant: [[0, 0.02], [8, 0.09], [12, 0.18], [16, 0.27], [26, 0.45], [39, 0.65], [52, 0.8], [78, 0.93], [96, 1]],
};

export function expectedFraction(weeks: number, size: SizeClass): number {
  const t = GROWTH[size];
  if (weeks >= t[t.length - 1][0]) return 1;
  for (let i = 1; i < t.length; i++) {
    const [w1, f1] = t[i];
    const [w0, f0] = t[i - 1];
    if (weeks <= w1) return f0 + ((weeks - w0) / (w1 - w0)) * (f1 - f0);
  }
  return 1;
}

export function expectedWeightKg(dog: Dog, weeks: number): number {
  return dog.adultWeightKg * expectedFraction(weeks, dog.size);
}

export function latestWeightKg(dog: Dog): number | undefined {
  if (!dog.weights.length) return undefined;
  return [...dog.weights].sort((a, b) => a.date.localeCompare(b.date))[dog.weights.length - 1].kg;
}

export interface CalorieTarget {
  daily: number;
  weekly: number;
  monthly: number;
  perMeal: number;
  meals: number;
  treatBudget: number;
  factor: number;
  basisKg: number;
  explain: string;
}

/**
 * Resting energy requirement (RER = 70 × kg^0.75) multiplied by a life-stage factor,
 * following common veterinary nutrition guidance (puppies under 4 months ×3, growing ×2,
 * adults ×1.6 neutered / ×1.8 intact, seniors ×1.4), adjusted for activity.
 */
export function calorieTarget(dog: Dog, now = new Date()): CalorieTarget {
  const weeks = ageWeeks(dog.birthDate, now);
  const stage = stageFor(weeks, dog.size);
  const basisKg = latestWeightKg(dog) ?? Math.max(0.5, expectedWeightKg(dog, weeks));
  const rer = 70 * Math.pow(basisKg, 0.75);
  let factor: number;
  let explain: string;
  if (weeks < 17) {
    factor = 3;
    explain = 'Puppies under 4 months need about 3× resting energy to fuel fast growth.';
  } else if (weeks < ADULT_AT_WEEKS[dog.size]) {
    factor = 2;
    explain = 'Growing dogs from 4 months to adulthood need about 2× resting energy.';
  } else if (stage.id === 'senior') {
    factor = dog.neutered ? 1.4 : 1.5;
    explain = 'Seniors usually need a little less as they slow down.';
  } else {
    factor = dog.neutered ? 1.6 : 1.8;
    explain = `Adult ${dog.neutered ? 'neutered' : 'intact'} dogs need about ${factor}× resting energy.`;
  }
  const actMul = dog.activity === 'high' ? 1.2 : dog.activity === 'low' ? 0.9 : 1;
  const daily = Math.round((rer * factor * actMul) / 5) * 5;
  const meals = mealsPerDay(weeks, stage.id);
  return {
    daily,
    weekly: daily * 7,
    monthly: daily * 30,
    perMeal: Math.round(daily * 0.9 / meals),
    meals,
    treatBudget: Math.round(daily * 0.1),
    factor: factor * actMul,
    basisKg,
    explain,
  };
}

export function dayKey(d: Date | string): string {
  const x = typeof d === 'string' ? new Date(d) : d;
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

export function logsOn(logs: LogEntry[], day: Date): LogEntry[] {
  const k = dayKey(day);
  return logs.filter((l) => dayKey(l.at) === k);
}

export function sumKcal(logs: LogEntry[]): number {
  return logs.reduce((s, l) => s + (l.type === 'meal' || l.type === 'treat' ? l.kcal ?? 0 : 0), 0);
}

export function sumMinutes(logs: LogEntry[], types: LogEntry['type'][]): number {
  return logs.reduce((s, l) => s + (types.includes(l.type) ? l.minutes ?? 0 : 0), 0);
}

export function lastNDays(n: number, now = new Date()): Date[] {
  const out: Date[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    out.push(d);
  }
  return out;
}

export interface DogSnapshot {
  weeks: number;
  stage: Stage;
  cal: CalorieTarget;
  exerciseTarget: number;
}

export function snapshot(dog: Dog, now = new Date()): DogSnapshot {
  const weeks = ageWeeks(dog.birthDate, now);
  const stage = stageFor(weeks, dog.size);
  return {
    weeks,
    stage,
    cal: calorieTarget(dog, now),
    exerciseTarget: exerciseTargetMinutes(weeks, stage.id, dog.activity),
  };
}

// ---------- Gamification ----------

export const XP_FOR: Record<LogEntry['type'], number> = {
  meal: 10,
  treat: 5,
  walk: 20,
  play: 15,
  training: 25,
  potty: 10,
  grooming: 20,
  sleep: 5,
  health: 10,
  weight: 15,
};

export function levelFromXp(xp: number) {
  // Each level needs more XP than the last: 250, 400, 550, ...
  let level = 1;
  let need = 250;
  let rest = xp;
  while (rest >= need) {
    rest -= need;
    level += 1;
    need += 150;
  }
  return { level, into: rest, need };
}

export const LEVEL_TITLES = [
  'New Friend',
  'Curious Pup',
  'Sniff Scout',
  'Treat Tracker',
  'Walk Wizard',
  'Potty Pro',
  'Trick Trainer',
  'Pack Leader',
  'Dog Whisperer',
  'Legendary Human',
];

export function levelTitle(level: number) {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
}

export function streakDays(logs: LogEntry[], now = new Date()): number {
  const days = new Set(logs.map((l) => dayKey(l.at)));
  let streak = 0;
  const d = new Date(now);
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1); // today not logged yet keeps yesterday's streak
  while (days.has(dayKey(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
