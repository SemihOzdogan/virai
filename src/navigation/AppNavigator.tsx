import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';

import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { useAuthStore } from '../store';
import { useTheme } from '../theme/ThemeProvider';
import type { RootStackParamList } from '../types/navigation';

const Stack = createStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { colors } = useTheme();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isAuthReady = useAuthStore(state => state.isAuthReady);
  const initialize = useAuthStore(state => state.initialize);

  useEffect(() => initialize(), [initialize]);

  if (!isAuthReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      key={isAuthenticated ? 'authenticated' : 'unauthenticated'}
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.background },
      }}>
      {isAuthenticated ? (
        <Stack.Group>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
        </Stack.Group>
      ) : (
        <Stack.Group>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
