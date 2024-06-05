import { createMqttClient } from '../../src/Mqtt';
import type { MqttClient } from '../../src/Mqtt/MqttClient';

export const createMqtt = (): MqttClient => {
  /**
   * Mqtt Connectors
   */
  const clientId = 'mqttx_0121';
  const hostId = 'broker.emqx.io';
  const port = 1883;

  const client = createMqttClient({
    clientId: clientId,
    host: hostId,
    port: port,
    options: {
      password: '',
      cleanSession: true,
      enableSslConfig: false,
      keepAlive: 60,
      autoReconnect: true,
      retryCount: 3,
    },
  });

  client.setOnConnectCallback(() => console.log(`::MQTT OnConnectCallback`));
  client.setOnDisconnectCallback((_, options) =>
    console.log(`::MQTT OnDisconnectCallback`, options.disconnectType)
  );
  client.setOnConnectFailureCallback(() =>
    console.log(`::MQTT OnConnectFailureCallback`)
  );

  return client;
};
