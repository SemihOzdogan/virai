import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSpeechStore } from '../store/speechStore';
import { useTheme } from '../../../theme';
import { useI18n } from '../../../i18n';
import { createStyles } from './SpeechPlayer.styles';

export function SpeechPlayer() {
  const { colors } = useTheme();
  const { t } = useI18n();
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
            {error ? t('voiceReading') : conversationTitle || t('responseReading')}
          </Text>
          <Text numberOfLines={1} style={styles.subtitle}>
            {error || text}
          </Text>
        </View>
        {status !== 'idle' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={status === 'playing' ? t('pauseReading') : t('resumeReading')}
            onPress={() => (status === 'playing' ? pause() : resume())}
            style={styles.control}>
            <Text style={styles.controlText}>{status === 'playing' ? 'Ⅱ' : '▶'}</Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={status === 'idle' ? t('dismissAlert') : t('stopReading')}
          onPress={() => (status === 'idle' ? clearError() : stop())}
          style={styles.control}>
          <Text style={styles.controlText}>{status === 'idle' ? '×' : '■'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
