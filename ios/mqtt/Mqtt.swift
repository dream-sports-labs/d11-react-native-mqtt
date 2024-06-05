//
//  Mqtt.swift
//  CocoaAsyncSocket
//
//  Created by Vibhor Verma on 31/10/23.
//

@objc
public class Mqtt: NSObject, MqttDelegate {
    @objc
    public static let shared = Mqtt()
    
    var emitterModule = MqttEventEmitter()
    
    private override init() {
        super.init()
    }
    
    func triggerNativeEventEmitter(_ event: String, params: [String: Any]?) {
        emitterModule.sendEvent(event, param: params)
    }

    @objc
    public func createMqtt(_ clientId: String, host: String, port: Int, enableSslConfig: Bool) {
        MqttManager.shared.createMqtt(clientId, host: host, port: port, enableSslConfig:enableSslConfig, emitJsiEvent: triggerNativeEventEmitter)
        print("CREATE MQTT CALLED with ",enableSslConfig)
    }
    
    @objc
    public func removeMqtt(_ clientId: String) {
        MqttManager.shared.removeMqtt(clientId)
    }

    @objc
    public func connectMqtt(_ clientId: String, options: [String: Any]) {
        MqttManager.shared.connectMqtt(clientId, options: options)
        print("connectMqtt MQTT CALLED")
    }

    @objc
    public func disconnectMqtt(_ clientId: String) {
        MqttManager.shared.disconnectMqtt(clientId)
        print("disconnectMqtt MQTT CALLED")
    }

    @objc
    public func subscribeMqtt(_ eventId: String, clientId: String, topic: String, qos: Int) {
        MqttManager.shared.subscribeMqtt(eventId, clientId: clientId, topic: topic, qos: qos)
        print("subscribeMqtt MQTT CALLED")
    }

    @objc
    public func unsubscribeMqtt(_ eventId: String, clientId: String, topic: String) {
        MqttManager.shared.unsubscribeMqtt(eventId, clientId: clientId, topic: topic)
    }
    
    @objc
    public func getConnectionStatusMqtt(_ clientId: String) -> String {
        return MqttManager.shared.getConnectionStatusMqtt(clientId)
        print("getConnectionStatusMqtt MQTT CALLED")
    }
}
