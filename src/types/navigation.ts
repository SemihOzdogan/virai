import type { ChatMode } from '../features/chat/types/chat';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Adventure: undefined;
  Chat: { conversationId: string; title?: string; mode?: ChatMode };
};
