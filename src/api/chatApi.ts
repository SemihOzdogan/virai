import { getApp } from '@react-native-firebase/app';
import { getAI, getGenerativeModel, GoogleAIBackend, type Content } from '@react-native-firebase/ai';
import {
  collection,
  deleteDoc,
  doc,
  getFirestore,
  getDocs,
  limit,
  limitToLast,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from '@firebase/firestore';

import { getFirebaseApp } from '../config/firebase';
import type { ChatMessage, Conversation } from '../types/chat';

const firestore = () => getFirestore(getFirebaseApp());
const maxMessageLength = 6000;
const maxHistoryMessages = 20;
const staleRequestMs = 180_000;

function asDate(value: unknown) {
  return value instanceof Timestamp ? value.toDate() : null;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Sohbet işlemi başarısız oldu.';
}

function getConversationRef(uid: string, conversationId: string) {
  return doc(firestore(), 'users', uid, 'conversations', conversationId);
}

export function createConversationId(uid: string) {
  return doc(collection(firestore(), 'users', uid, 'conversations')).id;
}

export async function deleteChatConversation(uid: string, conversationId: string) {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(conversationId)) {
    throw new Error('Sohbet kimliği geçersiz.');
  }

  const database = firestore();
  const messagesRef = collection(
    database,
    'users',
    uid,
    'conversations',
    conversationId,
    'messages',
  );

  while (true) {
    const messagesSnapshot = await getDocs(query(messagesRef, limit(450)));
    if (messagesSnapshot.empty) {
      break;
    }

    const batch = writeBatch(database);
    messagesSnapshot.docs.forEach(message => batch.delete(message.ref));
    await batch.commit();
  }

  await deleteDoc(getConversationRef(uid, conversationId));
}

export function subscribeToConversations(
  uid: string,
  onChange: (conversations: Conversation[]) => void,
  onError: (message: string) => void,
) {
  const conversationsQuery = query(
    collection(firestore(), 'users', uid, 'conversations'),
    orderBy('updatedAt', 'desc'),
    limit(50),
  );

  return onSnapshot(
    conversationsQuery,
    snapshot =>
      onChange(
        snapshot.docs.map(item => {
          const data = item.data();
          return {
            id: item.id,
            title: String(data.title ?? 'Yeni sohbet'),
            provider: 'gemini',
            updatedAt: asDate(data.updatedAt),
          };
        }),
      ),
    error => onError(getErrorMessage(error)),
  );
}

export function subscribeToMessages(
  uid: string,
  conversationId: string,
  onChange: (messages: ChatMessage[]) => void,
  onError: (message: string) => void,
) {
  const messagesQuery = query(
    collection(firestore(), 'users', uid, 'conversations', conversationId, 'messages'),
    orderBy('sequence', 'asc'),
    limitToLast(100),
  );

  return onSnapshot(
    messagesQuery,
    snapshot =>
      onChange(
        snapshot.docs.map(item => {
          const data = item.data();
          return {
            id: item.id,
            role: data.role === 'assistant' ? 'assistant' : 'user',
            content: String(data.content ?? ''),
            sequence: Number(data.sequence ?? 0),
            createdAt: asDate(data.createdAt),
            status: data.status === 'failed' ? 'failed' : 'complete',
            error: typeof data.error === 'string' ? data.error : undefined,
            provider: 'gemini',
          };
        }),
      ),
    error => onError(getErrorMessage(error)),
  );
}

