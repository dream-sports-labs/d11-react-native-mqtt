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
            if self.clientMap[clientId] == nil {
                self.clientMap[clientId] = MqttHelper(clientId, host: host, port: port, enableSslConfig: enableSslConfig, emitJsiEvent: emitJsiEvent)
            } else {
                // TODO: "MqttManager", "client already exists for clientId: $clientId with host: $host, port: $port"
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
            if let client = self.clientMap[clientId] {
                client.connectMqtt(clientId, options: MqttHelperOptions(options))
            } else {
                // TODO: "MqttManager", "unable to connect as the client for clientId: $clientId does not exist"
            }
        }
    }

    func disconnectMqtt(_ clientId: String) {
        executer.async {
            if let client = self.clientMap[clientId] {
                client.disconnectMqtt()
            } else {
                // TODO: "MqttManager", "unable to disconnect as the client for clientId: $clientId does not exist"
            }
        }
    }

    func subscribeMqtt(_ eventId: String, clientId: String, topic: String, qos: Int) {
        executer.async {
            if let client = self.clientMap[clientId] {
                client.subscribeMqtt(eventId, clientId: clientId, topic: topic, qos: qos)
            } else {
                // TODO: "MqttManager", "unable to subscribe as the client for clientId: $clientId does not exist"
            }
        }
    }

    func unsubscribeMqtt(_ eventId: String, clientId: String, topic: String) {
        executer.async {
            if let client = self.clientMap[clientId] {
                client.unsubscribeMqtt(eventId, clientId: clientId, topic: topic)
            } else {
                // TODO: "MqttManager", "unable to unsubscribe as the client for clientId: $clientId does not exist"
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
