import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LogMng } from '@/utils/LogMng';

// Tests run as a dev build (import.meta.env.DEV is true), so verbose output is available.
describe('LogMng', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    LogMng.setMode(LogMng.MODE_DEBUG);
  });

  it('prints verbose messages in debug mode', () => {
    LogMng.setMode(LogMng.MODE_DEBUG);

    expect(LogMng.debug('d')).toBe(true);
    expect(LogMng.info('i')).toBe(true);
    expect(LogMng.net('n')).toBe(true);
    LogMng.system('s');

    expect(console.log).toHaveBeenCalledTimes(4);
  });

  it('hides verbose messages in release mode', () => {
    LogMng.setMode(LogMng.MODE_RELEASE);

    expect(LogMng.debug('d')).toBe(false);
    expect(LogMng.info('i')).toBe(false);
    expect(LogMng.net('n')).toBe(false);
    LogMng.system('s');

    expect(console.log).not.toHaveBeenCalled();
  });

  it('always prints warnings and errors, through console.warn and console.error', () => {
    LogMng.setMode(LogMng.MODE_RELEASE);

    LogMng.warn('careful');
    LogMng.error('broken');

    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.log).not.toHaveBeenCalled();
  });

  it('passes the message and the data to the console', () => {
    const data = { code: 0 };

    LogMng.error('broken', data);
    LogMng.warn('falsy data is still data', 0);

    expect(vi.mocked(console.error).mock.calls[0].slice(-2)).toEqual(['broken', data]);
    expect(vi.mocked(console.warn).mock.calls[0].slice(-2)).toEqual([
      'falsy data is still data',
      0,
    ]);
  });

  it('remembers the mode', () => {
    LogMng.setMode(LogMng.MODE_RELEASE);
    expect(LogMng.getMode()).toBe(LogMng.MODE_RELEASE);
  });
});
