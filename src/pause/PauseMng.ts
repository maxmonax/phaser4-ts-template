/**
 * Why the game is paused. Each source pauses and resumes only its own reason.
 *
 * - `orientation` — the "rotate your device" overlay is shown;
 * - `adWait` — an ad is requested and the game waits for the SDK to answer: the game stops,
 *   but the sound plays on until the ad really starts (CrazyGames asks for it: an ad may not
 *   come at all);
 * - `ad` — an ad is on screen;
 * - `platform` — the game portal asked to pause (e.g. Yandex `game_api_pause`);
 * - `hidden` — the browser tab is hidden.
 */
export type PauseReason = 'orientation' | 'adWait' | 'ad' | 'platform' | 'hidden';

/** Reasons that stop the game but leave the sound on. */
const AUDIBLE_REASONS: ReadonlySet<PauseReason> = new Set(['adWait']);

type PauseListener = (paused: boolean) => void;
type MuteListener = (muted: boolean) => void;

/**
 * Single point of pausing the game.
 *
 * The game is paused while at least one reason is active. Sources do not
 * interfere: when the overlay is closed during an ad, the game stays paused
 * until the ad is over too. The sound is off while a reason other than
 * `adWait` is active.
 *
 * It does not depend on Phaser: `bindGamePause()` connects it to the game.
 */
export class PauseMng {
  private static reasons = new Set<PauseReason>();
  private static listeners = new Set<PauseListener>();
  private static muteListeners = new Set<MuteListener>();

  static pause(reason: PauseReason): void {
    PauseMng.set(reason, true);
  }

  static resume(reason: PauseReason): void {
    PauseMng.set(reason, false);
  }

  /** Adds or removes the reason: `set('ad', true)` is the same as `pause('ad')`. */
  static set(reason: PauseReason, active: boolean): void {
    const wasPaused = PauseMng.isPaused();
    const wasMuted = PauseMng.isMuted();
    if (active) PauseMng.reasons.add(reason);
    else PauseMng.reasons.delete(reason);

    const paused = PauseMng.isPaused();
    if (paused !== wasPaused) {
      for (const listener of Array.from(PauseMng.listeners)) listener(paused);
    }
    const muted = PauseMng.isMuted();
    if (muted !== wasMuted) {
      for (const listener of Array.from(PauseMng.muteListeners)) listener(muted);
    }
  }

  static isPaused(): boolean {
    return PauseMng.reasons.size > 0;
  }

  /** Whether the sound must be off: a pause for any reason but `adWait`. */
  static isMuted(): boolean {
    for (const reason of PauseMng.reasons) {
      if (!AUDIBLE_REASONS.has(reason)) return true;
    }
    return false;
  }

  static has(reason: PauseReason): boolean {
    return PauseMng.reasons.has(reason);
  }

  /** The listener is called on every change between paused and running. */
  static onChange(listener: PauseListener): () => void {
    PauseMng.listeners.add(listener);
    return () => PauseMng.listeners.delete(listener);
  }

  /** The listener is called on every change of `isMuted()`. */
  static onMuteChange(listener: MuteListener): () => void {
    PauseMng.muteListeners.add(listener);
    return () => PauseMng.muteListeners.delete(listener);
  }

  /** Removes all reasons and listeners. For tests. */
  static reset(): void {
    PauseMng.reasons.clear();
    PauseMng.listeners.clear();
    PauseMng.muteListeners.clear();
  }
}
