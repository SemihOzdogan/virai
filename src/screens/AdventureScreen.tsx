import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SceneIllustration } from '../adventure/SceneIllustration';
import {
  cancelAdventureReminder,
  scheduleAdventureReminder,
} from '../utils/adventureReminder';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/navigation';
import { useAuthStore } from '../store/authStore';
import { useTheme, type AppTheme } from '../theme/ThemeProvider';
import {
  chapters,
  characters,
  clues,
  opening,
  restoreAdventure,
  totalTurns,
  type Adventure,
} from '../adventure/story';

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
          setError('Kayıt yüklenemedi. Geri dönüp yeniden dene.');
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
  }, [storageKey]);

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
      const { narrate } = await import('../adventure/narrator');
      const scene = await narrate(adventure, action);
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
      'Yeni bir yol dene',
      'Bu maceranın cihazdaki ilerlemesi sıfırlanacak.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Yeniden başla',
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
                setError('İlerleme sıfırlanamadı. Tekrar dene.');
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
  const scene = adventure?.turns[count - 1] ?? opening;
  const share = async () => {
    try {
      await Share.share({
        message: `VirAI · Oda 307\nBenim hikâyemin sonu:\n\n${scene.text}`,
      });
    } catch {
      setError('Hikâye paylaşılamadı. Tekrar dene.');
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
            accessibilityLabel="Geri dön"
            onPress={onBack}
            style={styles.back}
          >
            <Text style={styles.text}>‹ Geri</Text>
          </Pressable>
          <Text style={styles.label}>MACERA</Text>
          <Text style={styles.muted}>
            {count}/{totalTurns}
          </Text>
        </View>
        {loading ? (
          <ActivityIndicator
            accessibilityLabel="Macera yükleniyor"
            color={colors.accent}
          />
        ) : (
          <ScrollView
            ref={scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.hero}>
              <Text style={styles.label}>İNTERAKTİF GİZEM · 5 BÖLÜM</Text>
              <Text style={styles.title}>Oda 307</Text>
              <Text style={styles.subtitle}>
                Otel seni hatırlıyor. Peki ya sen?
              </Text>
              <View style={styles.progress}>
                {chapters.map((title, index) => (
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
                İlerleme bu cihazda otomatik kaydedilir.
              </Text>
            </View>
            {adventure && (
              <>
                <Text style={styles.section}>
                  {complete
                    ? 'Hikâyenin sonu'
                    : `Bölüm ${chapter + 1} · ${chapters[chapter]}`}
                </Text>
                {count === 0 && (
                  <Text style={styles.muted}>
                    Karakterler: {characters.join(' • ')}
                  </Text>
                )}
                <SceneIllustration scene={opening} />
                <Text style={styles.story}>{opening.text}</Text>
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
                        ✧ Bölüm tamamlandı · {clues[Math.floor(index / 3)]}{' '}
                        keşfedildi
                      </Text>
                    )}
                  </View>
                ))}
                {count > 0 && (
                  <View style={styles.collection}>
                    <Text style={styles.section}>
                      Keşif koleksiyonun · {Math.floor(count / 3)}/5
                    </Text>
                    <Text style={styles.muted}>
                      {clues.slice(0, Math.floor(count / 3)).join('  •  ') ||
                        'İlk bölümün sonunda ilk ipucunu aç.'}
                    </Text>
                  </View>
                )}
                {!complete && (
                  <>
                    <Text style={styles.section}>Şimdi ne yapacaksın?</Text>
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
                      accessibilityLabel="Kendi hamleni yaz"
                      placeholder="Ya da kendi hamleni yaz…"
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
                      <Text style={styles.primaryText}>Hamleni oyna</Text>
                    </Pressable>
                  </>
                )}
                {busy && (
                  <View style={styles.wait}>
                    <ActivityIndicator color={colors.accent} />
                    <Text style={styles.muted}>Hikâyen yazılıyor…</Text>
                  </View>
                )}
                {complete && (
                  <Pressable
                    accessibilityRole="button"
                    onPress={share}
                    style={styles.primary}
                  >
                    <Text style={styles.primaryText}>
                      Hikâyemin sonunu paylaş
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
                    <Text style={styles.muted}>Baştan farklı bir yol dene</Text>
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
const createStyles = (colors: AppTheme['colors']) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    back: { paddingVertical: 14 },
    content: { padding: 22, paddingBottom: 40 },
    hero: {
      padding: 24,
      backgroundColor: colors.accentSoft,
      borderRadius: 24,
      marginBottom: 24,
    },
    label: {
      color: colors.accent,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 2,
    },
    title: {
      color: colors.text,
      fontSize: 42,
      fontWeight: '800',
      marginVertical: 12,
    },
    subtitle: { color: colors.textSecondary, fontSize: 16, lineHeight: 24 },
    progress: { flexDirection: 'row', gap: 6, marginVertical: 20 },
    segment: { flex: 1, height: 5, borderRadius: 3 },
    text: { color: colors.text, fontSize: 15, lineHeight: 23 },
    muted: { color: colors.textSecondary, fontSize: 12, lineHeight: 20 },
    section: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '700',
      marginBottom: 12,
    },
    story: {
      color: colors.text,
      fontSize: 17,
      lineHeight: 29,
      marginVertical: 18,
    },
    action: {
      color: colors.accent,
      backgroundColor: colors.accentSoft,
      padding: 16,
      borderRadius: 16,
      fontSize: 15,
      lineHeight: 23,
    },
    reward: {
      color: colors.accent,
      fontSize: 13,
      lineHeight: 22,
      marginBottom: 20,
    },
    collection: {
      padding: 18,
      borderRadius: 16,
      backgroundColor: colors.surfaceRaised,
      marginBottom: 24,
    },
    choice: {
      padding: 17,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      marginBottom: 10,
    },
    input: {
      color: colors.text,
      backgroundColor: colors.input,
      borderRadius: 16,
      padding: 16,
      minHeight: 80,
      marginVertical: 12,
      textAlignVertical: 'top',
    },
    primary: {
      backgroundColor: colors.accent,
      padding: 17,
      borderRadius: 16,
      alignItems: 'center',
    },
    primaryText: { color: colors.onAccent, fontWeight: '700', fontSize: 15 },
    disabled: { opacity: 0.45 },
    wait: {
      flexDirection: 'row',
      gap: 10,
      justifyContent: 'center',
      padding: 20,
    },
    error: {
      color: colors.error,
      fontSize: 14,
      lineHeight: 22,
      paddingVertical: 12,
    },
  });
