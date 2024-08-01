import { NativeModules, type NativeModule } from 'react-native';

export const MqttModule: NativeModule & {
  installJSIModule: () => boolean;
} = NativeModules.MqttModule;

export interface MqttModuleProxy {
  removeMqtt: (clientId: string) => void;
  connectMqtt: (
    clientId: string,
    options: {
      keepAlive: number;
      cleanSession: boolean;
      username: string;
      password: string;
    }
  ) => void;

  disconnectMqtt: (clientId: string) => void;

  subscribeMqtt: (
    eventId: string,
    clientId: string,
    topic: string,
    qos: 0 | 1 | 2
  ) => void;

  unsubscribeMqtt: (eventId: string, clientId: string, topic: string) => void;

  getConnectionStatusMqtt: (clientId: string) => string;
}

declare global {
  var __MqttModuleProxy: MqttModuleProxy;
}

function isLoaded() {
  return (
    global.__MqttModuleProxy !== null && global.__MqttModuleProxy !== undefined
  );
}

if (!isLoaded()) {
  const mqttModule = NativeModules.MqttModule as {
    installJSIModule: () => boolean;
  };
  const isSuccessful = mqttModule.installJSIModule();
  console.log('::MQTT : JSI bindings installation status', isSuccessful);
}

export const MqttJSIModule = global.__MqttModuleProxy;
