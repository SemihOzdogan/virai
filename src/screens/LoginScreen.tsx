import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';

import { useAuthStore } from '../store';
import type { RootStackParamList } from '../types/navigation';

type Props = StackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const login = useAuthStore(state => state.login);
  const loginWithGoogle = useAuthStore(state => state.loginWithGoogle);
  const requestPasswordReset = useAuthStore(state => state.requestPasswordReset);
  const isLoading = useAuthStore(state => state.isLoading);
  const error = useAuthStore(state => state.error);
  const clearError = useAuthStore(state => state.clearError);

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Hata', 'E-posta ve şifre alanlarını doldurmalısın.');
      return;
    }

    await login({ email, password });
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      Alert.alert('E-posta gerekli', 'Şifre sıfırlama bağlantısı için e-posta adresini girin.');
      return;
    }

    const sent = await requestPasswordReset(email);

    if (sent) {
      Alert.alert('E-postanızı kontrol edin', 'Şifre sıfırlama bağlantısı gönderildi.');
    }
  };

  const handleGoogleLogin = async () => {
    await loginWithGoogle();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.backgroundGlow} />
          <View style={styles.backgroundGlowSecondary} />

          <View style={styles.headerWrap}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>A+</Text>
            </View>
            <Text style={styles.title}>Hoş geldin</Text>
            <Text style={styles.subtitle}>Devam etmek için giriş yap.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>E-posta</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="ornek@mail.com"
                placeholderTextColor="#8EA0BE"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>

            <Text style={styles.label}>Şifre</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Şifrenizi girin"
                placeholderTextColor="#8EA0BE"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
              <Pressable
                onPress={() => setShowPassword(value => !value)}
                style={styles.eyeButton}>
                <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
              </Pressable>
            </View>

            <View style={styles.row}>
              <Pressable onPress={handlePasswordReset} disabled={isLoading}>
                <Text style={styles.forgotText}>Şifremi unuttum</Text>
              </Pressable>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
              style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}>
              <Text style={styles.primaryButtonText}>{isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}</Text>
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>veya</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.socialRow}>
              <Pressable
                style={styles.socialButton}
                onPress={handleGoogleLogin}
                disabled={isLoading}>
                <Text style={styles.socialIcon}>G</Text>
                <Text style={styles.socialText}>
                  {isLoading ? 'Bağlanıyor...' : 'Google ile devam et'}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Hesabın yok mu?</Text>
            <Pressable onPress={() => navigation.navigate('Register')}>
              <Text style={styles.signupText}>Kayıt ol</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B1020',
  },
  container: {
    flex: 1,
    backgroundColor: '#0B1020',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  backgroundGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#7C5CFF',
    opacity: 0.24,
    top: -30,
    right: -60,
  },
  backgroundGlowSecondary: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#17D1FF',
    opacity: 0.18,
    bottom: 140,
    left: -90,
  },
  headerWrap: {
    marginTop: 24,
    marginBottom: 20,
    zIndex: 1,
  },
  badge: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: 'rgba(124, 92, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    marginBottom: 20,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  title: {
    color: '#F5F7FF',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  subtitle: {
    marginTop: 10,
    color: '#AAB9D9',
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(164, 180, 255, 0.18)',
    padding: 22,
    zIndex: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.24,
    shadowRadius: 28,
    elevation: 10,
  },
  label: {
    color: '#DCE5FF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(148, 163, 184, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    paddingHorizontal: 12,
    marginBottom: 18,
    minHeight: 58,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#F8FAFF',
    fontSize: 16,
    paddingVertical: 16,
  },
  eyeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  eyeText: {
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 22,
  },
  forgotText: {
    color: '#7C9BFF',
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#7C5CFF',
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  errorText: {
    color: '#FF8A8A',
    fontSize: 13,
    marginBottom: 14,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.25)',
  },
  dividerText: {
    marginHorizontal: 14,
    color: '#AAB9D9',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
  },
  socialIcon: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
    marginRight: 8,
  },
  socialText: {
    color: '#EFF4FF',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    marginTop: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  footerText: {
    color: '#AAB9D9',
    fontSize: 15,
  },
  signupText: {
    color: '#7C9BFF',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 6,
  },
});
