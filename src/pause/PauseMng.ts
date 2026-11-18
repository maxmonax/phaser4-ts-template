/**
 * Why the game is paused. Each source pauses and resumes only its own reason.
 *
 * - `orientation` — the "rotate your device" overlay is shown;
 * - `ad` — an ad is on screen;
 * - `platform` — the game portal asked to pause (e.g. Yandex `game_api_pause`);
 * - `hidden` — the browser tab is hidden.
 */
export type PauseReason = 'orientation' | 'ad' | 'platform' | 'hidden';

type PauseListener = (paused: boolean) => void;

/**
 * Single point of pausing the game.
 *
 * The game is paused while at least one reason is active. Sources do not
 * interfere: when the overlay is closed during an ad, the game stays paused
 * until the ad is over too.
 *
 * It does not depend on Phaser: `bindGamePause()` connects it to the game.
 */
export class PauseMng {
  private static reasons = new Set<PauseReason>();
  private static listeners = new Set<PauseListener>();

  static pause(reason: PauseReason): void {
    PauseMng.set(reason, true);
  }

  static resume(reason: PauseReason): void {
    PauseMng.set(reason, false);
  }

  /** Adds or removes the reason: `set('ad', true)` is the same as `pause('ad')`. */
  static set(reason: PauseReason, active: boolean): void {
    const wasPaused = PauseMng.isPaused();
    if (active) PauseMng.reasons.add(reason);
    else PauseMng.reasons.delete(reason);

    const paused = PauseMng.isPaused();
    if (paused !== wasPaused) {
      for (const listener of Array.from(PauseMng.listeners)) listener(paused);
    }
  }

  static isPaused(): boolean {
    return PauseMng.reasons.size > 0;
  }

  static has(reason: PauseReason): boolean {
    return PauseMng.reasons.has(reason);
  }

  /** The listener is called on every change between paused and running. */
  static onChange(listener: PauseListener): () => void {
    PauseMng.listeners.add(listener);
    return () => PauseMng.listeners.delete(listener);
  }

  /** Removes all reasons and listeners. For tests. */
  static reset(): void {
    PauseMng.reasons.clear();
    PauseMng.listeners.clear();
  }
}
