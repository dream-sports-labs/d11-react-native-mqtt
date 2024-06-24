import { MqttConfig, createMqttClient } from '../../src/Mqtt';
import { MqttClient } from '../../src/Mqtt/MqttClient';

let instance: MqttClient | undefined;
export async function initializeMqttClient(
  config: MqttConfig
): Promise<MqttClient | undefined> {
  try {
    if (instance) return instance;
    instance = await createMqttClient(config);
    return instance;
  } catch (error) {
    console.log('An error occurred during MQTT client initialization:', error);
    return undefined;
  }
}
