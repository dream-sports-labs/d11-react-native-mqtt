#include <jni.h>
#include <jsi/jsi.h>
#include <pthread.h>
#include <sys/types.h>

namespace jsi = facebook::jsi;


/*
 * ******************************************************** JNI Methods ********************************************************
 */

static jclass java_class;
static jobject java_object;
static jobject java_storage_object;
static JavaVM *java_vm = nullptr;

static jobject JSIArrayToJArray(JNIEnv *jniEnv, jsi::Object &object, jsi::Runtime &runtime, jclass doubleClass,
                                jclass booleanClass, jclass integerClass, jclass longClass, jclass hashMapClass, jclass arrayListClass);

static jobject JSIRecordToJHashMap(JNIEnv *jniEnv, jsi::Object &object, jsi::Runtime &runtime, jclass doubleClass,
                                   jclass booleanClass, jclass integerClass, jclass longClass, jclass hashMapClass, jclass arrayListClass);

static jsi::Value JNIHashMapToJSIRecord(jobject hashMap, JNIEnv *env, jsi::Runtime &runtime, jclass stringClass, jclass integerClass, jclass floatClass, jclass doubleClass,
                                        jclass booleanClass, jclass arrayListClass, jclass hashMapClass);

static jsi::Value JNIArrayToJSIArray(jobject arrayList, JNIEnv *env, jsi::Runtime &runtime, jclass stringClass, jclass integerClass, jclass floatClass, jclass doubleClass,
                                     jclass booleanClass, jclass arrayListClass, jclass hashMapClass);


void DeferThreadDetach(JNIEnv *env) {
    static pthread_key_t thread_key;
    static auto run_once = [] {
        const auto err = pthread_key_create(&thread_key, [](void *ts_env) {
            if (ts_env) {
                java_vm->DetachCurrentThread();
            }
        });
        if (err) {
            // Failed to create TSD key. Throw an exception if you want to.
        }
        return 0;
    }();
    const auto ts_env = pthread_getspecific(thread_key);
    if (!ts_env) {
        if (pthread_setspecific(thread_key, env)) {
            // Failed to set thread-specific value for key. Throw an exception if you
            // want to.
        }
    }
}

JNIEnv *GetJniEnv() {
    JNIEnv *env = nullptr;
    auto get_env_result = java_vm->GetEnv((void **)&env, JNI_VERSION_1_6);
    if (get_env_result == JNI_EDETACHED) {
        if (java_vm->AttachCurrentThread(&env, NULL) == JNI_OK) {
            DeferThreadDetach(env);
        } else {
            // Failed to attach thread. Throw an exception if you want to.
        }
    } else if (get_env_result == JNI_EVERSION) {
        // Unsupported JNI version. Throw an exception if you want to.
    }
    return env;
}

static bool isInt(double d) {
    return d == (int)d;
}

static bool isLong(double d) {
    double intPointer;
    return modf(d, &intPointer) == 0.0;
}



