import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { delay, withTimeout } from '@/utils/async';

describe('async utils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('delay() resolves after the given time', async () => {
    const done = vi.fn();
    void delay(100).then(done);

    await vi.advanceTimersByTimeAsync(99);
    expect(done).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(done).toHaveBeenCalled();
  });

  it('withTimeout() passes the result through', async () => {
    await expect(withTimeout(Promise.resolve(5), 100)).resolves.toBe(5);
  });

  it('withTimeout() passes the error through', async () => {
    await expect(withTimeout(Promise.reject(new Error('boom')), 100)).rejects.toThrow('boom');
  });

  it('withTimeout() rejects when the promise is too slow', async () => {
    const result = withTimeout(new Promise(() => {}), 100, 'SDK init');
    const check = expect(result).rejects.toThrow('SDK init timed out after 100 ms');

    await vi.advanceTimersByTimeAsync(100);
    await check;
  });
});
