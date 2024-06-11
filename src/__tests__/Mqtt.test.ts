import { MockMqttModule } from '../../__mocks__/global';
import { createMqttClient } from '../Mqtt/Mqtt';

jest.mock('../Mqtt/EventEmitter.ts', () => {
  const remove = jest.fn();
  const mEventEmitter = {
    getInstance: jest.fn(),
    addListener: jest.fn((value, callback) => {
      callback({ reasonCode: 100 });
      return { remove };
    }),
    removeAllListeners: jest.fn(),
  };
  mEventEmitter.getInstance.mockReturnValue(mEventEmitter);
  return { EventEmitter: mEventEmitter };
});

describe('createMqttClient', () => {
  it('should correctly instantiate MqttClient with provided config', () => {
    const config = {
      clientId: 'client1',
      host: 'example.com',
      port: 1883,
      options: { keepAlive: 60 },
    };
    createMqttClient(config);

    expect(MockMqttModule.createMqtt).toHaveBeenCalledWith(
      config.clientId,
      config.host,
      config.port,
      false
    );
  });

  it('should correctly instantiate MqttClient with provided config with auto-reconnect', () => {
    const config = {
      clientId: 'client1',
      host: 'example.com',
      port: 1883,
      options: { keepAlive: 60, autoReconnect: true },
    };
    createMqttClient(config);

    expect(MockMqttModule.createMqtt).toHaveBeenCalledWith(
      config.clientId,
      config.host,
      config.port,
      false
    );
  });
});
