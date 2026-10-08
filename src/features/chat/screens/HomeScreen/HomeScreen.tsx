import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createConversationId } from '../../api/chatApi';
import { syncAdventureReminder } from '../../../adventure/services/adventureReminder';
import { useAuthStore } from '../../../auth/store/authStore';
import { useChatStore } from '../../store/chatStore';
import { useSpeechStore } from '../../../speech/store/speechStore';
import { ThemeSelector } from '../../../../theme/ThemeSelector';
import { useTheme } from '../../../../theme';
import { createStyles, rowActionsWidth } from './HomeScreen.styles';
import type { Conversation } from '../../types/chat';
import type { RootStackParamList } from '../../../../types/navigation';

type Props = StackScreenProps<RootStackParamList, 'Home'>;

type ConversationRowProps = {
  item: Conversation;
  onOpen: (conversation: Conversation) => void;
  onDelete: (conversationId: string) => Promise<boolean>;
  onRename: (conversation: Conversation) => void;
};

function formatDate(date: Date | null) {
  if (!date) {
    return 'Az önce';
  }

  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function ConversationRow({
  item,
  onOpen,
  onDelete,
  onRename,
}: ConversationRowProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirmationVisible, setDeleteConfirmationVisible] =
    useState(false);
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 12 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy) &&
          (gesture.dx < 0 || isOpen.current),
        onPanResponderMove: (_, gesture) => {
          const start = isOpen.current ? -rowActionsWidth : 0;
          translateX.setValue(
            Math.max(-rowActionsWidth, Math.min(0, start + gesture.dx)),
          );
        },
        onPanResponderRelease: (_, gesture) => {
          isOpen.current = isOpen.current
            ? gesture.dx <= rowActionsWidth / 3
            : gesture.dx < -rowActionsWidth / 3;
          Animated.spring(translateX, {
            toValue: isOpen.current ? -rowActionsWidth : 0,
            useNativeDriver: true,
            bounciness: 0,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(translateX, {
            toValue: isOpen.current ? -rowActionsWidth : 0,
            useNativeDriver: true,
            bounciness: 0,
          }).start();
        },
      }),
    [translateX],
  );

  const deleteConversation = async () => {
    setDeleteConfirmationVisible(false);
    setIsDeleting(true);
    try {
      await onDelete(item.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <View style={styles.conversationRow}>
        <View style={styles.rowActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${item.title} sohbetinin başlığını düzenle`}
            onPress={() => onRename(item)}
            style={({ pressed }) => [
              styles.rowActionButton,
              styles.renameActionButton,
              pressed && styles.deleteButtonPressed,
            ]}
          >
            <View style={styles.renameIconBackground}>
              <Text style={styles.renameActionText}>✎</Text>
            </View>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${item.title} sohbetini sil`}
            disabled={isDeleting}
            onPress={() => setDeleteConfirmationVisible(true)}
            android_ripple={{ color: 'rgba(255,255,255,0.14)' }}
            style={({ pressed }) => [
              styles.rowActionButton,
              styles.deleteButton,
              pressed && styles.deleteButtonPressed,
            ]}
          >
            {isDeleting ? (
              <ActivityIndicator color={colors.onAccent} size="small" />
            ) : (
              <View style={styles.deleteButtonContent}>
                <View style={styles.deleteIconBackground}>
                  <View style={styles.trashLid}>
                    <View style={styles.trashHandle} />
                  </View>
                  <View style={styles.trashCan}>
                    <View style={styles.trashLine} />
                    <View style={styles.trashLine} />
                  </View>
                </View>
              </View>
            )}
          </Pressable>
        </View>
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.conversationForeground,
            { transform: [{ translateX }] },
          ]}
        >
          <View style={styles.conversationCard}>
            <Pressable
              accessibilityRole="button"
              accessibilityHint="Sola kaydırarak düzenleme ve silme seçeneklerini göster"
              onPress={() => onOpen(item)}
              style={styles.conversationOpenButton}
            >
              <View style={styles.conversationIcon}>
                <Text style={styles.conversationIconText}>✦</Text>
              </View>
              <View style={styles.conversationContent}>
                <Text numberOfLines={1} style={styles.conversationTitle}>
                  {item.title}
                </Text>
                <Text style={styles.conversationMeta}>
                  VirAI · {formatDate(item.updatedAt)}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
      <Modal
        animationType="fade"
        transparent
        visible={isDeleteConfirmationVisible}
        onRequestClose={() => setDeleteConfirmationVisible(false)}
        statusBarTranslucent
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Onayı kapat"
          onPress={() => setDeleteConfirmationVisible(false)}
          style={styles.modalBackdrop}
        >
          <Pressable style={styles.deleteConfirmation} onPress={() => {}}>
            <Text style={styles.deleteConfirmationTitle}>
              Sohbet silinsin mi?
            </Text>
            <Text style={styles.deleteConfirmationMessage}>
              “{item.title}” sohbeti ve içindeki tüm mesajlar kalıcı olarak
              silinecek.
            </Text>
            <View style={styles.deleteConfirmationActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setDeleteConfirmationVisible(false)}
                style={styles.deleteCancelButton}
              >
                <Text style={styles.deleteCancelText}>Vazgeç</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={deleteConversation}
                style={styles.deleteConfirmButton}
              >
                <Text style={styles.deleteConfirmText}>Sohbeti sil</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export function HomeScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const updateProfile = useAuthStore(state => state.updateProfile);
  const isAuthLoading = useAuthStore(state => state.isLoading);
  const conversations = useChatStore(state => state.conversations);
  const subscribeToConversations = useChatStore(
    state => state.subscribeToConversations,
  );
  const isLoadingConversations = useChatStore(
    state => state.isLoadingConversations,
  );
  const error = useChatStore(state => state.error);
  const clearError = useChatStore(state => state.clearError);
  const deleteConversation = useChatStore(state => state.deleteConversation);
  const renameConversation = useChatStore(state => state.renameConversation);
  const isPlayerVisible = useSpeechStore(
    state => state.status !== 'idle' || state.error !== null,
  );
  const [isProfileMenuVisible, setProfileMenuVisible] = useState(false);
  const [isLogoutConfirmationVisible, setLogoutConfirmationVisible] =
    useState(false);
  const [isEditProfileVisible, setEditProfileVisible] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [profileValidationError, setProfileValidationError] = useState<
    string | null
  >(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [conversationToRename, setConversationToRename] =
    useState<Conversation | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    return subscribeToConversations(user.id);
  }, [subscribeToConversations, user?.id]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    syncAdventureReminder(user.id).catch(reminderError => {
      console.warn('Macera hatırlatıcısı geri yüklenemedi.', reminderError);
    });
  }, [user?.id]);

  const startConversation = () => {
    if (!user?.id) {
      return;
    }

    const conversationId = createConversationId(user.id);
    navigation.navigate('Chat', { conversationId });
  };

  const startInterview = () => {
    if (!user?.id) {
      return;
    }

    navigation.navigate('Chat', {
      conversationId: createConversationId(user.id),
      title: 'Mülakat simülasyonu',
      mode: 'interview',
    });
  };

  const handleLogout = async () => {
    setProfileMenuVisible(false);
    setLogoutConfirmationVisible(false);
    clearError();
    await logout();
  };
  const requestLogout = () => {
    setProfileMenuVisible(false);
    setLogoutConfirmationVisible(true);
  };
  const openEditProfile = () => {
    clearError();
    setProfileValidationError(null);
    setProfileName(user?.name ?? '');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setProfileMenuVisible(false);
    setEditProfileVisible(true);
  };
  const closeEditProfile = () => {
    if (isAuthLoading) {
      return;
    }

    setEditProfileVisible(false);
    setProfileValidationError(null);
    clearError();
  };
  const saveProfile = async () => {
    const name = profileName.trim();
    const isChangingPassword = Boolean(newPassword || confirmNewPassword || currentPassword);

    if (!name) {
      setProfileValidationError('Lütfen ad soyad alanını doldurun.');
      return;
    }

    if (isChangingPassword) {
      if (!currentPassword) {
        setProfileValidationError('Şifreyi değiştirmek için mevcut şifrenizi girin.');
        return;
      }

      if (newPassword.length < 6) {
        setProfileValidationError('Yeni şifre en az 6 karakter olmalıdır.');
        return;
      }

      if (newPassword !== confirmNewPassword) {
        setProfileValidationError('Yeni şifreler eşleşmiyor.');
        return;
      }
    }

    setProfileValidationError(null);
    const updated = await updateProfile({
      name,
      currentPassword: isChangingPassword ? currentPassword : undefined,
      newPassword: isChangingPassword ? newPassword : undefined,
    });

    if (updated) {
      setEditProfileVisible(false);
    }
  };
  const profileInitial = (user?.name?.trim() || user?.email?.trim() || '?')
    .charAt(0)
    .toLocaleUpperCase('tr-TR');

  const openConversation = (conversation: Conversation) => {
    navigation.navigate('Chat', {
      conversationId: conversation.id,
      title: conversation.title,
      mode: conversation.mode,
    });
  };

  const handleDeleteConversation = (conversationId: string) =>
    user?.id
      ? deleteConversation(user.id, conversationId)
      : Promise.resolve(false);

  const openRenameDialog = (conversation: Conversation) => {
    clearError();
    setConversationToRename(conversation);
    setRenameTitle(conversation.title);
  };

  const saveConversationTitle = async () => {
    if (!user?.id || !conversationToRename || isRenaming) {
      return;
    }

    const title = renameTitle.trim();
    if (!title || title.length > 60) {
      return;
    }

    setIsRenaming(true);
    const renamed = await renameConversation(
      user.id,
      conversationToRename.id,
      title,
    );
    setIsRenaming(false);
    if (renamed) {
      setConversationToRename(null);
    }
  };

  const normalizedSearchQuery = searchQuery.trim().toLocaleLowerCase('tr-TR');
  const visibleConversations = normalizedSearchQuery
    ? conversations.filter(conversation =>
        conversation.title
          .toLocaleLowerCase('tr-TR')
          .includes(normalizedSearchQuery),
      )
    : conversations;

  const renderConversation = ({ item }: { item: Conversation }) => (
    <ConversationRow
      item={item}
      onOpen={openConversation}
      onDelete={handleDeleteConversation}
      onRename={openRenameDialog}
    />
  );

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={isPlayerVisible ? ['bottom'] : ['top', 'bottom']}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>AI ASİSTAN</Text>
            <Text style={styles.title}>Sohbetlerin</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Profil ve uygulama seçenekleri"
            accessibilityState={{ expanded: isProfileMenuVisible }}
            onPress={() => setProfileMenuVisible(true)}
            style={styles.profileButton}
          >
            {user?.avatar ? (
              <Image
                source={{ uri: user.avatar }}
                style={styles.profileImage}
              />
            ) : (
              <Text style={styles.profileInitial}>{profileInitial}</Text>
            )}
          </Pressable>
        </View>

        <Text style={styles.greeting}>
          Merhaba{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
        </Text>
        <Text style={styles.description}>
          VirAI ile sohbet et, konuşmalarına istediğin zaman devam et.
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={startConversation}
          style={styles.newChatButton}
        >
          <Text style={styles.newChatIcon}>＋</Text>
          <View style={styles.newChatCopy}>
            <Text style={styles.newChatTitle}>Yeni sohbet</Text>
            <Text style={styles.newChatSubtitle}>VirAI ile başla</Text>
          </View>
          <Text style={styles.newChatArrow}>›</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mülakat simülasyonunu başlat"
          onPress={startInterview}
          style={styles.interviewButton}
        >
          <View style={styles.interviewIcon}>
            <Text style={styles.interviewIconText}>⌁</Text>
          </View>
          <View style={styles.newChatCopy}>
            <Text style={styles.interviewTitle}>Mülakat simülasyonu</Text>
            <Text style={styles.interviewSubtitle}>
              Soruları yanıtla, anlık geri bildirim al
            </Text>
          </View>
          <Text style={styles.interviewArrow}>›</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Macera: Oda 307, başla veya devam et"
          onPress={() => navigation.navigate('Adventure')}
          style={styles.interviewButton}
        >
          <View style={styles.interviewIcon}>
            <Text style={styles.interviewIconText}>✧</Text>
          </View>
          <View style={styles.newChatCopy}>
            <Text style={styles.interviewTitle}>Macera · Oda 307</Text>
            <Text style={styles.interviewSubtitle}>
              Otel seni hatırlıyor. Hikâyene gir
            </Text>
          </View>
          <Text style={styles.interviewArrow}>›</Text>
        </Pressable>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Geçmiş sohbetler</Text>
          <Text style={styles.listCount}>{conversations.length}</Text>
        </View>

        {conversations.length > 0 ? (
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Sohbetlerde ara..."
            placeholderTextColor={colors.placeholder}
            returnKeyType="search"
            accessibilityLabel="Sohbetlerde ara"
            style={styles.searchInput}
          />
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {isLoadingConversations ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✧</Text>
            <Text style={styles.emptyTitle}>Henüz sohbet yok</Text>
            <Text style={styles.emptyText}>
              İlk sohbetini başlatınca burada görünecek.
            </Text>
          </View>
        ) : visibleConversations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Sonuç bulunamadı</Text>
            <Text style={styles.emptyText}>
              Farklı bir sohbet adıyla tekrar ara.
            </Text>
          </View>
        ) : (
          <FlatList
            data={visibleConversations}
            keyExtractor={item => item.id}
            renderItem={renderConversation}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
      <Modal
        animationType="fade"
        transparent
        visible={conversationToRename !== null}
        onRequestClose={() => setConversationToRename(null)}
        statusBarTranslucent
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Başlık düzenlemeyi kapat"
          onPress={() => setConversationToRename(null)}
          style={styles.modalBackdrop}
        >
          <Pressable style={styles.deleteConfirmation} onPress={() => {}}>
            <Text style={styles.deleteConfirmationTitle}>
              Sohbet başlığını düzenle
            </Text>
            <TextInput
              value={renameTitle}
              onChangeText={setRenameTitle}
              maxLength={60}
              autoFocus
              selectTextOnFocus
              accessibilityLabel="Yeni sohbet başlığı"
              style={styles.renameInput}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.deleteConfirmationActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setConversationToRename(null)}
                disabled={isRenaming}
                style={styles.deleteCancelButton}
              >
                <Text style={styles.deleteCancelText}>Vazgeç</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={saveConversationTitle}
                disabled={isRenaming || !renameTitle.trim()}
                style={styles.deleteConfirmButton}
              >
                <Text style={styles.deleteConfirmText}>
                  {isRenaming ? 'Kaydediliyor...' : 'Kaydet'}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      <Modal
        animationType="fade"
        transparent
        visible={isEditProfileVisible}
        onRequestClose={closeEditProfile}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalKeyboardAvoidingView}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Profil düzenlemeyi kapat"
            onPress={closeEditProfile}
            style={styles.modalBackdrop}
          >
            <Pressable style={styles.profileEditor} onPress={() => {}}>
            <Text style={styles.deleteConfirmationTitle}>Profili düzenle</Text>
            <Text style={styles.profileEditorDescription}>
              Hesap bilgilerini güncelleyebilirsin.
            </Text>

            <Text style={styles.profileEditorLabel}>Ad soyad</Text>
            <TextInput
              value={profileName}
              onChangeText={value => {
                setProfileName(value);
                setProfileValidationError(null);
              }}
              placeholder="Adınız Soyadınız"
              placeholderTextColor={colors.placeholder}
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={80}
              accessibilityLabel="Ad soyad"
              style={styles.renameInput}
            />

            <View style={styles.profileEditorDivider} />
            <Text style={styles.profileEditorPasswordTitle}>Şifre değiştir</Text>
            <Text style={styles.profileEditorHint}>
              Şifreni değiştirmek istemiyorsan bu alanları boş bırak.
            </Text>
            <TextInput
              value={currentPassword}
              onChangeText={value => {
                setCurrentPassword(value);
                setProfileValidationError(null);
              }}
              placeholder="Mevcut şifre"
              placeholderTextColor={colors.placeholder}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Mevcut şifre"
              style={styles.profileEditorInput}
            />
            <TextInput
              value={newPassword}
              onChangeText={value => {
                setNewPassword(value);
                setProfileValidationError(null);
              }}
              placeholder="Yeni şifre (en az 6 karakter)"
              placeholderTextColor={colors.placeholder}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Yeni şifre"
              style={styles.profileEditorInput}
            />
            <TextInput
              value={confirmNewPassword}
              onChangeText={value => {
                setConfirmNewPassword(value);
                setProfileValidationError(null);
              }}
              placeholder="Yeni şifreyi tekrar gir"
              placeholderTextColor={colors.placeholder}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={saveProfile}
              accessibilityLabel="Yeni şifreyi tekrar gir"
              style={styles.profileEditorInput}
            />

            {profileValidationError ? (
              <Text style={styles.error}>{profileValidationError}</Text>
            ) : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.deleteConfirmationActions}>
              <Pressable
                accessibilityRole="button"
                onPress={closeEditProfile}
                disabled={isAuthLoading}
                style={styles.deleteCancelButton}
              >
                <Text style={styles.deleteCancelText}>Vazgeç</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={saveProfile}
                disabled={isAuthLoading}
                style={styles.profileSaveButton}
              >
                <Text style={styles.deleteConfirmText}>
                  {isAuthLoading ? 'Kaydediliyor...' : 'Kaydet'}
                </Text>
              </Pressable>
            </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
      <Modal
        animationType="fade"
        transparent
        visible={isProfileMenuVisible}
        onRequestClose={() => setProfileMenuVisible(false)}
        statusBarTranslucent
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Menüyü kapat"
          onPress={() => setProfileMenuVisible(false)}
          style={styles.modalBackdrop}
        >
          <Pressable style={styles.profileMenu} onPress={() => {}}>
            <View style={styles.profileMenuHeader}>
              <View style={styles.profileMenuAvatar}>
                {user?.avatar ? (
                  <Image
                    source={{ uri: user.avatar }}
                    style={styles.profileMenuAvatarImage}
                  />
                ) : (
                  <Text style={styles.profileMenuAvatarText}>
                    {profileInitial}
                  </Text>
                )}
              </View>
              <View style={styles.profileDetails}>
                {user?.name ? (
                  <Text numberOfLines={1} style={styles.profileName}>
                    {user.name}
                  </Text>
                ) : null}
                {user?.email ? (
                  <Text numberOfLines={1} style={styles.profileEmail}>
                    {user.email}
                  </Text>
                ) : null}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Menüyü kapat"
                onPress={() => setProfileMenuVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>
            <View style={styles.menuDivider} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Profil bilgilerini düzenle"
              onPress={openEditProfile}
              style={styles.menuEditProfileButton}
            >
              <View style={styles.menuEditProfileIcon}>
                <Text style={styles.menuEditProfileIconText}>✎</Text>
              </View>
              <View style={styles.menuEditProfileCopy}>
                <Text style={styles.menuEditProfileTitle}>Profili düzenle</Text>
                <Text style={styles.menuEditProfileSubtitle}>
                  Ad soyadını veya şifreni güncelle
                </Text>
              </View>
              <Text style={styles.menuEditProfileArrow}>›</Text>
            </Pressable>
            <View style={styles.menuDivider} />
            <Text style={styles.menuSectionTitle}>Görünüm</Text>
            <ThemeSelector />
            <Pressable
              accessibilityRole="button"
              onPress={requestLogout}
              disabled={isAuthLoading}
              style={styles.menuLogoutButton}
            >
              <Text style={styles.menuLogoutText}>
                {isAuthLoading ? 'Çıkış yapılıyor...' : 'Çıkış yap'}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
      <Modal
        animationType="fade"
        transparent
        visible={isLogoutConfirmationVisible}
        onRequestClose={() => setLogoutConfirmationVisible(false)}
        statusBarTranslucent
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Onayı kapat"
          onPress={() => setLogoutConfirmationVisible(false)}
          style={styles.modalBackdrop}
        >
          <Pressable style={styles.deleteConfirmation} onPress={() => {}}>
            <Text style={styles.deleteConfirmationTitle}>
              Çıkış yapılsın mı?
            </Text>
            <Text style={styles.deleteConfirmationMessage}>
              Hesabınızdan çıkış yapmak istediğinize emin misiniz?
            </Text>
            <View style={styles.deleteConfirmationActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setLogoutConfirmationVisible(false)}
                style={styles.deleteCancelButton}
              >
                <Text style={styles.deleteCancelText}>Vazgeç</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={handleLogout}
                disabled={isAuthLoading}
                style={styles.deleteConfirmButton}
              >
                <Text style={styles.deleteConfirmText}>
                  {isAuthLoading ? 'Çıkış yapılıyor...' : 'Çıkış yap'}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
