import * as React from 'react';
import { Client } from './mqttService';

export const useEventListeners = () => {
  React.useEffect(() => {
    const connectionListener = Client.onConnect((ack) => {
      console.log('Client Connection Success Listner', ack);
    });

    const onConnectFailureListener = Client.onConnectFailure((reasonCode) => {
      console.log('Client Connection Failure Listner', reasonCode);
    });

    const onErrorFailureListener = Client.onErrorFailure((ack) => {
      console.log('Client Connection Failure Listner', ack);
    });

    const onDisconnectFailureListener = Client.onDisconnectFailure((ack) => {
      console.log('Client Connection Failure Listner', ack);
    });

    return () => {
      connectionListener.remove();
      onConnectFailureListener.remove();
      onErrorFailureListener.remove();
      onDisconnectFailureListener.remove();
    };
  }, []);
};
