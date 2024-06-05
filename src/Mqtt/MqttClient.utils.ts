/**
 * Function to calculate the backoff time for retrying MQTT connection.
 * It calculates the backoff time based on exponential backoff algorithm with jitter.
 * This function is typically used to determine the delay before retrying a failed connection attempt.
 * @param backoffTime The base backoff time in milliseconds (default: 2000 ms).
 * @param retryCurrentCount The current retry attempt count.
 * @param maxBackoffTime The maximum backoff time allowed in seconds (default: 60 seconds).
 * @param jitter The jitter factor to introduce randomness into the backoff time (default: 1).
 * @returns The calculated backoff time in milliseconds.
 * @remarks The backoff time is calculated as a random value within a range, increasing exponentially with each retry attempt.
 *          It ensures that subsequent retry attempts are spaced out and adds jitter to avoid synchronization of retry attempts.
 */
export const getMqttBackoffTime = (
  backoffTime = 2000,
  retryCurrentCount: number,
  maxBackoffTime = 60,
  jitter = 1
) => {
  return Math.min(
    backoffTime * Math.pow(2, retryCurrentCount) +
      Math.ceil(Math.random() * jitter),
    maxBackoffTime * 1000
  );
};
