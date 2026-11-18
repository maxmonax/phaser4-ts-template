import { PauseMng } from '../pause/PauseMng';
import { PlatformMng } from '../platform/PlatformMng';
import { LogMng } from '../utils/LogMng';

/**
 * Ads for the game code. One ad at a time; the game is paused (and muted)
 * while an ad is on screen, whatever the platform SDK does.
 *
 * ```ts
 * await AdMng.showInterstitial(); // at a natural break: before a new round, between levels
 * if (await AdMng.showRewarded()) giveReward();
 * ```
 */
export class AdMng {
  private static busy = false;
  private static lastAdAt = -Infinity;

  /** Whether the platform shows ads at all. Hide rewarded buttons when it does not. */
  static isAvailable(): boolean {
    return PlatformMng.hasAds;
  }

  static isBusy(): boolean {
    return AdMng.busy;
  }

  /**
   * Whether `showInterstitial()` would request an ad now. On platforms that pace ads
   * themselves the platform may still decide not to show it.
   */
  static canShowInterstitial(): boolean {
    return (
      AdMng.isAvailable() &&
      !AdMng.busy &&
      Date.now() - AdMng.lastAdAt >= PlatformMng.interstitialCooldownMs
    );
  }

  /** Shows an interstitial if one can be shown now. Resolves when the game can continue. */
  static async showInterstitial(): Promise<void> {
    if (!AdMng.canShowInterstitial()) return;
    await AdMng.run('Interstitial', () => PlatformMng.showInterstitial(), undefined);
  }

  /** Shows a rewarded ad. Resolves with `true` if the reward should be given. */
  static async showRewarded(): Promise<boolean> {
    if (!AdMng.isAvailable() || AdMng.busy) return false;
    return AdMng.run('Rewarded ad', () => PlatformMng.showRewarded(), false);
  }

  /** Forgets the time of the last ad. For tests. */
  static reset(): void {
    AdMng.busy = false;
    AdMng.lastAdAt = -Infinity;
  }

  private static async run<T>(name: string, show: () => Promise<T>, onError: T): Promise<T> {
    AdMng.busy = true;
    PauseMng.pause('ad');
    try {
      return await show();
    } catch (e) {
      LogMng.warn(`${name} failed`, e);
      return onError;
    } finally {
      // A rewarded ad also restarts the interstitial timer: no two ads in a row.
      AdMng.lastAdAt = Date.now();
      PauseMng.resume('ad');
      AdMng.busy = false;
    }
  }
}
