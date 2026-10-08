import React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { useTheme, type ThemeMode } from './';
import { useI18n } from '../i18n/I18nProvider';
import { styles } from './ThemeSelector.styles';

export function ThemeSelector() {
  const { isDark, setMode, colors } = useTheme();
  const { t } = useI18n();
  const nextMode: ThemeMode = isDark ? 'light' : 'dark';
  const nextModeLabel = t(isDark ? 'themeLight' : 'themeDark');

  const handleModeChange = () => {
    setMode(nextMode).catch(error => {
      console.warn('Tema tercihi kaydedilemedi.', error);
      Alert.alert(t('themeSaveErrorTitle'), t('themeSaveErrorMessage'));
    });
  };

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={nextModeLabel}
        onPress={handleModeChange}
        style={({ pressed }) => [
          styles.option,
          {
            backgroundColor: colors.accentSoft,
            borderColor: colors.border,
            opacity: pressed ? 0.72 : 1,
          },
        ]}>
        <Text style={[styles.label, { color: colors.accent }]}>
          {isDark ? '☀️' : '🌙'}
        </Text>
      </Pressable>
    </View>
  );
}
