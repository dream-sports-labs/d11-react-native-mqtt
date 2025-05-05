//
//  MqttHelper.swift
//  CocoaAsyncSocket
//
//  Created by Vibhor Verma on 31/10/23.
//

// import Foundation

import Foundation
import CocoaMQTT

class MqttHelper {
    private let emitJsiEvent: (_ event: String, _ params: [String : Any]?) -> Void
    private let mqtt: CocoaMQTT5
    private let clientId: String
    private var subscriptionMap = [String: [String: Subscription]]()
    
    private let CONNECTED_EVENT = "connected"
    private let CLIENT_INITIALIZE_EVENT = "client_initialize"
    private let DISCONNECTED_EVENT = "disconnected"
    private let SUBSCRIBE_SUCCESS = "subscribe_success"
    private let SUBSCRIBE_FAILED = "subscribe_failed"
    private let ERROR_EVENT = "mqtt_error"

    private let CONNECTED = "connected"
    private let CONNECTING = "connecting"
    private let DISCONNECTED = "disconnected"

    // Error Reason Codes
    private let DEFAULT_ERROR = -1
    private let CONNECTION_ERROR = -2
    private let DISCONNECTION_ERROR = -3
    private let SUBSCRIPTION_ERROR = -4
    private let UNSUBSCRIPTION_ERROR = -5
    private let INITIALIZATION_ERROR = -6
    private let RX_CHAIN_ERROR = -7

    init(_ clientId: String, host: String, port: Int, enableSslConfig: Bool, emitJsiEvent: @escaping (_ event: String, _ params: [String : Any]?) -> Void) {
        self.emitJsiEvent = emitJsiEvent
        self.clientId = clientId
        mqtt = CocoaMQTT5(clientID: clientId, host: host, port: UInt16(port))
        mqtt.delegate = self
        mqtt.enableSSL = enableSslConfig

        if mqtt.clientID == clientId && mqtt.host == host && mqtt.port == UInt16(port) {
            emitJsiEvent(clientId + CLIENT_INITIALIZE_EVENT, ["clientInit": true])
        } else {
            emitJsiEvent(clientId + ERROR_EVENT, [
                "clientInit": false,
                "errorMessage": "Failed to initialize MQTT client",
                "errorType": "INITIALIZATION",
                "reasonCode": INITIALIZATION_ERROR
            ])
        }
    }

    func connectMqtt(_ clientId: String, options: MqttHelperOptions) {
        let connectProperties = MqttConnectProperties()
        connectProperties.topicAliasMaximum = 0
        connectProperties.sessionExpiryInterval = 0
        connectProperties.receiveMaximum = 100
        connectProperties.maximumPacketSize = 1024*1024
        mqtt.connectProperties = connectProperties

        mqtt.username = options.username
        mqtt.password = options.password
        mqtt.keepAlive = options.keepAlive
        mqtt.cleanSession = options.cleanSession

        _ = mqtt.connect()
    }

    func disconnectMqtt() {
        mqtt.disconnect()
    }

    func subscribeMqtt(_ eventId: String, clientId: String, topic: String, qos: Int) {
        let subscription = Subscription(qos: qos)
        if subscriptionMap[topic] != nil {
            subscriptionMap[topic]?[eventId] = subscription
        } else {
            subscriptionMap[topic] = [eventId:subscription]
        }
        if mqtt.connState == .connected {
            let qosEnum = CocoaMQTTQoS(rawValue: UInt8(qos)) ?? .qos0
            let mqttSubscribe = MqttSubscription(topic: topic, qos: qosEnum)
            mqttSubscribe.retainHandling = CocoaRetainHandlingOption.sendOnSubscribe
            mqtt.subscribe([mqttSubscribe])
        }
    }

    func unsubscribeMqtt(_ eventId: String, clientId: String, topic: String) {
        if subscriptionMap[topic] == nil {
            return
        }
        if let length = subscriptionMap[topic]?.count, length > 1 {
            subscriptionMap[topic]?.removeValue(forKey: eventId)
        } else {
            mqtt.unsubscribe(topic)
            subscriptionMap.removeValue(forKey: topic)
        }
    }

    func getConnectionStatusMqtt() -> String {
        switch(mqtt.connState) {
            case .disconnected:
                return DISCONNECTED
            case .connecting:
                return CONNECTING
            case .connected:
                return CONNECTED
        }
    }
}

