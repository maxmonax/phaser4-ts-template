import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PauseMng } from '@/pause/PauseMng';
import type { IPlatform } from '@/platform/IPlatform';
import { PlatformMng } from '@/platform/PlatformMng';
import { FakePlatform, noMute } from './FakePlatform';

/** A platform whose `init()` the test finishes by hand. */
function slowPlatform() {
  const platform = new FakePlatform();
  const sdk = { ready: () => {} };
  platform.init.mockImplementation(
    (host) =>
      new Promise<void>((resolve) => {
        platform.host = host;
        sdk.ready = resolve;
      })
  );
  return { platform, sdk };
}

describe('PlatformMng', () => {
  let platform: FakePlatform;

  beforeEach(async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    platform = new FakePlatform();
    await PlatformMng.init(noMute, platform);
  });

  afterEach(() => {
    PauseMng.reset();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('initializes the platform', () => {
    expect(platform.init).toHaveBeenCalledTimes(1);
    expect(PlatformMng.getLangs()).toEqual(['ru']);
    expect(PlatformMng.hasAds).toBe(true);
  });

  it('passes mute requests of the platform to the game', () => {
    const setMuted = vi.fn();
    void PlatformMng.init(setMuted, platform);

    platform.host?.setMuted(true);

    expect(setMuted).toHaveBeenCalledWith(true);
  });

  it('falls back to the web platform without ads when the SDK fails', async () => {
    const broken = new FakePlatform();
    broken.init.mockRejectedValue(new Error('SDK is blocked'));

    await PlatformMng.init(noMute, broken);

    expect(PlatformMng.hasAds).toBe(false);
    expect(PlatformMng.getLangs()).toEqual([]);
  });

  it('starts the game without a slow SDK and lets it join later', async () => {
    vi.useFakeTimers();
    const { platform: slow, sdk } = slowPlatform();

    const init = PlatformMng.init(noMute, slow);
    await vi.advanceTimersByTimeAsync(5_000);
    await init;
    expect(PlatformMng.hasAds).toBe(false);

    PlatformMng.loadingFinished();
    PlatformMng.gameplayStart();
    PlatformMng.levelStart(2);
    sdk.ready();
    await vi.advanceTimersByTimeAsync(0);

    expect(PlatformMng.hasAds).toBe(true);
    // The SDK hears what it has missed.
    expect(slow.loadingFinished).toHaveBeenCalledTimes(1);
    expect(slow.gameplayStart).toHaveBeenCalledTimes(1);
    expect(slow.levelEvent).toHaveBeenCalledWith('2', 'start');
  });

  it('gives up an SDK that does not initialize in 30 seconds', async () => {
    vi.useFakeTimers();
    const { platform: slow, sdk } = slowPlatform();

    void PlatformMng.init(noMute, slow);
    await vi.advanceTimersByTimeAsync(30_000);
    sdk.ready();
    await vi.advanceTimersByTimeAsync(0);

    expect(PlatformMng.hasAds).toBe(false);
    expect(console.error).toHaveBeenCalled();
  });

  it('ignores an SDK of an earlier init', async () => {
    vi.useFakeTimers();
    const { platform: slow, sdk } = slowPlatform();
    const init = PlatformMng.init(noMute, slow);
    await vi.advanceTimersByTimeAsync(5_000);
    await init;

    const noAds = new FakePlatform();
    noAds.hasAds = false;
    await PlatformMng.init(noMute, noAds);
    sdk.ready();
    await vi.advanceTimersByTimeAsync(0);

    expect(PlatformMng.hasAds).toBe(false);
  });

  it('reports loading finished only once', () => {
    PlatformMng.loadingFinished();
    PlatformMng.loadingFinished();

    expect(platform.loadingFinished).toHaveBeenCalledTimes(1);
    expect(PlatformMng.loadedAt).not.toBeNull();
  });

  it('does not let an SDK exception escape', () => {
    platform.gameplayStart.mockImplementation(() => {
      throw new Error('SDK bug');
    });
    platform.getMaxAspect.mockImplementation(() => {
      throw new Error('SDK bug');
    });

    expect(() => PlatformMng.gameplayStart()).not.toThrow();
    expect(PlatformMng.getMaxAspect()).toBeNull();
  });

  it('passes the field limit of the platform', () => {
    platform.getMaxAspect.mockReturnValue(2);

    expect(PlatformMng.getMaxAspect()).toBe(2);
  });

  it('reports gameplay only while the game is not paused', () => {
    PlatformMng.gameplayStart();
    expect(platform.gameplayStart).toHaveBeenCalledTimes(1);

    PauseMng.pause('ad');
    expect(platform.gameplayStop).toHaveBeenCalledTimes(1);
    expect(PlatformMng.isGameplay()).toBe(false);

    PauseMng.resume('ad');
    expect(platform.gameplayStart).toHaveBeenCalledTimes(2);
  });

  it('does not start gameplay on resume when the player is in a menu', () => {
    PlatformMng.gameplayStart();
    PlatformMng.gameplayStop();
    PauseMng.pause('hidden');
    PauseMng.resume('hidden');

    expect(platform.gameplayStart).toHaveBeenCalledTimes(1);
    expect(platform.gameplayStop).toHaveBeenCalledTimes(1);
  });

  it('starts gameplay after a pause if it was requested during the pause', () => {
    PauseMng.pause('orientation');
    PlatformMng.gameplayStart();
    expect(platform.gameplayStart).not.toHaveBeenCalled();

    PauseMng.resume('orientation');
    expect(platform.gameplayStart).toHaveBeenCalledTimes(1);
  });

  describe('a pause of the platform', () => {
    it('pauses the game', () => {
      platform.host?.setPaused(true);
      expect(PauseMng.has('platform')).toBe(true);

      platform.host?.setPaused(false);
      expect(PauseMng.isPaused()).toBe(false);
    });

    it('stops and starts gameplay when the SDK does not do it itself', () => {
      PlatformMng.gameplayStart();
      platform.host?.setPaused(true);
      platform.host?.setPaused(false);

      expect(platform.gameplayStop).toHaveBeenCalledTimes(1);
      expect(platform.gameplayStart).toHaveBeenCalledTimes(2);
    });

    it('does not repeat the stop and start of an SDK that does it itself', () => {
      platform.pauseStopsGameplay = true;
      PlatformMng.gameplayStart();

      platform.host?.setPaused(true);
      platform.host?.setPaused(false);

      expect(platform.gameplayStop).not.toHaveBeenCalled();
      expect(platform.gameplayStart).toHaveBeenCalledTimes(1);
      expect(PlatformMng.isGameplay()).toBe(true);
    });

    it('stops the gameplay that the SDK has started on resume, if the game is still paused', () => {
      platform.pauseStopsGameplay = true;
      PlatformMng.gameplayStart();

      platform.host?.setPaused(true);
      PauseMng.pause('hidden');
      platform.host?.setPaused(false);
      expect(platform.gameplayStop).toHaveBeenCalledTimes(1);

      PauseMng.resume('hidden');
      expect(platform.gameplayStart).toHaveBeenCalledTimes(2);
    });

    it('stops the gameplay that the SDK has started on resume, if the player has left it', () => {
      platform.pauseStopsGameplay = true;
      PlatformMng.gameplayStart();

      platform.host?.setPaused(true);
      PlatformMng.gameplayStop();
      platform.host?.setPaused(false);

      expect(platform.gameplayStop).toHaveBeenCalledTimes(1);
    });

    it('does not start gameplay that was stopped before the pause', () => {
      platform.pauseStopsGameplay = true;
      PlatformMng.gameplayStart();
      PlatformMng.gameplayStop();

      platform.host?.setPaused(true);
      platform.host?.setPaused(false);

      expect(platform.gameplayStart).toHaveBeenCalledTimes(1);
      expect(platform.gameplayStop).toHaveBeenCalledTimes(1);
    });
  });

  it('reports every attempt at a level once, and an unfinished one as failed', () => {
    PlatformMng.levelStart(1);
    PlatformMng.levelEnd(true);
    PlatformMng.levelEnd(false);
    PlatformMng.levelStart(2);
    PlatformMng.levelStart(2);

    expect(platform.levelEvent.mock.calls).toEqual([
      ['1', 'start'],
      ['1', 'complete'],
      ['2', 'start'],
      ['2', 'fail'],
      ['2', 'start'],
    ]);
  });

  it('offers the best score to the leaderboard of the platform', async () => {
    const board = {
      readScore: vi.fn(async (): Promise<number | null> => 3),
      writeScore: vi.fn(async () => true),
    };
    Object.assign(platform, board satisfies Partial<IPlatform>);

    await PlatformMng.reportScore(5);
    await PlatformMng.reportScore(4);

    expect(board.writeScore.mock.calls).toEqual([[5]]);
  });

  it('ignores scores on a platform without a leaderboard', async () => {
    await expect(PlatformMng.reportScore(5)).resolves.toBeUndefined();
  });

  it('uses localStorage when the platform storage fails', async () => {
    platform.createStorage.mockRejectedValue(new Error('no player'));

    const storage = await PlatformMng.createStorage('game');

    await expect(storage.load()).resolves.toBeNull();
  });
});
