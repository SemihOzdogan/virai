import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SceneIllustration } from '../../components/SceneIllustration';
import {
  cancelAdventureReminder,
  scheduleAdventureReminder,
} from '../../services/adventureReminder';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../../../../types/navigation';
import { useAuthStore } from '../../../auth/store/authStore';
import { useTheme, type AppTheme } from '../../../../theme';
import { useI18n } from '../../../../i18n';
import { createStyles } from './AdventureScreen.styles';
import {
  getStory,
  restoreAdventure,
  totalTurns,
  type Adventure,
} from '../../services/story';

type Props = StackScreenProps<RootStackParamList, 'Adventure'>;
export function AdventureScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const uid = useAuthStore(state => state.user?.id);
  // A different account gets a fresh component and its own save slot.
  return (
    <AdventureGame
      key={uid}
      uid={uid}
      styles={styles}
      colors={colors}
      onBack={() => navigation.goBack()}
    />
  );
}
function AdventureGame({
  uid,
  styles,
  colors,
  onBack,
}: {
  uid?: string;
  styles: ReturnType<typeof createStyles>;
  colors: AppTheme['colors'];
  onBack: () => void;
}) {
  const { language, t } = useI18n();
  const story = getStory(language);
  const [adventure, setAdventure] = useState<Adventure | null>(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  const alive = useRef(true);
  const scroll = useRef<React.ElementRef<typeof ScrollView>>(null);
  const storageKey = `virai-adventure-307-v1:${uid}`;
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(storageKey)
      .then(raw => {
        const saved = restoreAdventure(raw);
        if (active) {
          setAdventure(saved);
        }
      })
      .catch(() => {
        if (active) {
          setError(t('adventureLoadError'));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [storageKey, t]);

  useEffect(() => {
    if (!uid || loading || !adventure) {
      return;
    }

    const reminderTask =
      adventure.turns.length > 0 && adventure.turns.length < totalTurns
        ? scheduleAdventureReminder(uid)
        : cancelAdventureReminder(uid);
    reminderTask.catch(reminderError => {
      console.warn('Macera hatırlatıcısı güncellenemedi.', reminderError);
    });
  }, [adventure, loading, uid]);

  const play = async (text: string) => {
    const action = text.trim();
    if (
      !uid ||
      !adventure ||
      lock.current ||
      !action ||
      adventure.turns.length >= totalTurns
    ) {
      return;
    }
    lock.current = true;
    setBusy(true);
    setError(null);
    let stage: 'generate' | 'save' = 'generate';
    try {
      const { narrate } = await import('../../services/narrator');
      const scene = await narrate(adventure, action, language);
      const next: Adventure = {
        version: 1,
        turns: [...adventure.turns, { ...scene, action }],
      };
      stage = 'save';
      await AsyncStorage.setItem(storageKey, JSON.stringify(next));
      if (alive.current) {
        setAdventure(next);
        setInput('');
      }
    } catch (cause) {
      if (alive.current) {
        const detail =
          cause instanceof Error ? cause.message : 'Bilinmeyen hata';
        setError(
          stage === 'save'
            ? 'Sahne hazırlandı ama cihazına kaydedilemedi. Depolama alanını kontrol edip tekrar dene. Önceki ilerlemen korunuyor.'
            : `Anlatıcı yanıtı alınamadı. ${detail}`,
        );
      }
    } finally {
      lock.current = false;
      if (alive.current) {
        setBusy(false);
      }
    }
  };
  const restart = () =>
    Alert.alert(
      t('restartTitle'),
      t('restartMessage'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('restart'),
          style: 'destructive',
          onPress: async () => {
            if (lock.current || !uid) {
              return;
            }
            lock.current = true;
            setBusy(true);
            try {
              const next: Adventure = { version: 1, turns: [] };
              await AsyncStorage.setItem(storageKey, JSON.stringify(next));
              cancelAdventureReminder(uid).catch(reminderError => {
                console.warn(
                  'Macera hatırlatıcısı iptal edilemedi.',
                  reminderError,
                );
              });
              if (alive.current) {
                setAdventure(next);
                setInput('');
                setError(null);
              }
            } catch {
              if (alive.current) {
                setError(t('adventureResetError'));
              }
            } finally {
              lock.current = false;
              if (alive.current) {
                setBusy(false);
              }
            }
          },
        },
      ],
    );
  const count = adventure?.turns.length ?? 0;
  const complete = count === totalTurns;
  const chapter = Math.min(4, Math.floor(count / 3));
  const scene = adventure?.turns[count - 1] ?? story.opening;
  const share = async () => {
    try {
      await Share.share({
        message: `VirAI · Oda 307\nBenim hikâyemin sonu:\n\n${scene.text}`,
      });
    } catch {
      setError(t('shareError'));
    }
  };
  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('back')}
            onPress={onBack}
            style={styles.backButton}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.label}>{t('adventure')}</Text>
          <Text style={styles.muted}>
            {count}/{totalTurns}
          </Text>
        </View>
        {loading ? (
          <ActivityIndicator
            accessibilityLabel={t('adventureLoading')}
            color={colors.accent}
          />
        ) : (
          <ScrollView
            ref={scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.hero}>
              <Text style={styles.label}>{t('interactiveMystery')}</Text>
              <Text style={styles.title}>Oda 307</Text>
              <Text style={styles.subtitle}>
                {t('adventureHero')}
              </Text>
              <View style={styles.progress}>
                {story.chapters.map((title, index) => (
                  <View
                    key={title}
                    style={[
                      styles.segment,
                      {
                        backgroundColor:
                          index < Math.floor(count / 3)
                            ? colors.accent
                            : colors.border,
                      },
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.muted}>
                {t('adventureAutoSave')}
              </Text>
            </View>
            {adventure && (
              <>
                <Text style={styles.section}>
                  {complete
                    ? t('storyEnding')
                    : `${t('chapter', { number: chapter + 1 })} · ${story.chapters[chapter]}`}
                </Text>
                {count === 0 && (
                  <Text style={styles.muted}>
                    {t('characters')}: {story.characters.join(' • ')}
                  </Text>
                )}
                <SceneIllustration scene={story.opening} />
                <Text style={styles.story}>{story.opening.text}</Text>
                {adventure.turns.map((turn, index) => (
                  <View
                    key={index}
                    onLayout={event => {
                      if (index === count - 1) {
                        scroll.current?.scrollTo({
                          y: event.nativeEvent.layout.y,
                          animated: true,
                        });
                      }
                    }}
                  >
                    <Text style={styles.action}>↳ {turn.action}</Text>
                    <SceneIllustration scene={turn} />
                    <Text style={styles.story}>{turn.text}</Text>
                    {(index + 1) % 3 === 0 && (
                      <Text style={styles.reward}>
                        ✧ {t('chapter', { number: Math.floor(index / 3) + 1 })} · {story.clues[Math.floor(index / 3)]}{' '}
                        keşfedildi
                      </Text>
                    )}
                  </View>
                ))}
                {count > 0 && (
                  <View style={styles.collection}>
                    <Text style={styles.section}>
                      {t('collection')} · {Math.floor(count / 3)}/5
                    </Text>
                    <Text style={styles.muted}>
                      {story.clues.slice(0, Math.floor(count / 3)).join('  •  ') ||
                        t('firstClue')}
                    </Text>
                  </View>
                )}
                {!complete && (
                  <>
                    <Text style={styles.section}>{t('whatNext')}</Text>
                    {scene.choices.map(choice => (
                      <Pressable
                        key={choice}
                        accessibilityRole="button"
                        disabled={busy}
                        accessibilityState={{ disabled: busy }}
                        onPress={() => play(choice)}
                        style={[styles.choice, busy && styles.disabled]}
                      >
                        <Text style={styles.text}>{choice} →</Text>
                      </Pressable>
                    ))}
                    <TextInput
                      accessibilityLabel={t('customMove')}
                      placeholder={t('customMovePlaceholder')}
                      placeholderTextColor={colors.textMuted}
                      value={input}
                      onChangeText={setInput}
                      editable={!busy}
                      maxLength={600}
                      multiline
                      style={styles.input}
                    />
                    <Pressable
                      accessibilityRole="button"
                      disabled={busy || !input.trim()}
                      onPress={() => play(input)}
                      style={[
                        styles.primary,
                        (busy || !input.trim()) && styles.disabled,
                      ]}
                    >
                      <Text style={styles.primaryText}>{t('playMove')}</Text>
                    </Pressable>
                  </>
                )}
                {busy && (
                  <View style={styles.wait}>
                    <ActivityIndicator color={colors.accent} />
                    <Text style={styles.muted}>{t('writingStory')}</Text>
                  </View>
                )}
                {complete && (
                  <Pressable
                    accessibilityRole="button"
                    onPress={share}
                    style={styles.primary}
                  >
                    <Text style={styles.primaryText}>
                      {t('shareEnding')}
                    </Text>
                  </Pressable>
                )}
                {count > 0 && (
                  <Pressable
                    accessibilityRole="button"
                    disabled={busy}
                    onPress={restart}
                    style={styles.back}
                  >
                    <Text style={styles.muted}>{t('restartAdventure')}</Text>
                  </Pressable>
                )}
              </>
            )}
            {error && (
              <Text accessibilityRole="alert" style={styles.error}>
                {error}
              </Text>
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
