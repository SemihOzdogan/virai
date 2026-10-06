import ActivityKit
import SwiftUI
import WidgetKit

@main
struct VirAILiveActivityWidgetBundle: WidgetBundle {
  var body: some Widget {
    VirAILiveActivityWidget()
  }
}

struct VirAILiveActivityWidget: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: SpeechActivityAttributes.self) { context in
      VStack(alignment: .leading, spacing: 8) {
        Text(context.attributes.conversationTitle)
          .font(.headline)
          .lineLimit(1)
        Label(
          context.state.status == "paused" ? "Duraklatıldı" : "Yanıt okunuyor",
          systemImage: context.state.status == "paused" ? "pause.fill" : "waveform"
        )
        .font(.subheadline)
        .foregroundStyle(.secondary)
        SpeechActivityControls(status: context.state.status)
      }
      .padding()
      .activityBackgroundTint(Color(uiColor: .secondarySystemBackground))
      .activitySystemActionForegroundColor(.primary)
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          Image(systemName: context.state.status == "paused" ? "pause.fill" : "waveform")
            .foregroundStyle(.tint)
        }
        DynamicIslandExpandedRegion(.center) {
          Text(context.attributes.conversationTitle)
            .font(.headline)
            .lineLimit(1)
        }
        DynamicIslandExpandedRegion(.bottom) {
          VStack(spacing: 10) {
            Text(context.state.status == "paused" ? "Duraklatıldı" : "Yanıt okunuyor")
              .font(.subheadline)
              .foregroundStyle(.secondary)
            SpeechActivityControls(status: context.state.status)
          }
        }
      } compactLeading: {
        Image(systemName: context.state.status == "paused" ? "pause.fill" : "waveform")
      } compactTrailing: {
        Text("VirAI")
          .font(.caption2)
      } minimal: {
        Image(systemName: context.state.status == "paused" ? "pause.fill" : "waveform")
      }
      .widgetURL(URL(string: "virai://"))
      .keylineTint(.purple)
    }
  }

  private struct SpeechActivityControls: View {
    let status: String

    var body: some View {
      HStack(spacing: 20) {
        if status == "paused" {
          Button(intent: ResumeSpeechIntent()) {
            Label("Devam et", systemImage: "play.fill")
          }
        } else {
          Button(intent: PauseSpeechIntent()) {
            Label("Duraklat", systemImage: "pause.fill")
          }
        }

        Button(intent: StopSpeechIntent()) {
          Label("Durdur", systemImage: "stop.fill")
            .foregroundStyle(.red)
        }
      }
      .font(.caption)
      .buttonStyle(.plain)
    }
  }
}
