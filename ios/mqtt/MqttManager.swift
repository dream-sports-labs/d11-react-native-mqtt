//
//  MqttManager.swift
//  CocoaAsyncSocket
//
//  Created by Vibhor Verma on 31/10/23.
//

import Foundation

class MqttManager {
    static let shared = MqttManager() // Singleton instance
    var clientMap = [String: MqttHelper]()
    let executer = DispatchQueue(label: "com.mqtt.thread")

    private init() {
    }

    func createMqtt(_ clientId: String, host: String, port: Int, enableSslConfig: Bool, emitJsiEvent: @escaping (_ event: String, _ params: [String : Any]?) -> Void) {
        executer.async {
            do {
                if self.clientMap[clientId] == nil {
                    self.clientMap[clientId] = try MqttHelper(clientId, host: host, port: port, enableSslConfig: enableSslConfig, emitJsiEvent: emitJsiEvent)
                } else {
                    print("MqttManager: client already exists for clientId: \(clientId) with host: \(host), port: \(port)")
                }
            } catch {
                print("MqttManager: Failed to create MQTT client for clientId: \(clientId), error: \(error)")
            }
        }
    }

    func removeMqtt(_ clientId: String) {
        executer.async {
            self.clientMap.removeValue(forKey: clientId)
        }
    }

    func connectMqtt(_ clientId: String, options: [String: Any]) {
        executer.async {
            do {
                if let client = self.clientMap[clientId] {
                    try client.connectMqtt(clientId, options: MqttHelperOptions(options))
                } else {
                    print("MqttManager: unable to connect as the client for clientId: \(clientId) does not exist")
                }
            } catch {
                print("MqttManager: Failed to connect MQTT client for clientId: \(clientId), error: \(error)")
            }
        }
    }

    func disconnectMqtt(_ clientId: String) {
        executer.async {
            do {
                if let client = self.clientMap[clientId] {
                    try client.disconnectMqtt()
                } else {
                    // TODO: Log "MqttManager: unable to disconnect as the client for clientId: \(clientId) does not exist")
                }
            } catch {
                print("MqttManager: Failed to disconnect MQTT client for clientId: \(clientId), error: \(error)")
            }
        }
    }

    func subscribeMqtt(_ eventId: String, clientId: String, topic: String, qos: Int) {
        executer.async {
            do {
                if let client = self.clientMap[clientId] {
                    try client.subscribeMqtt(eventId, clientId: clientId, topic: topic, qos: qos)
                } else {
                    // TODO: Log "MqttManager: unable to subscribe as the client for clientId: \(clientId) does not exist"
                }
            } catch {
                // Log error message
                print("MqttManager: Failed to subscribe MQTT client for clientId: \(clientId), error: \(error)")
            }
        }
    }

    func unsubscribeMqtt(_ eventId: String, clientId: String, topic: String) {
        executer.async {
            do {
                if let client = self.clientMap[clientId] {
                    try client.unsubscribeMqtt(eventId, clientId: clientId, topic: topic)
                } else {
                    // TODO: Log "MqttManager: unable to unsubscribe as the client for clientId: \(clientId) does not exist"
                }
            } catch {
                // Log error message
                print("MqttManager: Failed to unsubscribe MQTT client for clientId: \(clientId), error: \(error)")
            }
        }
    }

    func getConnectionStatusMqtt(_ clientId: String) -> String {
        return executer.sync {
            if let client = clientMap[clientId] {
                return client.getConnectionStatusMqtt()
            } else {
                return "disconnected"
            }
        }
    }
}
