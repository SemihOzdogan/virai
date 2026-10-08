import React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { useTheme, type ThemeMode } from './';
import { styles } from './ThemeSelector.styles';

const options: { mode: ThemeMode; label: string }[] = [
  { mode: 'system', label: 'Sistem' },
  { mode: 'light', label: 'Açık' },
  { mode: 'dark', label: 'Koyu' },
];

export function ThemeSelector() {
  const { mode, setMode, colors } = useTheme();
  const handleModeChange = (nextMode: ThemeMode) => {
    setMode(nextMode).catch(error => {
      console.warn('Tema tercihi kaydedilemedi.', error);
      Alert.alert('Tema tercihi kaydedilemedi', 'Görünüm değişti ancak tercih saklanamadı.');
    });
  };

  return (
    <View
      accessibilityLabel="Görünüm teması"
      style={[styles.container, { backgroundColor: colors.surfaceRaised }]}>
      {options.map(option => {
        const selected = mode === option.mode;
        return (
          <Pressable
            key={option.mode}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => handleModeChange(option.mode)}
            style={[
              styles.option,
              selected && { backgroundColor: colors.accent },
            ]}>
            <Text
              style={[
                styles.label,
                { color: selected ? colors.onAccent : colors.textSecondary },
              ]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
