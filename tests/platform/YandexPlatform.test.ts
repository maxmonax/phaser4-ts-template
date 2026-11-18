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

describe('YandexPlatform', () => {
  let sdk: ReturnType<typeof fakeSdk>;
  let platform: YandexPlatform;

  beforeEach(async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    sdk = fakeSdk();
    vi.stubGlobal('YaGames', { init: vi.fn(async () => sdk) });
    platform = new YandexPlatform();
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

  it('takes the language from environment.i18n.lang', () => {
    expect(platform.getLang()).toBe('ru');
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
    const closed = platform.showInterstitial();
    sdk.adv.lastCallbacks.onClose?.(true);
    await expect(closed).resolves.toBeUndefined();

    const failed = platform.showInterstitial();
    sdk.adv.lastCallbacks.onError?.(new Error('no fill'));
    await expect(failed).resolves.toBeUndefined();
  });

  it('gives the reward only after onRewarded', async () => {
    const watched = platform.showRewarded();
    sdk.adv.lastCallbacks.onRewarded?.();
    sdk.adv.lastCallbacks.onClose?.();
    await expect(watched).resolves.toBe(true);

    const skipped = platform.showRewarded();
    sdk.adv.lastCallbacks.onClose?.();
    await expect(skipped).resolves.toBe(false);

    const failed = platform.showRewarded();
    sdk.adv.lastCallbacks.onError?.(new Error('no fill'));
    await expect(failed).resolves.toBe(false);
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
