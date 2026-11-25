import type { ISaveStorage } from '../save/ISaveStorage';
import type { PlatformId } from './platforms';

/** Requests from the platform to the game. */
export type PlatformHost = {
  /** The platform asks to pause or resume the game (e.g. Yandex `game_api_pause`). */
  setPaused(paused: boolean): void;
  /** The platform asks to mute or unmute the game (e.g. CrazyGames `settings.muteAudio`). */
  setMuted(muted: boolean): void;
};

/** How an attempt at a level goes, for the portal's statistics. */
export type LevelAction = 'start' | 'complete' | 'fail';

/**
 * Adapter of one game portal SDK. The game does not call it directly:
 * `PlatformMng` adds the safety around it and `AdMng` handles ads.
 *
 * To add a platform: implement this interface in `src/platform/<id>/`,
 * add the id and the SDK script to `PLATFORMS` and a branch to `createPlatform()`.
 */
export interface IPlatform {
  readonly id: PlatformId;
  /** Whether the platform shows ads. Without ads, rewarded buttons should be hidden. */
  readonly hasAds: boolean;
  /**
   * The shortest time between two interstitials that the game keeps itself, if it differs from
   * `Config.ADS.INTERSTITIAL_INTERVAL_MS`. `0` for a platform that paces ads on its own and
   * wants an ad break at every natural pause (Poki).
   */
  readonly interstitialIntervalMs?: number;
  /**
   * The SDK stops gameplay itself when it pauses the game, and starts it again on resume if
   * it was going (Yandex: `GameplayAPI` on `game_api_pause` and `game_api_resume`). Then
   * `PlatformMng` does not repeat these calls.
   */
  readonly pauseStopsGameplay?: boolean;

  /** Initializes the SDK. Rejects if the SDK is not available. */
  init(host: PlatformHost): Promise<void>;
  /**
   * Languages the platform asks the game to open in, the first one preferred: the player's
   * language (BCP 47 tag or a base code), then the platform's fallback for a language the game
   * does not have. Empty when the platform has no say.
   */
  getLangs(): readonly string[];
  /**
   * How much longer than wide (or wider than long) the game field may be on this device:
   * `2` for 2:1. `null`: no limit, the field fills the window.
   */
  getMaxAspect?(): number | null;
  /** Storage for `SaveMng`. Called once, after `init()`. */
  createStorage(saveKey: string): Promise<ISaveStorage>;

  /** The game is loaded and the player can start playing. Called once. */
  loadingFinished(): void;
  /** The player is playing now: not in a menu, not paused, no ad on screen. */
  gameplayStart(): void;
  gameplayStop(): void;
  /** Level statistics of the portal (Poki `measure`). Called once per action and attempt. */
  levelEvent?(level: string, action: LevelAction): void;

  /**
   * Shows an interstitial and resolves when it is closed or was not shown. Calls `started`
   * when the ad is on screen; an SDK that does not tell it reliably calls it at once, and the
   * game is then muted from the request on.
   */
  showInterstitial(started: () => void): Promise<void>;
  /** Same as `showInterstitial()`; resolves with `true` if the player earned the reward. */
  showRewarded(started: () => void): Promise<boolean>;

  /**
   * The player's result on the leaderboard: `0` when there is none yet, `null` when the player
   * cannot have one (a guest, no leaderboard). Platforms without leaderboards leave it out.
   */
  readScore?(): Promise<number | null>;
  /** Replaces the player's result. Resolves with `false` when the player may not write one. */
  writeScore?(score: number): Promise<boolean>;
}
