import React, { useEffect } from 'react';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { Linking, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SpeechPlayer } from './src/components/SpeechPlayer';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useSpeechStore } from './src/store/speechStore';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';

export default function App() {
  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleLiveActivityAction(url);
    });

    Linking.getInitialURL()
      .then(handleLiveActivityAction)
      .catch(error => console.warn('Could not read the initial app URL:', error));

    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedNavigation />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function handleLiveActivityAction(url: string | null | undefined) {
  const speech = useSpeechStore.getState();

  if (url === 'virai://speech/pause') {
    speech.pause().catch(error => console.warn('Could not pause speech:', error));
  } else if (url === 'virai://speech/resume') {
    speech.resume().catch(error => console.warn('Could not resume speech:', error));
  } else if (url === 'virai://speech/stop') {
    speech.stop().catch(error => console.warn('Could not stop speech:', error));
  }
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
