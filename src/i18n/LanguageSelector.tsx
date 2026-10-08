import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme';
import { useI18n, type AppLanguage } from './I18nProvider';

export function LanguageSelector() {
  const { language, setLanguage, t } = useI18n();
  const { colors } = useTheme();

  const nextLanguage: AppLanguage = language === 'tr' ? 'en' : 'tr';
  const nextLanguageLabel = t(nextLanguage === 'tr' ? 'turkish' : 'english');
  const nextLanguageFlag = nextLanguage === 'tr' ? '🇹🇷' : '🇬🇧';

  const handleLanguageChange = () => {
    setLanguage(nextLanguage).catch(error => {
      console.warn('Dil tercihi kaydedilemedi.', error);
      Alert.alert(t('languageSaveErrorTitle'), t('languageSaveErrorMessage'));
    });
  };

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={nextLanguageLabel}
        onPress={handleLanguageChange}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: colors.accentSoft,
            borderColor: colors.border,
            opacity: pressed ? 0.72 : 1,
          },
        ]}
      >
        <Text style={styles.flag}>{nextLanguageFlag}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
  },
  button: {
    alignItems: 'center',
    borderRadius: 15,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 56,
  },
  flag: { fontSize: 25 },
});
