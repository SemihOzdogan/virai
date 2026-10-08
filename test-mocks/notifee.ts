const notifee = {
  requestPermission: jest.fn(async () => ({ authorizationStatus: 1 })),
  createChannel: jest.fn(async () => 'adventure-reminders'),
  cancelTriggerNotification: jest.fn(async () => undefined),
  createTriggerNotification: jest.fn(async () => 'adventure-reminder'),
  displayNotification: jest.fn(async () => 'adventure-reminder-test'),
  getInitialNotification: jest.fn(async () => null),
  onForegroundEvent: jest.fn(() => jest.fn()),
  onBackgroundEvent: jest.fn(),
};

export const AndroidImportance = { DEFAULT: 3 };
export const AuthorizationStatus = { DENIED: 0, AUTHORIZED: 1 };
export const RepeatFrequency = { DAILY: 1 };
export const TriggerType = { TIMESTAMP: 0 };
export const EventType = { PRESS: 1 };
export default notifee;
