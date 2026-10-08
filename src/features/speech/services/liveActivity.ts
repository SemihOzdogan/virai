import { NativeModules, Platform } from 'react-native';

type LiveActivityModule = {
  start: (conversationTitle: string) => Promise<boolean>;
  updateStatus: (status: 'playing' | 'paused') => Promise<void>;
  end: () => Promise<void>;
};

const liveActivity = NativeModules.LiveActivityModule as LiveActivityModule | undefined;

function reportLiveActivityError(error: unknown) {
  console.warn(
    'Live Activity could not be updated:',
    error instanceof Error ? error.message : error,
  );
}

export async function startSpeechLiveActivity(conversationTitle: string) {
  if (Platform.OS !== 'ios' || !liveActivity) {
    return;
  }

  try {
    await liveActivity.start(conversationTitle);
  } catch (error) {
    reportLiveActivityError(error);
  }
}

export async function updateSpeechLiveActivity(status: 'playing' | 'paused') {
  if (Platform.OS !== 'ios' || !liveActivity) {
    return;
  }

  try {
    await liveActivity.updateStatus(status);
  } catch (error) {
    reportLiveActivityError(error);
  }
}

export async function endSpeechLiveActivity() {
  if (Platform.OS !== 'ios' || !liveActivity) {
    return;
  }

  try {
    await liveActivity.end();
  } catch (error) {
    reportLiveActivityError(error);
  }
}