export async function sendChatMessage(
  uid: string,
  conversationId: string,
  text: string,
  previousMessages: ChatMessage[],
) {
  const trimmedText = text.trim();
  if (!trimmedText || trimmedText.length > maxMessageLength) {
    throw new Error(`Mesaj boş olamaz ve ${maxMessageLength} karakteri aşamaz.`);
  }

  if (!/^[A-Za-z0-9_-]{1,128}$/.test(conversationId)) {
    throw new Error('Sohbet kimliği geçersiz.');
  }

  const conversationRef = getConversationRef(uid, conversationId);
  const userMessageRef = doc(collection(conversationRef, 'messages'));
  const assistantMessageRef = doc(collection(conversationRef, 'messages'));
  const requestStartedAt = Timestamp.now();
  let sequence = 0;

  await runTransaction(firestore(), async transaction => {
    const conversationSnapshot = await transaction.get(conversationRef);
    const conversation = conversationSnapshot.data();

    if (conversation && conversation.userId !== uid) {
      throw new Error('Bu sohbete erişim izniniz yok.');
    }

    const activeRequestIsStale =
      conversation?.isGenerating &&
      (conversation.generationStartedAt instanceof Timestamp
        ? Date.now() - conversation.generationStartedAt.toMillis() >= staleRequestMs
        : true);
    const previousRequestId =
      activeRequestIsStale && typeof conversation?.activeRequestId === 'string'
        ? conversation.activeRequestId
        : null;
    const previousMessageRef = previousRequestId
      ? doc(collection(conversationRef, 'messages'), previousRequestId)
      : null;
    const previousMessageSnapshot = previousMessageRef
      ? await transaction.get(previousMessageRef)
      : null;

    if (conversation?.isGenerating && !activeRequestIsStale) {
      throw new Error('Bu sohbette başka bir yanıt hazırlanıyor. Lütfen bekleyin.');
    }

    sequence = Number(conversation?.nextSequence ?? 0);
    if (!Number.isSafeInteger(sequence) || sequence < 0) {
      throw new Error('Sohbet sırası geçersiz.');
    }

    if (previousMessageRef && previousMessageSnapshot?.exists()) {
      transaction.update(previousMessageRef, {
        status: 'failed',
        error: 'Yanıt isteğinin süresi doldu. Lütfen mesajı tekrar gönderin.',
      });
    }

    transaction.set(
      conversationRef,
      {
        userId: uid,
        title:
          typeof conversation?.title === 'string' && conversation.title.trim()
            ? conversation.title.trim().slice(0, 60)
            : trimmedText.slice(0, 60),
        provider: 'gemini',
        ...(conversationSnapshot.exists()
          ? {}
          : {
              createdAt: serverTimestamp(),
            }),
        nextSequence: sequence + 1,
        isGenerating: true,
        generationStartedAt: requestStartedAt,
        activeRequestId: userMessageRef.id,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    transaction.set(userMessageRef, {
      role: 'user',
      content: trimmedText,
      sequence,
      createdAt: serverTimestamp(),
      status: 'complete',
      provider: 'gemini',
    });
  });

  try {
    const history: Content[] = previousMessages
      .filter(message => message.status === 'complete' && message.content.trim())
      .slice(-maxHistoryMessages)
      .map(message => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }],
      }));

    const ai = getAI(getApp(), { backend: new GoogleAIBackend() });
    const model = getGenerativeModel(ai, {
      model: 'gemini-3.1-flash-lite',
      generationConfig: { maxOutputTokens: 2048 },
    });
    const response = await model.startChat({ history }).sendMessage(trimmedText);
    const reply = response.response.text().trim();

    if (!reply) {
      throw new Error('Gemini boş bir yanıt döndürdü. Lütfen tekrar deneyin.');
    }

    await runTransaction(firestore(), async transaction => {
      const conversationSnapshot = await transaction.get(conversationRef);
      const conversation = conversationSnapshot.data();

      if (
        !conversationSnapshot.exists() ||
        conversation?.userId !== uid ||
        conversation?.activeRequestId !== userMessageRef.id ||
        conversation?.isGenerating !== true
      ) {
        throw new Error('Yanıt isteğinin süresi doldu. Lütfen yeni bir mesaj gönderin.');
      }

      transaction.set(assistantMessageRef, {
        role: 'assistant',
        content: reply,
        sequence: sequence + 1,
        createdAt: serverTimestamp(),
        status: 'complete',
        provider: 'gemini',
      });
      transaction.update(conversationRef, {
        nextSequence: sequence + 2,
        isGenerating: false,
        generationStartedAt: null,
        activeRequestId: null,
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    try {
      await runTransaction(firestore(), async transaction => {
        const conversationSnapshot = await transaction.get(conversationRef);
        const conversation = conversationSnapshot.data();

        transaction.update(userMessageRef, {
          status: 'failed',
          error: getErrorMessage(error).slice(0, 500),
        });
        if (conversation?.activeRequestId === userMessageRef.id) {
          transaction.update(conversationRef, {
            isGenerating: false,
            generationStartedAt: null,
            activeRequestId: null,
            updatedAt: serverTimestamp(),
          });
        }
      });
    } catch (cleanupError) {
      throw new Error(
        `${getErrorMessage(error)} Sohbet durumu güncellenemedi: ${getErrorMessage(cleanupError)}`,
      );
    }

    throw new Error(getErrorMessage(error));
  }
}
