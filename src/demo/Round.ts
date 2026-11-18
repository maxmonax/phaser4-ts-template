import { MyMath } from '@/utils/MyMath';

export type RoundConfig = {
  durationMs: number;
  /** Pause between two orbs at the start and at the end of the round. */
  spawnDelayMs: readonly [start: number, end: number];
  /** How long an orb stays on screen at the start and at the end of the round. */
  orbLifeMs: readonly [start: number, end: number];
};

/**
 * State of one demo round: the time left, the score and the difficulty.
 * No Phaser here, so the rules are covered by unit tests (`tests/demo/Round.test.ts`).
 */
export class Round {
  private _timeLeftMs: number;
  private _elapsedMs = 0;
  private _score = 0;
  private _extended = false;

  constructor(private readonly config: RoundConfig) {
    this._timeLeftMs = config.durationMs;
  }

  get score(): number {
    return this._score;
  }

  get timeLeftMs(): number {
    return this._timeLeftMs;
  }

  /** Whole seconds for the timer on screen: 0 only when the round is over. */
  get secondsLeft(): number {
    return Math.ceil(this._timeLeftMs / 1000);
  }

  get isOver(): boolean {
    return this._timeLeftMs <= 0;
  }

  /** Whether the round got extra time: it is given once per round. */
  get extended(): boolean {
    return this._extended;
  }

  /** 0 at the start of the round, 1 from the end of its normal duration on. */
  get progress(): number {
    return MyMath.clamp(this._elapsedMs / this.config.durationMs, 0, 1);
  }

  /** Orbs appear faster towards the end of the round. */
  get spawnDelayMs(): number {
    return MyMath.lerp(this.config.spawnDelayMs[0], this.config.spawnDelayMs[1], this.progress);
  }

  /** Orbs stay on screen for a shorter time towards the end of the round. */
  get orbLifeMs(): number {
    return MyMath.lerp(this.config.orbLifeMs[0], this.config.orbLifeMs[1], this.progress);
  }

  tick(dtMs: number): void {
    if (this.isOver) return;
    this._elapsedMs += dtMs;
    this._timeLeftMs = Math.max(0, this._timeLeftMs - dtMs);
  }

  addScore(points = 1): void {
    if (!this.isOver) this._score += points;
  }

  /** Adds time to the round, also to a round that is over. */
  extend(ms: number): void {
    this._timeLeftMs += ms;
    this._extended = true;
  }

  reset(): void {
    this._timeLeftMs = this.config.durationMs;
    this._elapsedMs = 0;
    this._score = 0;
    this._extended = false;
  }
}
