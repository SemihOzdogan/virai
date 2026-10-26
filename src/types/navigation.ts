import type { ChatAttachment, ChatMode } from '../features/chat/types/chat';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Adventure: undefined;
  JobApplication: undefined;
  Chat: {
    conversationId: string;
    title?: string;
    mode?: ChatMode;
    autoFocus?: boolean;
    initialMessage?: string;
    initialAttachments?: Array<ChatAttachment & { data: string }>;
  };
};
