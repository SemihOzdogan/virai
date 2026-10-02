import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  ActivityIndicator,
  FlatList,
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
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const confirmDelete = () => {
    Alert.alert(
      'Sohbet silinsin mi?',
      'Bu sohbet ve içindeki tüm mesajlar kalıcı olarak silinecek.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            await onDelete(item.id);
            setIsDeleting(false);
          },
        },
      ],
    );
  };

  return (
    <View style={styles.conversationRow}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${item.title} sohbetini sil`}
        disabled={isDeleting}
        onPress={confirmDelete}
        android_ripple={{ color: 'rgba(255,255,255,0.14)' }}
        style={({ pressed }) => [
          styles.deleteButton,
          pressed && styles.deleteButtonPressed,
        ]}>
        {isDeleting ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
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
              Gemini · {formatDate(item.updatedAt)}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

export function HomeScreen({ navigation }: Props) {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const isAuthLoading = useAuthStore(state => state.isLoading);
  const conversations = useChatStore(state => state.conversations);
  const subscribeToConversations = useChatStore(state => state.subscribeToConversations);
  const isLoadingConversations = useChatStore(state => state.isLoadingConversations);
  const error = useChatStore(state => state.error);
  const clearError = useChatStore(state => state.clearError);
  const deleteConversation = useChatStore(state => state.deleteConversation);

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
    clearError();
    await logout();
  };

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
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>AI ASİSTAN</Text>
            <Text style={styles.title}>Sohbetlerin</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={handleLogout}
            disabled={isAuthLoading}
            style={styles.logoutButton}>
            <Text style={styles.logoutText}>{isAuthLoading ? '...' : 'Çıkış'}</Text>
          </Pressable>
        </View>

        <Text style={styles.greeting}>
          Merhaba{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
        </Text>
        <Text style={styles.description}>
          Gemini'ye sor, sohbetlerine istediğin zaman devam et.
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={startConversation}
          style={styles.newChatButton}>
          <Text style={styles.newChatIcon}>＋</Text>
          <View style={styles.newChatCopy}>
            <Text style={styles.newChatTitle}>Yeni sohbet</Text>
            <Text style={styles.newChatSubtitle}>Gemini ile başla</Text>
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
            <ActivityIndicator color="#8B72FF" />
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

        <Text style={styles.disclaimer}>
          Gemini ücretsiz kullanım kotası ve Google kullanım koşulları geçerlidir.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0B1020' },
  container: { flex: 1, paddingHorizontal: 22, paddingTop: 14 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 26,
  },
  eyebrow: { color: '#8B72FF', fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  title: { color: '#F5F7FF', fontSize: 28, fontWeight: '800', marginTop: 4 },
  logoutButton: {
    borderColor: 'rgba(164,180,255,0.2)',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 9,
  },
  logoutText: { color: '#C7D2F3', fontSize: 14, fontWeight: '600' },
  greeting: { color: '#E9EDFF', fontSize: 19, fontWeight: '700' },
  description: { color: '#9EACCA', fontSize: 14, lineHeight: 21, marginTop: 7, marginBottom: 20 },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#7658F5',
    shadowColor: '#7658F5',
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
  listTitle: { color: '#E4E9FA', fontSize: 16, fontWeight: '700' },
  listCount: {
    color: '#AAB9D9',
    backgroundColor: 'rgba(148,163,184,0.13)',
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
    backgroundColor: '#0B1020',
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148,163,184,0.12)',
  },
  conversationIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(124,92,255,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  conversationIconText: { color: '#A28FFF', fontSize: 21 },
  conversationContent: { flex: 1 },
  conversationTitle: { color: '#E8EDFF', fontSize: 14, fontWeight: '600' },
  conversationMeta: { color: '#8492B0', fontSize: 12, marginTop: 5 },
  chevron: { color: '#8290AD', fontSize: 24, marginLeft: 10 },
  centered: { padding: 32, alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 35, paddingHorizontal: 20 },
  emptyIcon: { color: '#8B72FF', fontSize: 34, marginBottom: 10 },
  emptyTitle: { color: '#E5EAFB', fontSize: 15, fontWeight: '700' },
  emptyText: { color: '#8997B5', fontSize: 13, textAlign: 'center', marginTop: 6 },
  error: { color: '#FF8A8A', fontSize: 13, marginBottom: 8 },
  disclaimer: {
    color: '#7785A2',
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 16,
    paddingVertical: 10,
  },
});
