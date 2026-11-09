import type { AppState, LogEntry, SkillLevel, TrainingRating } from './types';
import { LESSONS, LEVEL_INFO, LEVELS } from '@/data/learn';

/** Lessons that are practiced as a skill (logged under Training). */
export const SKILL_LESSONS = LESSONS.filter((l) => ['training', 'behavior', 'exercise'].includes(l.cat) || l.id === 'crate');

export function lessonComplete(s: AppState, id: string) {
  const l = LESSONS.find((x) => x.id === id);
  return !!l && (s.lessonSteps[id] ?? []).length >= l.steps.length;
}

export function completedIn(s: AppState, level: SkillLevel) {
  return LESSONS.filter((l) => l.level === level && lessonComplete(s, l.id)).length;
}

/** A level opens when enough lessons of the level below are complete, or when the owner unlocks it early. */
export function levelUnlocked(s: AppState, level: SkillLevel): boolean {
  const info = LEVEL_INFO[level];
  if (!info.needs) return true;
  if (s.unlockedLevels.includes(level)) return true;
  return levelUnlocked(s, info.needs) && completedIn(s, info.needs) >= info.needCount;
}

export function nextLockedLevel(s: AppState): SkillLevel | undefined {
  return LEVELS.find((l) => !levelUnlocked(s, l));
}

// ---------- Mastery ----------

const POINTS: Record<TrainingRating, number> = { struggled: 1, okay: 2, nailed: 3 };

export const MASTERY = [
  { stars: 0, label: 'New', min: 0 },
  { stars: 1, label: 'Learning', min: 1 },
  { stars: 2, label: 'Getting it', min: 8 },
  { stars: 3, label: 'Reliable', min: 18 },
  { stars: 4, label: 'Mastered', min: 30 },
] as const;

export interface Mastery {
  points: number;
  sessions: number;
  stars: number;
  label: string;
  next?: number; // points needed for the next star
}

/** Mastery grows with each practice session. "Nailed it" counts most, so harder-won skills rise faster. */
export function skillMastery(logs: LogEntry[], skill: string): Mastery {
  const sessions = logs.filter((l) => l.type === 'training' && l.skill === skill);
  const points = sessions.reduce((n, l) => n + POINTS[l.rating ?? 'okay'], 0);
  let tier: (typeof MASTERY)[number] = MASTERY[0];
  for (const m of MASTERY) if (points >= m.min) tier = m;
  const nextTier = MASTERY.find((m) => m.min > points);
  return { points, sessions: sessions.length, stars: tier.stars, label: tier.label, next: nextTier ? nextTier.min - points : undefined };
}

export interface SkillItem {
  key: string;
  name: string;
  level: SkillLevel;
  custom: boolean;
  lessonId?: string;
  cue?: string;
}

export function allSkills(s: AppState): SkillItem[] {
  const built: SkillItem[] = SKILL_LESSONS.map((l) => ({ key: l.id, name: l.title, level: l.level, custom: false, lessonId: l.id }));
  const custom: SkillItem[] = s.customSkills.map((c) => ({ key: c.id, name: c.name, level: c.level, custom: true, cue: c.cue }));
  return [...built, ...custom];
}

export function skillLevelOf(s: AppState, name?: string): SkillLevel {
  return allSkills(s).find((k) => k.name === name)?.level ?? 'beginner';
}
