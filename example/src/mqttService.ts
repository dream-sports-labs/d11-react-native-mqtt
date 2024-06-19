import {
  DisconnectCallback,
  MQTT_EVENTS,
  Mqtt5ReasonCode,
  MqttConfig,
  MqttEventsInterface,
  MqttOptions,
  SubscribeMqtt,
  createMqttClient,
} from '../../src/Mqtt';
import { MqttClient } from '../../src/Mqtt/MqttClient';

export class Client {
  static instance: MqttClient | undefined;

  private static config: MqttConfig | undefined;

  private static pendingConnectCallbacks: ((
    ack: MqttEventsInterface[MQTT_EVENTS.CONNECTED_EVENT]
  ) => void)[] = [];
  private static pendingConnectFailureCallbacks: ((
    mqtt5ReasonCode: Mqtt5ReasonCode
  ) => void)[] = [];
  private static pendingErrorCallbacks: ((
    ack: MqttEventsInterface[MQTT_EVENTS.ERROR_EVENT]
  ) => void)[] = [];
  private static pendingDisconnectFailureCallbacks: ((
    mqtt5ReasonCode: DisconnectCallback['mqtt5ReasonCode'],
    options: DisconnectCallback['options']
  ) => void)[] = [];

  private constructor() {}
  /**
   * Initializes the MQTT client with the provided configuration.
   * Creates the instance if it doesn't exist.
   * @param config The configuration for creating the MQTT client.
   */
  static async initialize(config: MqttConfig): Promise<void> {
    if (!Client.instance || Client.config !== config) {
      Client.config = config;
      Client.instance = await createMqttClient(config);

      // Execute all pending callbacks for various events
      Client.pendingConnectCallbacks.forEach((callback) =>
        Client.instance?.setOnConnectCallback(callback)
      );
      Client.pendingConnectFailureCallbacks.forEach((callback) =>
        Client.instance?.setOnConnectFailureCallback(callback)
      );
      Client.pendingErrorCallbacks.forEach((callback) =>
        Client.instance?.setOnErrorCallback(callback)
      );
      Client.pendingDisconnectFailureCallbacks.forEach((callback) =>
        Client.instance?.setOnDisconnectCallback(callback)
      );

      // Clear all queues after execution
      Client.pendingConnectCallbacks = [];
      Client.pendingConnectFailureCallbacks = [];
      Client.pendingErrorCallbacks = [];
      Client.pendingDisconnectFailureCallbacks = [];
    }
  }

  /**
   * Connects the MQTT client to the broker.
   * @param options Optional new options for connection.
   */
  static connect(options?: MqttOptions) {
    if (Client.instance) {
      Client.instance.connect(options);
    } else {
      console.log('MQTT client is not initialized');
    }
  }

  /**
   * Disconnects the MQTT client from the broker.
   */
  static disconnect() {
    if (Client.instance) {
      Client.instance.disconnect();
    } else {
      console.error('MQTT client is not initialized');
    }
  }

  static remove() {
    if (Client.instance) {
      Client.instance.remove();
      Client.instance = undefined;
      Client.config = undefined;
    } else {
      console.error('MQTT client is not initialized');
    }
  }

  /**
   * Subscribes to an MQTT topic with the specified Quality of Service (QoS).
   * @param subscription The subscription details including topic, QoS, and callbacks.
   * @returns An object with a remove method to unsubscribe from the topic.
   */
  static subscribe(subscription: SubscribeMqtt) {
    if (Client.instance) {
      return Client.instance.subscribe(subscription);
    } else {
      console.error('MQTT client is not initialized');
      return undefined;
    }
  }

  /**
   * Retrieves the current connection status of the MQTT client.
   * @returns The current connection status.
   */
  static async getConnectionStatus(): Promise<string | undefined> {
    if (Client.instance) {
      const status = Client.instance.getConnectionStatus();
      console.log(`MQTT Connection Status: ${status}`);
      return status;
    } else {
      console.error('MQTT client is not initialized');
      return undefined;
    }
  }

  /**
   * Set a callback for the MQTT CONNECTED event.
   * @param callback The callback to execute when the MQTT client connects.
   * @returns An object with a method to remove the event listener.
   */
  static onConnect(
    callback: (ack: MqttEventsInterface[MQTT_EVENTS.CONNECTED_EVENT]) => void
  ) {
    if (Client.instance) {
      return Client.instance.setOnConnectCallback(callback);
    } else {
      Client.pendingConnectCallbacks.push(callback);
      return {
        remove: () =>
          Client.removeCallback(Client.pendingConnectCallbacks, callback),
      };
    }
  }

  /**
   * Set a callback for the MQTT connection failure event.
   * @param callback The callback to execute when the MQTT client connection results in failure.
   * @returns An object with a method to remove the event listener.
   */
  static onConnectFailure(
    callback: (mqtt5ReasonCode: Mqtt5ReasonCode) => void
  ) {
    if (Client.instance) {
      return Client.instance.setOnConnectFailureCallback(callback);
    } else {
      Client.pendingConnectFailureCallbacks.push(callback);
      return {
        remove: () =>
          Client.removeCallback(
            Client.pendingConnectFailureCallbacks,
            callback
          ),
      };
    }
  }

  /**
   * Set a callback for the MQTT error event.
   * @param callback The callback to execute when the MQTT client has error in it's lifecycle.
   * @returns An object with a method to remove the event listener.
   */
  static onErrorFailure(
    callback: (ack: MqttEventsInterface[MQTT_EVENTS.ERROR_EVENT]) => void
  ) {
    if (Client.instance) {
      return Client.instance.setOnErrorCallback(callback);
    } else {
      Client.pendingErrorCallbacks.push(callback);
      return {
        remove: () =>
          Client.removeCallback(Client.pendingErrorCallbacks, callback),
      };
    }
  }

  /**
   * Set a callback for the MQTT onDisconnect Failure event.
   * @param callback The callback to execute when the MQTT client disconnect has failed.
   * @returns An object with a method to remove the event listener.
   */
  static onDisconnectFailure(
    callback: (
      mqtt5ReasonCode: DisconnectCallback['mqtt5ReasonCode'],
      options: DisconnectCallback['options']
    ) => void
  ) {
    if (Client.instance) {
      return Client.instance.setOnDisconnectCallback(callback);
    } else {
      Client.pendingDisconnectFailureCallbacks.push(callback);
      return {
        remove: () =>
          Client.removeCallback(
            Client.pendingDisconnectFailureCallbacks,
            callback
          ),
      };
    }
  }

  private static removeCallback(queue: any[], callback: Function) {
    const index = queue.indexOf(callback);
    if (index > -1) {
      queue.splice(index, 1);
    }
  }
}
