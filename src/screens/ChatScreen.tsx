import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';

import { useAuthStore } from '../store';
import { useChatStore } from '../store/chatStore';
import type { ChatMessage } from '../types/chat';
import type { RootStackParamList } from '../types/navigation';

type Props = StackScreenProps<RootStackParamList, 'Chat'>;

const EMPTY_MESSAGES: ChatMessage[] = [];

export function ChatScreen({ navigation, route }: Props) {
  const { conversationId, title } = route.params;
  const user = useAuthStore(state => state.user);
  const subscribeToMessages = useChatStore(state => state.subscribeToMessages);
  const messages = useChatStore(
    state => state.messagesByConversation[conversationId] ?? EMPTY_MESSAGES,
  );
  const isLoadingMessages = useChatStore(
    state => state.loadingMessagesByConversation[conversationId] ?? true,
  );
  const sendMessage = useChatStore(state => state.sendMessage);
  const isSending = useChatStore(state => state.isSending);
  const error = useChatStore(state => state.error);
  const clearError = useChatStore(state => state.clearError);
  const [draft, setDraft] = useState('');
  const scrollView = useRef<React.ElementRef<typeof ScrollView>>(null);

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    return subscribeToMessages(user.id, conversationId);
  }, [conversationId, subscribeToMessages, user?.id]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || isSending || isLoadingMessages || !user?.id) {
      return;
    }

    setDraft('');
    const sent = await sendMessage(user.id, conversationId, text);
    if (!sent) {
      setDraft(text);
    }
  };

  const displayTitle = title?.trim() || 'Yeni sohbet';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 6 : 0}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <Text numberOfLines={1} style={styles.headerTitle}>{displayTitle}</Text>
            <Text style={styles.headerSubtitle}>AI Asistan</Text>
          </View>
          <View style={styles.headerMark}>
            <Text style={styles.headerMarkText}>✦</Text>
          </View>
        </View>

        <ScrollView
          ref={scrollView}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollView.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {isLoadingMessages ? (
            <View style={styles.loading}>
              <ActivityIndicator color="#8B72FF" />
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.welcome}>
              <View style={styles.welcomeMark}>
                <Text style={styles.welcomeMarkText}>✦</Text>
              </View>
              <Text style={styles.welcomeTitle}>Nasıl yardımcı olabilirim?</Text>
              <Text style={styles.welcomeText}>
                Sorunu yaz; Gemini yanıtlasın. Sohbetin hesabına kaydedilir.
              </Text>
            </View>
          ) : (
            messages.map(message => (
              <View
                key={message.id}
                style={[
                  styles.messageRow,
                  message.role === 'user' && styles.userMessageRow,
                ]}>
                {message.role === 'assistant' ? (
                  <View style={styles.assistantMark}>
                    <Text style={styles.assistantMarkText}>✦</Text>
                  </View>
                ) : null}
                <View
                  style={[
                    styles.messageBubble,
                    message.role === 'user' ? styles.userBubble : styles.assistantBubble,
                    message.status === 'failed' && styles.failedBubble,
                  ]}>
                  <Text style={styles.messageText}>{message.content}</Text>
                  {message.status === 'failed' ? (
                    <Text style={styles.failedLabel}>
                      {message.error ?? error ?? 'Yanıt alınamadı. Lütfen tekrar deneyin.'}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))
          )}
          {isSending ? (
            <View style={styles.typingRow}>
              <View style={styles.assistantMark}>
                <Text style={styles.assistantMarkText}>✦</Text>
              </View>
              <View style={styles.typingBubble}>
                <ActivityIndicator color="#A28FFF" size="small" />
                <Text style={styles.typingText}>
                  Gemini yanıtlıyor...
                </Text>
              </View>
            </View>
          ) : null}
        </ScrollView>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Mesajını yaz..."
            placeholderTextColor="#7F8CA8"
            multiline
            maxLength={6000}
            editable={!isSending}
            style={styles.input}
            accessibilityLabel="Mesajını yaz"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mesajı gönder"
            onPress={handleSend}
            disabled={!draft.trim() || isSending || isLoadingMessages || !user?.id}
            style={[
              styles.sendButton,
              (!draft.trim() || isSending || isLoadingMessages || !user?.id) &&
                styles.sendButtonDisabled,
            ]}>
            <Text style={styles.sendButtonText}>↑</Text>
          </Pressable>
        </View>
        <Text style={styles.footerNote}>
          Mesajlar Gemini'ye iletilir. Yanıtlar yapay zekâ tarafından oluşturulur.
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0B1020' },
  container: { flex: 1, backgroundColor: '#0B1020' },
  header: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148,163,184,0.12)',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: 'rgba(148,163,184,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: '#F3F5FF', fontSize: 31, lineHeight: 33, marginTop: -3 },
  headerTitleWrap: { flex: 1, marginLeft: 12 },
  headerTitle: { color: '#F3F5FF', fontSize: 15, fontWeight: '700' },
  headerSubtitle: { color: '#8492B0', fontSize: 11, marginTop: 3 },
  headerMark: {
    width: 36,
    height: 36,
    borderRadius: 13,
    backgroundColor: 'rgba(124,92,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMarkText: { color: '#A28FFF', fontSize: 20 },
  messages: { flex: 1 },
  messagesContent: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 20 },
  loading: { padding: 28, alignItems: 'center' },
  welcome: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  welcomeMark: {
    width: 62,
    height: 62,
    borderRadius: 22,
    backgroundColor: 'rgba(124,92,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  welcomeMarkText: { color: '#A28FFF', fontSize: 32 },
  welcomeTitle: { color: '#F0F3FF', fontSize: 20, fontWeight: '700', textAlign: 'center' },
  welcomeText: {
    color: '#98A6C3',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 300,
  },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 8 },
  userMessageRow: { justifyContent: 'flex-end' },
  assistantMark: {
    width: 27,
    height: 27,
    borderRadius: 10,
    backgroundColor: 'rgba(124,92,255,0.19)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 2,
  },
  assistantMarkText: { color: '#A28FFF', fontSize: 15 },
  messageBubble: { maxWidth: '84%', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 19 },
  userBubble: { backgroundColor: '#7658F5', borderBottomRightRadius: 6 },
  assistantBubble: {
    backgroundColor: 'rgba(148,163,184,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.12)',
    borderBottomLeftRadius: 6,
  },
  failedBubble: { borderColor: 'rgba(255,138,138,0.5)' },
  messageText: { color: '#F3F5FF', fontSize: 15, lineHeight: 22 },
  failedLabel: { color: '#FFAAAA', fontSize: 11, marginTop: 6 },
  typingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: 'rgba(148,163,184,0.1)',
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  typingText: { color: '#AFBAD1', fontSize: 12 },
  error: { color: '#FFAAAA', fontSize: 12, paddingHorizontal: 18, paddingBottom: 7 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginHorizontal: 13,
    padding: 8,
    paddingLeft: 15,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    backgroundColor: '#111A2E',
  },
  input: {
    flex: 1,
    color: '#F3F5FF',
    fontSize: 15,
    lineHeight: 21,
    maxHeight: 125,
    paddingTop: 9,
    paddingBottom: 8,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#7658F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: { opacity: 0.4 },
  sendButtonText: { color: '#FFFFFF', fontSize: 25, fontWeight: '700', lineHeight: 30 },
  footerNote: { color: '#66738F', fontSize: 10, textAlign: 'center', paddingVertical: 7 },
});
