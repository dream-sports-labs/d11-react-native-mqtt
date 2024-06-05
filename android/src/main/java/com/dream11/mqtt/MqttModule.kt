package com.d11.rn.mqtt

import java.io.Serializable

interface MqttModule {
  fun createMqtt(clientId: String, host: String, port: Integer, enableSslConfig: java.lang.Boolean)
  fun removeMqtt(clientId: String)
  fun connectMqtt(clientId: String, options: HashMap<String, Serializable>)
  fun disconnectMqtt(clientId: String)
  fun subscribeMqtt(eventId: String, clientId: String, topic: String, qos: Integer)
  fun unsubscribeMqtt(eventId: String, clientId: String, topic: String)
  fun getConnectionStatusMqtt(clientId: String): String
}
