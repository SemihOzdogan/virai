import { create } from 'zustand';

import {
  endSpeechLiveActivity,
  startSpeechLiveActivity,
  updateSpeechLiveActivity,
} from '../services/liveActivity';

type SpeechStatus = 'idle' | 'playing' | 'paused';
type TtsEventName = 'tts-finish' | 'tts-pause' | 'tts-resume' | 'tts-cancel';
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
    tts.addEventListener('tts-cancel', clearPlayback);
    tts.addEventListener('tts-pause', () => setPlaybackStatus('paused'));
    tts.addEventListener('tts-resume', () => setPlaybackStatus('playing'));
    ttsModule = tts;
  }
  return ttsModule;
}

function setPlaybackStatus(status: Exclude<SpeechStatus, 'idle'>) {
  if (useSpeechStore.getState().status === status) {
    return;
  }
  useSpeechStore.setState({ status });
  updateSpeechLiveActivity(status);
}

function clearPlayback() {
  endSpeechLiveActivity();
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
      startSpeechLiveActivity(conversationTitle);
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
      set({ error: null });
      setPlaybackStatus('paused');
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
      set({ error: null });
      setPlaybackStatus('playing');
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
