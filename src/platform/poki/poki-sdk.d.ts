/**
 * The part of the Poki HTML5 SDK that the adapter uses.
 * Docs: https://developers.poki.com/guide/sdk-html5 (no official type package).
 */
export interface PokiSDKApi {
  /** Rejects when an ad blocker is on: the game should load anyway. */
  init(): Promise<void>;
  gameLoadingFinished(): void;
  gameplayStart(): void;
  gameplayStop(): void;
  /** Resolves when the break is over; Poki decides whether an ad is actually shown. */
  commercialBreak(onStart?: () => void): Promise<void>;
  /** Resolves with `true` when the reward should be given. */
  rewardedBreak(onStart?: () => void): Promise<boolean>;
  /** Player language as a lowercase base code: `en`, `pt`, ... */
  getLanguage(): string;
  /**
   * A game event for Poki statistics, e.g. `measure('level', '3', 'start')`. Actions with
   * a meaning: `start`, `complete`, `fail`; one attempt gets either `complete` or `fail`.
   * No `/` or `^` in the values.
   */
  measure(category: string, what: string, action: string): void;
}

declare global {
  var PokiSDK: PokiSDKApi | undefined;
}
