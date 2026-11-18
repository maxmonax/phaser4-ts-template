import type { Player, SDK } from 'ysdk';
import type { ISaveStorage, SaveRecord } from '../../save/ISaveStorage';
import { KeyValueSaveStorage } from '../../save/KeyValueSaveStorage';
import { LogMng } from '../../utils/LogMng';
import type { IPlatform, PlatformHost } from '../IPlatform';

/**
 * Yandex Games: https://yandex.ru/dev/games/doc/ru/sdk/sdk-about
 *
 * Requirements this adapter covers:
 * - language from `environment.i18n.lang` (2.14);
 * - `LoadingAPI.ready()` once, when the player can start playing (1.19.2);
 * - `GameplayAPI.start()` / `stop()` and `game_api_pause` / `game_api_resume`
 *   are optional, but must follow the docs when used: PlatformMng reports gameplay
 *   only while the game is not paused (ads, hidden tab, these events).
 */
export class YandexPlatform implements IPlatform {
  readonly id = 'yandex';
  readonly hasAds = true;
  /**
   * Yandex shows a fullscreen ad not more often than the interval set in the
   * developer console. Keep this value in line with it: then the game knows
   * in advance whether an ad will be shown (e.g. to show `AdShower`).
   */
  readonly interstitialCooldownMs = 60_000;

  private sdk: SDK | null = null;

  async init(host: PlatformHost): Promise<void> {
    if (typeof YaGames === 'undefined') {
      throw new Error('Yandex Games SDK is not loaded (/sdk.js)');
    }
    const sdk = await YaGames.init();
    sdk.on('game_api_pause', () => host.setPaused(true));
    sdk.on('game_api_resume', () => host.setPaused(false));
    this.sdk = sdk;
  }

  getLang(): string | null {
    return this.getSdk().environment.i18n.lang;
  }

  /**
   * Player data on Yandex servers. If it is not available, the SDK safe storage:
   * unlike `localStorage`, it survives iOS clearing site data.
   */
  async createStorage(saveKey: string): Promise<ISaveStorage> {
    const sdk = this.getSdk();
    try {
      return new YandexPlayerStorage(await sdk.getPlayer(), saveKey);
    } catch (e) {
      LogMng.warn('Yandex player data is not available, the SDK safe storage is used', e);
      return new KeyValueSaveStorage(await sdk.getStorage(), saveKey);
    }
  }

  loadingFinished(): void {
    this.getSdk().features.LoadingAPI?.ready();
  }

  gameplayStart(): void {
    this.getSdk().features.GameplayAPI?.start();
  }

  gameplayStop(): void {
    this.getSdk().features.GameplayAPI?.stop();
  }

  showInterstitial(): Promise<void> {
    const sdk = this.getSdk();
    return new Promise((resolve) => {
      sdk.adv.showFullscreenAdv({
        callbacks: {
          // Also called after an error and when the ad is skipped as too frequent.
          onClose: () => resolve(),
          onError: (error) => {
            LogMng.warn('Yandex: interstitial error', error);
            resolve();
          },
          onOffline: () => resolve(),
        },
      });
    });
  }

  showRewarded(): Promise<boolean> {
    const sdk = this.getSdk();
    return new Promise((resolve) => {
      let rewarded = false;
      sdk.adv.showRewardedVideo({
        callbacks: {
          onRewarded: () => {
            rewarded = true;
          },
          onClose: () => resolve(rewarded),
          onError: (error) => {
            LogMng.warn('Yandex: rewarded ad error', error);
            resolve(false);
          },
        },
      });
    });
  }

  private getSdk(): SDK {
    if (!this.sdk) throw new Error('YandexPlatform: init() has not completed');
    return this.sdk;
  }
}

/** Keeps the record in the Yandex player data under one key. */
class YandexPlayerStorage implements ISaveStorage {
  constructor(
    private readonly player: Player,
    private readonly key: string
  ) {}

  async load(): Promise<SaveRecord | null> {
    const data = await this.player.getData([this.key]);
    const record: unknown = data[this.key];
    return typeof record === 'object' && record !== null && !Array.isArray(record)
      ? (record as SaveRecord)
      : null;
  }

  async save(data: SaveRecord, flush: boolean): Promise<void> {
    // Without flush the SDK queues the data and sends it on its own:
    // the player data API has a limit on requests.
    await this.player.setData({ [this.key]: data }, flush);
  }
}
