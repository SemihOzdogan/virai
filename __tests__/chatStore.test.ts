jest.mock('../src/features/chat/api/chatApi', () => ({
  deleteChatConversation: jest.fn(),
  renameChatConversation: jest.fn(),
  sendChatMessage: jest.fn(),
  subscribeToConversations: jest.fn(),
  subscribeToMessages: jest.fn(),
}));

import { sendChatMessage } from '../src/features/chat/api/chatApi';
import { useChatStore } from '../src/features/chat/store/chatStore';

test('tracks pending replies independently for each conversation', async () => {
  let resolveFirst: (() => void) | undefined;
  let resolveSecond: (() => void) | undefined;
  jest.mocked(sendChatMessage)
    .mockImplementationOnce(() => new Promise<void>(resolve => { resolveFirst = resolve; }))
    .mockImplementationOnce(() => new Promise<void>(resolve => { resolveSecond = resolve; }));

  const firstSend = useChatStore.getState().sendMessage('user', 'first-chat', 'Hello');
  const secondSend = useChatStore.getState().sendMessage('user', 'second-chat', 'Hi');

  expect(useChatStore.getState().sendingByConversation).toEqual({
    'first-chat': true,
    'second-chat': true,
  });

  resolveFirst?.();
  await firstSend;
  expect(useChatStore.getState().sendingByConversation).toEqual({
    'first-chat': false,
    'second-chat': true,
  });

  resolveSecond?.();
  await secondSend;
  expect(useChatStore.getState().sendingByConversation).toEqual({
    'first-chat': false,
    'second-chat': false,
  });
});
