import { create } from 'zustand';

type SpeechStatus = 'idle' | 'playing' | 'paused';
type TtsEventName = 'tts-finish' | 'tts-pause' | 'tts-resume';
type TtsApi = {
  addEventListener: (
    eventName: TtsEventName,
    handler: () => void,
  ) => { remove: () => void };
  getInitStatus: () => Promise<boolean>;
  pause: () => Promise<boolean>;
  resume: () => Promise<boolean>;
  setDefaultLanguage: (language: string) => Promise<boolean>;
  setIgnoreSilentSwitch: (setting: 'ignore' | 'obey' | 'inherit') => Promise<boolean>;
  speak: (text: string) => Promise<string | number>;
  stop: () => Promise<boolean>;
};

type SpeechState = {
  status: SpeechStatus;
  text: string | null;
  messageId: string | null;
  conversationId: string | null;
  conversationTitle: string | null;
  error: string | null;
  play: (
    text: string,
    messageId: string,
    conversationId: string,
    conversationTitle: string,
  ) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  clearError: () => void;
};

let ttsModule: TtsApi | null = null;

function ensureTtsModule() {
  if (!ttsModule) {
    const tts = require('@iternio/react-native-tts').default as TtsApi;
    tts.addEventListener('tts-finish', clearPlayback);
    tts.addEventListener('tts-pause', () => useSpeechStore.setState({ status: 'paused' }));
    tts.addEventListener('tts-resume', () => useSpeechStore.setState({ status: 'playing' }));
    ttsModule = tts;
  }
  return ttsModule;
}

function clearPlayback() {
  useSpeechStore.setState({
    status: 'idle',
    text: null,
    messageId: null,
    conversationId: null,
    conversationTitle: null,
  });
}

export const useSpeechStore = create<SpeechState>(set => ({
  status: 'idle',
  text: null,
  messageId: null,
  conversationId: null,
  conversationTitle: null,
  error: null,
  play: async (text, messageId, conversationId, conversationTitle) => {
    set({ error: null });
    try {
      const tts = ensureTtsModule();
      await tts.stop();
      await tts.getInitStatus();
      await tts.setIgnoreSilentSwitch('ignore');
      await tts.setDefaultLanguage('tr-TR');
      set({ status: 'playing', text, messageId, conversationId, conversationTitle });
      await tts.speak(text);
    } catch (error) {
      clearPlayback();
      set({
        error: error instanceof Error ? error.message : 'Sesli okuma başlatılamadı.',
      });
    }
  },
  pause: async () => {
    if (useSpeechStore.getState().status !== 'playing') {
      return;
    }
    try {
      await ensureTtsModule().pause();
      set({ status: 'paused', error: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Ses duraklatılamadı.' });
    }
  },
  resume: async () => {
    if (useSpeechStore.getState().status !== 'paused') {
      return;
    }
    try {
      await ensureTtsModule().resume();
      set({ status: 'playing', error: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Ses devam ettirilemedi.' });
    }
  },
  stop: async () => {
    clearPlayback();
    if (!ttsModule) {
      return;
    }
    try {
      await ttsModule.stop();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Sesli okuma durdurulamadı.',
      });
    }
  },
  clearError: () => set({ error: null }),
}));
