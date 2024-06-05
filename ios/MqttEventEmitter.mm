//
//  MqttEventEmitter.m
//  d11-mqtt
//
//  Created by Vibhor Verma on 07/11/23.
//

#import "MqttEventEmitter.h"
#import <React/RCTBridge+Private.h>


@implementation MqttEventEmitter

- (void)sendEvent:(NSString * _Nonnull)eventName param:(NSDictionary<NSString *,id> *_Nullable)params {
    RCTBridge* bridge = [RCTBridge currentBridge];
    [[bridge moduleForClass:[MqttModule class]] sendEventToJs:eventName param:params];
}

@end
