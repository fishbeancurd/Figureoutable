import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { RoutineItem } from './types';
import { toMin } from './routine';
import { joinNames, mergeReminders, type Reminder } from './reminderPlan';

const supported = Platform.OS === 'ios' || Platform.OS === 'android';

if (supported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function ensurePermission(): Promise<boolean> {
  if (!supported) return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('routine', {
      name: 'Routine reminders',
      // eslint-disable-next-line import/namespace -- exported via `export *`, which the lint resolver misses
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/** Reminders fire 10 minutes before each routine item, on the days it runs. */
const LEAD_MIN = 10;

async function schedule(r: Reminder) {
  const at = toMin(r.time) - LEAD_MIN;
  const shiftDay = at < 0 ? -1 : 0;
  const t = (at + 1440) % 1440;
  const hour = Math.floor(t / 60);
  const minute = t % 60;
  const content: Notifications.NotificationContentInput = {
    title: `${r.title} in ${LEAD_MIN} min`,
    body: `${r.title} for ${joinNames(r.dogNames)} is coming up.`,
  };
  const channelId = Platform.OS === 'android' ? 'routine' : undefined;
  if (r.days.length === 7) {
    await Notifications.scheduleNotificationAsync({
      content,
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId },
    });
    return;
  }
  for (const day of r.days) {
    // Expo weekdays are 1 (Sunday) to 7 (Saturday).
    const weekday = ((day + shiftDay + 7) % 7) + 1;
    await Notifications.scheduleNotificationAsync({
      content,
      trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday, hour, minute, channelId },
    });
  }
}

const MAX_PENDING = 60;

/** Replaces all scheduled reminders with every dog's current routine. */
export async function syncAllReminders(dogs: { dogName: string; routine: RoutineItem[] }[], enabled: boolean): Promise<void> {
  if (!supported) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!enabled) return;
  if (!(await ensurePermission())) return;
  let count = 0;
  for (const r of mergeReminders(dogs)) {
    const cost = r.days.length === 7 ? 1 : r.days.length;
    if (count + cost > MAX_PENDING) continue;
    count += cost;
    await schedule(r);
  }
}

export const remindersSupported = supported;
