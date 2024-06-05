import { Mqtt5ReasonCode, MQTT_EVENTS, MqttQos } from './MqttClient.constants';

export type MqttConnect = {
  keepAlive?: number;
  cleanSession?: boolean;
  username?: string;
  password?: string;
  maxBackoffTime?: number;
  backoffTime?: number;
  jitter?: number;
  enableSslConfig?: boolean;
};

export type MqttReconnect = {
  autoReconnect?: boolean;
  retryCount?: number;
};

export type MqttOptions = MqttConnect & MqttReconnect;

export type MqttConfig = {
  clientId: string;
  host: string;
  port: number;
  options?: MqttOptions;
};

/**
 * Event Listeners
 */
export interface MqttEventsInterface {
  [MQTT_EVENTS.CONNECTED_EVENT]: {
    reasonCode: Mqtt5ReasonCode;
  };
  [MQTT_EVENTS.DISCONNECTED_EVENT]: {
    reasonCode: Mqtt5ReasonCode;
  };
  [MQTT_EVENTS.SUBSCRIPTION_EVENT]: {
    payload: string;
    topic: string;
    qos: MqttQos;
  };
  [MQTT_EVENTS.SUBSCRIPTION_SUCCESS_EVENT]: {
    message: string;
    topic: string;
    qos: MqttQos;
  };
  [MQTT_EVENTS.SUBSCRIPTION_FAILED_EVENT]: {
    errorMessage: string;
  };
}
