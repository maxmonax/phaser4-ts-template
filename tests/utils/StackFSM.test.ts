import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StackFSM } from '@/utils/states/StackFSM';

describe('StackFSM', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('pushes a state and calls its onStart', () => {
    const fsm = new StackFSM();
    const onStart = vi.fn();
    fsm.initState('patrol', undefined, undefined, onStart);

    fsm.pushState('patrol');

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(fsm.getCurrentState()?.name).toBe('patrol');
  });

  it('updates only the state on top of the stack', () => {
    const fsm = new StackFSM();
    const updatePatrol = vi.fn();
    const updateAttack = vi.fn();
    fsm.initState('patrol', undefined, updatePatrol);
    fsm.initState('attack', undefined, updateAttack);

    fsm.pushState('patrol');
    fsm.pushState('attack');
    fsm.update(16);

    expect(updateAttack).toHaveBeenCalledWith(16);
    expect(updatePatrol).not.toHaveBeenCalled();
  });

  it('popState ends the top state and returns to the previous one', () => {
    const fsm = new StackFSM();
    const endAttack = vi.fn();
    fsm.initState('patrol');
    fsm.initState('attack', undefined, undefined, undefined, endAttack);
    fsm.pushState('patrol');
    fsm.pushState('attack');

    fsm.popState();

    expect(endAttack).toHaveBeenCalledTimes(1);
    expect(fsm.getCurrentState()?.name).toBe('patrol');
  });

  it('does not push the state that is already on top', () => {
    const fsm = new StackFSM();
    const onStart = vi.fn();
    fsm.initState('patrol', undefined, undefined, onStart);

    fsm.pushState('patrol');
    fsm.pushState('patrol');
    fsm.popState();

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(fsm.getCurrentState()).toBeUndefined();
  });

  it('calls handlers with the given context', () => {
    const fsm = new StackFSM();
    const ctx = { name: 'ctx' };
    const onUpdate = vi.fn();
    fsm.initState('patrol', ctx, onUpdate);

    fsm.pushState('patrol');
    fsm.update(16);

    expect(onUpdate.mock.contexts[0]).toBe(ctx);
  });

  it('ignores unknown and duplicate states', () => {
    const fsm = new StackFSM();
    const first = vi.fn();
    const second = vi.fn();
    fsm.initState('patrol', undefined, first);
    fsm.initState('patrol', undefined, second); // ignored

    fsm.pushState('missing'); // ignored
    expect(fsm.getCurrentState()).toBeUndefined();

    fsm.pushState('patrol');
    fsm.update(16);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledTimes(2);
  });

  it('popState on an empty stack does nothing', () => {
    const fsm = new StackFSM();
    expect(() => fsm.popState()).not.toThrow();
  });

  it('free() clears the stack and the registered states', () => {
    const fsm = new StackFSM();
    fsm.initState('patrol');
    fsm.pushState('patrol');

    fsm.free();

    expect(fsm.getCurrentState()).toBeUndefined();
    fsm.pushState('patrol');
    expect(fsm.getCurrentState()).toBeUndefined();
  });
});
