package com.d11.rn.mqtt

import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.hivemq.client.mqtt.MqttClientState
import com.hivemq.client.mqtt.datatypes.MqttQos
import com.hivemq.client.mqtt.mqtt5.Mqtt5Client
import com.hivemq.client.mqtt.mqtt5.Mqtt5RxClient
import com.hivemq.client.mqtt.mqtt5.exceptions.Mqtt5ConnAckException
import com.hivemq.client.mqtt.mqtt5.exceptions.Mqtt5DisconnectException
import io.reactivex.Observer
import io.reactivex.disposables.Disposable

class MqttHelper(
    private val clientId: String,
    host: String,
    port: Int,
    enableSslConfig: Boolean,
    private val emitJsiEvent: (eventId: String, payload: WritableMap) -> Unit
) {
    private val mqtt: Mqtt5RxClient
    private val subscriptionMap: HashMap<String, HashMap<String, Subscription>> = HashMap()

    companion object {
        const val CONNECTED_EVENT = "connected"
        const val DISCONNECTED_EVENT = "disconnected"
        const val SUBSCRIBE_SUCCESS = "subscribe_success"
        const val SUBSCRIBE_FAILED = "subscribe_failed"

        const val CONNECTED = "connected"
        const val CONNECTING = "connecting"
        const val DISCONNECTED = "disconnected"
    }

    init {
      Log.d("MQTT init", "clientid " + clientId + "host "+ host + "port "+ port)
        val client = Mqtt5Client.builder()
            .identifier(clientId)
            .addDisconnectedListener { disconnectedContext ->
                val connPayload = try {
                    (disconnectedContext.cause as Mqtt5ConnAckException?)?.mqttMessage?.reasonCode?.code
                } catch (e: Exception) {
                    null
                }

                val disconnectPayload = try {
                    (disconnectedContext.cause as Mqtt5DisconnectException).mqttMessage.reasonCode.code
                } catch (e: Exception) {
                    null
                }
                val params = Arguments.createMap().apply {
                    putInt("reasonCode", connPayload ?: disconnectPayload ?: -1)
                }
                emitJsiEvent(clientId + DISCONNECTED_EVENT, params)
            }
            .addConnectedListener {
                val params = Arguments.createMap().apply {
                    putInt("reasonCode", 0)
                }
                emitJsiEvent(clientId + CONNECTED_EVENT, params)
            }
            .serverHost(host)
            .serverPort(port)

      mqtt = if(enableSslConfig) {
        client
          .sslWithDefaultConfig()
          .buildRx()
      } else {
        client
          .buildRx()
      }
    }

    fun connect(options: MqttConnectOptions) {
      Log.d("MQTT Connect called", "username " + options.username)
         val disposable: Disposable = mqtt.connectWith()
            .keepAlive(options.keepAlive)
            .cleanStart(options.cleanSession)
            .simpleAuth()
            .username(options.username)
            .password(options.password)
            .applySimpleAuth()
            .applyConnect()
            .doOnSuccess { ack ->
                Log.d("MQTT Connect", "" + ack.reasonString)
                for ((topic, eventIdMap) in subscriptionMap) {
                    for ((eventId, subscription) in eventIdMap) {
                        subscription.disposable.dispose()
                        subscribeMqtt(eventId, topic, subscription.qos)
                    }
                }
            }
            .doOnError { error ->
                Log.e("MQTT Connect", "" + error.message + ":" + error.cause)
            }
            .subscribe( {},
              { throwable ->
                // This is the error handler in the subscribe method.
                // It will be called if an error occurs in the observable chain.
                Log.e("RxJava", "Error occurred in subscribe: ${throwable.message}")
              })

    }

    fun disconnectMqtt() {
        val disposable: Disposable =  mqtt.disconnect()
            .doOnComplete {
                Log.d("MQTT Disconnect", "doOnComplete") // TODO: Replace with LogWrapper when available on bridge
            }
            .doOnError { error ->
                Log.e("MQTT Disconnect", "" + error.message) // TODO: Replace with LogWrapper when available on bridge

                /**
                 * Will be triggered when disconnection failed. Ideally this can happen when connection is already disconnected.
                 */
                val params = Arguments.createMap().apply {
                    putInt("reasonCode", -1)
                }
                emitJsiEvent(clientId + DISCONNECTED_EVENT, params)
            }
            .subscribe( {},
              { throwable ->
                // This is the error handler in the subscribe method.
                // It will be called if an error occurs in the observable chain.
                Log.e("RxJava", "Error occurred in subscribe: ${throwable.message}")
              })
    }

    fun subscribeMqtt(eventId: String, topic: String, qos: Int) {
        val disposable: Disposable = mqtt.subscribePublishesWith()
            .topicFilter(topic)
            .qos(MqttQos.fromCode(qos) ?: MqttQos.AT_MOST_ONCE)
            .applySubscribe()
            .doOnSingle { subAck ->
                Log.e("MQTT Subscribe", "" + subAck.reasonString)

                val params = Arguments.createMap().apply {
                    putString("message", subAck.reasonString.toString())
                    putString("topic", topic) // TODO: get from mqtt client
                    putInt("qos", qos) // TODO: get from response
                }
                emitJsiEvent(eventId + SUBSCRIBE_SUCCESS, params)
            }
            .doOnNext { publish ->
                val params = Arguments.createMap().apply {
                    putString("payload", String(publish.payloadAsBytes))
                    putString("topic", publish.topic.toString())
                    putInt("qos", publish.qos.code)
                }
                emitJsiEvent(eventId, params)
            }
            .doOnError { error ->
                Log.e("MQTT Subscribe", "" + error.message) // TODO: Replace with LogWrapper when available on bridge

                val params = Arguments.createMap().apply {
                    putString("errorMessage", error.message.toString())
                }
                emitJsiEvent(eventId + SUBSCRIBE_FAILED, params)
            }
            .subscribe( {},
              { throwable ->
                // This is the error handler in the subscribe method.
                // It will be called if an error occurs in the observable chain.
                Log.e("RxJava", "Error occurred in subscribe: ${throwable.message}")
              })

        if (!subscriptionMap.containsKey(topic)) {
            subscriptionMap[topic] = HashMap()
        }
        subscriptionMap[topic]?.set(eventId, Subscription(disposable, qos))
    }

    fun unsubscribeMqtt(eventId: String, topic: String) {
        val allSubscriptions = subscriptionMap[topic]
        if (allSubscriptions == null) {
            Log.e("MQTT Unsubscribe", "unable to unsubscribe topic: $topic")
            return
        }
        allSubscriptions[eventId]?.disposable?.dispose()
        if (allSubscriptions.size > 1) {
            allSubscriptions.remove(eventId)
        } else {
            val disposable: Disposable = mqtt.unsubscribeWith()
                .addTopicFilter(topic)
                .applyUnsubscribe()
                .doOnSuccess {  unsubAck ->
                    // TODO: Replace with LogWrapper when available on bridge
                    Log.e("MQTT Unsubscribe", "" + unsubAck.reasonString)
                }
                .doOnError { error ->
                    // TODO: Replace with LogWrapper when available on bridge
                    Log.e("MQTT Unsubscribe", "" + error.message)
                }
                .subscribe( {},
                  { throwable ->
                    // This is the error handler in the subscribe method.
                    // It will be called if an error occurs in the observable chain.
                    Log.e("RxJava", "Error occurred in subscribe: ${throwable.message}")
                  })
            subscriptionMap.remove(topic)
        }
    }

    fun getConnectionStatusMqtt(): String {
        return when(mqtt.state) {
            MqttClientState.CONNECTED -> {CONNECTED}
            MqttClientState.DISCONNECTED -> {DISCONNECTED}
            MqttClientState.CONNECTING -> {CONNECTING}
            MqttClientState.DISCONNECTED_RECONNECT -> {DISCONNECTED}
            MqttClientState.CONNECTING_RECONNECT -> {CONNECTING}
        }
    }
}

data class Subscription(
    val disposable: Disposable,
    val qos: Int
)

