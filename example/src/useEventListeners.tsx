import * as React from 'react';
import { MqttClient } from '../../src/Mqtt/MqttClient';

export const useEventListeners = (mqttClient: MqttClient | undefined) => {
  React.useEffect(() => {
    const connectionListener = mqttClient?.setOnConnectCallback((ack) => {
      console.log('Client Connection Success Listner', ack);
    });

    const onConnectFailureListener = mqttClient?.setOnConnectFailureCallback(
      (ack) => {
        console.log('Client Connection Failure Listner', ack);
      }
    );

    const onErrorFailureListener = mqttClient?.setOnErrorCallback((ack) => {
      console.log('Client Connection Failure Listner', ack);
    });

    const onDisconnectFailureListener = mqttClient?.setOnDisconnectCallback(
      (ack) => {
        console.log('Client Connection Failure Listner', ack);
      }
    );

    return () => {
      connectionListener?.remove();
      onConnectFailureListener?.remove();
      onErrorFailureListener?.remove();
      onDisconnectFailureListener?.remove();
    };
  }, [mqttClient]);
};
