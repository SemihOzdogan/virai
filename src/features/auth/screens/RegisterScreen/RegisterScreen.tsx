import React, { useEffect, useMemo, useState } from 'react';
import {
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
import type { StackScreenProps } from '@react-navigation/stack';

import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../../../theme';
import { useI18n } from '../../../../i18n';
import { createStyles } from './RegisterScreen.styles';
import type { RootStackParamList } from '../../../../types/navigation';

type Props = StackScreenProps<RootStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const register = useAuthStore(state => state.register);
  const isLoading = useAuthStore(state => state.isLoading);
  const error = useAuthStore(state => state.error);
  const clearError = useAuthStore(state => state.clearError);

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setValidationError(t('validationAllFields'));
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setValidationError(t('validationEmail'));
      return;
    }

    if (password.length < 6) {
      setValidationError(t('validationPasswordLength'));
      return;
    }

    if (password !== confirmPassword) {
      setValidationError(t('validationPasswordsMatch'));
      return;
    }

    setValidationError(null);
    await register({ name, email, password });
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
          <View style={styles.glow} />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('backToLogin')}
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>

          <View style={styles.header}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Vir</Text>
              <View style={styles.badgeAi}>
                <Text style={styles.badgeText}>AI</Text>
                <Text style={styles.badgeSpark}>✦</Text>
              </View>
            </View>
            <Text style={styles.title}>{t('createAccount')}</Text>
            <Text style={styles.subtitle}>{t('createAccountSubtitle')}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>{t('fullName')}</Text>
            <View style={styles.inputWrap}>
              <TextInput
                value={name}
                onChangeText={value => {
                  setName(value);
                  setValidationError(null);
                }}
                placeholder={t('fullNamePlaceholder')}
                placeholderTextColor={colors.placeholder}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
                style={styles.input}
                accessibilityLabel={t('fullName')}
              />
            </View>

            <Text style={styles.label}>{t('email')}</Text>
            <View style={styles.inputWrap}>
              <TextInput
                value={email}
                onChangeText={value => {
                  setEmail(value);
                  setValidationError(null);
                }}
                placeholder={t('emailPlaceholder')}
                placeholderTextColor={colors.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                style={styles.input}
                accessibilityLabel={t('email')}
              />
            </View>

            <Text style={styles.label}>{t('password')}</Text>
            <View style={styles.inputWrap}>
              <TextInput
                value={password}
                onChangeText={value => {
                  setPassword(value);
                  setValidationError(null);
                }}
                placeholder={t('newPasswordPlaceholder')}
                placeholderTextColor={colors.placeholder}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                style={styles.input}
                accessibilityLabel={t('password')}
              />
            </View>

            <Text style={styles.label}>{t('confirmPassword')}</Text>
            <View style={styles.inputWrap}>
              <TextInput
                value={confirmPassword}
                onChangeText={value => {
                  setConfirmPassword(value);
                  setValidationError(null);
                }}
                placeholder={t('confirmPasswordPlaceholder')}
                placeholderTextColor={colors.placeholder}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
                style={styles.input}
                accessibilityLabel={t('confirmPassword')}
              />
            </View>

            {validationError ? <Text style={styles.error}>{validationError}</Text> : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              accessibilityRole="button"
              style={[styles.primaryButton, isLoading && styles.disabledButton]}
              onPress={handleRegister}
              disabled={isLoading}>
              <Text style={styles.primaryButtonText}>
                {isLoading ? t('creatingAccount') : t('register')}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
