import { create } from 'zustand';

import {
  loginWithGoogle,
  loginWithEmailAndPassword,
  logoutFromFirebase,
  observeFirebaseAuth,
  registerWithEmailAndPassword,
  sendPasswordReset,
  updateUserProfile,
} from '../api/authApi';
import type {
  AppUser,
  LoginCredentials,
  RegisterCredentials,
  UpdateProfileCredentials,
} from '../types/user';

type AuthState = {
  user: AppUser | null;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  isLoading: boolean;
  isEmailLoginLoading: boolean;
  isGoogleLoginLoading: boolean;
  error: string | null;
  initialize: () => () => void;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (credentials: RegisterCredentials) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  updateProfile: (credentials: UpdateProfileCredentials) => Promise<boolean>;
  logout: () => Promise<boolean>;
  clearError: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isAuthReady: false,
  isLoading: false,
  isEmailLoginLoading: false,
  isGoogleLoginLoading: false,
  error: null,
  initialize: () =>
    observeFirebaseAuth(
      user =>
        set({
          user,
          isAuthenticated: user !== null,
          isAuthReady: true,
          error: null,
        }),
      message =>
        set({
          isAuthReady: true,
          error: message,
        }),
    ),
  login: async credentials => {
    set({ isLoading: true, isEmailLoginLoading: true, error: null });

    try {
      const user = await loginWithEmailAndPassword(credentials);
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        isEmailLoginLoading: false,
        error: null,
      });
      return true;
    } catch (error) {
      set({
        isLoading: false,
        isEmailLoginLoading: false,
        error: error instanceof Error ? error.message : 'Giriş sırasında bir hata oluştu.',
      });
      return false;
    }
  },
  register: async credentials => {
    set({ isLoading: true, error: null });

    try {
      const user = await registerWithEmailAndPassword(credentials);
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return true;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Kayıt sırasında bir hata oluştu.',
      });
      return false;
    }
  },
  loginWithGoogle: async () => {
    set({ isLoading: true, isGoogleLoginLoading: true, error: null });

    try {
      const user = await loginWithGoogle();

      if (!user) {
        set({ isLoading: false, isGoogleLoginLoading: false });
        return false;
      }

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        isGoogleLoginLoading: false,
        error: null,
      });
      return true;
    } catch (error) {
      set({
        isLoading: false,
        isGoogleLoginLoading: false,
        error: error instanceof Error ? error.message : 'Google ile giriş yapılamadı.',
      });
      return false;
    }
  },
  requestPasswordReset: async email => {
    set({ isLoading: true, error: null });

    try {
      await sendPasswordReset(email);
      set({ isLoading: false });
      return true;
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : 'Şifre sıfırlama isteği gönderilemedi.',
      });
      return false;
    }
  },
  updateProfile: async credentials => {
    set({ isLoading: true, error: null });

    try {
      const user = await updateUserProfile(credentials);
      set({ user, isLoading: false, error: null });
      return true;
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : 'Profil güncellenirken bir hata oluştu.',
      });
      return false;
    }
  },
  logout: async () => {
    set({ isLoading: true, error: null });

    try {
      await logoutFromFirebase();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      return true;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Çıkış yapılırken bir hata oluştu.',
      });
      return false;
    }
  },
  clearError: () => set({ error: null }),
}));
