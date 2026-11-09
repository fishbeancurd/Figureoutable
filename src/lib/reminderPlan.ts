import type { RoutineItem } from './types';

export interface Reminder {
  title: string; // e.g. "Breakfast"
  time: string;
  days: number[];
  dogNames: string[];
}

export function joinNames(names: string[]) {
  return names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/**
 * The same task at the same time for several dogs becomes one reminder ("Breakfast for Mochi and Pepper").
 * Phones cap pending reminders (iOS allows 64), so the earliest tasks are kept if there are too many.
 */
export function mergeReminders(dogs: { dogName: string; routine: RoutineItem[] }[]): Reminder[] {
  const map = new Map<string, Reminder>();
  for (const { dogName, routine } of dogs) {
    for (const item of routine) {
      if (!item.remind) continue;
      const title = item.title.split(' · ')[0];
      const key = `${item.time}|${[...item.days].sort().join(',')}|${title.toLowerCase()}`;
      const existing = map.get(key);
      if (existing) {
        if (!existing.dogNames.includes(dogName)) existing.dogNames.push(dogName);
      } else map.set(key, { title, time: item.time, days: item.days, dogNames: [dogName] });
    }
  }
  return [...map.values()].sort((a, b) => a.time.localeCompare(b.time));
}

