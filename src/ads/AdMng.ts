import { Config } from '../data/Config';
import { PauseMng } from '../pause/PauseMng';
import { PlatformMng } from '../platform/PlatformMng';
import { LogMng } from '../utils/LogMng';

/**
 * Ads for the game code. One ad at a time.
 *
 * - From the request on the game stops (`adWait`), so the ad opens over the screen the player
 *   has left. The sound stops only when the ad really starts (`ad`): the SDK may answer that
 *   there is no ad (CrazyGames asks for it).
 * - An SDK that does not start the ad within `Config.ADS.START_TIMEOUT_MS` does not hold the
 *   game: it goes on as if there were no ad. If the ad still starts later, the game stops
 *   again until it is over.
 * - Interstitials keep `Config.ADS.INTERSTITIAL_INTERVAL_MS` apart and after the game has
 *   loaded, unless the platform paces them itself (`IPlatform.interstitialIntervalMs`).
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

  /** An ad is requested or on screen, or the SDK has not answered the last request yet. */
  static isBusy(): boolean {
    return AdMng.busy;
  }

  /**
   * Whether `showInterstitial()` would request an ad now. On platforms that pace ads
   * themselves the platform may still decide not to show it.
   */
  static canShowInterstitial(): boolean {
    const since = Math.max(AdMng.lastAdAt, PlatformMng.loadedAt ?? -Infinity);
    return (
      AdMng.isAvailable() && !AdMng.busy && Date.now() - since >= PlatformMng.interstitialIntervalMs
    );
  }

  /** Shows an interstitial if one can be shown now. Resolves when the game can continue. */
  static async showInterstitial(): Promise<void> {
    if (!AdMng.canShowInterstitial()) return;
    await AdMng.run('Interstitial', (started) => PlatformMng.showInterstitial(started), undefined);
  }

  /**
   * Shows a rewarded ad. Resolves with `true` if the reward should be given, `false` when there
   * is no ad: the player should be able to try again.
   */
  static async showRewarded(): Promise<boolean> {
    if (!AdMng.isAvailable() || AdMng.busy) return false;
    return AdMng.run('Rewarded ad', (started) => PlatformMng.showRewarded(started), false);
  }

  /** Forgets the time of the last ad. For tests. */
  static reset(): void {
    AdMng.busy = false;
    AdMng.lastAdAt = -Infinity;
  }

  /**
   * Requests an ad and resolves with its result, or with `noAd` if it has not started in time.
   * The game is free again once it resolves; `busy` lasts until the SDK answers.
   */
  private static run<T>(
    name: string,
    show: (started: () => void) => Promise<T>,
    noAd: T
  ): Promise<T> {
    AdMng.busy = true;
    PauseMng.pause('adWait');

    return new Promise<T>((resolve) => {
      let answered = false;
      let started = false;
      let finished = false;
      const answer = (value: T) => {
        if (answered) return;
        answered = true;
        resolve(value);
      };

      const timer = setTimeout(() => {
        LogMng.warn(`${name}: no ad in ${Config.ADS.START_TIMEOUT_MS} ms, the game goes on`);
        PauseMng.resume('adWait');
        answer(noAd);
      }, Config.ADS.START_TIMEOUT_MS);

      const onStarted = () => {
        if (started || finished) return;
        started = true;
        clearTimeout(timer);
        // Also after the timeout: the game has gone on, and stops again under the ad.
        PauseMng.pause('ad');
        PauseMng.resume('adWait');
      };

      const finish = (value: T) => {
        finished = true;
        clearTimeout(timer);
        if (answered && started) LogMng.warn(`${name}: shown after the game had gone on`);
        // A rewarded ad also restarts the interstitial timer: no two ads in a row.
        AdMng.lastAdAt = Date.now();
        PauseMng.resume('ad');
        PauseMng.resume('adWait');
        AdMng.busy = false;
        answer(value);
      };

      (async () => show(onStarted))().then(finish, (e: unknown) => {
        LogMng.warn(`${name} failed`, e);
        finish(noAd);
      });
    });
  }
}
