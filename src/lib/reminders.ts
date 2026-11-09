import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { RoutineItem } from './types';
import { toMin } from './routine';

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

async function scheduleItem(item: RoutineItem, dogName: string): Promise<string[]> {
  const at = toMin(item.time) - LEAD_MIN;
  const shiftDay = at < 0 ? -1 : 0;
  const t = (at + 1440) % 1440;
  const hour = Math.floor(t / 60);
  const minute = t % 60;
  const content: Notifications.NotificationContentInput = {
    title: `${item.title.split(' · ')[0]} in ${LEAD_MIN} min`,
    body: `${dogName}'s ${item.title.toLowerCase()} is coming up.`,
    data: { routineId: item.id },
  };
  const channelId = Platform.OS === 'android' ? 'routine' : undefined;
  if (item.days.length === 7) {
    const id = await Notifications.scheduleNotificationAsync({
      content,
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId },
    });
    return [id];
  }
  const ids: string[] = [];
  for (const day of item.days) {
    // Expo weekdays are 1 (Sunday) to 7 (Saturday).
    const weekday = ((day + shiftDay + 7) % 7) + 1;
    ids.push(
      await Notifications.scheduleNotificationAsync({
        content,
        trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday, hour, minute, channelId },
      }),
    );
  }
  return ids;
}

/** Replaces all scheduled reminders with the current routine. Returns routine items with notification ids. */
export async function syncReminders(routine: RoutineItem[], dogName: string, enabled: boolean): Promise<RoutineItem[]> {
  if (!supported) return routine;
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!enabled) return routine.map((r) => ({ ...r, notifIds: [] }));
  const ok = await ensurePermission();
  if (!ok) return routine.map((r) => ({ ...r, notifIds: [] }));
  const out: RoutineItem[] = [];
  for (const r of routine) {
    out.push(r.remind ? { ...r, notifIds: await scheduleItem(r, dogName) } : { ...r, notifIds: [] });
  }
  return out;
}

export const remindersSupported = supported;
