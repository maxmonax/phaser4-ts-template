import { describe, expect, it, vi } from 'vitest';
import { Fader } from '@/audio/Fader';

describe('Fader', () => {
  it('moves the value linearly and finishes exactly on the target', () => {
    const fader = new Fader();
    const values: number[] = [];
    const onComplete = vi.fn();

    fader.add(0, 10, 100, (v) => values.push(v), onComplete);

    fader.update(25);
    fader.update(25);
    expect(values).toEqual([2.5, 5]);
    expect(onComplete).not.toHaveBeenCalled();

    fader.update(50);
    expect(values.at(-1)).toBe(10);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(fader.size).toBe(0);
  });

  it('does not overshoot when the step is longer than the remaining time', () => {
    const fader = new Fader();
    const onUpdate = vi.fn();

    fader.add(1, 0, 100, onUpdate);
    fader.update(1000);

    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledWith(0);
  });

  it('completes a zero-duration fade on the first update', () => {
    const fader = new Fader();
    const onUpdate = vi.fn();
    const onComplete = vi.fn();

    fader.add(3, 7, 0, onUpdate, onComplete);
    expect(onComplete).not.toHaveBeenCalled();

    fader.update(16);
    expect(onUpdate).toHaveBeenCalledWith(7);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('stop() cancels the fade without calling onComplete', () => {
    const fader = new Fader();
    const onUpdate = vi.fn();
    const onComplete = vi.fn();

    const handle = fader.add(0, 1, 100, onUpdate, onComplete);
    fader.update(50);
    expect(handle.isActive).toBe(true);

    handle.stop();
    expect(handle.isActive).toBe(false);

    fader.update(100);
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();
    expect(fader.size).toBe(0);
  });

  it('reports a finished fade as inactive', () => {
    const fader = new Fader();
    const handle = fader.add(0, 1, 10);

    fader.update(10);
    expect(handle.isActive).toBe(false);
  });

  it('delay() calls back once after the given time', () => {
    const fader = new Fader();
    const callback = vi.fn();

    fader.delay(200, callback);
    fader.update(199);
    expect(callback).not.toHaveBeenCalled();

    fader.update(1);
    fader.update(500);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('lets a callback start the next fade', () => {
    const fader = new Fader();
    const second = vi.fn();

    fader.add(0, 1, 10, undefined, () => {
      fader.add(1, 0, 10, second);
    });

    fader.update(10); // first finishes and schedules the second
    expect(second).not.toHaveBeenCalled();

    fader.update(5);
    expect(second).toHaveBeenCalledWith(0.5);
  });

  it('lets a callback stop another fade during the same update', () => {
    const fader = new Fader();
    const victimUpdate = vi.fn();
    const handles: { victim?: ReturnType<Fader['add']> } = {};

    fader.add(0, 1, 100, () => handles.victim?.stop());
    handles.victim = fader.add(0, 1, 100, victimUpdate);

    fader.update(10);
    expect(victimUpdate).not.toHaveBeenCalled();
  });

  it('clear() cancels every fade', () => {
    const fader = new Fader();
    const onUpdate = vi.fn();
    const onComplete = vi.fn();
    const handle = fader.add(0, 1, 10, onUpdate, onComplete);

    fader.clear();
    fader.update(100);

    expect(handle.isActive).toBe(false);
    expect(onUpdate).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });
});
