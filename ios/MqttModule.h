//
//  MqttModule.h
//  d11-mqtt
//
//  Created by Vibhor Verma on 31/10/23.
//



#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface MqttModule : RCTEventEmitter <RCTBridgeModule>

@property (nonatomic, assign) BOOL setBridgeOnMainQueue;

- (void)sendEventToJs:(NSString * _Nonnull)eventName param:(NSDictionary<NSString *,id> *_Nullable)params;

@end
