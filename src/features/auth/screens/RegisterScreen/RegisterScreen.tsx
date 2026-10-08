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
import { createStyles } from './RegisterScreen.styles';
import type { RootStackParamList } from '../../../../types/navigation';

type Props = StackScreenProps<RootStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();
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
      setValidationError('Lütfen tüm alanları doldurun.');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setValidationError('Geçerli bir e-posta adresi girin.');
      return;
    }

    if (password.length < 6) {
      setValidationError('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Şifreler eşleşmiyor.');
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
            accessibilityLabel="Giriş ekranına dön"
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
            <Text style={styles.title}>Hesap oluştur</Text>
            <Text style={styles.subtitle}>Aramıza katılmak için bilgilerini gir.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Ad soyad</Text>
            <View style={styles.inputWrap}>
              <TextInput
                value={name}
                onChangeText={value => {
                  setName(value);
                  setValidationError(null);
                }}
                placeholder="Adınız Soyadınız"
                placeholderTextColor={colors.placeholder}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
                style={styles.input}
                accessibilityLabel="Ad soyad"
              />
            </View>

            <Text style={styles.label}>E-posta</Text>
            <View style={styles.inputWrap}>
              <TextInput
                value={email}
                onChangeText={value => {
                  setEmail(value);
                  setValidationError(null);
                }}
                placeholder="Email adresinizi girin"
                placeholderTextColor={colors.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                style={styles.input}
                accessibilityLabel="E-posta"
              />
            </View>

            <Text style={styles.label}>Şifre</Text>
            <View style={styles.inputWrap}>
              <TextInput
                value={password}
                onChangeText={value => {
                  setPassword(value);
                  setValidationError(null);
                }}
                placeholder="En az 6 karakter"
                placeholderTextColor={colors.placeholder}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                style={styles.input}
                accessibilityLabel="Şifre"
              />
            </View>

            <Text style={styles.label}>Şifreyi tekrar gir</Text>
            <View style={styles.inputWrap}>
              <TextInput
                value={confirmPassword}
                onChangeText={value => {
                  setConfirmPassword(value);
                  setValidationError(null);
                }}
                placeholder="Şifrenizi tekrar girin"
                placeholderTextColor={colors.placeholder}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
                style={styles.input}
                accessibilityLabel="Şifreyi tekrar gir"
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
                {isLoading ? 'Hesap oluşturuluyor...' : 'Kayıt Ol'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
