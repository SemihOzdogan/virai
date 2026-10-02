import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  ActivityIndicator,
  Keyboard,
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
import { useTheme, type AppTheme } from '../theme/ThemeProvider';
import type { ChatMessage } from '../types/chat';
import type { RootStackParamList } from '../types/navigation';

type Props = StackScreenProps<RootStackParamList, 'Chat'>;

const EMPTY_MESSAGES: ChatMessage[] = [];

function formatMessageTime(date: Date | null) {
  if (!date) {
    return null;
  }

  return new Intl.DateTimeFormat('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function TypingIndicator() {
  const { colors } = useTheme();
  const dots = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)])
    .current;

  useEffect(() => {
    const animations = dots.map((dot, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 140),
          Animated.timing(dot, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.delay((2 - index) * 140 + 220),
        ]),
      ),
    );

    animations.forEach(animation => animation.start());
    return () => animations.forEach(animation => animation.stop());
  }, [dots]);

  return (
    <View style={animationStyles.typingDots} accessibilityLabel="Yanıt hazırlanıyor">
      {dots.map((dot, index) => (
        <Animated.View
          key={index}
          style={[
            animationStyles.typingDot,
            {
              backgroundColor: colors.accent,
              opacity: dot.interpolate({
                inputRange: [0, 1],
                outputRange: [0.35, 1],
              }),
              transform: [
                {
                  translateY: dot.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -4],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

export function ChatScreen({ navigation, route }: Props) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
  const [pendingMessage, setPendingMessage] = useState<{
    text: string;
    afterSequence: number;
  } | null>(null);
  const input = useRef<React.ElementRef<typeof TextInput>>(null);
  const scrollView = useRef<React.ElementRef<typeof ScrollView>>(null);
  const scrollToLatest = useCallback(() => {
    requestAnimationFrame(() => scrollView.current?.scrollToEnd({ animated: true }));
  }, []);

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('transitionEnd', event => {
      if (event.data.closing) {
        return;
      }

      input.current?.focus();
      unsubscribe();
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    return subscribeToMessages(user.id, conversationId);
  }, [conversationId, subscribeToMessages, user?.id]);

  useEffect(() => {
    const keyboardSubscription = Keyboard.addListener('keyboardDidShow', scrollToLatest);
    return () => keyboardSubscription.remove();
  }, [scrollToLatest]);

  const pendingMessageIsConfirmed =
    pendingMessage !== null &&
    messages.some(
      message =>
        message.role === 'user' &&
        message.content === pendingMessage.text &&
        message.sequence > pendingMessage.afterSequence,
    );
  const visibleMessages =
    pendingMessage && !pendingMessageIsConfirmed
      ? [
          ...messages,
          {
            id: 'pending-user-message',
            role: 'user' as const,
            content: pendingMessage.text,
            sequence: pendingMessage.afterSequence + 1,
            createdAt: new Date(),
            status: 'complete' as const,
          },
        ]
      : messages;

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || isSending || isLoadingMessages || !user?.id) {
      return;
    }

    const afterSequence = messages.reduce(
      (highest, message) => Math.max(highest, message.sequence),
      -1,
    );
    setDraft('');
    setPendingMessage({ text, afterSequence });
    const sent = await sendMessage(user.id, conversationId, text);
    setPendingMessage(null);
    if (!sent) {
      setDraft(text);
    }
  };

  const displayTitle = title?.trim() || 'Yeni sohbet';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 6 : 0}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Geri dön"
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
          onContentSizeChange={scrollToLatest}
          onLayout={scrollToLatest}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {isLoadingMessages ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : visibleMessages.length === 0 ? (
            <View style={styles.welcome}>
              <View style={styles.welcomeMark}>
                <Text style={styles.welcomeMarkText}>✦</Text>
              </View>
              <Text style={styles.welcomeTitle}>Nasıl yardımcı olabilirim?</Text>
              <Text style={styles.welcomeText}>
                Mesajını yaz, VirAI yanıtlasın. Sohbetin hesabına kaydedilir.
              </Text>
            </View>
          ) : (
            visibleMessages.map(message => (
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
                    styles.messageContent,
                    message.role === 'user' && styles.userMessageContent,
                  ]}>
                  <View
                    style={[
                      styles.messageBubble,
                      message.role === 'user' ? styles.userBubble : styles.assistantBubble,
                      message.status === 'failed' && styles.failedBubble,
                    ]}>
                    <Text
                      style={[
                        styles.messageText,
                        message.role === 'user' && styles.userMessageText,
                      ]}>
                      {message.content}
                    </Text>
                    {message.status === 'failed' ? (
                      <Text style={styles.failedLabel}>
                        {message.error ?? error ?? 'Yanıt alınamadı. Lütfen tekrar deneyin.'}
                      </Text>
                    ) : null}
                  </View>
                  {formatMessageTime(message.createdAt) ? (
                    <Text style={styles.messageTime}>
                      {formatMessageTime(message.createdAt)}
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
                <TypingIndicator />
              </View>
            </View>
          ) : null}
        </ScrollView>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.composer}>
          <TextInput
            ref={input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Mesajını yaz..."
            placeholderTextColor={colors.placeholder}
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
          Mesajların VirAI tarafından yanıt oluşturmak için işlenir.
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: AppTheme['colors']) {
  return StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: colors.text, fontSize: 31, lineHeight: 33, marginTop: -3 },
  headerTitleWrap: { flex: 1, marginLeft: 12 },
  headerTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  headerSubtitle: { color: colors.textMuted, fontSize: 11, marginTop: 3 },
  headerMark: {
    width: 36,
    height: 36,
    borderRadius: 13,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMarkText: { color: colors.accent, fontSize: 20 },
  messages: { flex: 1 },
  messagesContent: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 20 },
  loading: { padding: 28, alignItems: 'center' },
  welcome: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  welcomeMark: {
    width: 62,
    height: 62,
    borderRadius: 22,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  welcomeMarkText: { color: colors.accent, fontSize: 32 },
  welcomeTitle: { color: colors.text, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  welcomeText: {
    color: colors.textSecondary,
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
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 2,
  },
  assistantMarkText: { color: colors.accent, fontSize: 15 },
  messageBubble: { maxWidth: '100%', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 19 },
  messageContent: { maxWidth: '84%', alignItems: 'flex-start' },
  userMessageContent: { alignItems: 'flex-end' },
  userBubble: { backgroundColor: colors.userBubble, borderBottomRightRadius: 6 },
  assistantBubble: {
    backgroundColor: colors.assistantBubble,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 6,
  },
  failedBubble: { borderColor: 'rgba(255,138,138,0.5)' },
  messageText: { color: colors.text, fontSize: 15, lineHeight: 22 },
  userMessageText: { color: colors.onAccent },
  messageTime: { color: colors.textMuted, fontSize: 10, marginTop: 4, marginHorizontal: 5 },
  failedLabel: { color: colors.error, fontSize: 11, marginTop: 6 },
  typingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  typingBubble: {
    minWidth: 62,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.assistantBubble,
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  error: { color: colors.error, fontSize: 12, paddingHorizontal: 18, paddingBottom: 7 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginHorizontal: 13,
    padding: 8,
    paddingLeft: 15,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    color: colors.text,
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
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: { opacity: 0.4 },
  sendButtonText: { color: '#FFFFFF', fontSize: 25, fontWeight: '700', lineHeight: 30 },
  footerNote: { color: colors.textMuted, fontSize: 10, textAlign: 'center', paddingVertical: 7 },
  });
}

const animationStyles = StyleSheet.create({
  typingDots: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  typingDot: { width: 7, height: 7, borderRadius: 4 },
});
