import React, { useState } from 'react';
import {
  ActivityIndicator,
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

import { useTheme } from '../../../../theme';
import { useI18n } from '../../../../i18n';
import type { RootStackParamList } from '../../../../types/navigation';
import {
  chooseDocument,
  chooseImage,
  type SelectedDocument,
  type SelectedImage,
} from '../../services/documentAttachment';
import { createConversationId } from '../../api/chatApi';
import { useAuthStore } from '../../../auth/store/authStore';
import { createStyles } from './JobApplicationScreen.styles';

type Props = StackScreenProps<RootStackParamList, 'JobApplication'>;

export function JobApplicationScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();
  const { t } = useI18n();
  const styles = createStyles(colors);
  const user = useAuthStore(state => state.user);
  const [resume, setResume] = useState<SelectedDocument | null>(null);
  const [listingImage, setListingImage] = useState<SelectedImage | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isPicking, setIsPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickResume = async () => {
    if (isPicking) return;
    setError(null);
    setIsPicking(true);
    try {
      const document = await chooseDocument();
      if (document) setResume(document);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : t('documentPickError'),
      );
    } finally {
      setIsPicking(false);
    }
  };

  const pickListingImage = async () => {
    if (isPicking) return;
    setError(null);
    setIsPicking(true);
    try {
      const image = await chooseImage();
      if (image) setListingImage(image);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : t('imagePickError'),
      );
    } finally {
      setIsPicking(false);
    }
  };

  const startPackage = () => {
    const listing = jobDescription.trim();
    if (!user?.id || !resume || (!listing && !listingImage)) return;

    navigation.replace('Chat', {
      conversationId: createConversationId(user.id),
      title: t('jobApplicationPackage'),
      mode: 'jobApplication',
      initialAttachments: [resume, ...(listingImage ? [listingImage] : [])],
      initialMessage: [
        'CV’mi ve aşağıdaki iş ilanını işe başvuru koçluğu kapsamında analiz et.',
        ...(listing
          ? ['İş ilanı:', listing]
          : ['İş ilanı ekli ekran görüntüsünde yer alıyor.']),
      ].join('\n\n'),
    });
  };

  const canStart = Boolean(
    resume && (jobDescription.trim() || listingImage) && user?.id,
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('back')}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.eyebrow}>{t('jobApplicationEyebrow')}</Text>
          <Text style={styles.title}>{t('jobApplicationPackage')}</Text>
          <Text style={styles.description}>
            {t('jobApplicationDescription')}
          </Text>

          {resume ? (
            <View style={styles.documentCard}>
              <Text style={styles.documentBadge}>PDF</Text>
              <Text numberOfLines={1} style={styles.documentName}>
                {resume.name}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('removeAttachedDocument')}
                onPress={() => setResume(null)}
              >
                <Text style={styles.removeText}>×</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={pickResume}
              disabled={isPicking}
              style={styles.uploadCard}
            >
              {isPicking ? (
                <ActivityIndicator color={colors.accent} />
              ) : (
                <Text style={styles.uploadIcon}>📎</Text>
              )}
              <View style={styles.uploadCopy}>
                <Text style={styles.uploadTitle}>{t('uploadResume')}</Text>
                <Text style={styles.uploadSubtitle}>
                  {t('uploadResumeHint')}
                </Text>
              </View>
            </Pressable>
          )}

          <Text style={styles.label}>{t('jobDescription')}</Text>
          <TextInput
            value={jobDescription}
            onChangeText={setJobDescription}
            placeholder={t('jobDescriptionPlaceholder')}
            placeholderTextColor={colors.placeholder}
            multiline
            maxLength={6000}
            textAlignVertical="top"
            style={styles.jobInput}
          />
          <Text style={styles.orText}>{t('or')}</Text>
          {listingImage ? (
            <View style={styles.documentCard}>
              <Text style={styles.imageBadge}>IMG</Text>
              <Text numberOfLines={1} style={styles.documentName}>
                {listingImage.name}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('removeAttachedDocument')}
                onPress={() => setListingImage(null)}
              >
                <Text style={styles.removeText}>×</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={pickListingImage}
              disabled={isPicking}
              style={styles.screenshotButton}
            >
              <Text style={styles.screenshotIcon}>▣</Text>
              <Text style={styles.screenshotText}>
                {t('uploadListingScreenshot')}
              </Text>
            </Pressable>
          )}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            accessibilityRole="button"
            onPress={startPackage}
            disabled={!canStart}
            style={[styles.startButton, !canStart && styles.disabledButton]}
          >
            <Text style={styles.startButtonText}>
              {t('createApplicationPackage')}
            </Text>
            <Text style={styles.startArrow}>›</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
