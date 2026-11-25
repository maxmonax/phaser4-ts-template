import { Config } from '../data/Config';
import { PauseMng } from '../pause/PauseMng';
import type { ISaveStorage } from '../save/ISaveStorage';
import { KeyValueSaveStorage } from '../save/KeyValueSaveStorage';
import { withTimeout } from '../utils/async';
import { LogMng } from '../utils/LogMng';
import { createPlatform } from './createPlatform';
import type { IPlatform, LevelAction, PlatformHost } from './IPlatform';
import type { PlatformId } from './platforms';
import { ScoreSync } from './ScoreSync';
import { WebPlatform } from './web/WebPlatform';

/**
 * The game waits this long for the SDK at startup: for its language and its storage.
 * Then it starts without them, and the SDK joins when it is ready.
 */
const START_WAIT_MS = 5_000;
/** An SDK that has not initialized by then is given up. */
const INIT_TIMEOUT_MS = 30_000;
const STORAGE_TIMEOUT_MS = 5_000;

/**
 * The platform the game runs on, as the game sees it.
 *
 * - An SDK error never breaks the game: if the SDK does not load or fails to
 *   initialize, the game continues on the web platform without ads.
 * - A slow SDK does not hold the game: after `START_WAIT_MS` the game starts without it,
 *   in the browser language and with `localStorage`. The SDK joins when it is ready and
 *   hears what it has missed: loading finished, gameplay going.
 * - `loadingFinished()` reaches the SDK once, whoever calls it.
 * - The game says when the player is in gameplay; the SDK hears about it only
 *   while the game is not paused (an ad, a hidden tab, the rotate overlay), and never
 *   twice in a row.
 */
export class PlatformMng {
  private static platform: IPlatform = new WebPlatform(false);
  /** Bumped by every `init()`: an SDK of an earlier `init()` that answers late is ignored. */
  private static generation = 0;
  private static loadedAtMs: number | null = null;
  private static gameplayWanted = false;
  private static gameplayReported = false;
  /** Gameplay was reported when the platform paused the game, see `pauseStopsGameplay`. */
  private static gameplayBeforePlatformPause = false;
  /** The level of the attempt in progress, see `levelStart()`. */
  private static level: string | null = null;
  private static bestScore = 0;
  private static scores: ScoreSync | null = null;
  private static offPause: (() => void) | null = null;

  /**
   * Call once at startup, before the game starts. Resolves when the SDK is ready, has failed,
   * or after `START_WAIT_MS`, whichever comes first.
   * @param setMuted the platform asks to mute or unmute the game.
   * @param platform for tests; by default the platform of the build is used.
   */
  static async init(setMuted: (muted: boolean) => void, platform?: IPlatform): Promise<void> {
    const generation = ++PlatformMng.generation;
    PlatformMng.platform = new WebPlatform(false);
    PlatformMng.loadedAtMs = null;
    PlatformMng.gameplayWanted = false;
    PlatformMng.gameplayReported = false;
    PlatformMng.level = null;
    PlatformMng.bestScore = 0;
    PlatformMng.scores = null;
    PlatformMng.offPause?.();
    PlatformMng.offPause = PauseMng.onChange(() => PlatformMng.updateGameplay());

    const current = () => generation === PlatformMng.generation;
    const candidate = platform ?? (await createPlatform());
    const host: PlatformHost = {
      setPaused: (paused) => {
        if (current()) PlatformMng.setPlatformPaused(paused);
      },
      setMuted,
    };

    const settled = withTimeout(
      (async () => candidate.init(host))(),
      INIT_TIMEOUT_MS,
      `${candidate.id} SDK init`
    ).then(
      () => {
        if (current()) PlatformMng.attach(candidate);
        return true;
      },
      (e: unknown) => {
        if (current()) {
          LogMng.error(`Platform "${candidate.id}" is not available, the game runs without it`, e);
        }
        return true;
      }
    );

    let timer: ReturnType<typeof setTimeout> | undefined;
    const late = new Promise<false>((resolve) => {
      timer = setTimeout(() => resolve(false), START_WAIT_MS);
    });
    const inTime = await Promise.race([settled, late]);
    clearTimeout(timer);
    if (!inTime) {
      LogMng.warn(`Platform "${candidate.id}": the SDK is slow, the game starts without it`);
    }
  }

  static get id(): PlatformId {
    return PlatformMng.platform.id;
  }

  static get hasAds(): boolean {
    return PlatformMng.platform.hasAds;
  }

  /** The shortest time between two interstitials, see `Config.ADS.INTERSTITIAL_INTERVAL_MS`. */
  static get interstitialIntervalMs(): number {
    return PlatformMng.platform.interstitialIntervalMs ?? Config.ADS.INTERSTITIAL_INTERVAL_MS;
  }

