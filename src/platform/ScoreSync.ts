import { delay } from '../utils/async';
import { LogMng } from '../utils/LogMng';

/** A platform leaderboard as `ScoreSync` sees it, see `IPlatform.readScore()`. */
export type ScoreBoard = {
  read(): Promise<number | null>;
  write(score: number): Promise<boolean>;
};

/** Yandex takes one leaderboard write a second. */
const MIN_WRITE_INTERVAL_MS = 1100;

/**
 * Keeps the player's best result on a platform leaderboard.
 *
 * - The result on the platform is read first and only ever raised: an old save on this
 *   device does not lower a record set on another one.
 * - A player who cannot have a result (a guest) writes nothing. The result is offered again
 *   with the next report, so it arrives once the player has logged in.
 * - Writes are at least a second apart. A result that grows meanwhile is sent after the
 *   current write, the last one only.
 * - A failure is logged and never reaches the game; the next report tries again.
 */
export class ScoreSync {
  private best = 0;
  /** The result on the platform; `undefined` until it is read. */
  private onPlatform: number | undefined;
  private writtenAt = -Infinity;
  private running: Promise<void> | null = null;

  constructor(
    private readonly board: ScoreBoard,
    private readonly minIntervalMs = MIN_WRITE_INTERVAL_MS
  ) {}

  /** Offers a result: a positive whole number. Resolves when the sync is over. */
  report(score: number): Promise<void> {
    if (Number.isSafeInteger(score) && score > 0) this.best = Math.max(this.best, score);
    this.running ??= this.sync().finally(() => (this.running = null));
    return this.running;
  }

  private async sync(): Promise<void> {
    if (this.best === 0) return;
    try {
      let onPlatform = this.onPlatform;
      if (onPlatform === undefined) {
        const read = await this.board.read();
        if (read === null) return;
        onPlatform = this.onPlatform = read;
      }
      while (this.best > onPlatform) {
        const wait = this.writtenAt + this.minIntervalMs - Date.now();
        if (wait > 0) await delay(wait);
        const score = this.best;
        this.writtenAt = Date.now();
        if (!(await this.board.write(score))) return;
        onPlatform = this.onPlatform = score;
      }
    } catch (e) {
      LogMng.warn('Leaderboard: the result is not saved', e);
    }
  }
}
