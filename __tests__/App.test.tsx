/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('../src/api/authApi', () => ({
  loginWithEmailAndPassword: jest.fn(),
  loginWithGoogle: jest.fn(),
  logoutFromFirebase: jest.fn(),
  observeFirebaseAuth: jest.fn(() => jest.fn()),
  registerWithEmailAndPassword: jest.fn(),
  sendPasswordReset: jest.fn(),
}));

jest.mock('../src/api/chatApi', () => ({
  createConversationId: jest.fn(),
  sendChatMessage: jest.fn(),
  subscribeToConversations: jest.fn(() => jest.fn()),
  subscribeToMessages: jest.fn(() => jest.fn()),
}));

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
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
