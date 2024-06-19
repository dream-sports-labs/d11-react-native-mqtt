import { MqttConfig } from '../../src/Mqtt';

export const mqttConfig: MqttConfig = {
  clientId: 'dummyMqtt',
  host: 'broker.hivemq.com',
  port: 1883,
  options: {
    password: '',
    cleanSession: true,
    enableSslConfig: false,
    keepAlive: 60,
    autoReconnect: true,
    retryCount: 3,
  },
};
