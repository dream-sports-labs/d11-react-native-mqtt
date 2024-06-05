export enum CONNECTION_STATE {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
}

export enum MQTT_EVENTS {
  CONNECTED_EVENT = 'connected',
  DISCONNECTED_EVENT = 'disconnected',
  SUBSCRIPTION_EVENT = 'subscription_event', // Do not use this as eventName. This is intended only for typing purpose
  SUBSCRIPTION_SUCCESS_EVENT = 'subscribe_success',
  SUBSCRIPTION_FAILED_EVENT = 'subscribe_failed',
}

// This is not exclusive yet. Add all reasonCodes if you have patience
export enum Mqtt5ReasonCode {
  BAD_USER_NAME_OR_PASSWORD = 134,
  NOT_AUTHORIZED = 135,
  BAD_AUTHENTICATION_METHOD = 140,
  NORMAL_DISCONNECTION = 0,
  DEFAULT = -1,
}

export enum MqttQos {
  AT_MOST_ONCE = 0,
  AT_LEAST_ONCE = 1,
  EXACTLY_ONCE = 2,
}
