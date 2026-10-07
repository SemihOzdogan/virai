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
      VStack(alignment: .leading, spacing: 14) {
        SpeechActivityHeader(
          title: context.attributes.conversationTitle,
          status: context.state.status
        )
        SpeechActivityControls(status: context.state.status)
      }
      .padding()
      .activityBackgroundTint(Color(red: 0.08, green: 0.09, blue: 0.16))
      .activitySystemActionForegroundColor(.white)
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          ActivityGlyph(status: context.state.status, size: 34)
        }
        DynamicIslandExpandedRegion(.center) {
          Text(context.attributes.conversationTitle)
            .font(.headline.weight(.semibold))
            .lineLimit(1)
        }
        DynamicIslandExpandedRegion(.bottom) {
          VStack(alignment: .leading, spacing: 12) {
            SpeechActivityStatus(status: context.state.status)
            SpeechActivityControls(status: context.state.status)
          }
        }
      } compactLeading: {
        Image(systemName: context.state.status == "paused" ? "pause.fill" : "waveform")
          .foregroundStyle(context.state.status == "paused" ? .orange : .purple)
      } compactTrailing: {
        Image(systemName: context.state.status == "paused" ? "play.fill" : "waveform.path.ecg")
          .font(.caption.weight(.bold))
          .foregroundStyle(.white)
      } minimal: {
        Image(systemName: context.state.status == "paused" ? "pause.fill" : "waveform")
          .foregroundStyle(context.state.status == "paused" ? .orange : .purple)
      }
      .widgetURL(URL(string: "virai://"))
      .keylineTint(.purple)
    }
  }

  private struct SpeechActivityHeader: View {
    let title: String
    let status: String

    var body: some View {
      HStack(spacing: 12) {
        ActivityGlyph(status: status, size: 38)
        VStack(alignment: .leading, spacing: 5) {
          Text(title)
            .font(.headline.weight(.semibold))
            .lineLimit(1)
          SpeechActivityStatus(status: status)
        }
      }
    }
  }

  private struct SpeechActivityStatus: View {
    let status: String

    private var isPaused: Bool { status == "paused" }

    var body: some View {
      Label(isPaused ? "Duraklatıldı" : "Yanıt okunuyor", systemImage: isPaused ? "pause.fill" : "waveform")
        .font(.caption.weight(.semibold))
        .foregroundStyle(isPaused ? Color.orange : Color(red: 0.72, green: 0.62, blue: 1))
    }
  }

  private struct ActivityGlyph: View {
    let status: String
    let size: CGFloat

    private var isPaused: Bool { status == "paused" }

    var body: some View {
      Image(systemName: isPaused ? "pause.fill" : "waveform")
        .font(.system(size: size * 0.42, weight: .bold))
        .foregroundStyle(isPaused ? Color.orange : Color.white)
        .frame(width: size, height: size)
        .background(isPaused ? Color.orange.opacity(0.18) : Color.purple.opacity(0.32), in: Circle())
        .overlay(Circle().strokeBorder(Color.white.opacity(0.14), lineWidth: 1))
    }
  }

  private struct SpeechActivityControls: View {
    let status: String

    var body: some View {
      HStack(spacing: 10) {
        if status == "paused" {
          Button(intent: ResumeSpeechIntent()) {
            ControlButtonLabel(title: "Devam et", icon: "play.fill", tint: .purple)
          }
        } else {
          Button(intent: PauseSpeechIntent()) {
            ControlButtonLabel(title: "Duraklat", icon: "pause.fill", tint: .purple)
          }
        }

        Button(intent: StopSpeechIntent()) {
          ControlButtonLabel(title: "Durdur", icon: "stop.fill", tint: .red)
        }
      }
      .buttonStyle(.plain)
    }
  }

  private struct ControlButtonLabel: View {
    let title: String
    let icon: String
    let tint: Color

    var body: some View {
      Label(title, systemImage: icon)
        .font(.subheadline.weight(.semibold))
        .frame(maxWidth: .infinity)
        .padding(.vertical, 11)
        .foregroundStyle(.white)
        .background(tint.opacity(0.78), in: Capsule())
        .overlay(Capsule().strokeBorder(Color.white.opacity(0.16), lineWidth: 1))
    }
  }
}
