import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdMng } from '@/ads/AdMng';
import { Config } from '@/data/Config';
import { PauseMng } from '@/pause/PauseMng';
import { PlatformMng } from '@/platform/PlatformMng';
import { FakePlatform, noMute } from '../platform/FakePlatform';

const START_TIMEOUT_MS = Config.ADS.START_TIMEOUT_MS;
const INTERVAL_MS = Config.ADS.INTERSTITIAL_INTERVAL_MS;

/** An ad the test starts and ends by hand. */
function manualAd<T>(platform: FakePlatform, kind: 'showInterstitial' | 'showRewarded') {
  const ad = { start: () => {}, end: (_value: T) => {} };
  platform[kind].mockImplementation(
    (started: () => void) =>
      new Promise((resolve) => {
        ad.start = started;
        ad.end = resolve as (value: T) => void;
      }) as never
  );
  return ad;
}

describe('AdMng', () => {
  let platform: FakePlatform;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    platform = new FakePlatform();
    await PlatformMng.init(noMute, platform);
    AdMng.reset();
  });

  afterEach(() => {
    PauseMng.reset();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('stops the game from the request on, and the sound only when the ad starts', async () => {
    const ad = manualAd<void>(platform, 'showInterstitial');

    const shown = AdMng.showInterstitial();
    await vi.advanceTimersByTimeAsync(0);
    expect(PauseMng.isPaused()).toBe(true);
    expect(PauseMng.isMuted()).toBe(false);

    ad.start();
    expect(PauseMng.has('ad')).toBe(true);
    expect(PauseMng.isMuted()).toBe(true);

    ad.end();
    await shown;
    expect(PauseMng.isPaused()).toBe(false);
    expect(AdMng.isBusy()).toBe(false);
  });

  it('goes on when the SDK does not start the ad in time', async () => {
    manualAd<void>(platform, 'showInterstitial');

    const shown = AdMng.showInterstitial();
    await vi.advanceTimersByTimeAsync(START_TIMEOUT_MS);
    await shown;

    expect(PauseMng.isPaused()).toBe(false);
    // The SDK has not answered yet: no other ad meanwhile.
    expect(AdMng.isBusy()).toBe(true);
    expect(await AdMng.showRewarded()).toBe(false);
  });

  it('stops the game again when the ad starts late', async () => {
    const ad = manualAd<void>(platform, 'showInterstitial');
    const shown = AdMng.showInterstitial();
    await vi.advanceTimersByTimeAsync(START_TIMEOUT_MS);
    await shown;

    ad.start();
    expect(PauseMng.has('ad')).toBe(true);
    expect(PauseMng.isMuted()).toBe(true);

    ad.end();
    await vi.advanceTimersByTimeAsync(0);
    expect(PauseMng.isPaused()).toBe(false);
    expect(AdMng.isBusy()).toBe(false);
  });

  it('gives no reward when the rewarded ad does not start in time', async () => {
    const ad = manualAd<boolean>(platform, 'showRewarded');

    const watched = AdMng.showRewarded();
    await vi.advanceTimersByTimeAsync(START_TIMEOUT_MS);
    await expect(watched).resolves.toBe(false);

    ad.start();
    ad.end(true);
    await vi.advanceTimersByTimeAsync(0);
    expect(PauseMng.isPaused()).toBe(false);
  });

  it('does not time out an ad that has started', async () => {
    const ad = manualAd<boolean>(platform, 'showRewarded');

    const watched = AdMng.showRewarded();
    await vi.advanceTimersByTimeAsync(0);
    ad.start();
    await vi.advanceTimersByTimeAsync(START_TIMEOUT_MS * 6);
    expect(PauseMng.has('ad')).toBe(true);

    ad.end(true);
    await expect(watched).resolves.toBe(true);
  });

  it('keeps the interval between interstitials, and after loading', async () => {
    platform.interstitialIntervalMs = undefined;
    PlatformMng.loadingFinished();

    await AdMng.showInterstitial();
    expect(platform.showInterstitial).not.toHaveBeenCalled();

    vi.advanceTimersByTime(INTERVAL_MS);
    await AdMng.showInterstitial();
    await AdMng.showInterstitial();
    expect(platform.showInterstitial).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(INTERVAL_MS);
    await AdMng.showInterstitial();
    expect(platform.showInterstitial).toHaveBeenCalledTimes(2);
  });

  it('lets a platform that paces ads itself have every break', async () => {
    platform.interstitialIntervalMs = 0;
    PlatformMng.loadingFinished();

    await AdMng.showInterstitial();
    await AdMng.showInterstitial();

    expect(platform.showInterstitial).toHaveBeenCalledTimes(2);
  });

  it('restarts the interstitial interval after a rewarded ad', async () => {
    platform.interstitialIntervalMs = undefined;

    await AdMng.showRewarded();

    expect(AdMng.canShowInterstitial()).toBe(false);
  });

  it('shows one ad at a time', async () => {
    const ad = manualAd<boolean>(platform, 'showRewarded');

    const first = AdMng.showRewarded();
    expect(AdMng.isBusy()).toBe(true);
    await expect(AdMng.showRewarded()).resolves.toBe(false);
    await AdMng.showInterstitial();
    expect(platform.showInterstitial).not.toHaveBeenCalled();

    ad.start();
    ad.end(true);
    await expect(first).resolves.toBe(true);
    expect(AdMng.isBusy()).toBe(false);
  });

  it('gives no reward and resumes the game when the ad fails', async () => {
    platform.showRewarded.mockRejectedValue(new Error('no fill'));

    await expect(AdMng.showRewarded()).resolves.toBe(false);
    expect(PauseMng.isPaused()).toBe(false);
  });

  it('survives an adapter that throws', async () => {
    platform.showInterstitial.mockImplementation(() => {
      throw new Error('SDK bug');
    });

    await AdMng.showInterstitial();

    expect(PauseMng.isPaused()).toBe(false);
    expect(AdMng.isBusy()).toBe(false);
  });

  it('does nothing on a platform without ads', async () => {
    platform.hasAds = false;

    await AdMng.showInterstitial();

    expect(await AdMng.showRewarded()).toBe(false);
    expect(platform.showInterstitial).not.toHaveBeenCalled();
    expect(platform.showRewarded).not.toHaveBeenCalled();
  });
});
