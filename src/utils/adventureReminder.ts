import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  RepeatFrequency,
  TriggerType,
} from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { restoreAdventure, totalTurns } from '../adventure/story';

const channelId = 'adventure-reminders';
const reminderHour = 12;
const reminderMinute = 0;

function reminderId(uid: string) {
  return `adventure-307-${uid}`;
}

function nextReminderTime() {
  const next = new Date();
  next.setHours(reminderHour, reminderMinute, 0, 0);
  if (next.getTime() <= Date.now()) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime();
}

/** Schedules one device-local reminder at 02:55 every day for an unfinished story. */
export async function scheduleAdventureReminder(uid: string) {
  const settings = await notifee.requestPermission();
  if (settings.authorizationStatus === AuthorizationStatus.DENIED) {
    return false;
  }

  await notifee.createChannel({
    id: channelId,
    name: 'Macera hatırlatıcıları',
    importance: AndroidImportance.DEFAULT,
  });

  const id = reminderId(uid);
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
      timestamp: nextReminderTime(),
      repeatFrequency: RepeatFrequency.DAILY,
    },
  );
  return true;
}

export function cancelAdventureReminder(uid: string) {
  return notifee.cancelTriggerNotification(reminderId(uid));
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
