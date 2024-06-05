//
//  MqttDelegate.swift
//  CocoaAsyncSocket
//
//  Created by Vibhor Verma on 31/10/23.
//

import Foundation

@objc public protocol MqttDelegate {
    func createMqtt(_ clientId: String, host: String, port: Int, enableSslConfig:Bool)
    func removeMqtt(_ clientId: String)
    func connectMqtt(_ clientId: String, options: [String: Any])
    func disconnectMqtt(_ clientId: String)
    func subscribeMqtt(_ eventId: String, clientId: String, topic: String, qos: Int)
    func unsubscribeMqtt(_ eventId: String, clientId: String, topic: String)
    func getConnectionStatusMqtt(_ clientId: String) -> String
}
