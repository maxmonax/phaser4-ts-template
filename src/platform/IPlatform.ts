import type { ISaveStorage } from '../save/ISaveStorage';
import type { PlatformId } from './platforms';

/** Requests from the platform to the game. */
export type PlatformHost = {
  /** The platform asks to pause or resume the game (e.g. Yandex `game_api_pause`). */
  setPaused(paused: boolean): void;
  /** The platform asks to mute or unmute the game (e.g. CrazyGames `settings.muteAudio`). */
  setMuted(muted: boolean): void;
};

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
   * Minimal time between interstitials that the game keeps itself.
   * `0` when the platform paces ads on its own and ignores requests that come too early.
   */
  readonly interstitialCooldownMs: number;

  /** Initializes the SDK. Rejects if the SDK is not available. */
  init(host: PlatformHost): Promise<void>;
  /** Language the platform suggests for the player (BCP 47 tag or a base code), or `null`. */
  getLang(): string | null;
  /** Storage for `SaveMng`. Called once, after `init()`. */
  createStorage(saveKey: string): Promise<ISaveStorage>;

  /** The game is loaded and the player can start playing. Called once. */
  loadingFinished(): void;
  /** The player is playing now: not in a menu, not paused, no ad on screen. */
  gameplayStart(): void;
  gameplayStop(): void;

  /** Resolves when the ad is closed or was not shown. */
  showInterstitial(): Promise<void>;
  /** Resolves with `true` if the player watched the ad and earned the reward. */
  showRewarded(): Promise<boolean>;
}
