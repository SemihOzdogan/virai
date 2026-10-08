import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import type { StackScreenProps } from '@react-navigation/stack';

import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../../../theme';
import { useI18n } from '../../../../i18n';
import { createStyles } from './LoginScreen.styles';
import type { RootStackParamList } from '../../../../types/navigation';

type Props = StackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();
  const { t } = useI18n();
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
      Alert.alert(t('loginRequiredTitle'), t('loginRequiredMessage'));
      return;
    }

    await login({ email, password });
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      Alert.alert(t('resetEmailRequiredTitle'), t('resetEmailRequiredMessage'));
      return;
    }

    const sent = await requestPasswordReset(email);

    if (sent) {
      Alert.alert(t('resetSentTitle'), t('resetSentMessage'));
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
            <Text style={styles.title}>{t('loginWelcome')}</Text>
            <Text style={styles.subtitle}>{t('loginSubtitle')}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>{t('email')}</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder={t('emailPlaceholder')}
                placeholderTextColor={colors.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>

            <Text style={styles.label}>{t('password')}</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={t('passwordPlaceholder')}
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
                <Text style={styles.forgotText}>{t('forgotPassword')}</Text>
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
                {isEmailLoginLoading ? t('loggingIn') : t('login')}
              </Text>
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>{t('or')}</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.socialRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('continueWithGoogle')}
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
                  {isGoogleLoginLoading ? t('connecting') : t('continueWithGoogle')}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('noAccount')}</Text>
            <Pressable onPress={() => navigation.navigate('Register')}>
              <Text style={styles.signupText}>{t('signUp')}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
