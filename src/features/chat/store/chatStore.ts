import { create } from 'zustand';

import {
  deleteAllChatConversations,
  deleteChatConversation,
  renameChatConversation,
  sendChatMessage,
  subscribeToConversations,
  subscribeToMessages,
} from '../api/chatApi';
import type { ChatAttachment, ChatMessage, ChatMode, Conversation } from '../types/chat';

type ChatState = {
  conversations: Conversation[];
  messagesByConversation: Record<string, ChatMessage[]>;
  isLoadingConversations: boolean;
  loadingMessagesByConversation: Record<string, boolean>;
  sendingByConversation: Record<string, boolean>;
  streamingResponseByConversation: Record<string, string>;
  error: string | null;
  subscribeToConversations: (uid: string) => () => void;
  subscribeToMessages: (uid: string, conversationId: string) => () => void;
  sendMessage: (
    uid: string,
    conversationId: string,
    text: string,
    mode?: ChatMode,
    document?: ChatAttachment & { data: string },
  ) => Promise<boolean>;
  deleteConversation: (uid: string, conversationId: string) => Promise<boolean>;
  deleteAllConversations: (uid: string) => Promise<boolean>;
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
  streamingResponseByConversation: {},
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
        set(state => {
          const streamedResponse = state.streamingResponseByConversation[conversationId];
          const hasPersistedStream =
            typeof streamedResponse === 'string' &&
            streamedResponse.length > 0 &&
            messages.some(
              message =>
                message.role === 'assistant' &&
                message.content.trim() === streamedResponse.trim(),
            );
          const streamingResponseByConversation = hasPersistedStream
            ? Object.fromEntries(
                Object.entries(state.streamingResponseByConversation).filter(
                  ([id]) => id !== conversationId,
                ),
              )
            : state.streamingResponseByConversation;

          return {
            messagesByConversation: {
              ...state.messagesByConversation,
              [conversationId]: messages,
            },
            streamingResponseByConversation,
            loadingMessagesByConversation: {
              ...state.loadingMessagesByConversation,
              [conversationId]: false,
            },
          };
        }),
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
  sendMessage: async (uid, conversationId, text, mode = 'general', document) => {
    if (get().sendingByConversation[conversationId]) {
      return false;
    }

    set(state => ({
      sendingByConversation: { ...state.sendingByConversation, [conversationId]: true },
      streamingResponseByConversation: {
        ...state.streamingResponseByConversation,
        [conversationId]: '',
      },
      error: null,
    }));

    try {
      await sendChatMessage(
        uid,
        conversationId,
        text,
        get().messagesByConversation[conversationId] ?? [],
        mode,
        document,
        content =>
          set(state => ({
            streamingResponseByConversation: {
              ...state.streamingResponseByConversation,
              [conversationId]: content,
            },
          })),
      );
      set(state => ({
        sendingByConversation: { ...state.sendingByConversation, [conversationId]: false },
      }));
      return true;
    } catch (error) {
      set(state => ({
        sendingByConversation: { ...state.sendingByConversation, [conversationId]: false },
        streamingResponseByConversation: Object.fromEntries(
          Object.entries(state.streamingResponseByConversation).filter(
            ([id]) => id !== conversationId,
          ),
        ),
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
  deleteAllConversations: async uid => {
    set({ error: null });

    try {
      await deleteAllChatConversations(uid);
      return true;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Sohbetler silinemedi.',
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
