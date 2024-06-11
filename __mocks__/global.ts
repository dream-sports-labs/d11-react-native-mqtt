import { jest } from '@jest/globals';
import { MqttModuleProxy } from '../src/Modules/mqttModule';

declare global {
  var __MqttModuleProxy: MqttModuleProxy;
}

const MockMqttModule = {
  createMqtt: jest.fn(),
  removeMqtt: jest.fn(),
  connectMqtt: jest.fn(),
  disconnectMqtt: jest.fn(),
  subscribeMqtt: jest.fn(),
  unsubscribeMqtt: jest.fn(),
  getConnectionStatusMqtt: jest.fn(() => 'disconnected'),
};

global.__MqttModuleProxy = {
  ...MockMqttModule,
};

export { MockMqttModule };
