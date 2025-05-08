package com.d11.rn.mqtt

import android.util.Log
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
        enableSslConfig:Boolean,
        emitJsiEvent: (eventId: String, payload: HashMap<String, Any>) -> Unit
    ) {
        executor.submit {
            if (!clientMap.containsKey(clientId)) {
                clientMap[clientId] = MqttHelper(clientId, host, port, enableSslConfig, emitJsiEvent)
            } else {
                Log.w("MqttManager", "client already exists for clientId: $clientId with host: $host, port: $port")
            }
        }
    }

    fun removeMqtt(clientId: String) {
        executor.submit {
            clientMap.remove(clientId)
        }
    }

    fun connectMqtt(
        clientId: String,
        options: MqttConnectOptions,
    ) {
        executor.submit {
            val client = clientMap[clientId]
            if (client != null) {
                client.connect(options)
            } else {
                Log.w("MqttManager", "unable to connect as the client for clientId: $clientId does not exist")
            }
        }
    }

    fun disconnectMqtt(clientId: String) {
        executor.submit {
            val client = clientMap[clientId]
            if (client != null) {
                client.disconnectMqtt()
            } else {
                Log.w("MqttManager", "unable to disconnect as the client for clientId: $clientId does not exist")
            }
        }
    }

    fun subscribeMqtt(id: String, clientId: String, topic: String, qos: Int) {
        executor.submit {
            val client = clientMap[clientId]
            if (client != null) {
                client.subscribeMqtt(id, topic, qos)
            } else {
                Log.w("MqttManager", "unable to subscribe as the client for clientId: $clientId does not exist")
            }
        }
    }

    fun unsubscribeMqtt(eventId: String, clientId: String, topic: String) {
        executor.submit {
            val client = clientMap[clientId]
            if (client != null) {
                client.unsubscribeMqtt(eventId, topic)
            } else {
                Log.w("MqttManager", "unable to unsubscribe as the client for clientId: $clientId does not exist")
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
