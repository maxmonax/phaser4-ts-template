import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PauseMng } from '@/pause/PauseMng';
import { PlatformMng } from '@/platform/PlatformMng';
import { FakePlatform, noopHost } from './FakePlatform';

describe('PlatformMng', () => {
  let platform: FakePlatform;

  beforeEach(async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    platform = new FakePlatform();
    await PlatformMng.init(noopHost, platform);
  });

  afterEach(() => {
    PauseMng.reset();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('initializes the platform with the host', () => {
    expect(platform.init).toHaveBeenCalledWith(noopHost);
    expect(PlatformMng.getLang()).toBe('ru');
    expect(PlatformMng.hasAds).toBe(true);
  });

  it('falls back to the web platform without ads when the SDK fails', async () => {
    const broken = new FakePlatform();
    broken.init.mockRejectedValue(new Error('SDK is blocked'));

    await PlatformMng.init(noopHost, broken);

    expect(PlatformMng.id).toBe('web');
    expect(PlatformMng.hasAds).toBe(false);
    expect(PlatformMng.getLang()).toBeNull();
  });

  it('falls back when the SDK init hangs', async () => {
    vi.useFakeTimers();
    const hanging = new FakePlatform();
    hanging.init.mockReturnValue(new Promise(() => {}));

    const init = PlatformMng.init(noopHost, hanging);
    await vi.advanceTimersByTimeAsync(10_000);
    await init;

    expect(PlatformMng.hasAds).toBe(false);
  });

  it('reports loading finished only once', () => {
    PlatformMng.loadingFinished();
    PlatformMng.loadingFinished();

    expect(platform.loadingFinished).toHaveBeenCalledTimes(1);
  });

  it('does not let an SDK exception escape', () => {
    platform.gameplayStart.mockImplementation(() => {
      throw new Error('SDK bug');
    });

    expect(() => PlatformMng.gameplayStart()).not.toThrow();
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

  it('uses localStorage when the platform storage fails', async () => {
    platform.createStorage.mockRejectedValue(new Error('no player'));

    const storage = await PlatformMng.createStorage('game');

    await expect(storage.load()).resolves.toBeNull();
  });
});
