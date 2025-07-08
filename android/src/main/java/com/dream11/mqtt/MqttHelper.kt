package com.d11.rn.mqtt

import android.util.Log
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
  private val emitJsiEvent: (eventId: String, payload: HashMap<String, Any>) -> Unit
) {
  private lateinit var mqtt: Mqtt5RxClient
  private val subscriptionMap: HashMap<String, HashMap<String, Subscription>> = HashMap()

  companion object {
    const val CLIENT_INITIALIZE_EVENT = "client_initialize"
    const val CONNECTED_EVENT = "connected"
    const val DISCONNECTED_EVENT = "disconnected"
    const val SUBSCRIBE_SUCCESS = "subscribe_success"
    const val SUBSCRIBE_FAILED = "subscribe_failed"
    const val ERROR_EVENT = "mqtt_error"

    const val CONNECTED = "connected"
    const val CONNECTING = "connecting"
    const val DISCONNECTED = "disconnected"

    // Error Reason Codes
    const val DEFAULT_ERROR = -1
    const val CONNECTION_ERROR = -2
    const val DISCONNECTION_ERROR = -3
    const val SUBSCRIPTION_ERROR = -4
    const val UNSUBSCRIPTION_ERROR = -5
    const val INITIALIZATION_ERROR = -6
    const val RX_CHAIN_ERROR = -7
  }

  init {
    Log.d("MQTT init", "clientid " + clientId + "host " + host + "port " + port)
    try {
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

          var errorMessage = ""
          val params = HashMap<String, Any>().apply {
            put("reasonCode", connPayload ?: disconnectPayload ?: DISCONNECTION_ERROR)
            errorMessage = try {
              disconnectedContext.cause.message ?: "Unknown error"
            } catch (e: Exception) {
              e.message.toString();
            }
            put("errorMessage", errorMessage)
          }
          emitJsiEvent(clientId + DISCONNECTED_EVENT, params)
        }
        .addConnectedListener {
          val params = HashMap<String, Any>().apply {
            put("reasonCode", 0)
          }
          emitJsiEvent(clientId + CONNECTED_EVENT, params)
        }
        .serverHost(host)
        .serverPort(port)

      mqtt = if (enableSslConfig) {
        client
          .sslWithDefaultConfig()
          .buildRx()
      } else {
        client
          .buildRx()
      }

      if (this::mqtt.isInitialized) {
        val params = HashMap<String, Any>().apply {
          put("clientInit", true)
        }
        emitJsiEvent(clientId + CLIENT_INITIALIZE_EVENT, params)
      }
    } catch (e: Exception) {
      Log.e("MQTT init", "Initialization failed: ${e.message}")
      val params = HashMap<String, Any>().apply {
        put("clientInit", false)
        put("errorMessage", e.message.toString())
        put("errorType", "INITIALIZATION")
        put("reasonCode", INITIALIZATION_ERROR)
      }
      emitJsiEvent(clientId + ERROR_EVENT, params)
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
        Log.d("MQTT Connect", " onSuccess " + ack.reasonString)
        for ((topic, eventIdMap) in subscriptionMap) {
          for ((eventId, subscription) in eventIdMap) {
            subscription.disposable.dispose()
            subscribeMqtt(eventId, topic, subscription.qos)
          }
        }
      }
      .doOnError { error ->
        Log.e("MQTT Connect", " onError " + error.message + ":" + error.cause)
        val params = HashMap<String, Any>().apply {
          put("clientConnected", false)
          put("errorMessage", error.message.toString())
          put("errorCause", error.cause.toString())
          put("errorType", "CONNECTION")
          put("reasonCode", CONNECTION_ERROR)
        }
        emitJsiEvent(clientId + ERROR_EVENT, params)
      }
      .subscribe(
        {},
        { throwable ->
          // This is the error handler in the subscribe method.
          // It will be called if an error occurs in the observable chain.
          Log.e("RxJava", "Error occurred in subscribe: ${throwable.message}")
        })

  }

  fun disconnectMqtt() {
    val disposable: Disposable = mqtt.disconnect()
      .doOnComplete {
        Log.d(
          "MQTT Disconnect",
          "doOnComplete"
        ) // TODO: Replace with LogWrapper when available on bridge
      }
      .doOnError { error ->
        Log.e(
          "MQTT Disconnect",
          "" + error.message
        ) // TODO: Replace with LogWrapper when available on bridge

        /**
         * Will be triggered when disconnection failed. Ideally this can happen when connection is already disconnected.
         */
        val params = HashMap<String, Any>().apply {
          put("clientDisconnected", false)
          put("errorMessage", error.message.toString())
          put("reasonCode", DISCONNECTION_ERROR)
        }
        emitJsiEvent(clientId + DISCONNECTED_EVENT, params)
      }
      .subscribe(
        {},
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

        val params = HashMap<String, Any>().apply {
          put("message", subAck.reasonString.toString())
          put("topic", topic)
          put("qos", (MqttQos.fromCode(qos) ?: MqttQos.AT_MOST_ONCE).code)
        }
        emitJsiEvent(eventId + SUBSCRIBE_SUCCESS, params)
      }
      .doOnNext { publish ->
        val params = HashMap<String, Any>().apply {
          put("payload", String(publish.payloadAsBytes))
          put("topic", publish.topic.toString())
          put("qos", publish.qos.code)
        }
        emitJsiEvent(eventId, params)
      }
      .doOnError { error ->
        Log.e(
          "MQTT Subscribe",
          "" + error.message
        ) // TODO: Replace with LogWrapper when available on bridge
        val params = HashMap<String, Any>().apply {
          put("clientSubscribed", false)
          put("errorMessage", error.message.toString())
          put("reasonCode", SUBSCRIPTION_ERROR)
        }
        emitJsiEvent(eventId + SUBSCRIBE_FAILED, params)
      }
      .subscribe(
        {},
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
        .doOnSuccess { unsubAck ->
          // TODO: Replace with LogWrapper when available on bridge
          Log.e("MQTT Unsubscribe", "" + unsubAck.reasonString)
        }
        .doOnError { error ->
          // TODO: Replace with LogWrapper when available on bridge
          Log.e("MQTT Unsubscribe", "" + error.message)
          val params = HashMap<String, Any>().apply {
            put("clientUnsubscribed", false)
            put("errorMessage", error.message.toString())
            put("errorType", "UNSUBSCRIPTION")
            put("topic", topic)
            put("reasonCode", UNSUBSCRIPTION_ERROR)
          }
          emitJsiEvent(clientId + ERROR_EVENT, params)
        }
        .subscribe(
          {},
          { throwable ->
            // This is the error handler in the subscribe method.
            // It will be called if an error occurs in the observable chain.
            Log.e("RxJava", "Error occurred in subscribe: ${throwable.message}")
          })
      subscriptionMap.remove(topic)
    }
  }

  fun getConnectionStatusMqtt(): String {
    return when (mqtt.state) {
      MqttClientState.CONNECTED -> {
        CONNECTED
      }

      MqttClientState.DISCONNECTED -> {
        DISCONNECTED
      }

      MqttClientState.CONNECTING -> {
        CONNECTING
      }

      MqttClientState.DISCONNECTED_RECONNECT -> {
        DISCONNECTED
      }

      MqttClientState.CONNECTING_RECONNECT -> {
        CONNECTING
      }
    }
  }
}

data class Subscription(
  val disposable: Disposable,
  val qos: Int
)


