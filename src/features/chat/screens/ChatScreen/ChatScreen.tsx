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
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';

import { useAuthStore } from '../../../auth/store/authStore';
import { useChatStore } from '../../store/chatStore';
import { useSpeechStore } from '../../../speech/store/speechStore';
import { useTheme } from '../../../../theme';
import { useI18n } from '../../../../i18n';
import { animationStyles, createStyles } from './ChatScreen.styles';
import type { ChatMessage } from '../../types/chat';
import type { RootStackParamList } from '../../../../types/navigation';

type Props = StackScreenProps<RootStackParamList, 'Chat'>;
type SpeechRecognitionApi = typeof import('react-native-speech-recognition-kit');

const EMPTY_MESSAGES: ChatMessage[] = [];
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
  const { t } = useI18n();
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
  const displayTitle = title?.trim() || (isInterview ? t('interviewSimulation') : t('newChat'));
  const starterPrompts = isInterview
    ? [t('interviewPromptOne'), t('interviewPromptTwo'), t('interviewPromptThree')]
    : [t('starterPromptOne'), t('starterPromptTwo'), t('starterPromptThree')];

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
            accessibilityLabel={t('back')}
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <Text numberOfLines={1} style={styles.headerTitle}>{displayTitle}</Text>
            <Text style={styles.headerSubtitle}>{isInterview ? t('interviewCoach') : t('aiAssistantLabel')}</Text>
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
                {isInterview ? t('readyForInterview') : t('howCanIHelp')}
              </Text>
              <Text style={styles.welcomeText}>
                {isInterview
                  ? t('interviewWelcome')
                  : t('chatWelcome')}
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
                            ? t('stopReading')
                            : t('listenToAnswer')
                        }
                        onPress={() => toggleSpeech(message)}
                        style={styles.speechButton}>
                        <Text style={styles.speechButtonText}>
                          {speechStatus !== 'idle' &&
                          speechConversationId === conversationId &&
                          speechMessageId === message.id
                            ? `■ ${t('stop')}`
                            : `▶ ${t('listen')}`}
                        </Text>
                      </Pressable>
                    ) : null}
                    {message.status === 'failed' ? (
                      <>
                        <Text style={styles.failedLabel}>
                          {message.error ?? error ?? t('answerFailed')}
                        </Text>
                        {message.role === 'user' ? (
                          <Pressable
                            accessibilityRole="button"
                            onPress={() => handleSend(message.content)}
                            disabled={isSending || isLoadingMessages}
                            style={styles.retryButton}>
                            <Text style={styles.retryButtonText}>
                              {isSending ? t('retrying') : t('retry')}
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
            placeholder={isInterview ? t('interviewAnswerPlaceholder') : t('messagePlaceholder')}
            placeholderTextColor={colors.placeholder}
            multiline
            maxLength={6000}
            editable={!isSending && !isListening}
            style={styles.input}
            accessibilityLabel={isInterview ? t('interviewAnswerLabel') : t('messageLabel')}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              isListening ? t('stopVoiceInput') : t('startVoiceInput')
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
            accessibilityLabel={t('sendMessage')}
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
          {t('messagesPrivacyNote')}
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
