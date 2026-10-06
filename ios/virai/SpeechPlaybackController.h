#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface SpeechPlaybackController : NSObject

+ (BOOL)pause;
+ (BOOL)resume;
+ (BOOL)stop;

@end

NS_ASSUME_NONNULL_END
