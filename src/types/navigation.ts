import type { ChatMode } from './chat';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Adventure: undefined;
  Chat: { conversationId: string; title?: string; mode?: ChatMode };
};
