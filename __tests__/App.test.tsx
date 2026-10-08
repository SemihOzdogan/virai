/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('../src/features/auth/api/authApi', () => ({
  loginWithEmailAndPassword: jest.fn(),
  loginWithGoogle: jest.fn(),
  logoutFromFirebase: jest.fn(),
  observeFirebaseAuth: jest.fn(() => jest.fn()),
  registerWithEmailAndPassword: jest.fn(),
  sendPasswordReset: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('react-native-svg', () => ({
  default: () => null,
  Path: () => null,
}));

jest.mock('@iternio/react-native-tts', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    stop: jest.fn(() => Promise.resolve(true)),
    getInitStatus: jest.fn(() => Promise.resolve(true)),
    setDefaultLanguage: jest.fn(() => Promise.resolve(true)),
    speak: jest.fn(),
  },
}));

jest.mock('../src/features/chat/api/chatApi', () => ({
  createConversationId: jest.fn(),
  sendChatMessage: jest.fn(),
  subscribeToConversations: jest.fn(() => jest.fn()),
  subscribeToMessages: jest.fn(() => jest.fn()),
}));

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: { children: React.ReactNode }) =>
    children,
  createNavigationContainerRef: () => ({
    isReady: jest.fn(() => true),
    navigate: jest.fn(),
  }),
}));

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Group: ({ children }: { children: React.ReactNode }) => children,
    Navigator: ({ children }: { children: React.ReactNode }) => children,
    Screen: () => null,
  }),
}));

import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
