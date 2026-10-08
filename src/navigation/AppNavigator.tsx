import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';

import { LoginScreen } from '../features/auth/screens/LoginScreen/LoginScreen';
import { RegisterScreen } from '../features/auth/screens/RegisterScreen/RegisterScreen';
import { HomeScreen } from '../features/chat/screens/HomeScreen/HomeScreen';
import { AdventureScreen } from '../features/adventure/screens/AdventureScreen/AdventureScreen';
import { ChatScreen } from '../features/chat/screens/ChatScreen/ChatScreen';
import { useAuthStore } from '../features/auth/store/authStore';
import { useTheme } from '../theme';
import { styles } from './AppNavigator.styles';
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
          <Stack.Screen name="Adventure" component={AdventureScreen} />
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
