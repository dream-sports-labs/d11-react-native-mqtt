import { MqttClient } from './MqttClient';
import type { MqttConfig } from './MqttClient.interface';

/**
 * This function creates a new MQTT client instance based on the provided configuration.
 * It serves as a factory function for creating MQTT clients with specific configurations.
 * @param config The configuration object containing details such as clientId, host, port, and options.
 * @returns A new instance of MqttClient configured with the provided settings.
 */

export async function createMqttClient(
  config: MqttConfig
): Promise<MqttClient | undefined> {
  const { clientId, host, port, options } = config;
  const mqttClient = await MqttClient.create(clientId, host, port, options);
  return mqttClient ?? undefined;
}
