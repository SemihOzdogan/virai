#import "SpeechPlaybackController.h"
#import <TextToSpeech/TextToSpeech.h>

@implementation SpeechPlaybackController

+ (BOOL)pause {
  return [[TextToSpeech sharedInstance].synthesizer pauseSpeakingAtBoundary:AVSpeechBoundaryImmediate];
}

+ (BOOL)resume {
  return [[TextToSpeech sharedInstance].synthesizer continueSpeaking];
}

+ (BOOL)stop {
  return [[TextToSpeech sharedInstance].synthesizer stopSpeakingAtBoundary:AVSpeechBoundaryImmediate];
}

@end