  /** When `loadingFinished()` was first called (`Date.now()`), or `null` before that. */
  static get loadedAt(): number | null {
    return PlatformMng.loadedAtMs;
  }

  /** Languages the platform asks for, the first one preferred; see `IPlatform.getLangs()`. */
  static getLangs(): readonly string[] {
    return PlatformMng.call('getLangs', () => PlatformMng.platform.getLangs()) ?? [];
  }

  /** The longest side of the game field to its shortest at most, or `null`: no limit. */
  static getMaxAspect(): number | null {
    const platform = PlatformMng.platform;
    return PlatformMng.call('getMaxAspect', () => platform.getMaxAspect?.()) ?? null;
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
    if (PlatformMng.loadedAtMs !== null) return;
    PlatformMng.loadedAtMs = Date.now();
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

  /**
   * An attempt at a level begins, for the portal's statistics (Poki). An attempt that is
   * still going is counted as failed first: a restart, a new level.
   */
  static levelStart(level: string | number): void {
    PlatformMng.levelEnd(false);
    PlatformMng.level = String(level);
    PlatformMng.levelEvent(PlatformMng.level, 'start');
  }

  /**
   * The attempt is over: won, or lost and left. Only the first call after `levelStart()`
   * counts, so it is safe to call it when the player leaves the level for a menu.
   */
  static levelEnd(won: boolean): void {
    const level = PlatformMng.level;
    if (level === null) return;
    PlatformMng.level = null;
    PlatformMng.levelEvent(level, won ? 'complete' : 'fail');
  }

  /**
   * Offers the player's best result to the platform leaderboard (Yandex, when
   * `Config.YANDEX_LEADERBOARD` is set). Only a result higher than the one on the platform
   * is written. Call it when the game appears and after a new record; no need to wait.
   */
  static reportScore(score: number): Promise<void> {
    PlatformMng.bestScore = Math.max(PlatformMng.bestScore, score);
    const platform = PlatformMng.platform;
    if (!platform.readScore || !platform.writeScore) return Promise.resolve();
    PlatformMng.scores ??= new ScoreSync({
      read: () => platform.readScore?.() ?? Promise.resolve(null),
      write: (value) => platform.writeScore?.(value) ?? Promise.resolve(false),
    });
    return PlatformMng.scores.report(score);
  }

  /** Use `AdMng.showInterstitial()` in the game: it pauses the game around the ad. */
  static showInterstitial(started: () => void): Promise<void> {
    return PlatformMng.platform.showInterstitial(started);
  }

  /** Use `AdMng.showRewarded()` in the game: it pauses the game around the ad. */
  static showRewarded(started: () => void): Promise<boolean> {
    return PlatformMng.platform.showRewarded(started);
  }

  /** The SDK has initialized: from now on the game talks to it. */
  private static attach(platform: IPlatform): void {
    PlatformMng.platform = platform;
    LogMng.debug(`platform: ${platform.id}`);
    // An SDK that joins late has missed what happened meanwhile.
    if (PlatformMng.loadedAtMs !== null) {
      PlatformMng.call('loadingFinished', () => platform.loadingFinished());
    }
    if (PlatformMng.gameplayReported) {
      PlatformMng.call('gameplayStart', () => platform.gameplayStart());
    }
    if (PlatformMng.level !== null) PlatformMng.levelEvent(PlatformMng.level, 'start');
    if (PlatformMng.bestScore > 0) void PlatformMng.reportScore(PlatformMng.bestScore);
  }

  /**
   * The platform pauses or resumes the game. An SDK with `pauseStopsGameplay` reports
   * gameplay itself meanwhile: the game does not repeat its calls, it only follows its state.
   */
  private static setPlatformPaused(paused: boolean): void {
    if (paused === PauseMng.has('platform')) return;
    if (PlatformMng.platform.pauseStopsGameplay) {
      if (paused) {
        PlatformMng.gameplayBeforePlatformPause = PlatformMng.gameplayReported;
        PlatformMng.gameplayReported = false;
      } else {
        PlatformMng.gameplayReported = PlatformMng.gameplayBeforePlatformPause;
      }
    }
    PauseMng.set('platform', paused);
    // Another pause may still be on, or the player may have left gameplay meanwhile.
    PlatformMng.updateGameplay();
  }

  private static updateGameplay(): void {
    const active = PlatformMng.gameplayWanted && !PauseMng.isPaused();
    if (active === PlatformMng.gameplayReported) return;
    PlatformMng.gameplayReported = active;
    if (active) PlatformMng.call('gameplayStart', () => PlatformMng.platform.gameplayStart());
    else PlatformMng.call('gameplayStop', () => PlatformMng.platform.gameplayStop());
  }

  private static levelEvent(level: string, action: LevelAction): void {
    const platform = PlatformMng.platform;
    if (platform.levelEvent) {
      PlatformMng.call('levelEvent', () => platform.levelEvent?.(level, action));
    }
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
