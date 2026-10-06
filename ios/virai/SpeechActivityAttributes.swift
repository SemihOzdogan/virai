import ActivityKit

struct SpeechActivityAttributes: ActivityAttributes {
  struct ContentState: Codable, Hashable {
    var status: String
  }

  var conversationTitle: String
}
