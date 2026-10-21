import React, { useState } from 'react';
import { Alert, Modal, Pressable, Text, View } from 'react-native';

import { useTheme, type ThemeMode } from './';
import { useI18n } from '../i18n/I18nProvider';
import { styles } from './ThemeSelector.styles';

export function ThemeSelector() {
  const { isDark, mode, setMode, colors } = useTheme();
  const { t } = useI18n();
  const [isOpen, setOpen] = useState(false);
  const currentModeLabel = t(
    mode === 'system' ? 'themeSystem' : isDark ? 'themeDark' : 'themeLight',
  );

  const handleModeChange = (nextMode: ThemeMode) => {
    setMode(nextMode).then(() => setOpen(false)).catch(error => {
      console.warn('Tema tercihi kaydedilemedi.', error);
      Alert.alert(t('themeSaveErrorTitle'), t('themeSaveErrorMessage'));
    });
  };

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('theme')}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.option,
          {
            backgroundColor: colors.accentSoft,
            borderColor: colors.border,
            opacity: pressed ? 0.72 : 1,
          },
        ]}>
        <View style={[styles.icon, { backgroundColor: colors.accentSoft }]}>
          <Text style={styles.iconLabel}>
          {isDark ? '☀️' : '🌙'}
          </Text>
        </View>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: colors.text }]}>{t('theme')}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {currentModeLabel}
          </Text>
        </View>
        <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
      </Pressable>
      <Modal transparent animationType="fade" visible={isOpen} onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>{t('theme')}</Text>
            {(['system', 'light', 'dark'] as ThemeMode[]).map(option => {
              const label = t(
                option === 'system' ? 'themeSystem' : option === 'light' ? 'themeLight' : 'themeDark',
              );
              return (
                <Pressable key={option} onPress={() => handleModeChange(option)} style={styles.choice}>
                  <Text style={[styles.choiceText, { color: colors.text }]}>{label}</Text>
                  <Text style={[styles.check, { color: colors.accent }]}>{mode === option ? '✓' : ''}</Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
