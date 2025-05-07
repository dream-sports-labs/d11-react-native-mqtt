package com.d11.rn.mqtt.helpers

import com.facebook.react.bridge.*
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

object MapUtils {

    @Throws(JSONException::class)
    fun toJSONObject(readableMap: ReadableMap): JSONObject {
        val jsonObject = JSONObject()
        val iterator = readableMap.keySetIterator()

        while (iterator.hasNextKey()) {
            val key = iterator.nextKey()
            when (readableMap.getType(key)) {
                ReadableType.Null -> jsonObject.put(key, JSONObject.NULL)
                ReadableType.Boolean -> jsonObject.put(key, readableMap.getBoolean(key))
                ReadableType.Number -> jsonObject.put(key, readableMap.getDouble(key))
                ReadableType.String -> jsonObject.put(key, readableMap.getString(key))
                ReadableType.Map -> jsonObject.put(key, toJSONObject(readableMap.getMap(key)!!))
                ReadableType.Array -> jsonObject.put(key, ArrayUtils.toJSONArray(readableMap.getArray(key)!!))
            }
        }

        return jsonObject
    }

    @Throws(JSONException::class)
    fun toMap(jsonObject: JSONObject): Map<String, Any?> {
        val map: MutableMap<String, Any?> = HashMap()
        val iterator = jsonObject.keys()

        while (iterator.hasNext()) {
            val key = iterator.next()
            var value = jsonObject.get(key)

            value = when (value) {
                is JSONObject -> toMap(value)
                is JSONArray -> ArrayUtils.toArray(value)
                JSONObject.NULL -> null
                else -> value
            }

            map[key] = value
        }

        return map
    }

    fun toMap(readableMap: ReadableMap): Map<String, Any?> {
        val map: MutableMap<String, Any?> = HashMap()
        val iterator = readableMap.keySetIterator()

        while (iterator.hasNextKey()) {
            val key = iterator.nextKey()
            when (readableMap.getType(key)) {
                ReadableType.Null -> map[key] = null
                ReadableType.Boolean -> map[key] = readableMap.getBoolean(key)
                ReadableType.Number -> map[key] = readableMap.getDouble(key)
                ReadableType.String -> map[key] = readableMap.getString(key)
                ReadableType.Map -> map[key] = toMap(readableMap.getMap(key)!!)
                ReadableType.Array -> map[key] = ArrayUtils.toArray(readableMap.getArray(key)!!)
            }
        }

        return map
    }

    fun toWritableMap(map: Map<String, Any?>): WritableMap {
        val writableMap = Arguments.createMap()

        for ((key, value) in map) {
            when (value) {
                null -> writableMap.putNull(key)
                is Boolean -> writableMap.putBoolean(key, value)
                is Double -> writableMap.putDouble(key, value)
                is Int -> writableMap.putInt(key, value)
                is String -> writableMap.putString(key, value)
                is Map<*, *> -> {
                    @Suppress("UNCHECKED_CAST")
                    writableMap.putMap(key, toWritableMap(value as Map<String, Any?>))
                }
                is Array<*> -> writableMap.putArray(key, ArrayUtils.toWritableArray(value))
            }
        }

        return writableMap
    }

    fun toHashMap(attributes: HashMap<String, Any?>): HashMap<String, String> {
        val result = HashMap<String, String>()
        for ((key, value) in attributes) {
            result[key] = value?.toString() ?: "null"
        }
        return result
    }
}
