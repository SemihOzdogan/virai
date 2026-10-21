import React, { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme';
import { useI18n, type LanguagePreference } from './I18nProvider';

export function LanguageSelector() {
  const { language, preference, setLanguage, t } = useI18n();
  const { colors } = useTheme();
  const [isOpen, setOpen] = useState(false);

  const currentLanguageLabel = t(language === 'tr' ? 'turkish' : 'english');
  const currentLanguageFlag = language === 'tr' ? '🇹🇷' : '🇬🇧';

  const handleLanguageChange = (nextLanguage: LanguagePreference) => {
    setLanguage(nextLanguage).then(() => setOpen(false)).catch(error => {
      console.warn('Dil tercihi kaydedilemedi.', error);
      Alert.alert(t('languageSaveErrorTitle'), t('languageSaveErrorMessage'));
    });
  };

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('language')}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: colors.accentSoft,
            borderColor: colors.border,
            opacity: pressed ? 0.72 : 1,
          },
        ]}
      >
        <View style={[styles.icon, { backgroundColor: colors.accentSoft }]}>
          <Text style={styles.flag}>{currentLanguageFlag}</Text>
        </View>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: colors.text }]}>{t('language')}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {currentLanguageLabel}
          </Text>
        </View>
        <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
      </Pressable>
      <Modal transparent animationType="fade" visible={isOpen} onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>{t('language')}</Text>
            {(['system', 'tr', 'en'] as LanguagePreference[]).map(option => {
              const label = t(option === 'system' ? 'system' : option === 'tr' ? 'turkish' : 'english');
              return (
                <Pressable key={option} onPress={() => handleLanguageChange(option)} style={styles.choice}>
                  <Text style={[styles.choiceText, { color: colors.text }]}>{label}</Text>
                  <Text style={[styles.check, { color: colors.accent }]}>{preference === option ? '✓' : ''}</Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  button: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 64,
    paddingHorizontal: 12,
  },
  icon: {
    alignItems: 'center',
    borderRadius: 12,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  flag: { fontSize: 20 },
  copy: { flex: 1, marginLeft: 12 },
  title: { fontSize: 14, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 3 },
  chevron: { fontSize: 24, lineHeight: 26 },
  backdrop: {
    alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.42)', flex: 1,
    justifyContent: 'center', padding: 24,
  },
  sheet: { borderRadius: 20, padding: 18, width: '100%' },
  sheetTitle: { fontSize: 17, fontWeight: '800', marginBottom: 8 },
  choice: { alignItems: 'center', flexDirection: 'row', minHeight: 50 },
  choiceText: { flex: 1, fontSize: 16, fontWeight: '600' },
  check: { fontSize: 20, fontWeight: '800' },
});