static jsi::Value JNIValueToJSIValue(jobject result, JNIEnv *jniEnv,
                                     jsi::Runtime &runtime, jclass stringClass, jclass integerClass, jclass floatClass, jclass doubleClass,
                                     jclass booleanClass, jclass arrayListClass, jclass hashMapClass) {
    jsi::Value retVal = jsi::Value::null();
    if (result == nullptr) {
        return retVal;
    }

    if (jniEnv->IsInstanceOf(result, stringClass)) {
        jstring resultStr = (jstring)result;
        const char *str = jniEnv->GetStringUTFChars(resultStr, nullptr);
        retVal = jsi::String::createFromUtf8(runtime, str);
        jniEnv->ReleaseStringUTFChars(resultStr, str);
    } else if (jniEnv->IsInstanceOf(result, integerClass)) {
        jmethodID getVal = jniEnv->GetMethodID(integerClass, "intValue", "()I");
        int i = jniEnv->CallIntMethod(result, getVal);
        retVal = jsi::Value(runtime, i);
    } else if (jniEnv->IsInstanceOf(result, floatClass)) {
        jmethodID getVal = jniEnv->GetMethodID(floatClass, "floatValue", "()F");
        double d = jniEnv->CallFloatMethod(result, getVal);
        retVal = jsi::Value(runtime, d);
    } else if (jniEnv->IsInstanceOf(result, doubleClass)) {
        jmethodID getVal = jniEnv->GetMethodID(doubleClass, "doubleValue", "()D");
        double d = jniEnv->CallDoubleMethod(result, getVal);
        retVal = jsi::Value(runtime, d);
    } else if (jniEnv->IsInstanceOf(result, booleanClass)) {
        jmethodID getVal = jniEnv->GetMethodID(booleanClass, "booleanValue", "()Z");
        bool b = jniEnv->CallBooleanMethod(result, getVal);
        retVal = jsi::Value(runtime, b);
    } else if (jniEnv->IsInstanceOf(result, arrayListClass)) {
        // ArrayList<E>
        retVal = JNIArrayToJSIArray(result, jniEnv, runtime, stringClass, integerClass, floatClass, doubleClass, booleanClass, arrayListClass, hashMapClass);
    } else if (jniEnv->IsInstanceOf(result, hashMapClass)) {
        // HashMap<K, V>
        retVal = JNIHashMapToJSIRecord(result, jniEnv, runtime, stringClass, integerClass, floatClass, doubleClass, booleanClass, arrayListClass, hashMapClass);
    }
    return retVal;
}

static jsi::Value JNIHashMapToJSIRecord(jobject hashMap, JNIEnv *env, jsi::Runtime &runtime, jclass stringClass, jclass integerClass, jclass floatClass, jclass doubleClass,
                                        jclass booleanClass, jclass arrayListClass, jclass hashMapClass) {
    // Get the Map's entry Set.
    jsi::Value retVal = jsi::Value::null();
    jclass mapClass = env->FindClass("java/util/Map");
    if (mapClass == nullptr) {
        return retVal;
    }
    jmethodID entrySet =
            env->GetMethodID(mapClass, "entrySet", "()Ljava/util/Set;");
    if (entrySet == nullptr) {
        return retVal;
    }
    jobject set = env->CallObjectMethod(hashMap, entrySet);
    if (set == nullptr) {
        return retVal;
    }
    // Obtain an iterator over the Set
    jclass setClass = env->FindClass("java/util/Set");
    if (setClass == nullptr) {
        return retVal;
    }
    jmethodID iterator =
            env->GetMethodID(setClass, "iterator", "()Ljava/util/Iterator;");
    if (iterator == nullptr) {
        return retVal;
    }
    jobject iter = env->CallObjectMethod(set, iterator);
    if (iter == nullptr) {
        return retVal;
    }
    // Get the Iterator method IDs
    jclass iteratorClass = env->FindClass("java/util/Iterator");
    if (iteratorClass == nullptr) {
        return retVal;
    }
    jmethodID hasNext = env->GetMethodID(iteratorClass, "hasNext", "()Z");
    if (hasNext == nullptr) {
        return retVal;
    }
    jmethodID next =
            env->GetMethodID(iteratorClass, "next", "()Ljava/lang/Object;");
    if (next == nullptr) {
        return retVal;
    }
    // Get the Entry class method IDs
    jclass entryClass = env->FindClass("java/util/Map$Entry");
    if (entryClass == nullptr) {
        return retVal;
    }
    jmethodID getKey =
            env->GetMethodID(entryClass, "getKey", "()Ljava/lang/Object;");
    if (getKey == nullptr) {
        return retVal;
    }
    jmethodID getValue =
            env->GetMethodID(entryClass, "getValue", "()Ljava/lang/Object;");
    if (getValue == nullptr) {
        return retVal;
    }
    // Iterate over the entry Set
    auto jsiObj = jsi::Object(runtime);
    while (env->CallBooleanMethod(iter, hasNext)) {
        jobject entry = env->CallObjectMethod(iter, next);
        jstring key = (jstring) env->CallObjectMethod(entry, getKey);
        jobject value = env->CallObjectMethod(entry, getValue);
        const char* keyStr = env->GetStringUTFChars(key, NULL);
        if (!keyStr) {
            return retVal;
        }
        auto jsiValue = JNIValueToJSIValue(value, env, runtime, stringClass, integerClass, floatClass, doubleClass, booleanClass, arrayListClass, hashMapClass);
        jsiObj.setProperty(runtime, keyStr, jsiValue);
        env->DeleteLocalRef(entry);
        env->ReleaseStringUTFChars(key, keyStr);
        env->DeleteLocalRef(key);
        env->DeleteLocalRef(value);
    }
    env->DeleteLocalRef(mapClass);
    env->DeleteLocalRef(set);
    env->DeleteLocalRef(setClass);
    env->DeleteLocalRef(iter);
    env->DeleteLocalRef(iteratorClass);
    env->DeleteLocalRef(entryClass);
    return jsiObj;
}

