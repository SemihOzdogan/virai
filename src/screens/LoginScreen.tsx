import React, { useEffect, useMemo, useState } from 'react';
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
import Svg, { Path } from 'react-native-svg';
import type { StackScreenProps } from '@react-navigation/stack';

import { useAuthStore } from '../store';
import { useTheme, type AppTheme } from '../theme/ThemeProvider';
import type { RootStackParamList } from '../types/navigation';

type Props = StackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const login = useAuthStore(state => state.login);
  const loginWithGoogle = useAuthStore(state => state.loginWithGoogle);
  const requestPasswordReset = useAuthStore(state => state.requestPasswordReset);
  const isLoading = useAuthStore(state => state.isLoading);
  const isEmailLoginLoading = useAuthStore(state => state.isEmailLoginLoading);
  const isGoogleLoginLoading = useAuthStore(state => state.isGoogleLoginLoading);
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
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
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
              <Text style={styles.badgeText}>Vir</Text>
              <View style={styles.badgeAi}>
                <Text style={styles.badgeText}>AI</Text>
                <Text style={styles.badgeSpark}>✦</Text>
              </View>
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
                placeholder="Email adresinizi girin"
                placeholderTextColor={colors.placeholder}
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
                placeholderTextColor={colors.placeholder}
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
              style={[
                styles.primaryButton,
                isEmailLoginLoading && styles.primaryButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={isLoading}>
              <Text style={styles.primaryButtonText}>
                {isEmailLoginLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
              </Text>
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>veya</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.socialRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Google ile devam et"
                style={styles.socialButton}
                onPress={handleGoogleLogin}
                disabled={isLoading}>
                <Svg viewBox="0 0 120 120" style={styles.socialIcon}>
                  <Path
                    d="M117.6 61.3636c0-4.2545-.3818-8.3454-1.0909-12.2727H60v23.2091h32.2909c-1.3909 7.5-5.6182 13.8545-11.9727 18.1091v15.0545h19.3909C111.0545 95.0182 117.6 79.6364 117.6 61.3636Z"
                    fill="#4285F4"
                  />
                  <Path
                    d="M60 120c16.2 0 29.7818-5.3727 39.7091-14.5364L80.3182 90.4091c-5.3728 3.6-12.2455 5.7273-20.3182 5.7273-15.6273 0-28.8545-10.5546-33.5727-24.7364H6.3818v15.5454C16.2545 106.5545 36.5455 120 60 120Z"
                    fill="#34A853"
                  />
                  <Path
                    d="M26.4273 71.4C25.2273 67.8 24.5455 63.9545 24.5455 60s.6818-7.8 1.8818-11.4V33.0545H6.3818C2.3182 41.1545 0 50.3182 0 60s2.3182 18.8455 6.3818 26.9455L26.4273 71.4Z"
                    fill="#FBBC05"
                  />
                  <Path
                    d="M60 23.8636c8.8091 0 16.7182 3.0273 22.9364 8.9728l17.2091-17.2091C89.7545 5.9455 76.1727 0 60 0 36.5455 0 16.2545 13.4455 6.3818 33.0545L26.4273 48.6C31.1455 34.4182 44.3727 23.8636 60 23.8636Z"
                    fill="#EA4335"
                  />
                </Svg>
                <Text style={styles.socialText}>
                  {isGoogleLoginLoading ? 'Bağlanıyor...' : 'Google ile devam et'}
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

function createStyles(colors: AppTheme['colors'], isDark: boolean) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 40,
    },
    backgroundGlow: {
      position: 'absolute',
      width: 260,
      height: 260,
      borderRadius: 130,
      backgroundColor: colors.accent,
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
      width: 112,
      height: 54,
      borderRadius: 18,
      backgroundColor: 'rgba(124, 92, 255, 0.18)',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.14)',
      marginBottom: 20,
    },
    badgeText: {
      color: '#FFFFFF',
      fontSize: 21,
      fontWeight: '700',
    },
    badgeAi: { position: 'relative' },
    badgeSpark: {
      position: 'absolute',
      top: -5,
      left: '50%',
      color: '#17D1FF',
      fontSize: 15,
      transform: [{ translateX: 10 }],
    },
    title: {
      color: colors.text,
      fontSize: 36,
      fontWeight: '800',
      letterSpacing: -1,
    },
    subtitle: {
      marginTop: 10,
      color: colors.textSecondary,
      fontSize: 16,
      lineHeight: 24,
    },
    card: {
      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.72)' : colors.surface,
      borderRadius: 30,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 25,
      zIndex: 1,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.24,
      shadowRadius: 28,
      elevation: 10,
    },
    label: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
      marginBottom: 10,
      marginTop: 6,
    },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.input,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      marginBottom: 20,
      minHeight: 60,
    },
    inputIcon: {
      fontSize: 18,
      marginRight: 10,
    },
    input: {
      flex: 1,
      color: colors.text,
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
      color: colors.accent,
      fontSize: 14,
      fontWeight: '600',
    },
    primaryButton: {
      backgroundColor: colors.accent,
      borderRadius: 18,
      paddingVertical: 18,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.accent,
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
      color: colors.error,
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
      color: colors.textSecondary,
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
      backgroundColor: colors.input,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 13,
    },
    socialIcon: {
      width: 22,
      height: 22,
      marginRight: 8,
    },
    socialText: {
      color: colors.text,
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
      color: colors.textSecondary,
      fontSize: 15,
    },
    signupText: {
      color: colors.accent,
      fontSize: 15,
      fontWeight: '700',
      marginLeft: 6,
    },
  });
}
