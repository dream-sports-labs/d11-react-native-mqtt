import '../__mocks__/global';

jest.mock('child_process', () => ({
  execSync: jest.fn(() => Buffer.from('')),
}));

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();

  global.__MqttModuleProxy = {
    createMqtt: jest.fn(),
    removeMqtt: jest.fn(),
    connectMqtt: jest.fn(),
    disconnectMqtt: jest.fn(),
    subscribeMqtt: jest.fn(),
    unsubscribeMqtt: jest.fn(),
    getConnectionStatusMqtt: jest.fn(() => 'disconnected'),
  };
});