extension MqttHelper: CocoaMQTT5Delegate {
    func mqtt5(_ mqtt5: CocoaMQTT5, didConnectAck ack: CocoaMQTTCONNACKReasonCode, connAckData: MqttDecodeConnAck?) {
        if (ack != .success) {
            emitJsiEvent(clientId + DISCONNECTED_EVENT, ["reasonCode": ack.rawValue])
            return
        }

        emitJsiEvent(clientId + CONNECTED_EVENT, ["reasonCode": ack.rawValue])

        for (topic, idSubscriptionMap) in subscriptionMap {
            if let maxQos = idSubscriptionMap.values.max(by: { $0.qos < $1.qos })?.qos {
                let qosEnum = CocoaMQTTQoS(rawValue: UInt8(maxQos)) ?? .qos0
                let mqttSubscribe = MqttSubscription(topic: topic, qos: qosEnum)
                mqttSubscribe.retainHandling = CocoaRetainHandlingOption.sendOnSubscribe
                mqtt5.subscribe([mqttSubscribe])
            }
        }
    }

    func mqtt5(_ mqtt5: CocoaMQTT5, didPublishMessage message: CocoaMQTT5Message, id: UInt16) {
    }

    func mqtt5(_ mqtt5: CocoaMQTT5, didPublishAck id: UInt16, pubAckData: MqttDecodePubAck?) {
    }

    func mqtt5(_ mqtt5: CocoaMQTT5, didPublishRec id: UInt16, pubRecData: MqttDecodePubRec?) {
    }

    func mqtt5(_ mqtt5: CocoaMQTT5, didReceiveMessage message: CocoaMQTT5Message, id: UInt16, publishData: MqttDecodePublish?) {
        if let allSubscriptionsForTopic = subscriptionMap[message.topic] {
            for eventId in allSubscriptionsForTopic.keys {
                emitJsiEvent(eventId, ["payload": message.string ?? "", "topic": message.topic, "qos": message.qos.rawValue])
                print("message ", message.string ?? "")
            }
        }
    }

    func mqtt5(_ mqtt5: CocoaMQTT5, didSubscribeTopics success: NSDictionary, failed: [String], subAckData: MqttDecodeSubAck?) {
        // Handle successful subscriptions
        for (topic, qos) in success {
            if let topic = topic as? String, let qosValue = qos as? NSNumber, let allSubscriptionsForTopic = subscriptionMap[topic] {
              for eventId in allSubscriptionsForTopic.keys {
                emitJsiEvent(eventId + SUBSCRIBE_SUCCESS, ["message": "", "qos": qosValue.intValue, "topic": topic]) // TODO: get actual error message
              }
            }
        }
    
        // Handle failed subscriptions
        for topic in failed {
            if let allSubscriptionsForTopic = subscriptionMap[topic] {
                for eventId in allSubscriptionsForTopic.keys {
                    emitJsiEvent(eventId + SUBSCRIBE_FAILED, [
                        "errorMessage": "Failed to subscribe to topic: \(topic)",
                        "topic": topic,
                        "reasonCode": SUBSCRIPTION_ERROR
                    ])
                }
            }
        }
    }

    func mqtt5(_ mqtt5: CocoaMQTT5, didUnsubscribeTopics topics: [String], UnsubAckData: MqttDecodeUnsubAck?) {
    }

    func mqtt5(_ mqtt5: CocoaMQTT5, didReceiveDisconnectReasonCode reasonCode: CocoaMQTTDISCONNECTReasonCode) {
    }

    func mqtt5(_ mqtt5: CocoaMQTT5, didReceiveAuthReasonCode reasonCode: CocoaMQTTAUTHReasonCode) {
    }

    func mqtt5DidPing(_ mqtt5: CocoaMQTT5) {
    }

    func mqtt5DidReceivePong(_ mqtt5: CocoaMQTT5) {
    }

    func mqtt5DidDisconnect(_ mqtt5: CocoaMQTT5, withError err: Error?) {
        let reasonCode = DISCONNECTION_ERROR
        var errorMessage = ""
      
        if let error = err {
            errorMessage = error.localizedDescription
        }
        
        let params: [String: Any] = [
            "reasonCode": reasonCode,
            "errorMessage": errorMessage
        ]
        emitJsiEvent(clientId + DISCONNECTED_EVENT, params)
    }
}

struct Subscription {
    var qos: Int
}
