import notifee from '@notifee/react-native';
import {
  cancelAdventureReminder,
  scheduleAdventureReminder,
  syncAdventureReminder,
} from '../src/features/adventure/services/adventureReminder';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn() },
}));
import AsyncStorage from '@react-native-async-storage/async-storage';

const notificationApi = notifee as jest.Mocked<typeof notifee>;

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers().setSystemTime(new Date('2026-10-08T01:25:00'));
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  notificationApi.requestPermission.mockResolvedValue({
    authorizationStatus: 1,
  } as never);
});

afterEach(() => jest.useRealTimers());

test('schedules one daily 02:55 reminder for an unfinished story', async () => {
  await expect(scheduleAdventureReminder('user-1')).resolves.toBe(true);
  expect(notificationApi.createChannel).toHaveBeenCalledWith(
    expect.objectContaining({ id: 'adventure-reminders' }),
  );
  expect(notificationApi.cancelTriggerNotification).toHaveBeenCalledWith(
    'adventure-307-user-1',
  );
  expect(notificationApi.createTriggerNotification).toHaveBeenCalledWith(
    expect.objectContaining({ title: 'Oda 307 seni bekliyor' }),
    expect.objectContaining({
      timestamp: new Date('2026-10-08T02:55:00').getTime(),
      repeatFrequency: 1,
    }),
  );
});

test('does not schedule when notification permission is denied', async () => {
  notificationApi.requestPermission.mockResolvedValue({
    authorizationStatus: 0,
  } as never);
  await expect(scheduleAdventureReminder('user-1')).resolves.toBe(false);
  expect(notificationApi.createTriggerNotification).not.toHaveBeenCalled();
});

test('cancels the reminder for the completed or reset story', async () => {
  await cancelAdventureReminder('user-1');
  expect(notificationApi.cancelTriggerNotification).toHaveBeenCalledWith(
    'adventure-307-user-1',
  );
});

test('restores a reminder from an unfinished adventure on the home screen', async () => {
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
    JSON.stringify({
      version: 1,
      turns: [
        {
          text: 'Kapı açıldı.',
          choices: ['Gir', 'Bekle', 'Seslen'],
          action: 'Kapıyı aç',
        },
      ],
    }),
  );
  await expect(syncAdventureReminder('user-1')).resolves.toBe(true);
  expect(notificationApi.createTriggerNotification).toHaveBeenCalled();
});
