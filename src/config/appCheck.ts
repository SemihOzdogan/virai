import { getApp } from '@react-native-firebase/app';
import {
  initializeAppCheck,
  ReactNativeFirebaseAppCheckProvider,
  type AppCheck,
} from '@react-native-firebase/app-check';

let appCheckInstance: AppCheck | undefined;

/**
 * Initializes Firebase App Check once before any Firebase AI Logic request.
 * Debug builds use the debug provider so the iOS simulator can be registered;
 * release builds use the providers registered in Firebase Console.
 */
export function getFirebaseAppCheck() {
  if (appCheckInstance) {
    return appCheckInstance;
  }

  const provider = new ReactNativeFirebaseAppCheckProvider();
  provider.configure({
    apple: {
      provider: __DEV__ ? 'debug' : 'appAttestWithDeviceCheckFallback',
    },
    android: {
      provider: __DEV__ ? 'debug' : 'playIntegrity',
    },
    isTokenAutoRefreshEnabled: true,
  });

  appCheckInstance = initializeAppCheck(getApp(), {
    provider,
    isTokenAutoRefreshEnabled: true,
  });

  return appCheckInstance;
}

