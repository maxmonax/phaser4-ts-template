import type { ISaveStorage } from '../../save/ISaveStorage';
import { KeyValueSaveStorage } from '../../save/KeyValueSaveStorage';
import { LogMng } from '../../utils/LogMng';
import type { IPlatform, PlatformHost } from '../IPlatform';
import type { CrazyGamesSDK } from './crazygames-sdk';

/**
 * CrazyGames, HTML5 SDK v3: https://docs.crazygames.com/sdk/intro/
 *
 * - Ads go only through the SDK. CrazyGames paces midgame ads itself
 *   and ignores requests that come too early.
 * - Between two levels: either a midgame ad or a "watch an ad to continue",
 *   not both (CrazyGames requirement).
 * - `settings.muteAudio` mutes the game; it wins over the in-game sound toggle.
 * - On localhost the SDK runs in the `local` environment: ads are an overlay.
 */
export class CrazyGamesPlatform implements IPlatform {
  readonly id = 'crazygames';
  readonly hasAds = true;
  readonly interstitialCooldownMs = 0;

  private sdk: CrazyGamesSDK | null = null;

  async init(host: PlatformHost): Promise<void> {
    const sdk = globalThis.CrazyGames?.SDK;
    if (!sdk) throw new Error('CrazyGames SDK is not loaded');

    await sdk.init();
    // Outside CrazyGames and localhost every SDK call throws.
    if (sdk.environment === 'disabled') throw new Error('CrazyGames SDK is disabled on this site');

    sdk.game.loadingStart();
    host.setMuted(sdk.game.settings.muteAudio);
    sdk.game.addSettingsChangeListener((settings) => host.setMuted(settings.muteAudio));
    this.sdk = sdk;
  }

  getLang(): string | null {
    return this.getSdk().user.systemInfo?.locale ?? null;
  }

  /** The SDK data module: synced to the player account. Without it, `localStorage`. */
  async createStorage(saveKey: string): Promise<ISaveStorage> {
    const data = this.getSdk().data;
    try {
      // Throws when "Progress Save" is turned off for the game.
      data.getItem(saveKey);
      return new KeyValueSaveStorage(data, saveKey);
    } catch (e) {
      LogMng.warn('CrazyGames data module is not available, localStorage is used', e);
      return KeyValueSaveStorage.local(saveKey);
    }
  }

  loadingFinished(): void {
    this.getSdk().game.loadingStop();
  }

  gameplayStart(): void {
    this.getSdk().game.gameplayStart();
  }

  gameplayStop(): void {
    this.getSdk().game.gameplayStop();
  }

  showInterstitial(): Promise<void> {
    return this.requestAd('midgame').then(() => undefined);
  }

  showRewarded(): Promise<boolean> {
    return this.requestAd('rewarded');
  }

  /** Resolves with `true` when the ad was watched to the end. */
  private requestAd(type: 'midgame' | 'rewarded'): Promise<boolean> {
    const sdk = this.getSdk();
    return new Promise((resolve) => {
      sdk.ad.requestAd(type, {
        adFinished: () => resolve(true),
        adError: (error) => {
          // `unfilled` and `adCooldown` are normal: there is just no ad now.
          LogMng.debug(`CrazyGames: ${type} ad not shown: ${error.code}`);
          resolve(false);
        },
      });
    });
  }

  private getSdk(): CrazyGamesSDK {
    if (!this.sdk) throw new Error('CrazyGamesPlatform: init() has not completed');
    return this.sdk;
  }
}
