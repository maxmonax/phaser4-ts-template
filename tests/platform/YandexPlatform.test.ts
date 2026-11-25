import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { YandexPlatform } from '@/platform/yandex/YandexPlatform';

type AdCallbacks = Record<string, ((arg?: unknown) => void) | undefined>;

function fakeSdk() {
  const events = new Map<string, () => void>();
  const playerData: Record<string, unknown> = {};
  const sdk = {
    events,
    playerData,
    environment: { i18n: { lang: 'ru' } },
    deviceInfo: { isDesktop: vi.fn(() => true) },
    availableMethods: new Set(['leaderboards.getPlayerEntry', 'leaderboards.setScore']),
    isAvailableMethod: vi.fn(async (name: string) => sdk.availableMethods.has(name)),
    leaderboards: {
      getPlayerEntry: vi.fn(async (_name: string): Promise<{ score: number }> => ({ score: 7 })),
      setScore: vi.fn(async (_name: string, _score: number) => {}),
    },
    features: {
      LoadingAPI: { ready: vi.fn() },
      GameplayAPI: { start: vi.fn(), stop: vi.fn() },
    },
    adv: {
      // The test decides how the ad ends by calling the callbacks.
      lastCallbacks: {} as AdCallbacks,
      showFullscreenAdv: vi.fn((opts: { callbacks: AdCallbacks }) => {
        sdk.adv.lastCallbacks = opts.callbacks;
      }),
      showRewardedVideo: vi.fn((opts: { callbacks: AdCallbacks }) => {
        sdk.adv.lastCallbacks = opts.callbacks;
      }),
    },
    on: vi.fn((event: string, cb: () => void) => {
      events.set(event, cb);
      return () => events.delete(event);
    }),
    getPlayer: vi.fn(async () => ({
      getData: async (keys: string[]) => Object.fromEntries(keys.map((k) => [k, playerData[k]])),
      setData: vi.fn(async (data: Record<string, unknown>) => void Object.assign(playerData, data)),
    })),
    getStorage: vi.fn(async () => {
      const map = new Map<string, string>();
      return {
        getItem: (k: string) => map.get(k) ?? null,
        setItem: (k: string, v: string) => void map.set(k, v),
      };
    }),
  };
  return sdk;
}

const host = { setPaused: vi.fn(), setMuted: vi.fn() };
const noop = () => {};

