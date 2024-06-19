package com.d11.rn.mqtt

import android.util.Log
import com.facebook.react.bridge.WritableMap
import java.util.concurrent.Callable
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

object MqttManager {

    private val clientMap: HashMap<String, MqttHelper> = HashMap()
    private val executor: ExecutorService = Executors.newSingleThreadExecutor()

    fun createMqtt(
    clientId: String,
    host: String,
    port: Int,
    enableSslConfig: Boolean,
    emitJsiEvent: (eventId: String, payload: WritableMap) -> Unit
) {
    executor.submit {
        try {
            if (!clientMap.containsKey(clientId)) {
                clientMap[clientId] = MqttHelper(clientId, host, port, enableSslConfig, emitJsiEvent)
            } else {
                Log.w("MqttManager", "client already exists for clientId: $clientId with host: $host, port: $port")
            }
        } catch (e: Exception) {
            Log.w("MqttManager", "Error creating MQTT client: ${e.message}")
        }
    }
}

fun removeMqtt(clientId: String) {
    executor.submit {
        try {
            clientMap.remove(clientId)
        } catch (e: Exception) {
            Log.w("MqttManager", "Error removing MQTT client: ${e.message}")
        }
    }
}

fun connectMqtt(
    clientId: String,
    options: MqttConnectOptions,
) {
    executor.submit {
        try {
            val client = clientMap[clientId]
            if (client != null) {
                client.connect(options)
            } else {
                Log.w("MqttManager", "unable to connect as the client for clientId: $clientId does not exist")
            }
        } catch (e: Exception) {
            Log.w("MqttManager", "Error connecting MQTT client: ${e.message}")
        }
    }
}

fun disconnectMqtt(clientId: String) {
    executor.submit {
        try {
            val client = clientMap[clientId]
            if (client != null) {
                client.disconnectMqtt()
            } else {
                Log.w("MqttManager", "unable to disconnect as the client for clientId: $clientId does not exist")
            }
        } catch (e: Exception) {
            Log.w("MqttManager", "Error disconnecting MQTT client: ${e.message}")
        }
    }
}

fun subscribeMqtt(id: String, clientId: String, topic: String, qos: Int) {
    executor.submit {
        try {
            val client = clientMap[clientId]
            if (client != null) {
                client.subscribeMqtt(id, topic, qos)
            } else {
                Log.w("MqttManager", "unable to subscribe as the client for clientId: $clientId does not exist")
            }
        } catch (e: Exception) {
            Log.w("MqttManager", "Error subscribing MQTT client: ${e.message}")
        }
    }
}

fun unsubscribeMqtt(eventId: String, clientId: String, topic: String) {
    executor.submit {
        try {
            val client = clientMap[clientId]
            if (client != null) {
                client.unsubscribeMqtt(eventId, topic)
            } else {
                Log.w("MqttManager", "unable to unsubscribe as the client for clientId: $clientId does not exist")
            }
        } catch (e: Exception) {
            Log.w("MqttManager", "Error unsubscribing MQTT client: ${e.message}")
        }
    }
}

    fun getConnectionStatusMqtt(clientId: String): String {
        return try {
            executor.submit(Callable {
                clientMap[clientId]?.getConnectionStatusMqtt() ?: "disconnected"
            }).get()
        } catch (e: Exception) {
            "disconnected"
        }
    }
}
