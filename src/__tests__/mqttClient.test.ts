import { MqttClient } from '../Mqtt/MqttClient';
import { MqttJSIModule } from '../Modules/mqttModule';
import { EventEmitter } from '../Mqtt/EventEmitter';
import { CONNECTION_STATE, MQTT_EVENTS } from '../Mqtt/MqttClient.constants';
import { NativeModules } from 'react-native';
const { MqttModule } = NativeModules;

const clientConfig = {
  autoReconnect: false,
  keepAlive: 60,
  username: '',
  password: '',
  cleanSession: true,
  retryCount: 0,
  backoffTime: 100,
  maxBackoffTime: 100,
  jitter: 1,
};

jest.mock('../Mqtt/EventEmitter', () => {
  const remove = jest.fn();
  const mEventEmitter = {
    getInstance: jest.fn(),
    addListener: jest.fn((_, callback) => {
      callback({ reasonCode: 100 });
      return { remove };
    }),
    removeAllListeners: jest.fn(),
  };
  mEventEmitter.getInstance.mockReturnValue(mEventEmitter);
  return { EventEmitter: mEventEmitter };
});

jest.mock('../Mqtt/MqttClient.utils', () => ({
  getMqttBackoffTime: jest.fn().mockReturnValue(1000),
}));

describe('MqttClient', () => {
  const clientId = 'test-client';
  const host = 'localhost';
  const port = 1883;
  let mqttClient: MqttClient;

  it('should not initialize MQTT client when called without host', () => {
    mqttClient = new MqttClient(
      'client1',
      undefined as unknown as string,
      1883
    );
    expect(MqttModule.createMqtt).toBeCalledTimes(0);
  });

  it('should create an instance and call createMqtt', () => {
    mqttClient = new MqttClient(clientId, host, port, clientConfig);
    expect(MqttModule.createMqtt).toHaveBeenCalledWith(
      clientId,
      host,
      port,
      false
    );
  });

  it('should connect to MQTT client', () => {
    let client;
    client = new MqttClient(clientId, host, port, clientConfig);
    client.connect();
    expect(MqttJSIModule.connectMqtt).toHaveBeenCalledWith(clientId, {
      cleanSession: true,
      keepAlive: 60,
      password: '',
      username: '',
    });
  });

  it('should reset MQTT client options', () => {
    let client;
    client = new MqttClient(clientId, host, port, clientConfig);
    client.resetOptions({ enableSslConfig: true });
    const hasKeepAlive = client.options.enableSslConfig;
    expect(hasKeepAlive).toBeTruthy();
  });

  describe('Retry Logic Tests', () => {
    let client;
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.clearAllTimers();
    });

    test('Should retry the connection with success when not connected', async () => {
      client = new MqttClient(clientId, host, port, {
        ...clientConfig,
        autoReconnect: true,
        retryCount: 3,
      });
      client.getConnectionStatus = jest.fn();
      client.resetOptions = jest.fn();
      client.handleReConnection();
      jest.runAllTimers();

      await expect(client.getConnectionStatus).toHaveBeenCalled();
      await expect(client.resetOptions).toHaveBeenCalled();
      await expect(MqttJSIModule.connectMqtt).toHaveBeenCalledWith(
        'test-client',
        { cleanSession: true, keepAlive: 60, password: '', username: '' }
      );
    });

    test('Should retry the connection with failure when not connected', async () => {
      client = new MqttClient(clientId, host, port, {
        ...clientConfig,
        autoReconnect: true,
        retryCount: 3,
      });
      client.connect = undefined;
      client.onReconnectIntercepter = undefined;
      client.getConnectionStatus = jest.fn();
      client.handleReConnection();
      jest.runAllTimers();

      await expect(client.getConnectionStatus).toHaveBeenCalled();
      expect(() => {
        client.onReconnectIntercepter();
      }).toThrow();
    });

    test('Should execute handleReConnection with failure when not connected', async () => {
      client = new MqttClient(clientId, host, port, {
        ...clientConfig,
        autoReconnect: true,
        retryCount: 3,
      });
      client.connection = undefined;
      client.onReconnectIntercepter = undefined;
      client.getConnectionStatus = jest.fn();
      client.handleReConnection();
      jest.runAllTimers();

      await expect(client.getConnectionStatus).toHaveBeenCalled();
      expect(() => {
        client.onReconnectIntercepter();
      }).toThrow();
    });
  });

  describe('MqttClient disconnect and remove', () => {
    let client;

    beforeEach(() => {
      client = new MqttClient('client1', 'localhost', 1883);
    });

    it('should disconnect MQTT client', () => {
      client.disconnect();
      expect(client.connectionStatus).toBe('disconnected');
      expect(MqttJSIModule.disconnectMqtt).toHaveBeenCalledWith('client1');
    });

    it('should remove MQTT client and its listeners', () => {
      client.remove();
      expect(MqttJSIModule.removeMqtt).toHaveBeenCalledWith('client1');
      expect(
        EventEmitter.getInstance().removeAllListeners
      ).toHaveBeenCalledTimes(4);
    });
  });

  it('should subscribe to a topic', () => {
    const topic = 'test-topic';
    const qos = 1;
    const onEvent = jest.fn();

    mqttClient = new MqttClient(clientId, host, port, clientConfig);
    const subscription = mqttClient.subscribe({ topic, qos, onEvent });
    subscription.remove();
    expect(MqttJSIModule.subscribeMqtt).toHaveBeenCalledWith(
      expect.any(String),
      clientId,
      topic,
      qos
    );
    expect(EventEmitter.getInstance().addListener).toHaveBeenCalledTimes(4);
    expect(subscription.remove).toBeDefined();
  });

  it('should get connection status', () => {
    mqttClient = new MqttClient(clientId, host, port, clientConfig);
    const status = mqttClient.getConnectionStatus();
    expect(status).toBe(CONNECTION_STATE.CONNECTED);
  });

  it('should get retry count', () => {
    mqttClient = new MqttClient(clientId, host, port, clientConfig);
    const status = mqttClient.getCurrentRetryCount();
    expect(status).toBe(0);
  });

  describe('MqttClient event handling', () => {
    let client;

    beforeEach(() => {
      client = new MqttClient('client1', 'localhost', 1883);
      jest.clearAllMocks();
    });

    test('setOnConnectCallback should register connection success event listener correctly', () => {
      const callback = jest.fn();
      const eventName = 'test-client' + MQTT_EVENTS.CONNECTED_EVENT;
      const result = mqttClient.setOnConnectCallback(callback);

      expect(EventEmitter.getInstance().addListener).toHaveBeenCalledWith(
        eventName,
        callback
      );
      expect(result.remove).toBeDefined();
    });

    test('setOnErrorCallback should register error event listener correctly', () => {
      const callback = jest.fn();
      const eventName = 'test-client' + MQTT_EVENTS.ERROR_EVENT;
      const result = mqttClient.setOnErrorCallback(callback);

      expect(EventEmitter.getInstance().addListener).toHaveBeenCalledWith(
        eventName,
        callback
      );
      expect(result.remove).toBeDefined();
    });

    it('should set a callback for disconnect event interception', () => {
      const callback = jest.fn();
      const result = client.onDisconnectInterceptor(callback);

      expect(callback).toHaveBeenCalled();
      expect(result.remove).toBeDefined();
    });
    it('should execute catch block for disconnect event interception', () => {
      client.onDisconnectInterceptor(() => {});
      expect(() => {
        client.onDisconnectInterceptor();
      }).toThrow();
    });

    it('should not try to connect if connection is not equal to connecting', () => {
      client.connectionStatus = CONNECTION_STATE.CONNECTED;
      const result = client.connection();
      expect(result).toBe(undefined);
    });

    it('should handle connection failure event', () => {
      client.disconnect();
      const mockCallback = jest.fn();

      const callback = client.setOnDisconnectCallback(mockCallback);
      expect(mockCallback).toHaveBeenCalled();
      expect(callback.remove).toBeDefined();
    });

    it('should execute setOnReconnectIntercepter', () => {
      const mockCallback = jest.fn();
      client.setOnReconnectIntercepter(mockCallback);
      expect(client.onReconnectIntercepter).toBe(mockCallback);
    });

    it('should handle connect failure event', () => {
      client.resetConnectVariables();
      const mockCallback = jest.fn();
      const callback = client.setOnConnectFailureCallback(mockCallback);
      expect(mockCallback).toHaveBeenCalled();
      expect(callback.remove).toBeDefined();
    });
  });
});
