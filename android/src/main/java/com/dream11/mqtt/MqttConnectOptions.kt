package com.d11.rn.mqtt

import java.io.Serializable

class MqttConnectOptions(val options: HashMap<String, Serializable>) {
    companion object {
        const val KEEP_ALIVE_IN_SEC = 60 // seconds
    }

    val username: String = options["username"] as String? ?: ""
    val password: ByteArray = (options["password"] as String? ?: "").toByteArray()
    val keepAlive: Int = (options["keepAlive"] as Integer?)?.toInt() ?: KEEP_ALIVE_IN_SEC
    val cleanSession: Boolean = options["cleanSession"] as Boolean? ?: false
    val enableSslConfig: Boolean = options["enableSslConfig"] as Boolean? ?: false
}
