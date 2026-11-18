/**
 * The part of the CrazyGames HTML5 SDK v3 that the adapter uses.
 * Docs: https://docs.crazygames.com/sdk/intro/ (no official type package).
 */

export type CrazyGamesAdError = {
  /** `adsDisabled`, `unfilled`, `adblock`, `adCooldown`, `other`. */
  code: string;
  message: string;
};

export type CrazyGamesAdCallbacks = {
  adStarted?: () => void;
  adFinished?: () => void;
  /** Also called when there is no ad to show. */
  adError?: (error: CrazyGamesAdError) => void;
};

export type CrazyGamesSettings = {
  /** The player muted the game in the CrazyGames UI: overrides in-game sound toggles. */
  muteAudio: boolean;
  disableChat: boolean;
};

export interface CrazyGamesSDK {
  init(): Promise<void>;
  /** `local` on localhost (ads are replaced by an overlay), `disabled` outside CrazyGames. */
  readonly environment: 'local' | 'crazygames' | 'disabled';
  game: {
    loadingStart(): void;
    loadingStop(): void;
    gameplayStart(): void;
    gameplayStop(): void;
    readonly settings: CrazyGamesSettings;
    addSettingsChangeListener(listener: (settings: CrazyGamesSettings) => void): void;
  };
  ad: {
    requestAd(type: 'midgame' | 'rewarded', callbacks: CrazyGamesAdCallbacks): void;
  };
  /** Same API as localStorage. Needs "Progress Save" turned on when the game is submitted. */
  data: Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'clear'>;
  user: {
    readonly systemInfo?: {
      /** E.g. `en-US`. */
      locale?: string;
      countryCode?: string;
    };
  };
}

declare global {
  var CrazyGames: { SDK: CrazyGamesSDK } | undefined;
}
