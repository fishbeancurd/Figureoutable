import type { Dog, Owner, RoutineItem } from './types';
import { snapshot } from './dogmath';
import { pottyHoldHours } from '@/data/stages';
import { findBreed } from '@/data/breeds';
import { uid } from './util';

export const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};
export const fromMin = (min: number) => {
  const m = ((Math.round(min / 5) * 5) % 1440 + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};
export const fmtTime = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  const ap = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ap}`;
};

const ALL = [0, 1, 2, 3, 4, 5, 6];

/**
 * Builds a suggested daily structure from the owner's day (wake, work, bed) and the dog's needs
 * (meals for its age, how long it can hold its bladder, exercise target). Everything is editable after.
 */
export function buildRoutine(dog: Dog, owner: Owner): RoutineItem[] {
  const s = snapshot(dog);
  const wake = toMin(owner.wake);
  let bed = toMin(owner.bed);
  if (bed <= wake) bed += 1440;
  const workStart = toMin(owner.workStart);
  const workEnd = toMin(owner.workEnd);
  const hold = pottyHoldHours(s.weeks) * 60;
  const items: RoutineItem[] = [];
  const add = (title: string, type: RoutineItem['type'], at: number, minutes?: number, days = ALL) =>
    items.push({ id: uid(), title, type, time: fromMin(at), minutes, days, remind: true });

  const young = ['baby', 'puppy', 'junior'].includes(s.stage.id);

  // Morning
  add('Wake-up potty break', 'potty-break', wake, 5);

  // Meals spread across the waking day, the last at least 3 h before bed.
  const firstMeal = wake + 20;
  const lastMeal = Math.max(firstMeal + 60, bed - 180);
  const meals = s.cal.meals;
  const mealNames = meals === 4 ? ['Breakfast', 'Lunch', 'Afternoon meal', 'Dinner'] : meals === 3 ? ['Breakfast', 'Lunch', 'Dinner'] : ['Breakfast', 'Dinner'];
  for (let i = 0; i < meals; i++) {
    const t = meals === 1 ? firstMeal : firstMeal + ((lastMeal - firstMeal) * i) / (meals - 1);
    add(`${mealNames[i]} · about ${s.cal.perMeal} kcal`, 'meal-time', t, 10);
  }

  // Walks: split the exercise target in two, around the owner's day.
  const walkEach = Math.max(5, Math.round(s.exerciseTarget / 2 / 5) * 5);
  add(young ? `Short walk and sniff · ${walkEach} min` : `Morning walk · ${walkEach} min`, 'walk', firstMeal + 30, walkEach);
  const eveningWalk = owner.worksFromHome ? Math.max(workEnd, wake + 9 * 60) : workEnd + 20;
  add(young ? `Play and explore · ${walkEach} min` : `Evening walk · ${walkEach} min`, 'walk', Math.min(eveningWalk, bed - 90), walkEach);

  // Training: short sessions for young dogs.
  if (young) {
    add('Training session · 5 min', 'training', firstMeal + 75, 5);
    add('Training session · 5 min', 'training', Math.min(eveningWalk + 60, bed - 60), 5);
    add('Crate nap', 'nap', firstMeal + 90, 90);
  } else {
    add('Training or brain game · 10 min', 'training', Math.min(eveningWalk + 60, bed - 60), 10);
  }

  // Potty breaks through the day so gaps never exceed what the dog can hold.
  const fixed = items.map((i) => toMin(i.time)).concat([bed - 15]).sort((a, b) => a - b);
  let last = wake;
  for (const t of fixed) {
    while (t - last > hold) {
      last += hold;
      const workday = !owner.worksFromHome && last >= workStart && last <= workEnd;
      add(
        workday ? 'Potty break · walker or home visit' : 'Potty break',
        'potty-break',
        last,
        5,
        workday ? owner.workDays : ALL,
      );
    }
    last = Math.max(last, t);
  }

  // Grooming
  add('Brush teeth', 'grooming', bed - 40, 3);
  const coat = findBreed(dog.breed)?.coat ?? 'short';
  const brushDays = coat === 'long' || coat === 'curly' ? ALL : coat === 'double' ? [1, 3, 6] : [6];
  add('Brush coat', 'grooming', bed - 70, coat === 'short' ? 5 : 10, brushDays);
  add('Nail check and paw handling', 'grooming', wake + 600 > bed - 120 ? bed - 120 : wake + 600, 5, [0]);

  // Night
  add('Last potty break, then bed', 'potty-break', bed - 15, 5);
  if (young && pottyHoldHours(s.weeks) <= 3) {
    add('Night potty trip (quiet and boring)', 'potty-break', bed + Math.min(hold, 240), 5);
  }

  return items.sort((a, b) => a.time.localeCompare(b.time));
}

export const ROUTINE_TYPE_TINT: Record<string, 'peach' | 'butter' | 'mint' | 'lavender' | 'sky' | 'rose'> = {
  'meal-time': 'peach',
  meal: 'peach',
  'potty-break': 'butter',
  potty: 'butter',
  walk: 'mint',
  play: 'mint',
  training: 'lavender',
  nap: 'sky',
  sleep: 'sky',
  grooming: 'rose',
  health: 'rose',
  treat: 'peach',
  weight: 'lavender',
};
