import { EventEmitter } from './EventEmitter';
import { MqttClient } from './MqttClient';
import { MQTT_EVENTS } from './MqttClient.constants';
import type { MqttConfig, MqttEventsInterface } from './MqttClient.interface';

/**
 * This function creates a new MQTT client instance based on the provided configuration.
 * It serves as a factory function for creating MQTT clients with specific configurations.
 * @param config The configuration object containing details such as clientId, host, port, and options.
 * @returns A new instance of MqttClient configured with the provided settings.
 */

export const createMqttClient = (
  config: MqttConfig
): Promise<MqttClient | undefined> => {
  const eventEmitter: EventEmitter = EventEmitter.getInstance();
  const eventName = config.clientId + MQTT_EVENTS.CLIENT_INITIALIZE_EVENT;

  return new Promise<MqttClient | undefined>((resolve) => {
    const listener = eventEmitter.addListener(
      eventName,
      (ack: MqttEventsInterface[MQTT_EVENTS.CLIENT_INITIALIZE_EVENT]) => {
        if (ack.clientInit) {
          resolve(client);
        } else {
          resolve(undefined);
        }
        listener.remove();
      }
    );

    let client: MqttClient = new MqttClient(
      config.clientId,
      config.host,
      config.port,
      config.options
    );
  });
};
