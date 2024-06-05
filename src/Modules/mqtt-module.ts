import { NativeModules, type NativeModule } from 'react-native';

export const MqttModule: NativeModule & {
  installJSIModule: () => boolean;
} = NativeModules.MqttModule;

export interface MqttModuleProxy {
  createMqtt: (
    clientId: string,
    host: string,
    port: number,
    enableSslConfig: boolean
  ) => void;

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

  getConnectionStatusMqtt: (
    clientId: string
  ) => 'connected' | 'connecting' | 'disconnected';
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
  if (!isSuccessful) {
    console.warn('::MQTT : JSI bindings installation failed for MqttModule');
  } else {
    console.log('::MQTT : JSI bindings installation successful for MqttModule');
  }
}

export const MqttJSIModule = global.__MqttModuleProxy;
