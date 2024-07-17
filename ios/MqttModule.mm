//
//  MqttModule.mm
//  d11-mqtt
//
//  Created by Vibhor Verma on 31/10/23.
//


#import "MqttModule.h"
#import "MqttJSIUtils.h"

#import <React/RCTBridge+Private.h>
#import <d11_mqtt/d11_mqtt-Swift.h>



using namespace facebook::jsi;
using namespace std;

@interface MqttModule()

@end

@implementation MqttModule

@synthesize bridge = _bridge;
@synthesize methodQueue = _methodQueue;

RCT_EXPORT_MODULE(MqttModule)

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

- (NSArray<NSString *> *)supportedEvents {
    return @[@"CUSTOM_EVENT"];
}

- (void)sendEventToJs:(NSString * _Nonnull)eventName param:(NSDictionary<NSString *,id> *_Nullable)params {
     [self sendEventWithName:eventName body: params];
}

RCT_EXPORT_METHOD(createMqtt:(NSString *)clientId host:(NSString *)host port:(NSInteger)port enableSsl:(BOOL)enableSsl) {
    [[Mqtt shared] createMqtt:clientId host:host port:port enableSslConfig:enableSsl];
}

static Value removeMqtt(Runtime &runtime, const Value &thisValue, const Value *arguments, size_t count) {
    NSString *clientId = mqtt::convertJSIStringToNSString(runtime, arguments[0].getString(runtime));

    [[Mqtt shared] removeMqtt:clientId];
    return Value();
}

static Value connectMqtt(Runtime &runtime, const Value &thisValue, const Value *arguments, size_t count) {
    NSString *clientId = mqtt::convertJSIStringToNSString(runtime, arguments[0].getString(runtime));
    NSDictionary *options = mqtt::convertJSIObjectToNSDictionary(runtime, arguments[1].getObject(runtime));

    [[Mqtt shared] connectMqtt:clientId options:options];
    printf("connect mqtt called");
    return Value();
}

static Value disconnectMqtt(Runtime &runtime, const Value &thisValue, const Value *arguments, size_t count) {
    NSString *clientId = mqtt::convertJSIStringToNSString(runtime, arguments[0].getString(runtime));

    [[Mqtt shared] disconnectMqtt:clientId];
    return Value();
}

static Value subscribeMqtt(Runtime &runtime, const Value &thisValue, const Value *arguments, size_t count) {
    NSString *eventId = mqtt::convertJSIStringToNSString(runtime, arguments[0].getString(runtime));
    NSString *clientId = mqtt::convertJSIStringToNSString(runtime, arguments[1].getString(runtime));
    NSString *topic = mqtt::convertJSIStringToNSString(runtime, arguments[2].getString(runtime));
    NSNumber *qosString = mqtt::convertJSIValueToObjCObject(runtime, arguments[3]);
    NSInteger qos = [qosString intValue];

    [[Mqtt shared] subscribeMqtt:eventId clientId:clientId topic:topic qos:qos];
    return Value();
}

static Value unsubscribeMqtt(Runtime &runtime, const Value &thisValue, const Value *arguments, size_t count) {
    NSString *eventId = mqtt::convertJSIStringToNSString(runtime, arguments[0].getString(runtime));
    NSString *clientId = mqtt::convertJSIStringToNSString(runtime, arguments[1].getString(runtime));
    NSString *topic = mqtt::convertJSIStringToNSString(runtime, arguments[2].getString(runtime));

    [[Mqtt shared] unsubscribeMqtt:eventId clientId:clientId topic:topic];
    return Value();
}

static Value getConnectionStatusMqtt(Runtime &runtime, const Value &thisValue, const Value *arguments, size_t count) {
    NSString *clientId = mqtt::convertJSIStringToNSString(runtime, arguments[0].getString(runtime));

    NSString *state = [[Mqtt shared] getConnectionStatusMqtt:clientId];
    auto jsiValue = mqtt::convertNSStringToJSIString(runtime, state);
    return jsiValue;
}


static void installJSIModule(Runtime &jsiRuntime) {
    // Create a proxy object that will hold all our functions
    Object module = Object(jsiRuntime);
    
    // Callable properties
    mqtt::registerCxxFunction(jsiRuntime, module, "removeMqtt", 1, removeMqtt);
    mqtt::registerCxxFunction(jsiRuntime, module, "connectMqtt", 2, connectMqtt);
    mqtt::registerCxxFunction(jsiRuntime, module, "disconnectMqtt", 1, disconnectMqtt);
    mqtt::registerCxxFunction(jsiRuntime, module, "subscribeMqtt", 4, subscribeMqtt);
    mqtt::registerCxxFunction(jsiRuntime, module, "unsubscribeMqtt", 3, unsubscribeMqtt);
    mqtt::registerCxxFunction(jsiRuntime, module, "getConnectionStatusMqtt", 1, getConnectionStatusMqtt);
    
    jsiRuntime.global().setProperty(jsiRuntime, "__MqttModuleProxy", std::move(module));
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(installJSIModule) {
    RCTBridge* bridge = [RCTBridge currentBridge];
    RCTCxxBridge* cxxBridge = (RCTCxxBridge*)bridge;
    if (cxxBridge == nil) {
        return @false;
    }
    auto jsiRuntime = (jsi::Runtime*) cxxBridge.runtime;
    if (jsiRuntime == nil) {
        return @false;
    }
    installJSIModule(*(facebook::jsi::Runtime *)jsiRuntime);
    return @true;
}

@end
