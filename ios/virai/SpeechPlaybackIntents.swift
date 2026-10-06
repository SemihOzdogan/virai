import ActivityKit
import AppIntents

@available(iOS 17.0, *)
struct PauseSpeechIntent: LiveActivityIntent, AudioPlaybackIntent {
  static var title: LocalizedStringResource = "Sesli okumayı duraklat"

  func perform() async throws -> some IntentResult {
#if !APP_EXTENSION
    let didPause = await MainActor.run { SpeechPlaybackController.pause() }
    if didPause {
      await updateLiveActivities(status: "paused")
    }
#endif
    return .result()
  }
}

@available(iOS 17.0, *)
struct ResumeSpeechIntent: LiveActivityIntent, AudioPlaybackIntent {
  static var title: LocalizedStringResource = "Sesli okumayı devam ettir"

  func perform() async throws -> some IntentResult {
#if !APP_EXTENSION
    let didResume = await MainActor.run { SpeechPlaybackController.resume() }
    if didResume {
      await updateLiveActivities(status: "playing")
    }
#endif
    return .result()
  }
}

@available(iOS 17.0, *)
struct StopSpeechIntent: LiveActivityIntent, AudioPlaybackIntent {
  static var title: LocalizedStringResource = "Sesli okumayı durdur"

  func perform() async throws -> some IntentResult {
#if !APP_EXTENSION
    let didStop = await MainActor.run { SpeechPlaybackController.stop() }
    if didStop {
      for activity in Activity<SpeechActivityAttributes>.activities {
        await activity.end(dismissalPolicy: .immediate)
      }
    }
#endif
    return .result()
  }
}

@available(iOS 17.0, *)
private func updateLiveActivities(status: String) async {
  for activity in Activity<SpeechActivityAttributes>.activities {
    await activity.update(using: SpeechActivityAttributes.ContentState(status: status))
  }
}
