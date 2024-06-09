import { getMqttBackoffTime } from '../Mqtt/MqttClient.utils';

describe('getMqttBackoffTime', () => {
  beforeEach(() => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('should exponentially increase backoff time with retry count', () => {
    const retryCount = 3;
    const expectedBackoff = 2000 * Math.pow(2, retryCount) + Math.ceil(0.5);
    expect(getMqttBackoffTime(undefined, retryCount)).toBeCloseTo(
      expectedBackoff
    );
  });

  test('should not exceed maximum backoff time', () => {
    const highRetryCount = 10;
    expect(getMqttBackoffTime(undefined, highRetryCount, 60)).toBe(60000);
  });

  test('should account for jitter in the calculation', () => {
    expect(getMqttBackoffTime(1000, 1, 3000, 10)).toBeLessThanOrEqual(
      1000 * Math.pow(2, 1) + 10
    );
  });

  test('should handle zero retry count', () => {
    expect(getMqttBackoffTime(1000, 0, 3000, 10)).toBeCloseTo(
      1004 + Math.ceil(0.5)
    );
  });

  test('should handle very high retry count and not exceed maximum backoff time', () => {
    expect(getMqttBackoffTime(1000, 50, 2000, 10)).toBe(2000 * 1000);
  });
});
