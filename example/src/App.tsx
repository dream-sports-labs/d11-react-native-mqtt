import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { RoundButton } from './Button';
import { Client } from './mqttService';
import { mqttConfig } from './mqttConstants';
import { SubscribeMqtt } from '../../src/Mqtt';
import { useEventListeners } from './useEventListeners';

export default function App() {
  useEventListeners();

  const subscriptionConfig: SubscribeMqtt = {
    topic: 'myTopic',
    qos: 1,
    onEvent: (payload) => {
      console.log('Received message:', payload);
    },
    onSuccess: (ack) => {
      console.log('Subscription success:', ack);
    },
    onError: (error) => {
      console.log('Subscription error:', error);
    },
  };

  const subscribeMqtt = () => Client.subscribe(subscriptionConfig);

  const createMqtt = async () => await Client.initialize(mqttConfig);

  return (
    <View style={styles.container}>
      <RoundButton
        onPress={createMqtt}
        backgroundColor={'#7fa99e'}
        buttonText="Create Mqtt"
      />
      <RoundButton
        onPress={Client.connect}
        backgroundColor={'#118a7e'}
        buttonText="Connect Mqtt"
      />

      <RoundButton
        onPress={Client.getConnectionStatus}
        backgroundColor={'#1f6f78'}
        buttonText="Connection Status"
      />
      <RoundButton
        onPress={subscribeMqtt}
        backgroundColor={'#7fa99b'}
        buttonText="Subscribe Mqtt"
      />
      <RoundButton
        onPress={Client.disconnect}
        backgroundColor={'#ff5959'}
        buttonText="Disconnect Mqtt"
      />
      <RoundButton
        onPress={Client.remove}
        backgroundColor={'red'}
        buttonText="Remove Mqtt"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D3D3D3',
  },
});
