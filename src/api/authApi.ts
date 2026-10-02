import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from '@firebase/auth';
import type { Unsubscribe } from '@firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import {
  getFirebaseAuth,
  getGoogleOAuthClientIds,
  isFirebaseConfigured,
} from '../config/firebase';
import { getAuthSessionExpiresAt } from '../utils/authSession';
import type { AppUser, LoginCredentials, RegisterCredentials } from '../types/user';

function toAppUser(user: User): AppUser {
  return {
    id: user.uid,
    email: user.email ?? '',
    name: user.displayName ?? user.email?.split('@')[0] ?? 'Kullanıcı',
    avatar: user.photoURL ?? undefined,
  };
}

function toAuthError(error: unknown) {
  if (error instanceof Error && error.message.startsWith('Firebase yapılandırması eksik')) {
    return error.message;
  }

  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : '';

  const messages: Record<string, string> = {
    'auth/invalid-email': 'Geçerli bir e-posta adresi girin.',
    'auth/invalid-credential': 'E-posta veya şifre doğru değil.',
    'auth/user-disabled': 'Bu hesap devre dışı bırakılmış.',
    'auth/user-not-found': 'Bu e-posta ile kayıtlı hesap bulunamadı.',
    'auth/wrong-password': 'E-posta veya şifre doğru değil.',
    'auth/too-many-requests': 'Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.',
    'auth/network-request-failed': 'Bağlantı kurulamadı. İnternet bağlantınızı kontrol edin.',
    'auth/email-not-found': 'Bu e-posta ile kayıtlı hesap bulunamadı.',
    'auth/operation-not-allowed': 'Bu giriş sağlayıcısı Firebase Console’da etkin değil.',
    'auth/account-exists-with-different-credential':
      'Bu e-posta başka bir giriş yöntemiyle kayıtlı. Önce o yöntemle giriş yapın.',
    'auth/email-already-in-use': 'Bu e-posta adresi zaten kayıtlı.',
    'auth/weak-password': 'Şifre en az 6 karakter olmalıdır.',
    'auth/missing-password': 'Şifre alanı zorunludur.',
  };

  if (messages[code]) {
    return messages[code];
  }

  return error instanceof Error ? error.message : 'Kimlik doğrulama sırasında bir hata oluştu.';
}

let googleSigninConfigured = false;

export async function loginWithGoogle(): Promise<AppUser | null> {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase yapılandırması eksik. src/config/firebase.ts dosyasındaki ayarları kontrol edin.',
    );
  }

  try {
    const { googleWebClientId, googleIosClientId } = getGoogleOAuthClientIds();

    if (!googleSigninConfigured) {
      GoogleSignin.configure({
        webClientId: googleWebClientId,
        iosClientId: googleIosClientId,
      });
      googleSigninConfigured = true;
    }

    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    if (response.type === 'cancelled') {
      return null;
    }

    const { idToken } = response.data;

    if (!idToken) {
      throw new Error(
        'Google kimlik belirteci alınamadı. Web OAuth Client ID yapılandırmasını kontrol edin.',
      );
    }

    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(getFirebaseAuth(), credential);
    return toAppUser(result.user);
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'SIGN_IN_CANCELLED'
    ) {
      return null;
    }

    throw new Error(toAuthError(error));
  }
}

export async function loginWithEmailAndPassword({
  email,
  password,
}: LoginCredentials): Promise<AppUser> {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase yapılandırması eksik. src/config/firebase.ts dosyasına Firebase Console bilgilerini ekleyin.',
    );
  }

  try {
    const credential = await signInWithEmailAndPassword(
      getFirebaseAuth(),
      email.trim(),
      password,
    );
    return toAppUser(credential.user);
  } catch (error) {
    throw new Error(toAuthError(error));
  }
}

export async function registerWithEmailAndPassword({
  name,
  email,
  password,
}: RegisterCredentials): Promise<AppUser> {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase yapılandırması eksik. src/config/firebase.ts dosyasındaki ayarları kontrol edin.',
    );
  }

  try {
    const credential = await createUserWithEmailAndPassword(
      getFirebaseAuth(),
      email.trim(),
      password,
    );
    await updateProfile(credential.user, { displayName: name.trim() });
    return toAppUser(credential.user);
  } catch (error) {
    throw new Error(toAuthError(error));
  }
}

export async function sendPasswordReset(email: string) {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase yapılandırması eksik. src/config/firebase.ts dosyasına Firebase Console bilgilerini ekleyin.',
    );
  }

  try {
    await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
  } catch (error) {
    throw new Error(toAuthError(error));
  }
}

export async function logoutFromFirebase() {
  try {
    await signOut(getFirebaseAuth());
  } catch (error) {
    throw new Error(toAuthError(error));
  }
}

export function observeFirebaseAuth(
  onUserChange: (user: AppUser | null) => void,
  onError: (message: string) => void,
): Unsubscribe {
  try {
    const auth = getFirebaseAuth();
    let expiryTimeout: ReturnType<typeof setTimeout> | undefined;

    const unsubscribe = onAuthStateChanged(
      auth,
      user => {
        if (expiryTimeout) {
          clearTimeout(expiryTimeout);
          expiryTimeout = undefined;
        }

        if (!user) {
          onUserChange(null);
          return;
        }

        const expiresAt = getAuthSessionExpiresAt(user.metadata.lastSignInTime);
        if (expiresAt === null || expiresAt <= Date.now()) {
          signOut(auth).catch(error => onError(toAuthError(error)));
          return;
        }

        onUserChange(toAppUser(user));
        expiryTimeout = setTimeout(() => {
          if (auth.currentUser?.uid === user.uid && Date.now() >= expiresAt) {
            signOut(auth).catch(error => onError(toAuthError(error)));
          }
        }, expiresAt - Date.now());
      },
      error => onError(toAuthError(error)),
    );

    return () => {
      if (expiryTimeout) {
        clearTimeout(expiryTimeout);
      }
      unsubscribe();
    };
  } catch (error) {
    onError(toAuthError(error));
    return () => {};
  }
}