static jsi::Value JNIArrayToJSIArray(jobject arrayList, JNIEnv *env, jsi::Runtime &runtime, jclass stringClass, jclass integerClass, jclass floatClass, jclass doubleClass,
                                     jclass booleanClass, jclass arrayListClass, jclass hashMapClass) {
    jsi::Value retVal = jsi::Value::null();
    if (arrayListClass == nullptr) {
        return retVal;
    }
    jmethodID iterator =
            env->GetMethodID(arrayListClass, "iterator", "()Ljava/util/Iterator;");
    if (iterator == nullptr) {
        return retVal;
    }
    jobject iter = env->CallObjectMethod(arrayList, iterator);
    if (iter == nullptr) {
        return retVal;
    }
    jclass iteratorClass = env->FindClass("java/util/Iterator");
    if (iteratorClass == nullptr) {
        return retVal;
    }
    jmethodID hasNext = env->GetMethodID(iteratorClass, "hasNext", "()Z");
    if (hasNext == nullptr) {
        return retVal;
    }
    jmethodID next =
            env->GetMethodID(iteratorClass, "next", "()Ljava/lang/Object;");
    if (next == nullptr) {
        return retVal;
    }
    jmethodID sizeMethod =
            env->GetMethodID(arrayListClass, "size", "()I");
    if (sizeMethod == nullptr) {
        return retVal;
    }
    jint size = env->CallIntMethod(arrayList, sizeMethod);
    size_t i = 0;
    jsi::Array jsiArray = jsi::Array(runtime, size);
    while (env->CallBooleanMethod(iter, hasNext)) {
        jobject value = env->CallObjectMethod(iter, next);
        auto jsiValue = JNIValueToJSIValue(value, env, runtime, stringClass, integerClass, floatClass, doubleClass, booleanClass, arrayListClass, hashMapClass);
        jsiArray.setValueAtIndex(runtime, i, jsiValue);
        env->DeleteLocalRef(value);
        i++;
    }
    env->DeleteLocalRef(iter);
    env->DeleteLocalRef(iteratorClass);
    return jsiArray;
}

