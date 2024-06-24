import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { RoundButton } from './Button';
import { mqttConfig } from './mqttConstants';
import { useEventListeners } from './useEventListeners';
import { MqttClient } from '../../src/Mqtt/MqttClient';
import { initializeMqttClient } from './createMqtt';
import { subscriptionConfig } from './mqttUtils';

export default function App() {
  const [mqttClient, setClient] = React.useState<MqttClient | undefined>(
    undefined
  );

  useEventListeners(mqttClient);

  React.useEffect(() => {
    initializeMqttClient(mqttConfig).then((client) => {
      if (client) {
        setClient(client);
      }
    });
  }, []);

  const connectMqtt = React.useCallback(
    () => (mqttClient ? mqttClient.connect() : null),
    [mqttClient]
  );

  const subscribeMqtt = React.useCallback(
    () => (mqttClient ? mqttClient.subscribe(subscriptionConfig) : null),
    [mqttClient]
  );

  const disconnectMqtt = React.useCallback(
    () => (mqttClient ? mqttClient.disconnect() : null),
    [mqttClient]
  );

  const removeMqtt = React.useCallback(() => {
    if (mqttClient) {
      mqttClient.remove();
      setClient(undefined);
    }
  }, [mqttClient]);

  const getConnectionStatus = React.useCallback(() => {
    const connectionStatus = mqttClient
      ? mqttClient.getConnectionStatus()
      : null;
    console.log(`::MQTT connectionStatus:${connectionStatus}`);
  }, [mqttClient]);

  return (
    <View style={styles.container}>
      <RoundButton
        onPress={connectMqtt}
        backgroundColor={'#118a7e'}
        buttonText="Connect Mqtt"
        disabled={!mqttClient}
      />
      <RoundButton
        onPress={getConnectionStatus}
        backgroundColor={'#1f6f78'}
        buttonText="Connection Status"
        disabled={!mqttClient}
      />
      <RoundButton
        onPress={subscribeMqtt}
        backgroundColor={'#7fa99b'}
        buttonText="Subscribe Mqtt"
        disabled={!mqttClient}
      />
      <RoundButton
        onPress={disconnectMqtt}
        backgroundColor={'#ff5959'}
        buttonText="Disconnect Mqtt"
        disabled={!mqttClient}
      />
      <RoundButton
        onPress={removeMqtt}
        backgroundColor={'red'}
        buttonText="Remove Mqtt"
        disabled={!mqttClient}
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
