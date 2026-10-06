import React from 'react';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SpeechPlayer } from './src/components/SpeechPlayer';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedNavigation />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function ThemedNavigation() {
  const { isDark, colors } = useTheme();
  const navigationTheme = isDark ? DarkTheme : DefaultTheme;

  return (
    <NavigationContainer
      theme={{
        ...navigationTheme,
        colors: {
          ...navigationTheme.colors,
          background: colors.background,
          card: colors.background,
          border: colors.border,
          text: colors.text,
          primary: colors.accent,
        },
      }}>
      <View style={styles.container}>
        <SpeechPlayer />
        <View style={styles.navigator}>
          <AppNavigator />
        </View>
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navigator: { flex: 1 },
});
