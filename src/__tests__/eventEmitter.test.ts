import {
  mockedMqttClass,
  NativeEventEmitter,
} from '../../__mocks__/react-native';
import { MqttModule } from '../Modules/mqttModule';
import { EventEmitter } from '../Mqtt/EventEmitter';

describe('EventEmitter', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should create a new EventEmitter instance', () => {
    const instance = EventEmitter.getInstance();
    expect(instance).toBeInstanceOf(NativeEventEmitter);
    expect(mockedMqttClass).toHaveBeenCalledWith(MqttModule);
  });

  it('should always return the same instance for multiple calls', () => {
    const firstInstance = EventEmitter.getInstance();
    const secondInstance = EventEmitter.getInstance();
    expect(secondInstance).toBe(firstInstance);
  });
});
