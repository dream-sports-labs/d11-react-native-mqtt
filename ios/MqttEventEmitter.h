//
//  MqttEventEmitter.h
//  d11-mqtt
//
//  Created by Vibhor Verma on 07/11/23.
//

#import <Foundation/Foundation.h>
#import "MqttModule.h"

NS_ASSUME_NONNULL_BEGIN

@interface MqttEventEmitter : NSObject

- (void)sendEvent:(NSString * _Nonnull)eventName param:(NSDictionary<NSString *,id> *_Nullable)params;

@end

NS_ASSUME_NONNULL_END
