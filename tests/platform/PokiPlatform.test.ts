import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PokiPlatform } from '@/platform/poki/PokiPlatform';

function fakeSdk() {
  return {
    init: vi.fn(async () => {}),
    gameLoadingFinished: vi.fn(),
    gameplayStart: vi.fn(),
    gameplayStop: vi.fn(),
    commercialBreak: vi.fn(async () => {}),
    rewardedBreak: vi.fn(async () => true),
    getLanguage: vi.fn(() => 'pt'),
    measure: vi.fn(),
  };
}

describe('PokiPlatform', () => {
  let sdk: ReturnType<typeof fakeSdk>;
  let platform: PokiPlatform;

  beforeEach(async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    sdk = fakeSdk();
    vi.stubGlobal('PokiSDK', sdk);
    platform = new PokiPlatform();
    await platform.init();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('fails to init when the SDK script is not loaded', async () => {
    vi.unstubAllGlobals();
    await expect(new PokiPlatform().init()).rejects.toThrow('not loaded');
  });

  it('goes on without ads when the SDK init rejects (ad blocker)', async () => {
    sdk.init.mockRejectedValue(new Error('blocked'));
    const blocked = new PokiPlatform();

    await blocked.init();
    blocked.loadingFinished();

    expect(blocked.hasAds).toBe(false);
    expect(sdk.gameLoadingFinished).toHaveBeenCalledTimes(1);
    expect(platform.hasAds).toBe(true);
  });

  it('leaves the pacing of ads to Poki', () => {
    expect(platform.interstitialIntervalMs).toBe(0);
  });

  it('sends level attempts to measure()', () => {
    platform.levelEvent('3', 'complete');

    expect(sdk.measure).toHaveBeenCalledWith('level', '3', 'complete');
  });

  it('maps loading and gameplay calls', () => {
    platform.loadingFinished();
    platform.gameplayStart();
    platform.gameplayStop();

    expect(sdk.gameLoadingFinished).toHaveBeenCalledTimes(1);
    expect(sdk.gameplayStart).toHaveBeenCalledTimes(1);
    expect(sdk.gameplayStop).toHaveBeenCalledTimes(1);
  });

  it('takes the language from getLanguage()', () => {
    expect(platform.getLangs()).toEqual(['pt']);
  });

  it('maps ads to commercial and rewarded breaks, started at the request', async () => {
    const started = vi.fn();
    await platform.showInterstitial(started);
    expect(sdk.commercialBreak).toHaveBeenCalledTimes(1);
    // The SDK's own start callback is not always called.
    expect(started).toHaveBeenCalledTimes(1);

    await expect(platform.showRewarded(started)).resolves.toBe(true);
    sdk.rewardedBreak.mockResolvedValue(false);
    await expect(platform.showRewarded(started)).resolves.toBe(false);
    expect(started).toHaveBeenCalledTimes(3);
  });
});