static jobject JSIValueToJNIValue(JNIEnv *jniEnv, const jsi::Value &jsiValue, jsi::Runtime &runtime, jclass doubleClass,
                                  jclass booleanClass, jclass integerClass, jclass longClass, jclass hashMapClass, jclass arrayListClass) {
    if (doubleClass == nullptr || booleanClass == nullptr || integerClass == nullptr || longClass == nullptr) {
        return nullptr;
    }
    jobject jniValue = nullptr;
    if (!jsiValue.isNull() && !jsiValue.isUndefined()) {
        if (jsiValue.isString()) {
            jsi::String val = jsiValue.getString(runtime);
            std::string cxxVal = val.utf8(runtime);
            jniValue = jniEnv->NewStringUTF(cxxVal.c_str());
        } else if (jsiValue.isBool()) {
            bool b = jsiValue.getBool();
            jmethodID booleanConstructID = jniEnv->GetMethodID(booleanClass, "<init>", "(Z)V");
            jniValue = jniEnv->NewObject(booleanClass, booleanConstructID, b);
        } else if (jsiValue.isNumber()) {
            double d = jsiValue.getNumber();
            if (isinf(d) || isnan(d)) {
                jniValue = nullptr;
            } else {
                if (isInt(d)) {
                    jmethodID integerConstructID = jniEnv->GetMethodID(integerClass, "<init>", "(I)V");
                    jniValue = jniEnv->NewObject(integerClass, integerConstructID, (int)d);
                } else if(isLong(d)) {
                    jmethodID longConstructID = jniEnv->GetMethodID(longClass, "<init>", "(J)V");
                    jniValue = jniEnv->NewObject(longClass, longConstructID, (long)d);
                } else {
                    jmethodID doubleConstructID = jniEnv->GetMethodID(doubleClass, "<init>", "(D)V");
                    jniValue = jniEnv->NewObject(doubleClass, doubleConstructID, d);
                }
            }
        } else if (jsiValue.isObject()) {
            jsi::Object o = jsiValue.getObject(runtime);
            if (!o.isFunction(runtime)) {
                if (o.isArray(runtime)) {
                    jniValue = JSIArrayToJArray(jniEnv, o, runtime, doubleClass, booleanClass, integerClass, longClass, hashMapClass, arrayListClass);
                } else {
                    jniValue = JSIRecordToJHashMap(jniEnv, o, runtime, doubleClass, booleanClass, integerClass, longClass, hashMapClass, arrayListClass);
                }
            }
        }
    }
    return jniValue;
}

static jobject JSIRecordToJHashMap(JNIEnv *jniEnv, jsi::Object &object, jsi::Runtime &runtime, jclass doubleClass,
                                   jclass booleanClass, jclass integerClass, jclass longClass, jclass hashMapClass, jclass arrayListClass) {
    if (object.isArray(runtime) || object.isFunction(runtime)) {
        return nullptr;
    }
    if (hashMapClass == nullptr)
        return nullptr;
    jsi::Array propertyNames = object.getPropertyNames(runtime);
    size_t size = propertyNames.size(runtime);
    jmethodID init = jniEnv->GetMethodID(hashMapClass, "<init>", "()V");
    jobject hashMap = jniEnv->NewObject(hashMapClass, init);
    jmethodID put = jniEnv->GetMethodID(hashMapClass, "put", "(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;");

    for (size_t i = 0; i < size; i++) {
        jsi::String jsiKey = propertyNames.getValueAtIndex(runtime, i).getString(runtime);
        std::string cxxKey = jsiKey.utf8(runtime);
        jstring jKey = jniEnv->NewStringUTF(cxxKey.c_str());
        jsi::Value jsiValue = object.getProperty(runtime, jsiKey);
        jobject jniValue = JSIValueToJNIValue(jniEnv, jsiValue, runtime, doubleClass, booleanClass, integerClass, longClass, hashMapClass, arrayListClass);
        if (jniValue != nullptr) {
            jniEnv->CallObjectMethod(hashMap, put, jKey, jniValue);
        } else {
            if (jsiValue.isNull()) {
                jniEnv->CallObjectMethod(hashMap, put, jKey, jniValue);
            }
        }
        jniEnv->DeleteLocalRef(jniValue);
        jniEnv->DeleteLocalRef(jKey);
    }
    return hashMap;
}

static jobject JSIArrayToJArray(JNIEnv *jniEnv, jsi::Object &object, jsi::Runtime &runtime, jclass doubleClass,
                                jclass booleanClass, jclass integerClass, jclass longClass, jclass hashMapClass, jclass arrayListClass) {
    if (object.isArray(runtime)) {
        if (arrayListClass == nullptr) {
            return nullptr;
        }
        jsi::Array jsiArray = object.getArray(runtime);
        size_t size = jsiArray.size(runtime);
        jmethodID init = jniEnv->GetMethodID(arrayListClass, "<init>", "(I)V");
        jobject array = jniEnv->NewObject(arrayListClass, init, (int)size);
        jmethodID add = jniEnv->GetMethodID(arrayListClass, "add", "(Ljava/lang/Object;)Z");
        for (size_t i = 0; i < size; i++) {
            jsi::Value jsiValue = jsiArray.getValueAtIndex(runtime, i);
            jobject jniValue = JSIValueToJNIValue(jniEnv, jsiValue, runtime, doubleClass, booleanClass, integerClass, longClass, hashMapClass, arrayListClass);
            jniEnv->CallBooleanMethod(array, add, jniValue);
            jniEnv->DeleteLocalRef(jniValue);
        }
        return array;
    } else {
        return nullptr;
    }
}




