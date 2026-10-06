jest.mock('@iternio/react-native-tts', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    getInitStatus: jest.fn(() => Promise.resolve(true)),
    pause: jest.fn(() => Promise.resolve(true)),
    resume: jest.fn(() => Promise.resolve(true)),
    setDefaultLanguage: jest.fn(() => Promise.resolve(true)),
    setIgnoreSilentSwitch: jest.fn(() => Promise.resolve(true)),
    speak: jest.fn(() => Promise.resolve(1)),
    stop: jest.fn(() => Promise.resolve(true)),
  },
}));

import { useSpeechStore } from '../src/store/speechStore';

test('keeps playback controls available independently of a chat screen', async () => {
  await useSpeechStore.getState().play('Yanıt metni', 'message-1', 'conversation-1', 'Sohbet');
  expect(useSpeechStore.getState()).toMatchObject({
    status: 'playing',
    text: 'Yanıt metni',
    conversationId: 'conversation-1',
  });

  await useSpeechStore.getState().pause();
  expect(useSpeechStore.getState().status).toBe('paused');

  await useSpeechStore.getState().resume();
  expect(useSpeechStore.getState().status).toBe('playing');

  await useSpeechStore.getState().stop();
  expect(useSpeechStore.getState()).toMatchObject({
    status: 'idle',
    text: null,
    conversationId: null,
  });
});
