import type { SizeClass } from '@/lib/types';
import type { TintName } from '@/constants/theme';

export type StageId = 'baby' | 'puppy' | 'junior' | 'adolescent' | 'adult' | 'senior';

export interface Stage {
  id: StageId;
  name: string;
  nickname: string;
  tint: TintName;
  summary: string;
  mealsPerDay: string;
  sleep: string;
  focus: string[];
}

export const STAGES: Stage[] = [
  {
    id: 'baby',
    name: 'Baby puppy',
    nickname: 'Homecoming',
    tint: 'peach',
    summary:
      'Everything is new. Keep the world small, predictable and gentle. Sleep, potty trips and short play are the whole day.',
    mealsPerDay: '4 small meals',
    sleep: '18 to 20 hours a day',
    focus: ['Potty routine', 'Crate as a safe den', 'Name and gentle handling', 'Calm socialization'],
  },
  {
    id: 'puppy',
    name: 'Puppy',
    nickname: 'Explorer',
    tint: 'butter',
    summary:
      'The prime socialization window is closing around 14 to 16 weeks. Introduce many people, sounds and surfaces, always at a happy distance.',
    mealsPerDay: '3 to 4 meals',
    sleep: '18 to 19 hours a day',
    focus: ['Socialization', 'Bite inhibition', 'Sit, down, come', 'Vaccine series'],
  },
  {
    id: 'junior',
    name: 'Junior',
    nickname: 'Teething season',
    tint: 'mint',
    summary:
      'Adult teeth are coming in, so chewing peaks. Offer safe chews, keep training sessions short and fun, and start loose-leash walking.',
    mealsPerDay: '3 meals',
    sleep: '16 to 18 hours a day',
    focus: ['Chew management', 'Loose-leash walking', 'Stay and leave it', 'Alone-time practice'],
  },
  {
    id: 'adolescent',
    name: 'Adolescent',
    nickname: 'Teenager',
    tint: 'lavender',
    summary:
      'Testing limits and selective hearing are normal. Stay consistent, keep rewarding recall, and give plenty of sniffing and brain games.',
    mealsPerDay: '2 meals',
    sleep: '14 to 16 hours a day',
    focus: ['Reliable recall', 'Impulse control', 'Energy outlets', 'Spay or neuter talk with vet'],
  },
  {
    id: 'adult',
    name: 'Adult',
    nickname: 'Best friend',
    tint: 'sky',
    summary:
      'Growth is done. Switch to adult food, keep a steady weight, and keep life interesting with new tricks, sports and adventures.',
    mealsPerDay: '2 meals',
    sleep: '12 to 14 hours a day',
    focus: ['Healthy weight', 'Dental care', 'Yearly check-ups', 'New skills and games'],
  },
  {
    id: 'senior',
    name: 'Senior',
    nickname: 'Golden years',
    tint: 'rose',
    summary:
      'Slower and wiser. Gentler exercise, comfy beds, more frequent vet visits and plenty of nose work keep seniors happy.',
    mealsPerDay: '2 smaller meals',
    sleep: '14 to 18 hours a day',
    focus: ['Joint comfort', 'Twice-yearly vet visits', 'Gentle walks', 'Brain games'],
  },
];

/** Age (in weeks) when the dog counts as an adult, by size. Larger dogs finish growing later. */
export const ADULT_AT_WEEKS: Record<SizeClass, number> = {
  toy: 43, // ~10 months
  small: 47, // ~11 months
  medium: 56, // ~13 months
  large: 70, // ~16 months
  giant: 96, // ~22 months
};

/** Age (in years) when the dog counts as a senior, by size. */
export const SENIOR_AT_YEARS: Record<SizeClass, number> = {
  toy: 10,
  small: 10,
  medium: 8,
  large: 7,
  giant: 6,
};

export function stageFor(ageWeeks: number, size: SizeClass): Stage {
  const get = (id: StageId) => STAGES.find((s) => s.id === id)!;
  if (ageWeeks < 12) return get('baby');
  if (ageWeeks < 17) return get('puppy');
  if (ageWeeks < 27) return get('junior');
  if (ageWeeks < ADULT_AT_WEEKS[size]) return get('adolescent');
  if (ageWeeks < SENIOR_AT_YEARS[size] * 52) return get('adult');
  return get('senior');
}

/** Puppies can usually hold their bladder about (age in months + 1) hours, up to ~8 h for adults. */
export function pottyHoldHours(ageWeeks: number): number {
  const months = ageWeeks / 4.345;
  if (months >= 9) return 8;
  return Math.max(1, Math.min(8, Math.round(months + 1)));
}

export function pottyGuide(ageWeeks: number, stage: StageId) {
  const hold = pottyHoldHours(ageWeeks);
  if (stage === 'baby' || stage === 'puppy') {
    return {
      hold,
      pee: `Every ${hold === 1 ? '1 to 2' : hold} hours while awake, plus right after sleeping, eating, drinking and play`,
      poo: '3 to 5 times a day, usually 5 to 30 minutes after each meal',
      night: hold <= 3 ? 'One or two night trips is normal at this age' : 'Most puppies manage the night by now with a late last trip',
    };
  }
  if (stage === 'junior' || stage === 'adolescent') {
    return {
      hold,
      pee: `About every ${hold} hours, and after naps, meals and play`,
      poo: '2 to 4 times a day',
      night: 'Usually sleeps through with a last trip before bed',
    };
  }
  return {
    hold,
    pee: stage === 'senior' ? '4 to 6 times a day; seniors may need extra trips' : '3 to 5 times a day',
    poo: '1 to 3 times a day',
    night: stage === 'senior' ? 'A night trip may come back with age, which is worth mentioning to your vet' : 'Sleeps through the night',
  };
}

/**
 * Exercise guide. For puppies, the common "5 minutes per month of age, twice a day" rule of thumb
 * for structured walks, plus free play. Adult targets vary by energy.
 */
export function exerciseTargetMinutes(ageWeeks: number, stage: StageId, activity: 'low' | 'normal' | 'high'): number {
  const months = ageWeeks / 4.345;
  if (stage === 'baby' || stage === 'puppy' || stage === 'junior' || stage === 'adolescent') {
    const base = Math.round(Math.min(months, 12) * 5 * 2);
    return Math.max(15, base + (activity === 'high' ? 15 : activity === 'low' ? -5 : 0));
  }
  if (stage === 'senior') return activity === 'high' ? 50 : 35;
  return activity === 'high' ? 90 : activity === 'low' ? 40 : 60;
}

export function mealsPerDay(ageWeeks: number, stage: StageId): number {
  if (ageWeeks < 12) return 4;
  if (ageWeeks < 26) return 3;
  return 2;
}
