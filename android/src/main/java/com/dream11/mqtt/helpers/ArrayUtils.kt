package com.d11.rn.mqtt.helpers

import com.facebook.react.bridge.*
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

object ArrayUtils {

    @Throws(JSONException::class)
    fun toJSONArray(readableArray: ReadableArray): JSONArray {
        val jsonArray = JSONArray()

        for (i in 0 until readableArray.size()) {
            when (readableArray.getType(i)) {
                ReadableType.Null -> jsonArray.put(i, JSONObject.NULL)
                ReadableType.Boolean -> jsonArray.put(i, readableArray.getBoolean(i))
                ReadableType.Number -> jsonArray.put(i, readableArray.getDouble(i))
                ReadableType.String -> jsonArray.put(i, readableArray.getString(i))
                ReadableType.Map -> jsonArray.put(i, MapUtils.toJSONObject(readableArray.getMap(i)!!))
                ReadableType.Array -> jsonArray.put(i, toJSONArray(readableArray.getArray(i)!!))
            }
        }

        return jsonArray
    }

    @Throws(JSONException::class)
    fun toArray(jsonArray: JSONArray): Array<Any?> {
        return Array(jsonArray.length()) { i ->
            val value = jsonArray.get(i)
            when (value) {
                is JSONObject -> MapUtils.toMap(value)
                is JSONArray -> toArray(value)
                JSONObject.NULL -> null
                else -> value
            }
        }
    }

    fun toArray(readableArray: ReadableArray): Array<Any?> {
        return Array(readableArray.size()) { i ->
            when (readableArray.getType(i)) {
                ReadableType.Null -> null
                ReadableType.Boolean -> readableArray.getBoolean(i)
                ReadableType.Number -> readableArray.getDouble(i)
                ReadableType.String -> readableArray.getString(i)
                ReadableType.Map -> MapUtils.toMap(readableArray.getMap(i)!!)
                ReadableType.Array -> toArray(readableArray.getArray(i)!!)
            }
        }
    }

    fun toWritableArray(array: Array<*>): WritableArray {
        val writableArray = Arguments.createArray()

        for (value in array) {
            when (value) {
                null -> writableArray.pushNull()
                is Boolean -> writableArray.pushBoolean(value)
                is Double -> writableArray.pushDouble(value)
                is Int -> writableArray.pushInt(value)
                is String -> writableArray.pushString(value)
                is Map<*, *> -> {
                    @Suppress("UNCHECKED_CAST")
                    writableArray.pushMap(MapUtils.toWritableMap(value as Map<String, Any?>))
                }
                is Array<*> -> writableArray.pushArray(toWritableArray(value))
            }
        }

        return writableArray
    }
}
