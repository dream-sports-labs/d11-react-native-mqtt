const NativeModules = {
  MqttModule: {
    installJSIModule: jest.fn((shouldReturnTrue = true) => {
      return shouldReturnTrue;
    }),
  },
};

const mockedMqttClass = jest.fn();

class NativeEventEmitter {
  constructor(name) {
    mockedMqttClass(name);
  }
}

export { NativeModules, NativeEventEmitter, mockedMqttClass };
