import { create } from 'zustand';

import {
  deleteChatConversation,
  renameChatConversation,
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
  sendingByConversation: Record<string, boolean>;
  error: string | null;
  subscribeToConversations: (uid: string) => () => void;
  subscribeToMessages: (uid: string, conversationId: string) => () => void;
  sendMessage: (uid: string, conversationId: string, text: string) => Promise<boolean>;
  deleteConversation: (uid: string, conversationId: string) => Promise<boolean>;
  renameConversation: (
    uid: string,
    conversationId: string,
    title: string,
  ) => Promise<boolean>;
  clearError: () => void;
};

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  messagesByConversation: {},
  isLoadingConversations: true,
  loadingMessagesByConversation: {},
  sendingByConversation: {},
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
    if (get().sendingByConversation[conversationId]) {
      return false;
    }

    set(state => ({
      sendingByConversation: { ...state.sendingByConversation, [conversationId]: true },
      error: null,
    }));

    try {
      await sendChatMessage(
        uid,
        conversationId,
        text,
        get().messagesByConversation[conversationId] ?? [],
      );
      set(state => ({
        sendingByConversation: { ...state.sendingByConversation, [conversationId]: false },
      }));
      return true;
    } catch (error) {
      set(state => ({
        sendingByConversation: { ...state.sendingByConversation, [conversationId]: false },
        error: error instanceof Error ? error.message : 'Mesaj gönderilemedi.',
      }));
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
  renameConversation: async (uid, conversationId, title) => {
    set({ error: null });

    try {
      await renameChatConversation(uid, conversationId, title);
      return true;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Sohbet başlığı değiştirilemedi.',
      });
      return false;
    }
  },
  clearError: () => set({ error: null }),
}));
