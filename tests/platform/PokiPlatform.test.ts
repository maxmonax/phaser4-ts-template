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
  };
}

describe('PokiPlatform', () => {
  let sdk: ReturnType<typeof fakeSdk>;
  let platform: PokiPlatform;

  beforeEach(async () => {
    sdk = fakeSdk();
    vi.stubGlobal('PokiSDK', sdk);
    platform = new PokiPlatform();
    await platform.init();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fails to init when the SDK script is not loaded', async () => {
    vi.unstubAllGlobals();
    await expect(new PokiPlatform().init()).rejects.toThrow('not loaded');
  });

  it('fails to init when the SDK init rejects (ad blocker)', async () => {
    sdk.init.mockRejectedValue(new Error('blocked'));
    await expect(new PokiPlatform().init()).rejects.toThrow('blocked');
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
    expect(platform.getLang()).toBe('pt');
  });

  it('maps ads to commercial and rewarded breaks', async () => {
    await platform.showInterstitial();
    expect(sdk.commercialBreak).toHaveBeenCalledTimes(1);

    await expect(platform.showRewarded()).resolves.toBe(true);
    sdk.rewardedBreak.mockResolvedValue(false);
    await expect(platform.showRewarded()).resolves.toBe(false);
  });
});
