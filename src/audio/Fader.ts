export type FadeHandle = {
  /** Cancels the fade. Its `onComplete` callback is not called. */
  stop(): void;
  readonly isActive: boolean;
};

type Fade = {
  from: number;
  to: number;
  duration: number;
  elapsed: number;
  active: boolean;
  onUpdate?: (value: number) => void;
  onComplete?: () => void;
};

/**
 * Minimal time-driven value tweener.
 *
 * It does not depend on Phaser and does not belong to any scene:
 * the owner drives it by calling `update(deltaMs)`. That keeps audio fades
 * running while scenes are stopped and started.
 */
export class Fader {
  private fades = new Set<Fade>();

  /** Tweens a value linearly from `from` to `to` over `durationMs`. */
  add(
    from: number,
    to: number,
    durationMs: number,
    onUpdate?: (value: number) => void,
    onComplete?: () => void
  ): FadeHandle {
    const fade: Fade = {
      from,
      to,
      duration: Math.max(0, durationMs),
      elapsed: 0,
      active: true,
      onUpdate,
      onComplete,
    };
    this.fades.add(fade);

    const fades = this.fades;
    return {
      stop() {
        fade.active = false;
        fades.delete(fade);
      },
      get isActive() {
        return fade.active;
      },
    };
  }

  /** Calls `callback` once after `delayMs`. */
  delay(delayMs: number, callback: () => void): FadeHandle {
    return this.add(0, 1, delayMs, undefined, callback);
  }

  update(deltaMs: number): void {
    // Callbacks may add or stop fades, so iterate over a snapshot.
    for (const fade of Array.from(this.fades)) {
      if (!fade.active) continue;

      fade.elapsed += deltaMs;
      const t = fade.duration > 0 ? Math.min(1, fade.elapsed / fade.duration) : 1;
      fade.onUpdate?.(fade.from + (fade.to - fade.from) * t);

      // onUpdate may have stopped this fade
      if (t >= 1 && fade.active) {
        fade.active = false;
        this.fades.delete(fade);
        fade.onComplete?.();
      }
    }
  }

  /** Cancels all fades without calling their `onComplete` callbacks. */
  clear(): void {
    for (const fade of this.fades) fade.active = false;
    this.fades.clear();
  }

  get size(): number {
    return this.fades.size;
  }
}
