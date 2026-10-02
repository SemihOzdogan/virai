import { create } from 'zustand';

import {
  deleteChatConversation,
  sendChatMessage,
  subscribeToConversations,
  subscribeToMessages,
} from '../api/chatApi';
import type { ChatMessage, Conversation } from '../types/chat';

type ChatState = {
  conversations: Conversation[];
  messagesByConversation: Record<string, ChatMessage[]>;
  isLoadingConversations: boolean;
  loadingMessagesByConversation: Record<string, boolean>;
  isSending: boolean;
  error: string | null;
  subscribeToConversations: (uid: string) => () => void;
  subscribeToMessages: (uid: string, conversationId: string) => () => void;
  sendMessage: (uid: string, conversationId: string, text: string) => Promise<boolean>;
  deleteConversation: (uid: string, conversationId: string) => Promise<boolean>;
  clearError: () => void;
};

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  messagesByConversation: {},
  isLoadingConversations: true,
  loadingMessagesByConversation: {},
  isSending: false,
  error: null,
  subscribeToConversations: uid =>
    subscribeToConversations(
      uid,
      conversations => set({ conversations, isLoadingConversations: false, error: null }),
      error => set({ error, isLoadingConversations: false }),
    ),
  subscribeToMessages: (uid, conversationId) => {
    set(state => ({
      loadingMessagesByConversation: {
        ...state.loadingMessagesByConversation,
        [conversationId]: true,
      },
      error: null,
    }));
    return subscribeToMessages(
      uid,
      conversationId,
      messages =>
        set(state => ({
          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationId]: messages,
          },
          loadingMessagesByConversation: {
            ...state.loadingMessagesByConversation,
            [conversationId]: false,
          },
        })),
      error =>
        set(state => ({
          error,
          loadingMessagesByConversation: {
            ...state.loadingMessagesByConversation,
            [conversationId]: false,
          },
        })),
    );
  },
  sendMessage: async (uid, conversationId, text) => {
    set({ isSending: true, error: null });

    try {
      await sendChatMessage(
        uid,
        conversationId,
        text,
        get().messagesByConversation[conversationId] ?? [],
      );
      set({ isSending: false });
      return true;
    } catch (error) {
      set({
        isSending: false,
        error: error instanceof Error ? error.message : 'Mesaj gönderilemedi.',
      });
      return false;
    }
  },
  deleteConversation: async (uid, conversationId) => {
    set({ error: null });

    try {
      await deleteChatConversation(uid, conversationId);
      return true;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Sohbet silinemedi.',
      });
      return false;
    }
  },
  clearError: () => set({ error: null }),
}));
