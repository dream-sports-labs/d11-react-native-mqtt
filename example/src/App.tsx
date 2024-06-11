import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { createMqtt } from './create-mqtt';
import type { MqttClient } from '../../src/Mqtt/MqttClient';
import { RoundButton } from './Button';

export default function App() {
  const [client, setClient] = React.useState<MqttClient | undefined>(undefined);

  const connectMqtt = () => {
    if (client) {
      client.connect();
      console.log(`::MQTT Connect Mqtt`);
    }
  };

  const disconnectMqtt = () => {
    if (client) {
      client.disconnect();
      console.log(`::MQTT Disconnect  Mqtt`);
    }
  };

  const getConnectionStatusMqtt = () => {
    if (client) {
      const status = client.getConnectionStatus();
      console.log(`::MQTT Mqtt Status ${status}`);
    }
  };

  const createMqttClient = () => {
    const newClient = createMqtt();
    setClient(newClient);
    console.log(`::MQTT Create Mqtt`);
  };

  return (
    <View style={styles.container}>
      <RoundButton
        onPress={createMqttClient}
        backgroundColor={'#7fa99b'}
        buttonText="Create Mqtt"
      />
      <RoundButton
        onPress={connectMqtt}
        backgroundColor={'#118a7e'}
        buttonText="Connect Mqtt"
      />
      <RoundButton
        onPress={getConnectionStatusMqtt}
        backgroundColor={'#1f6f78'}
        buttonText="Connection Status"
      />
      <RoundButton
        onPress={disconnectMqtt}
        backgroundColor={'#ff5959'}
        buttonText="Disconnect Mqtt"
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
