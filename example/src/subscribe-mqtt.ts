import { useCallback, useEffect, useRef } from 'react';
import { MqttClient } from '../../src/Mqtt/MqttClient';
import {
  CONNECTION_STATE,
  MQTT_EVENTS,
  MqttEventsInterface,
  MqttQos,
} from '../../src/Mqtt';

/**
 * A custom React hook for subscribing to MQTT topics and handling received messages.
 * @param topic The MQTT topic to subscribe to.
 * @param qos The quality of service for the subscription.
 * @param onData A callback function to handle received messages.
 * @param onErrorSubscription An optional callback function to handle subscription errors.
 * @param isEnabled A boolean indicating whether the subscription is enabled.
 * @param client An MQTT client instance.
 * @param onSuccessSubscription An optional callback function to handle subscription success.
 */
export const useMqttSubscription = <T>({
  topic,
  qos,
  onData,
  onErrorSubscription,
  isEnabled,
  client,
  onSuccessSubscription,
}: {
  topic: string;
  qos: MqttQos;
  onData: (event?: T) => void;
  onErrorSubscription?: (message: string) => void;
  isEnabled: boolean;
  client: MqttClient | undefined;
  onSuccessSubscription: (
    ack: MqttEventsInterface[MQTT_EVENTS.SUBSCRIPTION_SUCCESS_EVENT]
  ) => void;
}) => {
  const subscriptionsRef = useRef(onData);
  subscriptionsRef.current = onData;

  // Define a memoized function to add MQTT event listeners.
  const addMqttListeners = useCallback((mqttClient: MqttClient) => {
    console.log(
      `::MQTT Subscription: subscribe for topic: ${topic} with qos: ${qos}`
    );
    const connectionStatus = mqttClient.getConnectionStatus();

    if (connectionStatus !== CONNECTION_STATE.CONNECTED) {
      console.log(
        `::MQTT Subscription: client is ${connectionStatus} before subscribing, so reconnecting`
      );
      mqttClient.connect();
    }

    const listener = mqttClient.subscribe({
      topic,
      qos,
      onSuccess: (ack) => {
        onSuccessSubscription(ack);
        console.log(
          `::MQTT Subscription Success: subscription successful for ${topic} with response: ${JSON.stringify(
            ack
          )}`
        );
      },
      onError: (error) => {
        console.log(
          `::MQTT Subscription Failed: subscription failed for ${topic} with response: ${JSON.stringify(
            error
          )}`
        );
        onErrorSubscription?.(error.errorMessage);
      },
      onEvent: ({ payload }) => {
        try {
          const jsonObj = JSON.parse(payload) as T;
          console.log(
            `::MQTT Subscription: event type: ${typeof payload}, event: ${payload}`
          );
          subscriptionsRef.current(jsonObj);
        } catch (e) {
          console.error('::MQTT Subscription: error while parsing, ', e);
          subscriptionsRef.current();
        }
      },
    });

    return {
      remove: () => {
        listener.remove();
      },
    };
    // eslint-disable-next-line
  }, []);

  // Subscribe or unsubscribe based on changes to dependencies.
  useEffect(() => {
    if (!isEnabled || !topic || !client) {
      return;
    }

    let listener = addMqttListeners(client);

    // Return a cleanup function to unsubscribe when the component unmounts or dependencies change.
    return () => {
      console.log(`::MQTT Subscription: unsubscribe topic ${topic}`);
      listener.remove();
    };
    // eslint-disable-next-line
  }, [isEnabled, onErrorSubscription, qos, topic, client]);
};