/*
 * ******************************************************** Utility Methods ********************************************************
 */


static inline void addGlobalHostFunction(
        jsi::Runtime &runtime, jsi::Object &object, const char *name, unsigned int argc, jsi::HostFunctionType function)
{
    auto jsiFunction =
            jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forAscii(runtime, name), argc, function);
    object.setProperty(runtime, name, std::move(jsiFunction));
}

static jsi::Value executeJNIFunction(jsi::Runtime &runtime, const jsi::Value &thisValue, const jsi::Value *arguments, std::size_t count, const char* functionName, const char* functionSig, bool isVoid, jobject java_instance = java_object) {
    // Step-1 : Convert all JSI values received from JS to JNI Values and store in params array
    JNIEnv *jniEnv = GetJniEnv();
    java_class = jniEnv->GetObjectClass(java_instance);
    jvalue params[count];

    jclass doubleClass = jniEnv->FindClass("java/lang/Double");
    jclass booleanClass = jniEnv->FindClass("java/lang/Boolean");
    jclass integerClass = jniEnv->FindClass("java/lang/Integer");
    jclass longClass = jniEnv->FindClass("java/lang/Long");
    jclass hashMapClass = jniEnv->FindClass("java/util/HashMap");
    jclass arrayListClass = jniEnv->FindClass("java/util/ArrayList");
    jclass stringClass = jniEnv->FindClass("java/lang/String");
    jclass floatClass = jniEnv->FindClass("java/lang/Float");

    for (size_t i = 0; i < count; i++) {
        params[i].l = JSIValueToJNIValue(jniEnv, arguments[i], runtime, doubleClass, booleanClass, integerClass, longClass, hashMapClass, arrayListClass);
    }

    // Step-2 : Create method Id for java/kotlin function, execute method via jni and store jni result
    jmethodID methodId = jniEnv->GetMethodID(java_class, functionName, functionSig);
    jobject result = nullptr;
    if (isVoid && count == 0) {
        jniEnv->CallVoidMethod(java_instance, methodId);
    } else if (!isVoid && count == 0) {
        result = jniEnv->CallObjectMethod(java_instance, methodId);
    } else if (isVoid && count > 0) {
        jniEnv->CallVoidMethodA(java_instance, methodId, params);
    } else if (!isVoid && count > 0) {
        result = jniEnv->CallObjectMethodA(java_instance, methodId, params);
    }

    // Step-3 : Convert jni result value to JSI value and send back to JS

    auto jsiValue = isVoid ? jsi::Value() : JNIValueToJSIValue(result, jniEnv, runtime, stringClass, integerClass, floatClass, doubleClass, booleanClass, arrayListClass, hashMapClass);
    jniEnv->DeleteLocalRef(java_class);
    for (size_t i = 0; i < count; i++) {
        jniEnv->DeleteLocalRef(params[i].l);
    }
    jniEnv->DeleteLocalRef(result);
    jniEnv->DeleteLocalRef(doubleClass);
    jniEnv->DeleteLocalRef(booleanClass);
    jniEnv->DeleteLocalRef(integerClass);
    jniEnv->DeleteLocalRef(floatClass);
    jniEnv->DeleteLocalRef(stringClass);
    jniEnv->DeleteLocalRef(arrayListClass);
    jniEnv->DeleteLocalRef(hashMapClass);
    jniEnv->DeleteLocalRef(longClass);
    return jsiValue;
}


/*
 * ******************************************************** MQTT Module ********************************************************
 * Native Module: MqttModule
 */

static jobject java_mqtt_object;

