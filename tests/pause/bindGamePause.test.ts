import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as Phaser from 'phaser';
import { FrontEvent } from '@/events/FrontEvent';
import { PauseMng } from '@/pause/PauseMng';

// The real AudioMng and EventBus need Phaser, which needs a browser.
const setMuted = vi.hoisted(() => vi.fn());
vi.mock('@/audio/AudioMng', () => ({ AudioMng: { setMuted } }));
vi.mock('@/events/EventBus', async () => {
  const { EventEmitter } = await import('node:events');
  return { EventBus: new EventEmitter() };
});

const { EventBus } = await import('@/events/EventBus');
const { bindGamePause } = await import('@/pause/bindGamePause');

function fakeGame() {
  return { pause: vi.fn(), resume: vi.fn() };
}

describe('bindGamePause', () => {
  let game: ReturnType<typeof fakeGame>;

  beforeEach(() => {
    vi.stubGlobal('document', { hidden: false, addEventListener: vi.fn() });
    PauseMng.reset();
    setMuted.mockClear();
    game = fakeGame();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    EventBus.removeAllListeners();
  });

  it('only mutes the audio while the game is loading: the loading must go on', () => {
    bindGamePause(game as unknown as Phaser.Game);

    PauseMng.pause('orientation');

    expect(setMuted).toHaveBeenLastCalledWith(true, 'pause');
    expect(game.pause).not.toHaveBeenCalled();
  });

  it('stops the game once it has loaded, if a pause is still on', () => {
    bindGamePause(game as unknown as Phaser.Game);
    PauseMng.pause('orientation');

    EventBus.emit(FrontEvent.GAME_LOADED);

    expect(game.pause).toHaveBeenCalledTimes(1);
  });

  it('stops and resumes the game after it has loaded', () => {
    bindGamePause(game as unknown as Phaser.Game);
    EventBus.emit(FrontEvent.GAME_LOADED);

    PauseMng.pause('ad');
    expect(game.pause).toHaveBeenCalledTimes(1);
    expect(setMuted).toHaveBeenLastCalledWith(true, 'pause');

    PauseMng.resume('ad');
    expect(game.resume).toHaveBeenCalledTimes(1);
    expect(setMuted).toHaveBeenLastCalledWith(false, 'pause');
  });

  it('stops the game but not the sound while it waits for an ad', () => {
    bindGamePause(game as unknown as Phaser.Game);
    EventBus.emit(FrontEvent.GAME_LOADED);

    PauseMng.pause('adWait');
    expect(game.pause).toHaveBeenCalledTimes(1);
    expect(setMuted).not.toHaveBeenCalled();

    PauseMng.pause('ad');
    expect(setMuted).toHaveBeenLastCalledWith(true, 'pause');
  });

  it('a pause that ends before the game has loaded leaves the game running', () => {
    bindGamePause(game as unknown as Phaser.Game);
    PauseMng.pause('platform');
    PauseMng.resume('platform');

    EventBus.emit(FrontEvent.GAME_LOADED);

    expect(game.pause).not.toHaveBeenCalled();
    expect(game.resume).not.toHaveBeenCalled();
  });
});
