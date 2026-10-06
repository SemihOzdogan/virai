import ActivityKit
import Foundation
import React

@objc(LiveActivityModule)
class LiveActivityModule: NSObject {
  @objc static func requiresMainQueueSetup() -> Bool {
    false
  }

  @objc(start:resolver:rejecter:)
  func start(
    _ conversationTitle: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard #available(iOS 16.1, *) else {
      resolve(false)
      return
    }

    guard ActivityAuthorizationInfo().areActivitiesEnabled else {
      resolve(false)
      return
    }

    Task {
      do {
        for activity in Activity<SpeechActivityAttributes>.activities {
          await activity.end(dismissalPolicy: .immediate)
        }

        let attributes = SpeechActivityAttributes(
          conversationTitle: conversationTitle.isEmpty ? "VirAI" : conversationTitle
        )
        _ = try Activity.request(
          attributes: attributes,
          contentState: SpeechActivityAttributes.ContentState(status: "playing"),
          pushType: nil
        )
        resolve(true)
      } catch {
        reject("live_activity_start_failed", error.localizedDescription, error)
      }
    }
  }

  @objc(updateStatus:resolver:rejecter:)
  func updateStatus(
    _ status: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard #available(iOS 16.1, *) else {
      resolve(nil)
      return
    }

    Task {
      for activity in Activity<SpeechActivityAttributes>.activities {
        await activity.update(
          using: SpeechActivityAttributes.ContentState(status: status == "paused" ? "paused" : "playing")
        )
      }
      resolve(nil)
    }
  }

  @objc(end:rejecter:)
  func end(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard #available(iOS 16.1, *) else {
      resolve(nil)
      return
    }

    Task {
      for activity in Activity<SpeechActivityAttributes>.activities {
        await activity.end(dismissalPolicy: .immediate)
      }
      resolve(nil)
    }
  }
}
