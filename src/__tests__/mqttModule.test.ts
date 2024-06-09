import { NativeModules } from '../../__mocks__/react-native';
import { MqttModuleProxy } from '../Modules/mqttModule';

describe('MqttModule', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should log installation status installJSIModule', () => {
    NativeModules.MqttModule.installJSIModule(false);
    global.__MqttModuleProxy = undefined as unknown as MqttModuleProxy;
    console.log = jest.fn();
    require('../Modules/mqttModule');
    expect(console.log).toHaveBeenCalledWith(
      '::MQTT : JSI bindings installation status',
      true
    );
  });
});
