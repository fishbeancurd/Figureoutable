import type { IconName } from '@/components/Icon';
import type { TintName } from '@/constants/theme';
import type { LogEntry, LogType } from '@/lib/types';

export const LOG_META: Record<LogType, { label: string; icon: IconName; tint: TintName; verb: string }> = {
  meal: { label: 'Meal', icon: 'bowl', tint: 'peach', verb: 'Ate' },
  treat: { label: 'Treat', icon: 'bone', tint: 'butter', verb: 'Treat' },
  walk: { label: 'Walk', icon: 'paw', tint: 'mint', verb: 'Walked' },
  play: { label: 'Play', icon: 'ball', tint: 'sky', verb: 'Played' },
  training: { label: 'Train', icon: 'medal', tint: 'lavender', verb: 'Trained' },
  potty: { label: 'Potty', icon: 'potty', tint: 'butter', verb: 'Potty' },
  grooming: { label: 'Groom', icon: 'brush', tint: 'sky', verb: 'Groomed' },
  sleep: { label: 'Sleep', icon: 'moon', tint: 'lavender', verb: 'Slept' },
  health: { label: 'Health', icon: 'cross', tint: 'rose', verb: 'Health note' },
  weight: { label: 'Weigh-in', icon: 'scale', tint: 'mint', verb: 'Weighed' },
};

export const QUICK_LOGS: LogType[] = ['meal', 'treat', 'walk', 'potty', 'training', 'grooming', 'play', 'sleep', 'health', 'weight'];

export function describeLog(l: LogEntry): string {
  switch (l.type) {
    case 'meal':
    case 'treat':
      return `${l.foodName ?? l.type}${l.amount ? ` · ${l.amount}` : ''}${l.kcal ? ` · ${l.kcal} kcal` : ''}`;
    case 'walk':
    case 'play':
    case 'sleep':
      return `${l.minutes ?? 0} min`;
    case 'training':
      return `${l.skill ?? 'Practice'} · ${l.minutes ?? 0} min`;
    case 'potty':
      return `${l.potty === 'both' ? 'Pee and poo' : l.potty === 'poo' ? 'Poo' : 'Pee'}${l.accident ? ' · accident inside' : ' · outside'}${l.stool && l.stool !== 'firm' ? ` · ${l.stool} stool` : ''}`;
    case 'grooming':
      return { brush: 'Brushed coat', bath: 'Bath', nails: 'Nails trimmed', teeth: 'Teeth brushed', ears: 'Ears cleaned', eyes: 'Eyes wiped' }[l.groom ?? 'brush'];
    case 'health':
      return l.symptom ?? 'Note';
    case 'weight':
      return `${l.kg} kg`;
  }
}
