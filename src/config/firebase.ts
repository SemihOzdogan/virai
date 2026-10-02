import { getApp, getApps, initializeApp } from '@firebase/app';
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  type Auth,
} from '@firebase/auth';
import { createAsyncStorage } from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAY6pFusEdRikosJIxCq0U6luDI4BptjdY",
  authDomain: "deneme-7d49d.firebaseapp.com",
  projectId: "deneme-7d49d",
  storageBucket: "deneme-7d49d.firebasestorage.app",
  messagingSenderId: "77879130693",
  appId: "1:77879130693:web:3ba46358540e5d34cf812c",
  measurementId: "G-3BNQ6XVH8W",
  googleWebClientId: 'YOUR_GOOGLE_WEB_CLIENT_ID',
  googleIosClientId: 'YOUR_GOOGLE_IOS_CLIENT_ID',
};

const { googleWebClientId, googleIosClientId, ...firebaseAppConfig } = firebaseConfig;

export function isFirebaseConfigured() {
  return Object.entries(firebaseConfig)
    .filter(([key]) => key !== 'googleWebClientId' && key !== 'googleIosClientId')
    .every(([, value]) => value.length > 0 && !value.startsWith('YOUR_'));
}

export function getGoogleOAuthClientIds() {
  if (
    googleWebClientId.startsWith('YOUR_') ||
    googleIosClientId.startsWith('YOUR_')
  ) {
    throw new Error(
      'Google OAuth Client ID değerleri eksik. src/config/firebase.ts dosyasını ve iOS URL scheme ayarını tamamlayın.',
    );
  }

  return { googleWebClientId, googleIosClientId };
}

export function getFirebaseApp() {
  return getApps().length > 0 ? getApp() : initializeApp(firebaseAppConfig);
}

let authInstance: Auth | undefined;
const authStorage = createAsyncStorage('firebase-auth');

export function getFirebaseAuth() {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase yapılandırması eksik. src/config/firebase.ts dosyasına Firebase Console bilgilerini ekleyin.',
    );
  }

  if (authInstance) {
    return authInstance;
  }

  const app = getFirebaseApp();

  try {
    authInstance = initializeAuth(app, {
      persistence: getReactNativePersistence(authStorage),
    });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'auth/already-initialized'
    ) {
      authInstance = getAuth(app);
    } else {
      throw error;
    }
  }

  return authInstance;
}
