import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  CrazyGamesAdCallbacks,
  CrazyGamesSettings,
} from '@/platform/crazygames/crazygames-sdk';
import { CrazyGamesPlatform } from '@/platform/crazygames/CrazyGamesPlatform';

function fakeSdk() {
  const store = new Map<string, string>();
  const sdk = {
    environment: 'crazygames' as 'local' | 'crazygames' | 'disabled',
    init: vi.fn(async () => {}),
    settingsListener: null as ((settings: CrazyGamesSettings) => void) | null,
    lastAd: null as { type: string; callbacks: CrazyGamesAdCallbacks } | null,
    game: {
      loadingStart: vi.fn(),
      loadingStop: vi.fn(),
      gameplayStart: vi.fn(),
      gameplayStop: vi.fn(),
      settings: { muteAudio: true, disableChat: false },
      addSettingsChangeListener: vi.fn((listener: (settings: CrazyGamesSettings) => void) => {
        sdk.settingsListener = listener;
      }),
    },
    ad: {
      requestAd: vi.fn((type: string, callbacks: CrazyGamesAdCallbacks) => {
        sdk.lastAd = { type, callbacks };
      }),
    },
    data: {
      getItem: vi.fn((key: string) => store.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => void store.set(key, value)),
      removeItem: vi.fn(),
      clear: vi.fn(),
    },
    user: { systemInfo: { locale: 'de-DE', countryCode: 'DE' } },
  };
  return sdk;
}

const host = { setPaused: vi.fn(), setMuted: vi.fn() };
const noop = () => {};

describe('CrazyGamesPlatform', () => {
  let sdk: ReturnType<typeof fakeSdk>;
  let platform: CrazyGamesPlatform;

  beforeEach(async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    sdk = fakeSdk();
    vi.stubGlobal('CrazyGames', { SDK: sdk });
    platform = new CrazyGamesPlatform();
    await platform.init(host);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    host.setMuted.mockClear();
  });

  it('fails to init when the SDK script is not loaded', async () => {
    vi.unstubAllGlobals();
    await expect(new CrazyGamesPlatform().init(host)).rejects.toThrow('not loaded');
  });

  it('fails to init outside CrazyGames', async () => {
    sdk.environment = 'disabled';
    await expect(new CrazyGamesPlatform().init(host)).rejects.toThrow('disabled');
  });

  it('reports loading start on init and loading stop when loaded', () => {
    expect(sdk.game.loadingStart).toHaveBeenCalledTimes(1);

    platform.loadingFinished();

    expect(sdk.game.loadingStop).toHaveBeenCalledTimes(1);
  });

  it('follows the muteAudio setting', () => {
    expect(host.setMuted).toHaveBeenLastCalledWith(true);

    sdk.settingsListener?.({ muteAudio: false, disableChat: false });

    expect(host.setMuted).toHaveBeenLastCalledWith(false);
  });

  it('takes the language from systemInfo.locale', () => {
    expect(platform.getLangs()).toEqual(['de-DE']);
  });

  it('requests a midgame ad for an interstitial', async () => {
    const ad = platform.showInterstitial(noop);
    expect(sdk.lastAd?.type).toBe('midgame');

    sdk.lastAd?.callbacks.adError?.({ code: 'unfilled', message: '' });
    await expect(ad).resolves.toBeUndefined();
  });

  it('tells when the ad has started, not when it is requested', () => {
    const started = vi.fn();
    void platform.showInterstitial(started);
    expect(started).not.toHaveBeenCalled();

    sdk.lastAd?.callbacks.adStarted?.();
    expect(started).toHaveBeenCalledTimes(1);
  });

  it('gives the reward only when the rewarded ad finished', async () => {
    const watched = platform.showRewarded(noop);
    expect(sdk.lastAd?.type).toBe('rewarded');
    sdk.lastAd?.callbacks.adFinished?.();
    await expect(watched).resolves.toBe(true);

    const failed = platform.showRewarded(noop);
    sdk.lastAd?.callbacks.adError?.({ code: 'adblock', message: '' });
    await expect(failed).resolves.toBe(false);
  });

  it('saves to the data module', async () => {
    const storage = await platform.createStorage('game');

    await storage.save({ coins: 1 }, false);

    expect(sdk.data.setItem).toHaveBeenCalledWith('game', '{"coins":1}');
    expect(await storage.load()).toEqual({ coins: 1 });
  });

  it('uses localStorage when the data module is turned off', async () => {
    sdk.data.getItem.mockImplementation(() => {
      throw new Error('Progress Save is disabled');
    });

    const storage = await platform.createStorage('game');
    await storage.save({ coins: 2 }, false);

    expect(sdk.data.setItem).not.toHaveBeenCalled();
    expect(await storage.load()).toEqual({ coins: 2 });
  });
});
