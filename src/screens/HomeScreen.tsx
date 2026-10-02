import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  PanResponder,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createConversationId } from '../api/chatApi';
import { useAuthStore } from '../store';
import { useChatStore } from '../store/chatStore';
import { ThemeSelector } from '../theme/ThemeSelector';
import { useTheme, type AppTheme } from '../theme/ThemeProvider';
import type { Conversation } from '../types/chat';
import type { RootStackParamList } from '../types/navigation';

type Props = StackScreenProps<RootStackParamList, 'Home'>;
const deleteActionWidth = 76;

type ConversationRowProps = {
  item: Conversation;
  onOpen: (conversation: Conversation) => void;
  onDelete: (conversationId: string) => Promise<boolean>;
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

function ConversationRow({ item, onOpen, onDelete }: ConversationRowProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirmationVisible, setDeleteConfirmationVisible] = useState(false);
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 12 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy) &&
          (gesture.dx < 0 || isOpen.current),
        onPanResponderMove: (_, gesture) => {
          const start = isOpen.current ? -deleteActionWidth : 0;
          translateX.setValue(
            Math.max(-deleteActionWidth, Math.min(0, start + gesture.dx)),
          );
        },
        onPanResponderRelease: (_, gesture) => {
          isOpen.current = isOpen.current
            ? gesture.dx <= deleteActionWidth / 3
            : gesture.dx < -deleteActionWidth / 3;
          Animated.spring(translateX, {
            toValue: isOpen.current ? -deleteActionWidth : 0,
            useNativeDriver: true,
            bounciness: 0,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(translateX, {
            toValue: isOpen.current ? -deleteActionWidth : 0,
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${item.title} sohbetini sil`}
          disabled={isDeleting}
          onPress={() => setDeleteConfirmationVisible(true)}
          android_ripple={{ color: 'rgba(255,255,255,0.14)' }}
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && styles.deleteButtonPressed,
          ]}>
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
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.conversationForeground,
            { transform: [{ translateX }] },
          ]}>
          <Pressable
            accessibilityRole="button"
            accessibilityHint="Sola kaydırarak silme seçeneğini göster"
            onPress={() => onOpen(item)}
            style={styles.conversationCard}>
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
        </Animated.View>
      </View>
      <Modal
        animationType="fade"
        transparent
        visible={isDeleteConfirmationVisible}
        onRequestClose={() => setDeleteConfirmationVisible(false)}
        statusBarTranslucent>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Onayı kapat"
          onPress={() => setDeleteConfirmationVisible(false)}
          style={styles.modalBackdrop}>
          <Pressable style={styles.deleteConfirmation} onPress={() => { }}>
            <Text style={styles.deleteConfirmationTitle}>Sohbet silinsin mi?</Text>
            <Text style={styles.deleteConfirmationMessage}>
              “{item.title}” sohbeti ve içindeki tüm mesajlar kalıcı olarak silinecek.
            </Text>
            <View style={styles.deleteConfirmationActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setDeleteConfirmationVisible(false)}
                style={styles.deleteCancelButton}>
                <Text style={styles.deleteCancelText}>Vazgeç</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={deleteConversation}
                style={styles.deleteConfirmButton}>
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
  const isAuthLoading = useAuthStore(state => state.isLoading);
  const conversations = useChatStore(state => state.conversations);
  const subscribeToConversations = useChatStore(state => state.subscribeToConversations);
  const isLoadingConversations = useChatStore(state => state.isLoadingConversations);
  const error = useChatStore(state => state.error);
  const clearError = useChatStore(state => state.clearError);
  const deleteConversation = useChatStore(state => state.deleteConversation);
  const [isProfileMenuVisible, setProfileMenuVisible] = useState(false);
  const [isLogoutConfirmationVisible, setLogoutConfirmationVisible] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    return subscribeToConversations(user.id);
  }, [subscribeToConversations, user?.id]);

  const startConversation = () => {
    if (!user?.id) {
      return;
    }

    const conversationId = createConversationId(user.id);
    navigation.navigate('Chat', { conversationId });
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
  const profileInitial = (user?.name?.trim() || user?.email?.trim() || '?')
    .charAt(0)
    .toLocaleUpperCase('tr-TR');

  const openConversation = (conversation: Conversation) => {
    navigation.navigate('Chat', {
      conversationId: conversation.id,
      title: conversation.title,
    });
  };

  const handleDeleteConversation = (conversationId: string) =>
    user?.id
      ? deleteConversation(user.id, conversationId)
      : Promise.resolve(false);

  const renderConversation = ({ item }: { item: Conversation }) => (
    <ConversationRow
      item={item}
      onOpen={openConversation}
      onDelete={handleDeleteConversation}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
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
            style={styles.profileButton}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.profileImage} />
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
          style={styles.newChatButton}>
          <Text style={styles.newChatIcon}>＋</Text>
          <View style={styles.newChatCopy}>
            <Text style={styles.newChatTitle}>Yeni sohbet</Text>
            <Text style={styles.newChatSubtitle}>VirAI ile başla</Text>
          </View>
          <Text style={styles.newChatArrow}>›</Text>
        </Pressable>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Geçmiş sohbetler</Text>
          <Text style={styles.listCount}>{conversations.length}</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {isLoadingConversations ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✧</Text>
            <Text style={styles.emptyTitle}>Henüz sohbet yok</Text>
            <Text style={styles.emptyText}>İlk sohbetini başlatınca burada görünecek.</Text>
          </View>
        ) : (
          <FlatList
            data={conversations}
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
        visible={isProfileMenuVisible}
        onRequestClose={() => setProfileMenuVisible(false)}
        statusBarTranslucent>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Menüyü kapat"
          onPress={() => setProfileMenuVisible(false)}
          style={styles.modalBackdrop}>
          <Pressable style={styles.profileMenu} onPress={() => { }}>
            <View style={styles.profileMenuHeader}>
              <View style={styles.profileMenuAvatar}>
                {user?.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.profileMenuAvatarImage} />
                ) : (
                  <Text style={styles.profileMenuAvatarText}>{profileInitial}</Text>
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
                style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>
            <View style={styles.menuDivider} />
            <Text style={styles.menuSectionTitle}>Görünüm</Text>
            <ThemeSelector />
            <Pressable
              accessibilityRole="button"
              onPress={requestLogout}
              disabled={isAuthLoading}
              style={styles.menuLogoutButton}>
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
        statusBarTranslucent>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Onayı kapat"
          onPress={() => setLogoutConfirmationVisible(false)}
          style={styles.modalBackdrop}>
          <Pressable style={styles.deleteConfirmation} onPress={() => { }}>
            <Text style={styles.deleteConfirmationTitle}>Çıkış yapılsın mı?</Text>
            <Text style={styles.deleteConfirmationMessage}>
              Hesabınızdan çıkış yapmak istediğinize emin misiniz?
            </Text>
            <View style={styles.deleteConfirmationActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setLogoutConfirmationVisible(false)}
                style={styles.deleteCancelButton}>
                <Text style={styles.deleteCancelText}>Vazgeç</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={handleLogout}
                disabled={isAuthLoading}
                style={styles.deleteConfirmButton}>
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

function createStyles(colors: AppTheme['colors']) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, paddingHorizontal: 22, paddingTop: 14 },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 26,
    },
    eyebrow: { color: colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 2 },
    title: { color: colors.text, fontSize: 28, fontWeight: '800', marginTop: 4 },
    profileButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileInitial: { color: colors.accent, fontSize: 17, fontWeight: '700' },
    profileImage: { width: 40, height: 40, borderRadius: 20 },
    greeting: { color: colors.text, fontSize: 19, fontWeight: '700' },
    description: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 7, marginBottom: 20 },
    newChatButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 20,
      backgroundColor: colors.accent,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 9 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 6,
    },
    newChatIcon: { color: '#FFFFFF', fontSize: 28, fontWeight: '300', marginRight: 13 },
    newChatCopy: { flex: 1 },
    newChatTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    newChatSubtitle: { color: '#E0D9FF', fontSize: 12, marginTop: 4 },
    newChatArrow: { color: '#FFFFFF', fontSize: 27, fontWeight: '300' },
    listHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 28,
      marginBottom: 10,
      gap: 9,
    },
    listTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
    listCount: {
      color: colors.textSecondary,
      backgroundColor: colors.surfaceRaised,
      overflow: 'hidden',
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 2,
      fontSize: 12,
    },
    listContent: { paddingBottom: 10 },
    conversationRow: {
      overflow: 'hidden',
      position: 'relative',
    },
    deleteButton: {
      alignItems: 'center',
      bottom: 0,
      justifyContent: 'center',
      position: 'absolute',
      right: 0,
      top: 0,
      width: deleteActionWidth,
    },
    deleteButtonPressed: {
      opacity: 0.8,
    },
    deleteButtonContent: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteIconBackground: {
      alignItems: 'center',
      backgroundColor: '#D94355',
      borderRadius: 19,
      height: 38,
      justifyContent: 'center',
      width: 38,
    },
    trashLid: {
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 1,
      height: 2,
      marginBottom: 3,
      width: 15,
    },
    trashHandle: {
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 1,
      borderTopRightRadius: 1,
      height: 3,
      position: 'absolute',
      top: -3,
      width: 6,
    },
    trashCan: {
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderBottomLeftRadius: 3,
      borderBottomRightRadius: 3,
      flexDirection: 'row',
      height: 14,
      justifyContent: 'space-around',
      overflow: 'hidden',
      width: 12,
    },
    trashLine: {
      backgroundColor: '#D94355',
      borderRadius: 1,
      height: 8,
      width: 1.5,
    },
    conversationForeground: {
      backgroundColor: colors.background,
    },
    conversationCard: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 13,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    conversationIcon: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    conversationIconText: { color: colors.accent, fontSize: 21 },
    conversationContent: { flex: 1 },
    conversationTitle: { color: colors.text, fontSize: 14, fontWeight: '600' },
    conversationMeta: { color: colors.textMuted, fontSize: 12, marginTop: 5 },
    chevron: { color: colors.textMuted, fontSize: 24, marginLeft: 10 },
    centered: { padding: 32, alignItems: 'center' },
    emptyState: { alignItems: 'center', paddingVertical: 35, paddingHorizontal: 20 },
    emptyIcon: { color: colors.accent, fontSize: 34, marginBottom: 10 },
    emptyTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
    emptyText: { color: colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 6 },
    error: { color: colors.error, fontSize: 13, marginBottom: 8 },
    modalBackdrop: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    profileMenu: {
      width: '100%',
      maxWidth: 380,
      padding: 20,
      borderRadius: 24,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    deleteConfirmation: {
      width: '100%',
      maxWidth: 380,
      padding: 22,
      borderRadius: 24,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    deleteConfirmationTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
    },
    deleteConfirmationMessage: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 21,
      marginTop: 10,
    },
    deleteConfirmationActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 10,
      marginTop: 22,
    },
    deleteCancelButton: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingVertical: 11,
      borderRadius: 13,
      backgroundColor: colors.surfaceRaised,
    },
    deleteCancelText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
    deleteConfirmButton: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingVertical: 11,
      borderRadius: 13,
      backgroundColor: '#D94355',
    },
    deleteConfirmText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
    profileMenuHeader: { flexDirection: 'row', alignItems: 'center' },
    profileMenuAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accentSoft,
      overflow: 'hidden',
    },
    profileMenuAvatarImage: { width: 48, height: 48 },
    profileMenuAvatarText: { color: colors.accent, fontSize: 18, fontWeight: '700' },
    profileDetails: { flex: 1, marginLeft: 12 },
    profileName: { color: colors.text, fontSize: 15, fontWeight: '700' },
    profileEmail: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
    closeButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      backgroundColor: colors.surfaceRaised,
    },
    closeButtonText: { color: colors.textSecondary, fontSize: 24, lineHeight: 27 },
    menuDivider: { height: 1, backgroundColor: colors.border, marginVertical: 18 },
    menuSectionTitle: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
      marginBottom: 10,
    },
    menuLogoutButton: {
      alignItems: 'center',
      marginTop: 20,
      paddingVertical: 13,
      borderRadius: 14,
      backgroundColor: colors.accentSoft,
    },
    menuLogoutText: { color: colors.accent, fontSize: 14, fontWeight: '700' },
  });
}
