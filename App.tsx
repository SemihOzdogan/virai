import React, { useCallback, useEffect, useState } from 'react';
import {
  createNavigationContainerRef,
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { Linking, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { EventType } from '@notifee/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SpeechPlayer } from './src/components/SpeechPlayer';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useSpeechStore } from './src/store/speechStore';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';
import { useAuthStore } from './src/store';
import type { RootStackParamList } from './src/types/navigation';

const navigationRef = createNavigationContainerRef<RootStackParamList>();
const pendingAdventureKey = 'virai-pending-adventure-open';

export default function App() {
  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleLiveActivityAction(url);
    });

    Linking.getInitialURL()
      .then(handleLiveActivityAction)
      .catch(error =>
        console.warn('Could not read the initial app URL:', error),
      );

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
    speech
      .pause()
      .catch(error => console.warn('Could not pause speech:', error));
  } else if (url === 'virai://speech/resume') {
    speech
      .resume()
      .catch(error => console.warn('Could not resume speech:', error));
  } else if (url === 'virai://speech/stop') {
    speech.stop().catch(error => console.warn('Could not stop speech:', error));
  }
}

function ThemedNavigation() {
  const { isDark, colors } = useTheme();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const navigationTheme = isDark ? DarkTheme : DefaultTheme;
  const [navigationReady, setNavigationReady] = useState(false);
  const [shouldOpenAdventure, setShouldOpenAdventure] = useState(false);

  const handleAdventureNotification = useCallback(() => {
    setShouldOpenAdventure(true);
  }, []);

  useEffect(() => {
    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      if (
        type === EventType.PRESS &&
        detail.notification?.data?.destination === 'adventure'
      ) {
        handleAdventureNotification();
      }
    });

    notifee
      .getInitialNotification()
      .then(notification => {
        if (notification?.notification.data?.destination === 'adventure') {
          handleAdventureNotification();
        }
      })
      .catch(error =>
        console.warn('Could not read the initial notification:', error),
      );

    AsyncStorage.getItem(pendingAdventureKey)
      .then(value => {
        if (value === 'true') {
          return AsyncStorage.removeItem(pendingAdventureKey).then(
            handleAdventureNotification,
          );
        }
        return undefined;
      })
      .catch(error =>
        console.warn('Could not restore the pending adventure:', error),
      );

    return unsubscribe;
  }, [handleAdventureNotification]);

  useEffect(() => {
    if (!shouldOpenAdventure || !navigationReady || !isAuthenticated) {
      return;
    }

    navigationRef.navigate('Adventure');
    setShouldOpenAdventure(false);
  }, [isAuthenticated, navigationReady, shouldOpenAdventure]);

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => setNavigationReady(true)}
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
      }}
    >
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
