import type { Player, SDK } from 'ysdk';
import { Config } from '../../data/Config';
import type { ISaveStorage, SaveRecord } from '../../save/ISaveStorage';
import { KeyValueSaveStorage } from '../../save/KeyValueSaveStorage';
import { LogMng } from '../../utils/LogMng';
import type { IPlatform, PlatformHost } from '../IPlatform';

/** Players of these languages get Russian when the game lacks their language, the rest English. */
const RUSSIAN_FALLBACK = new Set(['be', 'kk', 'uk', 'uz']);

/** On a desktop the long side of the game field is at most twice the short one. */
const DESKTOP_MAX_ASPECT = 2;

/**
 * Yandex Games: https://yandex.ru/dev/games/doc/ru/sdk/sdk-about
 *
 * Requirements this adapter covers:
 * - language from `environment.i18n.lang`, at startup (2.14); a language the game lacks
 *   gets the Yandex fallback: Russian for `be`, `kk`, `uk`, `uz`, English for the rest
 *   (https://yandex.ru/dev/games/doc/ru/concepts/languages-and-domains);
 * - on a desktop the game field is at most 2:1 (1.6.2.1, 1.6.2.2);
 * - `LoadingAPI.ready()` once, when the player can start playing (1.19.2);
 * - `GameplayAPI.start()` / `stop()` and `game_api_pause` / `game_api_resume`
 *   are optional, but must follow the docs when used: PlatformMng reports gameplay
 *   only while the game is not paused (ads, hidden tab, these events). On these events
 *   the SDK calls `stop()` and `start()` itself (`pauseStopsGameplay`).
 *
 * Yandex paces fullscreen ads itself as well: a request that comes too early is closed
 * at once without an ad.
 */
export class YandexPlatform implements IPlatform {
  readonly id = 'yandex';
  readonly hasAds = true;
  readonly pauseStopsGameplay = true;

  private sdk: SDK | null = null;

  constructor(private readonly leaderboard: string = Config.YANDEX_LEADERBOARD) {}

  async init(host: PlatformHost): Promise<void> {
    if (typeof YaGames === 'undefined') {
      throw new Error('Yandex Games SDK is not loaded (/sdk.js)');
    }
    const sdk = await YaGames.init();
    sdk.on('game_api_pause', () => host.setPaused(true));
    sdk.on('game_api_resume', () => host.setPaused(false));
    this.sdk = sdk;
  }

  getLangs(): readonly string[] {
    const lang = this.getSdk().environment.i18n.lang;
    if (!lang) return [];
    const base = lang.toLowerCase().split('-')[0];
    return [lang, RUSSIAN_FALLBACK.has(base) ? 'ru' : 'en'];
  }

  getMaxAspect(): number | null {
    return this.getSdk().deviceInfo.isDesktop() ? DESKTOP_MAX_ASPECT : null;
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

  showInterstitial(started: () => void): Promise<void> {
    const sdk = this.getSdk();
    return new Promise((resolve) => {
      sdk.adv.showFullscreenAdv({
        callbacks: {
          onOpen: started,
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

  showRewarded(started: () => void): Promise<boolean> {
    const sdk = this.getSdk();
    return new Promise((resolve) => {
      let rewarded = false;
      sdk.adv.showRewardedVideo({
        callbacks: {
          onOpen: started,
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

  /**
   * The player's entry in `Config.YANDEX_LEADERBOARD`. `null` for a guest, who may not have
   * one, and when the game has no leaderboard. A leaderboard missing from the console throws.
   */
  async readScore(): Promise<number | null> {
    const sdk = this.getSdk();
    if (!this.leaderboard || !(await sdk.isAvailableMethod('leaderboards.getPlayerEntry'))) {
      return null;
    }
    try {
      const entry = await sdk.leaderboards.getPlayerEntry(this.leaderboard);
      return Number.isFinite(entry.score) ? entry.score : 0;
    } catch (e) {
      if ((e as { code?: unknown } | null)?.code === 'LEADERBOARD_PLAYER_NOT_PRESENT') return 0;
      throw e;
    }
  }

  async writeScore(score: number): Promise<boolean> {
    const sdk = this.getSdk();
    if (!this.leaderboard || !(await sdk.isAvailableMethod('leaderboards.setScore'))) {
      return false;
    }
    await sdk.leaderboards.setScore(this.leaderboard, score);
    return true;
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