static jsi::Value createMqtt(jsi::Runtime &runtime, const jsi::Value &thisValue,
                             const jsi::Value *arguments, std::size_t count) {
    jsi::Value retVal = executeJNIFunction(runtime, thisValue, arguments, count,
                                           "createMqtt", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/Integer;Ljava/lang/Boolean;)V",
                                           true, java_mqtt_object);
    return retVal;
}

static jsi::Value removeMqtt(jsi::Runtime &runtime, const jsi::Value &thisValue,
                             const jsi::Value *arguments, std::size_t count) {
    jsi::Value retVal = executeJNIFunction(runtime, thisValue, arguments, count,
                                           "removeMqtt", "(Ljava/lang/String;)V",
                                           true, java_mqtt_object);
    return retVal;
}

static jsi::Value connectMqtt(jsi::Runtime &runtime, const jsi::Value &thisValue,
                              const jsi::Value *arguments, std::size_t count) {
    jsi::Value retVal = executeJNIFunction(runtime, thisValue, arguments, count,
                                           "connectMqtt", "(Ljava/lang/String;Ljava/util/HashMap;)V",
                                           true, java_mqtt_object);
    return retVal;
}

static jsi::Value disconnectMqtt(jsi::Runtime &runtime, const jsi::Value &thisValue,
                                 const jsi::Value *arguments, std::size_t count) {
    jsi::Value retVal = executeJNIFunction(runtime, thisValue, arguments, count,
                                           "disconnectMqtt", "(Ljava/lang/String;)V",
                                           true, java_mqtt_object);
    return retVal;
}

static jsi::Value subscribeMqtt(jsi::Runtime &runtime, const jsi::Value &thisValue,
                                const jsi::Value *arguments, std::size_t count) {
    jsi::Value retVal = executeJNIFunction(runtime, thisValue, arguments, count,
                                           "subscribeMqtt", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/Integer;)V",
                                           true, java_mqtt_object);
    return retVal;
}

static jsi::Value unsubscribeMqtt(jsi::Runtime &runtime, const jsi::Value &thisValue,
                                  const jsi::Value *arguments, std::size_t count) {
    jsi::Value retVal = executeJNIFunction(runtime, thisValue, arguments, count,
                                           "unsubscribeMqtt", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V",
                                           true, java_mqtt_object);
    return retVal;
}

static jsi::Value getConnectionStatusMqtt(jsi::Runtime &runtime, const jsi::Value &thisValue,
                                          const jsi::Value *arguments, std::size_t count) {
    jsi::Value retVal = executeJNIFunction(runtime, thisValue, arguments, count,
                                           "getConnectionStatusMqtt", "(Ljava/lang/String;)Ljava/lang/String;",
                                           false, java_mqtt_object);
    return retVal;
}


static void installMqttJSIModule(jsi::Runtime &jsiRuntime){

    jsi::Object module = jsi::Object(jsiRuntime);

    addGlobalHostFunction(jsiRuntime, module, "createMqtt", 4, createMqtt);
    addGlobalHostFunction(jsiRuntime, module, "removeMqtt", 1, removeMqtt);
    addGlobalHostFunction(jsiRuntime, module, "connectMqtt", 2, connectMqtt);
    addGlobalHostFunction(jsiRuntime, module, "disconnectMqtt", 1, disconnectMqtt);
    addGlobalHostFunction(jsiRuntime, module, "subscribeMqtt", 4, subscribeMqtt);
    addGlobalHostFunction(jsiRuntime, module, "unsubscribeMqtt", 3, unsubscribeMqtt);
    addGlobalHostFunction(jsiRuntime, module, "getConnectionStatusMqtt", 1, getConnectionStatusMqtt);

    jsiRuntime.global().setProperty(jsiRuntime, "__MqttModuleProxy", std::move(module));
}

extern "C"
JNIEXPORT void JNICALL
Java_com_d11_rn_mqtt_MqttModuleImpl_nativeInstallJSIBindings(JNIEnv *env, jobject thiz, jlong jsi) {
    java_mqtt_object = env->NewGlobalRef(thiz);
    env->GetJavaVM(&java_vm);
    auto runtime = reinterpret_cast<jsi::Runtime *>(jsi);
    if (runtime) {
        installMqttJSIModule(*runtime);
    }
}

