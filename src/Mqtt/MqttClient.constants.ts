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
  CLIENT_INITIALIZE_EVENT = 'client_initialize',
  ERROR_EVENT = 'mqtt_error',
}

// This is not exclusive yet. Add all reasonCodes if you have patience
export enum Mqtt5ReasonCode {
  BAD_USER_NAME_OR_PASSWORD = 134,
  NOT_AUTHORIZED = 135,
  BAD_AUTHENTICATION_METHOD = 140,
  NORMAL_DISCONNECTION = 0,
  DEFAULT = -1,
  CONNECTION_ERROR = -2,
  DISCONNECTION_ERROR = -3,
  SUBSCRIPTION_ERROR = -4,
  UNSUBSCRIPTION_ERROR = -5,
  INITIALIZATION_ERROR = -6,
  RX_CHAIN_ERROR = -7,
}

export enum MqttQos {
  AT_MOST_ONCE = 0,
  AT_LEAST_ONCE = 1,
  EXACTLY_ONCE = 2,
}
