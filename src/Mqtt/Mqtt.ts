import { MqttClient } from './MqttClient';
import type { MqttConfig } from './MqttClient.interface';

/**
 * This function creates a new MQTT client instance based on the provided configuration.
 * It serves as a factory function for creating MQTT clients with specific configurations.
 * @param config The configuration object containing details such as clientId, host, port, and options.
 * @returns A new instance of MqttClient configured with the provided settings.
 */

export const createMqttClient = (config: MqttConfig): MqttClient => {
  return new MqttClient(
    config.clientId,
    config.host,
    config.port,
    config.options
  );
};
