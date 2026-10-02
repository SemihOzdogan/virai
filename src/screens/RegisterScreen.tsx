import React, { useEffect, useState } from 'react';
import {
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

type Props = StackScreenProps<RootStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
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
      <StatusBar barStyle="light-content" />
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
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Text style={styles.backText}>‹  Girişe dön</Text>
          </Pressable>

          <View style={styles.header}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>A+</Text>
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
                placeholderTextColor="#8EA0BE"
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
                placeholder="ornek@mail.com"
                placeholderTextColor="#8EA0BE"
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
                placeholderTextColor="#8EA0BE"
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
                placeholderTextColor="#8EA0BE"
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

          <Text style={styles.note}>
            Hesabın oluşturulduğunda Firebase Authentication’a kaydedilir.
          </Text>
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
    paddingTop: 20,
    paddingBottom: 36,
  },
  glow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#7C5CFF',
    opacity: 0.2,
    top: -60,
    right: -80,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingRight: 12,
    marginBottom: 16,
  },
  backText: {
    color: '#AAB9D9',
    fontSize: 15,
    fontWeight: '600',
  },
  header: {
    marginBottom: 22,
  },
  badge: {
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor: 'rgba(124, 92, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    marginBottom: 18,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  title: {
    color: '#F5F7FF',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  subtitle: {
    marginTop: 8,
    color: '#AAB9D9',
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(164, 180, 255, 0.18)',
    padding: 22,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.22,
    shadowRadius: 26,
    elevation: 10,
  },
  label: {
    color: '#DCE5FF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 9,
    marginTop: 4,
  },
  inputWrap: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(148, 163, 184, 0.08)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  input: {
    flex: 1,
    color: '#F8FAFF',
    fontSize: 15,
    paddingVertical: 14,
  },
  error: {
    color: '#FF8A8A',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#7C5CFF',
    borderRadius: 17,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 7,
  },
  disabledButton: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  note: {
    color: '#8493B3',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 18,
  },
});
