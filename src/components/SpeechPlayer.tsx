import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSpeechStore } from '../store/speechStore';
import { useTheme } from '../theme/ThemeProvider';

export function SpeechPlayer() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const status = useSpeechStore(state => state.status);
  const text = useSpeechStore(state => state.text);
  const conversationTitle = useSpeechStore(state => state.conversationTitle);
  const error = useSpeechStore(state => state.error);
  const pause = useSpeechStore(state => state.pause);
  const resume = useSpeechStore(state => state.resume);
  const stop = useSpeechStore(state => state.stop);
  const clearError = useSpeechStore(state => state.clearError);

  if (status === 'idle' && !error) {
    return null;
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.player}>
        <View style={styles.description}>
          <Text numberOfLines={1} style={styles.title}>
            {error ? 'Sesli okuma' : conversationTitle || 'Yanıt okunuyor'}
          </Text>
          <Text numberOfLines={1} style={styles.subtitle}>
            {error || text}
          </Text>
        </View>
        {status !== 'idle' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={status === 'playing' ? 'Sesli okumayı duraklat' : 'Sesli okumaya devam et'}
            onPress={() => (status === 'playing' ? pause() : resume())}
            style={styles.control}>
            <Text style={styles.controlText}>{status === 'playing' ? 'Ⅱ' : '▶'}</Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={status === 'idle' ? 'Uyarıyı kapat' : 'Sesli okumayı durdur'}
          onPress={() => (status === 'idle' ? clearError() : stop())}
          style={styles.control}>
          <Text style={styles.controlText}>{status === 'idle' ? '×' : '■'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    safeArea: {
      backgroundColor: colors.surface,
      borderBottomColor: colors.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      zIndex: 2,
    },
    player: {
      minHeight: 58,
      paddingHorizontal: 16,
      paddingVertical: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    description: {
      flex: 1,
    },
    title: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '700',
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    control: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    controlText: {
      color: colors.accent,
      fontSize: 16,
      fontWeight: '700',
    },
  });
}