describe('YandexPlatform', () => {
  let sdk: ReturnType<typeof fakeSdk>;
  let platform: YandexPlatform;

  beforeEach(async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    sdk = fakeSdk();
    vi.stubGlobal('YaGames', { init: vi.fn(async () => sdk) });
    platform = new YandexPlatform('levels');
    await platform.init(host);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    host.setPaused.mockClear();
  });

  it('fails to init when the SDK script is not loaded', async () => {
    vi.unstubAllGlobals();
    await expect(new YandexPlatform().init(host)).rejects.toThrow('not loaded');
  });

  it('takes the language from environment.i18n.lang, with the Yandex fallback after it', () => {
    expect(platform.getLangs()).toEqual(['ru', 'en']);

    sdk.environment.i18n.lang = 'kk';
    expect(platform.getLangs()).toEqual(['kk', 'ru']);

    sdk.environment.i18n.lang = 'tr';
    expect(platform.getLangs()).toEqual(['tr', 'en']);
  });

  it('limits the game field to 2:1 on a desktop only', () => {
    expect(platform.getMaxAspect()).toBe(2);

    sdk.deviceInfo.isDesktop.mockReturnValue(false);
    expect(platform.getMaxAspect()).toBeNull();
  });

  it('says that the SDK reports gameplay itself around its pause', () => {
    expect(platform.pauseStopsGameplay).toBe(true);
  });

  it('passes game_api_pause and game_api_resume to the game', () => {
    sdk.events.get('game_api_pause')?.();
    sdk.events.get('game_api_resume')?.();

    expect(host.setPaused.mock.calls).toEqual([[true], [false]]);
  });

  it('maps loading and gameplay to LoadingAPI and GameplayAPI', () => {
    platform.loadingFinished();
    platform.gameplayStart();
    platform.gameplayStop();

    expect(sdk.features.LoadingAPI.ready).toHaveBeenCalledTimes(1);
    expect(sdk.features.GameplayAPI.start).toHaveBeenCalledTimes(1);
    expect(sdk.features.GameplayAPI.stop).toHaveBeenCalledTimes(1);
  });

  it('resolves an interstitial on close and on error', async () => {
    const started = vi.fn();
    const closed = platform.showInterstitial(started);
    sdk.adv.lastCallbacks.onOpen?.();
    expect(started).toHaveBeenCalledTimes(1);
    sdk.adv.lastCallbacks.onClose?.(true);
    await expect(closed).resolves.toBeUndefined();

    const failed = platform.showInterstitial(noop);
    sdk.adv.lastCallbacks.onError?.(new Error('no fill'));
    await expect(failed).resolves.toBeUndefined();
  });

  it('gives the reward only after onRewarded', async () => {
    const started = vi.fn();
    const watched = platform.showRewarded(started);
    sdk.adv.lastCallbacks.onOpen?.();
    expect(started).toHaveBeenCalledTimes(1);
    sdk.adv.lastCallbacks.onRewarded?.();
    sdk.adv.lastCallbacks.onClose?.();
    await expect(watched).resolves.toBe(true);

    const skipped = platform.showRewarded(noop);
    sdk.adv.lastCallbacks.onClose?.();
    await expect(skipped).resolves.toBe(false);

    const failed = platform.showRewarded(noop);
    sdk.adv.lastCallbacks.onError?.(new Error('no fill'));
    await expect(failed).resolves.toBe(false);
  });

  it('reads and writes the score of the player in the leaderboard', async () => {
    await expect(platform.readScore()).resolves.toBe(7);
    expect(sdk.leaderboards.getPlayerEntry).toHaveBeenCalledWith('levels');

    await expect(platform.writeScore(9)).resolves.toBe(true);
    expect(sdk.leaderboards.setScore).toHaveBeenCalledWith('levels', 9);
  });

  it('reads 0 for a player who is not in the leaderboard yet', async () => {
    sdk.leaderboards.getPlayerEntry.mockRejectedValue({ code: 'LEADERBOARD_PLAYER_NOT_PRESENT' });

    await expect(platform.readScore()).resolves.toBe(0);
  });

  it('does not touch the leaderboard for a guest or without a leaderboard name', async () => {
    sdk.availableMethods.clear();
    await expect(platform.readScore()).resolves.toBeNull();
    await expect(platform.writeScore(9)).resolves.toBe(false);

    sdk.availableMethods.add('leaderboards.getPlayerEntry');
    const noBoard = new YandexPlatform('');
    await noBoard.init(host);
    await expect(noBoard.readScore()).resolves.toBeNull();

    expect(sdk.leaderboards.getPlayerEntry).not.toHaveBeenCalled();
    expect(sdk.leaderboards.setScore).not.toHaveBeenCalled();
  });

  it('keeps the save in the player data under the save key', async () => {
    const storage = await platform.createStorage('game');

    await storage.save({ coins: 3 }, true);

    expect(sdk.playerData).toEqual({ game: { coins: 3 } });
    expect(await storage.load()).toEqual({ coins: 3 });
  });

  it('falls back to the SDK safe storage when player data is not available', async () => {
    sdk.getPlayer.mockRejectedValue(new Error('no player'));
    const storage = await platform.createStorage('game');

    await storage.save({ coins: 4 }, false);

    expect(sdk.getStorage).toHaveBeenCalled();
    expect(await storage.load()).toEqual({ coins: 4 });
  });
});
