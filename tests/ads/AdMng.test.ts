import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdMng } from '@/ads/AdMng';
import { PauseMng } from '@/pause/PauseMng';
import { PlatformMng } from '@/platform/PlatformMng';
import { FakePlatform, noopHost } from '../platform/FakePlatform';

describe('AdMng', () => {
  let platform: FakePlatform;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    platform = new FakePlatform();
    await PlatformMng.init(noopHost, platform);
    AdMng.reset();
  });

  afterEach(() => {
    PauseMng.reset();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('pauses the game while an ad is on screen', async () => {
    let pausedDuringAd = false;
    platform.showInterstitial.mockImplementation(async () => {
      pausedDuringAd = PauseMng.has('ad');
    });

    await AdMng.showInterstitial();

    expect(pausedDuringAd).toBe(true);
    expect(PauseMng.isPaused()).toBe(false);
  });

  it('keeps the cooldown of the platform between interstitials', async () => {
    platform.interstitialCooldownMs = 60_000;

    await AdMng.showInterstitial();
    await AdMng.showInterstitial();
    expect(platform.showInterstitial).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(60_000);
    await AdMng.showInterstitial();
    expect(platform.showInterstitial).toHaveBeenCalledTimes(2);
  });

  it('restarts the interstitial cooldown after a rewarded ad', async () => {
    platform.interstitialCooldownMs = 60_000;

    await AdMng.showRewarded();

    expect(AdMng.canShowInterstitial()).toBe(false);
  });

  it('shows one ad at a time', async () => {
    let finish = () => {};
    platform.showRewarded.mockImplementation(
      () => new Promise<boolean>((resolve) => (finish = () => resolve(true)))
    );

    const first = AdMng.showRewarded();
    expect(AdMng.isBusy()).toBe(true);
    await expect(AdMng.showRewarded()).resolves.toBe(false);
    await AdMng.showInterstitial();
    expect(platform.showInterstitial).not.toHaveBeenCalled();

    finish();
    await expect(first).resolves.toBe(true);
    expect(AdMng.isBusy()).toBe(false);
  });

  it('gives no reward and resumes the game when the ad fails', async () => {
    platform.showRewarded.mockRejectedValue(new Error('no fill'));

    await expect(AdMng.showRewarded()).resolves.toBe(false);
    expect(PauseMng.isPaused()).toBe(false);
  });

  it('does nothing on a platform without ads', async () => {
    platform.hasAds = false;

    await AdMng.showInterstitial();

    expect(await AdMng.showRewarded()).toBe(false);
    expect(platform.showInterstitial).not.toHaveBeenCalled();
    expect(platform.showRewarded).not.toHaveBeenCalled();
  });
});
