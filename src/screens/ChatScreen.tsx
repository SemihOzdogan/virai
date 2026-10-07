import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  PermissionsAndroid,
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
import { useSpeechStore } from '../store/speechStore';
import { useTheme, type AppTheme } from '../theme/ThemeProvider';
import type { ChatMessage } from '../types/chat';
import type { RootStackParamList } from '../types/navigation';

type Props = StackScreenProps<RootStackParamList, 'Chat'>;
type SpeechRecognitionApi = typeof import('react-native-speech-recognition-kit');

const EMPTY_MESSAGES: ChatMessage[] = [];
const STARTER_PROMPTS = [
  'Bugün için kısa bir çalışma planı hazırla',
  'Karmaşık bir konuyu basitçe açıkla',
  'Bir fikrimi geliştirmeme yardım et',
];
const INTERVIEW_STARTER_PROMPTS = [
  'Yazılım geliştirici pozisyonu için pratik yapmak istiyorum',
  'Yeni mezun ürün yöneticisi mülakatına hazırlanıyorum',
  'Satış uzmanı rolü için mülakat simülasyonu yapalım',
];

function getVoiceNotice(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : '';
  const normalizedMessage = message.toLocaleLowerCase('tr-TR');

  if (normalizedMessage.includes('cancel') || normalizedMessage.includes('iptal')) {
    return null;
  }
  if (normalizedMessage.includes('permission') || normalizedMessage.includes('izin')) {
    return 'Sesli giriş için mikrofon ve konuşma tanıma izinlerini açın.';
  }
  if (
    normalizedMessage.includes('initialize recognizer') ||
    normalizedMessage.includes('recognizer not available') ||
    normalizedMessage.includes('konuşma tanıma kullanılamıyor')
  ) {
    return 'Sesli giriş şu anda kullanılamıyor. Mikrofon ve konuşma tanıma izinlerini kontrol edip tekrar deneyin.';
  }

  return fallback;
}

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
  const { conversationId, title, mode = 'general' } = route.params;
  const user = useAuthStore(state => state.user);
  const subscribeToMessages = useChatStore(state => state.subscribeToMessages);
  const messages = useChatStore(
    state => state.messagesByConversation[conversationId] ?? EMPTY_MESSAGES,
  );
  const isLoadingMessages = useChatStore(
    state => state.loadingMessagesByConversation[conversationId] ?? true,
  );
  const sendMessage = useChatStore(state => state.sendMessage);
  const isSending = useChatStore(
    state => state.sendingByConversation[conversationId] ?? false,
  );
  const error = useChatStore(state => state.error);
  const clearError = useChatStore(state => state.clearError);
  const [draft, setDraft] = useState('');
  const [pendingMessage, setPendingMessage] = useState<{
    text: string;
    afterSequence: number;
  } | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isStartingListening, setIsStartingListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const speechModule = useRef<SpeechRecognitionApi | null>(null);
  const speechSubscriptions = useRef<{ remove: () => void }[]>([]);
  const voiceDraftBase = useRef('');
  const ignoreSpeechErrorsAfterSend = useRef(false);
  const speechStatus = useSpeechStore(state => state.status);
  const speechMessageId = useSpeechStore(state => state.messageId);
  const speechConversationId = useSpeechStore(state => state.conversationId);
  const playSpeech = useSpeechStore(state => state.play);
  const stopSpeech = useSpeechStore(state => state.stop);
  const isPlayerVisible = useSpeechStore(
    state => state.status !== 'idle' || state.error !== null,
  );
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

  useEffect(() => {
    return () => {
      const module = speechModule.current;
      speechSubscriptions.current.forEach(subscription => subscription.remove());
      speechSubscriptions.current = [];
      if (module) {
        try {
          Promise.resolve(module.destroy()).catch(caughtError => {
            console.warn('Ses tanıma oturumu kapatılamadı.', caughtError);
          });
        } catch (caughtError) {
          console.warn('Ses tanıma oturumu kapatılamadı.', caughtError);
        }
      }
    };
  }, []);

  const ensureSpeechModule = async () => {
    if (!speechModule.current) {
      const module = await import('react-native-speech-recognition-kit');
      const { addEventListener, speechRecogntionEvents } = module;
      speechSubscriptions.current = [
        addEventListener(speechRecogntionEvents.PARTIAL_RESULTS, onSpeechTranscript),
        addEventListener(speechRecogntionEvents.RESULTS, onSpeechTranscript),
        addEventListener(speechRecogntionEvents.END, () => setIsListening(false)),
        addEventListener(speechRecogntionEvents.ERROR, onSpeechRecognitionError),
      ];
      speechModule.current = module;
    }
    return speechModule.current;
  };

  const onSpeechTranscript = (event: { value?: string }) => {
    const transcript = event.value?.trim();
    if (transcript) {
      setDraft(
        voiceDraftBase.current
          ? `${voiceDraftBase.current} ${transcript}`
          : transcript,
      );
    }
  };

  const onSpeechRecognitionError = (event: { message?: string }) => {
    setIsListening(false);
    setIsStartingListening(false);
    const message = event.message ?? 'Ses tanınamadı. Tekrar deneyin.';
    if (message.toLocaleLowerCase('tr-TR').includes('cancel')) {
      return;
    }

    if (ignoreSpeechErrorsAfterSend.current) {
      return;
    }

    setVoiceError(getVoiceNotice(new Error(message), 'Ses tanınamadı. Tekrar deneyin.'));
  };

  const toggleVoiceInput = async () => {
    if (isListening) {
      try {
        await speechModule.current?.stopListening();
      } catch (caughtError) {
        setVoiceError(getVoiceNotice(caughtError, 'Sesli giriş durdurulamadı. Tekrar deneyin.'));
      }
      setIsListening(false);
      return;
    }
    if (isStartingListening || isSending) {
      return;
    }

    setVoiceError(null);
    ignoreSpeechErrorsAfterSend.current = false;
    setIsStartingListening(true);
    try {
      if (Platform.OS === 'android') {
        const permission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        );
        if (permission !== PermissionsAndroid.RESULTS.GRANTED) {
          throw new Error('Sesli mesaj yazmak için mikrofon izni gereklidir.');
        }
      }

      const module = await ensureSpeechModule();
      const isAvailable = await module.isRecognitionAvailable();
      if (!isAvailable) {
        throw new Error('Bu cihazda konuşma tanıma kullanılamıyor.');
      }

      await module.setRecognitionLanguage('tr-TR');
      voiceDraftBase.current = draft.trim();
      Keyboard.dismiss();
      await module.startListening();
      setIsListening(true);
    } catch (caughtError) {
      setVoiceError(getVoiceNotice(caughtError, 'Sesli giriş başlatılamadı. Tekrar deneyin.'));
    } finally {
      setIsStartingListening(false);
    }
  };

  const toggleSpeech = async (message: ChatMessage) => {
    setVoiceError(null);
    if (
      speechStatus !== 'idle' &&
      speechConversationId === conversationId &&
      speechMessageId === message.id
    ) {
      await stopSpeech();
      return;
    }
    await playSpeech(message.content, message.id, conversationId, displayTitle);
  };

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

  const handleSend = async (messageText = draft) => {
    const text = messageText.trim();
    if (!text || isSending || isLoadingMessages || !user?.id) {
      return;
    }

    setVoiceError(null);
    ignoreSpeechErrorsAfterSend.current = true;
    const afterSequence = messages.reduce(
      (highest, message) => Math.max(highest, message.sequence),
      -1,
    );
    if (messageText === draft) {
      setDraft('');
    }
    setPendingMessage({ text, afterSequence });
    const sent = await sendMessage(user.id, conversationId, text, mode);
    setPendingMessage(null);
    if (!sent && messageText === draft) {
      setDraft(text);
    }
  };

  const isInterview = mode === 'interview';
  const displayTitle = title?.trim() || (isInterview ? 'Mülakat simülasyonu' : 'Yeni sohbet');
  const starterPrompts = isInterview ? INTERVIEW_STARTER_PROMPTS : STARTER_PROMPTS;

  return (
    <SafeAreaView style={styles.safeArea} edges={isPlayerVisible ? ['bottom'] : ['top', 'bottom']}>
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
            <Text style={styles.headerSubtitle}>{isInterview ? 'Mülakat koçu' : 'AI Asistan'}</Text>
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
              <Text style={styles.welcomeTitle}>
                {isInterview ? 'Mülakata hazır mısın?' : 'Nasıl yardımcı olabilirim?'}
              </Text>
              <Text style={styles.welcomeText}>
                {isInterview
                  ? 'Hedeflediğin rolü yaz; VirAI sırayla soru sorup her yanıtına geri bildirim versin.'
                  : 'Mesajını yaz, VirAI yanıtlasın. Sohbetin hesabına kaydedilir.'}
              </Text>
              <View style={styles.starterPrompts}>
                {starterPrompts.map(prompt => (
                  <Pressable
                    key={prompt}
                    accessibilityRole="button"
                    onPress={() => handleSend(prompt)}
                    disabled={isSending}
                    style={styles.starterPrompt}>
                    <Text style={styles.starterPromptText}>{prompt}</Text>
                  </Pressable>
                ))}
              </View>
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
                    {message.role === 'assistant' ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={
                          speechStatus !== 'idle' &&
                          speechConversationId === conversationId &&
                          speechMessageId === message.id
                            ? 'Sesli okumayı durdur'
                            : 'Yanıtı sesli dinle'
                        }
                        onPress={() => toggleSpeech(message)}
                        style={styles.speechButton}>
                        <Text style={styles.speechButtonText}>
                          {speechStatus !== 'idle' &&
                          speechConversationId === conversationId &&
                          speechMessageId === message.id
                            ? '■ Durdur'
                            : '▶ Dinle'}
                        </Text>
                      </Pressable>
                    ) : null}
                    {message.status === 'failed' ? (
                      <>
                        <Text style={styles.failedLabel}>
                          {message.error ?? error ?? 'Yanıt alınamadı. Lütfen tekrar deneyin.'}
                        </Text>
                        {message.role === 'user' ? (
                          <Pressable
                            accessibilityRole="button"
                            onPress={() => handleSend(message.content)}
                            disabled={isSending || isLoadingMessages}
                            style={styles.retryButton}>
                            <Text style={styles.retryButtonText}>
                              {isSending ? 'Tekrar deneniyor...' : 'Tekrar dene'}
                            </Text>
                          </Pressable>
                        ) : null}
                      </>
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
        {voiceError ? <Text style={styles.voiceNotice}>ⓘ {voiceError}</Text> : null}

        <View style={styles.composer}>
          <TextInput
            ref={input}
            value={draft}
            onChangeText={setDraft}
            placeholder={isInterview ? 'Yanıtını yaz...' : 'Mesajını yaz...'}
            placeholderTextColor={colors.placeholder}
            multiline
            maxLength={6000}
            editable={!isSending && !isListening}
            style={styles.input}
            accessibilityLabel={isInterview ? 'Mülakat yanıtını yaz' : 'Mesajını yaz'}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              isListening ? 'Sesli girişi durdur' : 'Sesli mesaj yaz'
            }
            accessibilityState={{ selected: isListening, busy: isStartingListening }}
            onPress={toggleVoiceInput}
            disabled={isSending || isStartingListening}
            style={[
              styles.voiceButton,
              isListening && styles.voiceButtonActive,
              (isSending || isStartingListening) && styles.sendButtonDisabled,
            ]}>
            <Text style={styles.voiceButtonText}>
              {isStartingListening ? '…' : isListening ? '■' : '🎙'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mesajı gönder"
            onPress={() => handleSend()}
            disabled={
              !draft.trim() ||
              isSending ||
              isLoadingMessages ||
              !user?.id ||
              isListening
            }
            style={[
              styles.sendButton,
              (!draft.trim() || isSending || isLoadingMessages || !user?.id || isListening) &&
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
  starterPrompts: {
    width: '100%',
    gap: 8,
    marginTop: 22,
  },
  starterPrompt: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  starterPromptText: { color: colors.textSecondary, fontSize: 13, textAlign: 'center' },
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
  retryButton: { alignSelf: 'flex-start', marginTop: 9, paddingVertical: 3 },
  retryButtonText: { color: colors.accent, fontSize: 12, fontWeight: '700' },
  speechButton: { alignSelf: 'flex-start', marginTop: 10, paddingVertical: 3 },
  speechButtonText: { color: colors.accent, fontSize: 12, fontWeight: '700' },
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
  voiceNotice: {
    color: colors.textSecondary,
    fontSize: 12,
    paddingHorizontal: 18,
    paddingBottom: 7,
  },
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
  voiceButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  voiceButtonActive: { backgroundColor: colors.error },
  voiceButtonText: { color: colors.textSecondary, fontSize: 16, fontWeight: '700' },
  sendButtonText: { color: '#FFFFFF', fontSize: 25, fontWeight: '700', lineHeight: 30 },
  footerNote: { color: colors.textMuted, fontSize: 10, textAlign: 'center', paddingVertical: 7 },
  });
}

const animationStyles = StyleSheet.create({
  typingDots: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  typingDot: { width: 7, height: 7, borderRadius: 4 },
});
