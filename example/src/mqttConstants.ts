import { MqttConfig } from '../../src/Mqtt';

export const mqttConfig: MqttConfig = {
  clientId: 'mqttx_d11_rn_mqtt',
  host: 'broker.emqx.io',
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
