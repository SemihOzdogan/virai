import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  RepeatFrequency,
  TriggerType,
} from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { restoreAdventure, totalTurns } from './story';

const channelId = 'adventure-reminders';
const reminderTimes = [
  { key: 'morning', hour: 10, minute: 0 },
  { key: 'midday', hour: 13, minute: 0 },
  { key: 'afternoon', hour: 17, minute: 0 },
  { key: 'evening', hour: 20, minute: 0 },
] as const;

function reminderId(uid: string, key: (typeof reminderTimes)[number]['key']) {
  return `adventure-307-${key}-${uid}`;
}

function legacyReminderId(uid: string) {
  return `adventure-307-${uid}`;
}

function nextReminderTime(hour: number, minute: number) {
  const next = new Date();
  next.setHours(hour, minute, 0, 0);
  if (next.getTime() <= Date.now()) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime();
}

async function createReminderChannel() {
  await notifee.createChannel({
    id: channelId,
    name: 'Macera hatırlatıcıları',
    importance: AndroidImportance.DEFAULT,
  });
}

async function hasNotificationPermission() {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus !== AuthorizationStatus.DENIED;
}

/** Schedules four device-local daily reminders for an unfinished story. */
export async function scheduleAdventureReminder(uid: string) {
  if (!(await hasNotificationPermission())) {
    return false;
  }

  await createReminderChannel();

  await notifee.cancelTriggerNotification(legacyReminderId(uid));
  await Promise.all(
    reminderTimes.map(async ({ key, hour, minute }) => {
      const id = reminderId(uid, key);
      await notifee.cancelTriggerNotification(id);
      await notifee.createTriggerNotification(
        {
          id,
          title: 'Oda 307 seni bekliyor',
          body: 'Atlas Oteli’nde yeni bir iz seni bekliyor. Hikâyene devam et.',
          data: { destination: 'adventure' },
          android: {
            channelId,
            smallIcon: 'ic_adventure_notification',
            pressAction: { id: 'default' },
          },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: nextReminderTime(hour, minute),
          repeatFrequency: RepeatFrequency.DAILY,
        },
      );
    }),
  );
  return true;
}

/** Sends an immediate local notification without changing scheduled reminders. */
export async function sendAdventureReminderTest() {
  if (!(await hasNotificationPermission())) {
    return false;
  }

  await createReminderChannel();
  await notifee.displayNotification({
    title: 'VirAI bildirim testi',
    body: 'Bildirimler düzgün çalışıyor. Oda 307 seni bekliyor.',
    data: { destination: 'adventure' },
    android: {
      channelId,
      smallIcon: 'ic_adventure_notification',
      pressAction: { id: 'default' },
    },
    ios: {
      foregroundPresentationOptions: {
        banner: true,
        list: true,
        sound: true,
      },
    },
  });
  return true;
}

export function cancelAdventureReminder(uid: string) {
  return Promise.all([
    notifee.cancelTriggerNotification(legacyReminderId(uid)),
    ...reminderTimes.map(({ key }) =>
      notifee.cancelTriggerNotification(reminderId(uid, key)),
    ),
  ]);
}

/** Restores the reminder whenever an authenticated user returns to the home screen. */
export async function syncAdventureReminder(uid: string) {
  const raw = await AsyncStorage.getItem(`virai-adventure-307-v1:${uid}`);
  const adventure = restoreAdventure(raw);
  if (adventure.turns.length > 0 && adventure.turns.length < totalTurns) {
    return scheduleAdventureReminder(uid);
  }
  await cancelAdventureReminder(uid);
  return false;
}
