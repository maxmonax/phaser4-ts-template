import { PauseMng } from '../pause/PauseMng';
import type { ISaveStorage } from '../save/ISaveStorage';
import { KeyValueSaveStorage } from '../save/KeyValueSaveStorage';
import { withTimeout } from '../utils/async';
import { LogMng } from '../utils/LogMng';
import { createPlatform } from './createPlatform';
import type { IPlatform, PlatformHost } from './IPlatform';
import type { PlatformId } from './platforms';
import { WebPlatform } from './web/WebPlatform';

const INIT_TIMEOUT_MS = 10_000;
const STORAGE_TIMEOUT_MS = 5_000;

/**
 * The platform the game runs on, as the game sees it.
 *
 * - An SDK error never breaks the game: if the SDK does not load or fails to
 *   initialize, the game continues on the web platform without ads.
 * - `loadingFinished()` reaches the SDK once, whoever calls it.
 * - The game says when the player is in gameplay; the SDK hears about it only
 *   while the game is not paused (an ad, a hidden tab, the rotate overlay).
 */
export class PlatformMng {
  private static platform: IPlatform = new WebPlatform(false);
  private static loadingReported = false;
  private static gameplayWanted = false;
  private static gameplayReported = false;
  private static offPause: (() => void) | null = null;

  /**
   * Call once at startup, before the game starts.
   * @param platform for tests; by default the platform of the build is used.
   */
  static async init(host: PlatformHost, platform?: IPlatform): Promise<void> {
    PlatformMng.loadingReported = false;
    PlatformMng.gameplayWanted = false;
    PlatformMng.gameplayReported = false;
    PlatformMng.offPause?.();

    const candidate = platform ?? (await createPlatform());
    try {
      await withTimeout(candidate.init(host), INIT_TIMEOUT_MS, `${candidate.id} SDK init`);
      PlatformMng.platform = candidate;
      LogMng.debug(`platform: ${candidate.id}`);
    } catch (e) {
      LogMng.error(`Platform "${candidate.id}" is not available, the game runs without it`, e);
      PlatformMng.platform = new WebPlatform(false);
    }

    PlatformMng.offPause = PauseMng.onChange(() => PlatformMng.updateGameplay());
  }

  static get id(): PlatformId {
    return PlatformMng.platform.id;
  }

  static get hasAds(): boolean {
    return PlatformMng.platform.hasAds;
  }

  static get interstitialCooldownMs(): number {
    return PlatformMng.platform.interstitialCooldownMs;
  }

  static getLang(): string | null {
    return PlatformMng.call('getLang', () => PlatformMng.platform.getLang()) ?? null;
  }

  /** Storage for `SaveMng`. Falls back to `localStorage` if the platform storage fails. */
  static async createStorage(saveKey: string): Promise<ISaveStorage> {
    try {
      return await withTimeout(
        PlatformMng.platform.createStorage(saveKey),
        STORAGE_TIMEOUT_MS,
        'Platform storage'
      );
    } catch (e) {
      LogMng.error('Platform storage is not available, localStorage is used', e);
      return KeyValueSaveStorage.local(saveKey);
    }
  }

  /** The game is loaded and the player can start playing. Only the first call counts. */
  static loadingFinished(): void {
    if (PlatformMng.loadingReported) return;
    PlatformMng.loadingReported = true;
    PlatformMng.call('loadingFinished', () => PlatformMng.platform.loadingFinished());
  }

  /** The player has entered gameplay: a level or a round has started. */
  static gameplayStart(): void {
    PlatformMng.gameplayWanted = true;
    PlatformMng.updateGameplay();
  }

  /** The player has left gameplay: a level is over, a menu is open. */
  static gameplayStop(): void {
    PlatformMng.gameplayWanted = false;
    PlatformMng.updateGameplay();
  }

  static isGameplay(): boolean {
    return PlatformMng.gameplayReported;
  }

  /** Use `AdMng.showInterstitial()` in the game: it pauses the game around the ad. */
  static showInterstitial(): Promise<void> {
    return PlatformMng.platform.showInterstitial();
  }

  /** Use `AdMng.showRewarded()` in the game: it pauses the game around the ad. */
  static showRewarded(): Promise<boolean> {
    return PlatformMng.platform.showRewarded();
  }

  private static updateGameplay(): void {
    const active = PlatformMng.gameplayWanted && !PauseMng.isPaused();
    if (active === PlatformMng.gameplayReported) return;
    PlatformMng.gameplayReported = active;
    if (active) PlatformMng.call('gameplayStart', () => PlatformMng.platform.gameplayStart());
    else PlatformMng.call('gameplayStop', () => PlatformMng.platform.gameplayStop());
  }

  /** Runs an SDK call; an exception is logged instead of breaking the game. */
  private static call<T>(name: string, fn: () => T): T | undefined {
    try {
      return fn();
    } catch (e) {
      LogMng.error(`Platform "${PlatformMng.platform.id}": ${name}() failed`, e);
      return undefined;
    }
  }
}
