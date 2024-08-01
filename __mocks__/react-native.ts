const NativeModules = {
  MqttModule: {
    installJSIModule: jest.fn((shouldReturnTrue = true) => {
      return shouldReturnTrue;
    }),
    createMqtt: jest.fn(),
  },
};

const mockedMqttClass = jest.fn();

class NativeEventEmitter {
  constructor(name) {
    mockedMqttClass(name);
  }
}

export { NativeModules, NativeEventEmitter, mockedMqttClass };
