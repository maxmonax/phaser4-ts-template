import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FSM } from '@/utils/states/FSM';

describe('FSM', () => {
  beforeEach(() => {
    // unknown and duplicate states are reported through LogMng.warn
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('enters a state and passes user data to onEnter', () => {
    const fsm = new FSM();
    const onEnter = vi.fn();
    fsm.addState('idle', undefined, onEnter);

    fsm.startState('idle', { level: 3 });

    expect(onEnter).toHaveBeenCalledWith({ level: 3 });
    expect(fsm.isCurrentState('idle')).toBe(true);
    expect(fsm.getCurrentState()?.name).toBe('idle');
  });

  it('calls onExit of the old state before onEnter of the new one', () => {
    const fsm = new FSM();
    const calls: string[] = [];
    fsm.addState(
      'a',
      undefined,
      () => calls.push('enter a'),
      undefined,
      () => calls.push('exit a')
    );
    fsm.addState('b', undefined, () => calls.push('enter b'));

    fsm.startState('a');
    fsm.startState('b');

    expect(calls).toEqual(['enter a', 'exit a', 'enter b']);
  });

  it('calls handlers with the given context', () => {
    const fsm = new FSM();
    const ctx = { name: 'ctx' };
    const onEnter = vi.fn();
    fsm.addState('a', ctx, onEnter);

    fsm.startState('a');

    expect(onEnter.mock.contexts[0]).toBe(ctx);
  });

  it('update() calls onUpdate of the current state with dt and user data', () => {
    const fsm = new FSM();
    const onUpdate = vi.fn();
    fsm.addState('run', undefined, undefined, onUpdate);

    fsm.update(16); // no state yet
    expect(onUpdate).not.toHaveBeenCalled();

    fsm.startState('run', 'data');
    fsm.update(16);

    expect(onUpdate).toHaveBeenCalledWith(16, 'data');
  });

  it('does not restart the state that is already current', () => {
    const fsm = new FSM();
    const onEnter = vi.fn();
    fsm.addState('idle', undefined, onEnter);

    fsm.startState('idle');
    fsm.startState('idle');

    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  it('ignores an unknown state and keeps the current one', () => {
    const fsm = new FSM();
    fsm.addState('idle');
    fsm.startState('idle');

    fsm.startState('missing');

    expect(fsm.isCurrentState('idle')).toBe(true);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it('refuses to add a state twice', () => {
    const fsm = new FSM();

    expect(fsm.addState('idle')).toBe(fsm);
    expect(fsm.addState('idle')).toBeUndefined();
  });

  it('queues a state change requested during a transition until the next update', () => {
    const fsm = new FSM();
    const onUpdateB = vi.fn();
    fsm.addState('a', undefined, () => fsm.startState('b'));
    fsm.addState('b', undefined, undefined, onUpdateB);

    fsm.startState('a');
    expect(fsm.isCurrentState('a')).toBe(true);

    fsm.update(16); // applies the queued change, does not update yet
    expect(fsm.isCurrentState('b')).toBe(true);
    expect(onUpdateB).not.toHaveBeenCalled();

    fsm.update(16);
    expect(onUpdateB).toHaveBeenCalledTimes(1);
  });

  it('free() forgets the current state and all registered states', () => {
    const fsm = new FSM();
    const onEnter = vi.fn();
    fsm.addState('idle', undefined, onEnter);
    fsm.startState('idle');

    fsm.free();

    expect(fsm.getCurrentState()).toBeUndefined();
    fsm.startState('idle');
    expect(onEnter).toHaveBeenCalledTimes(1);
  });
});
