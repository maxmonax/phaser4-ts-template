import { afterEach, describe, expect, it, vi } from 'vitest';
import { PauseMng } from '@/pause/PauseMng';

describe('PauseMng', () => {
  afterEach(() => {
    PauseMng.reset();
  });

  it('is running when no reason is active', () => {
    expect(PauseMng.isPaused()).toBe(false);
  });

  it('stays paused until every reason is resumed', () => {
    PauseMng.pause('ad');
    PauseMng.pause('orientation');

    PauseMng.resume('orientation');
    expect(PauseMng.isPaused()).toBe(true);
    expect(PauseMng.has('ad')).toBe(true);

    PauseMng.resume('ad');
    expect(PauseMng.isPaused()).toBe(false);
  });

  it('ignores resuming a reason that was not paused', () => {
    PauseMng.pause('ad');
    PauseMng.resume('platform');

    expect(PauseMng.isPaused()).toBe(true);
  });

  it('notifies listeners only when the paused state changes', () => {
    const listener = vi.fn();
    PauseMng.onChange(listener);

    PauseMng.pause('ad');
    PauseMng.pause('hidden'); // already paused
    PauseMng.resume('ad'); // still paused by 'hidden'
    PauseMng.resume('hidden');

    expect(listener.mock.calls).toEqual([[true], [false]]);
  });

  it('set() adds and removes a reason', () => {
    PauseMng.set('orientation', true);
    expect(PauseMng.has('orientation')).toBe(true);

    PauseMng.set('orientation', false);
    expect(PauseMng.has('orientation')).toBe(false);
  });

  it('stops notifying after unsubscribe', () => {
    const listener = vi.fn();
    const off = PauseMng.onChange(listener);

    off();
    PauseMng.pause('ad');

    expect(listener).not.toHaveBeenCalled();
  });
});
