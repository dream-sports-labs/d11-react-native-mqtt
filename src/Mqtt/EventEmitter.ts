import { NativeEventEmitter } from 'react-native';
import { MqttModule } from '../Modules/mqttModule';

/**
 * This function encapsulates the creation and management of a singleton event emitter instance.
 * It ensures that only one instance of the event emitter is created and reused throughout the application.
 * The singleton pattern is implemented using an Immediately Invoked Function Expression (IIFE).
 */
export const EventEmitter = (function () {
  var instance: EventEmitter;

  function createInstance() {
    var object = new NativeEventEmitter(MqttModule);
    return object;
  }

  return {
    /**
     * Method to get the singleton instance of the event emitter.
     * If the instance doesn't exist yet, it creates a new one using createInstance().
     * @returns The singleton instance of the event emitter.
     */
    getInstance: function () {
      if (!instance) {
        instance = createInstance();
      }
      return instance;
    },
  };
})();

/**
 * This type definition represents a custom event emitter.
 * It extends the functionality of the NativeEventEmitter class by omitting the 'addListener' method
 * and replacing it with a modified version to match specific requirements.
 */
export type EventEmitter = Omit<NativeEventEmitter, 'addListener'> & {
  /**
   * The 'addListener' method is overridden with a modified signature.
   * @param eventType The type of event to listen for.
   * @param listener A callback function to be invoked when the event occurs.
   * @param context An optional context for the listener.
   * @returns An EmitterSubscription representing the subscription to the event.
   */
  addListener: <T>(
    eventType: string,
    listener: (event: T) => void,
    context?: NonNullable<unknown>
  ) => ReturnType<NativeEventEmitter['addListener']>;
};
