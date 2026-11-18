import * as Phaser from 'phaser';

/**
 * Resolves after `ms` milliseconds of the scene clock: the time does not run while
 * the scene or the game is paused. Never resolves if the scene shuts down first,
 * so the code after `await` does not touch a scene that is gone.
 *
 * For real time, independent of the game, use `delay()` from `utils/async`.
 */
export function wait(scene: Phaser.Scene, ms: number): Promise<void> {
  return new Promise((resolve) => {
    scene.time.delayedCall(ms, resolve);
  });
}

/**
 * Runs a tween and resolves when it completes or is stopped. Never resolves for
 * an endless tween (`repeat: -1`) or if the scene shuts down first.
 *
 * ```ts
 * await tweenAsync(this, { targets: panel, alpha: 0, duration: 200 });
 * panel.destroy();
 * ```
 */
export function tweenAsync(
  scene: Phaser.Scene,
  config: Phaser.Types.Tweens.TweenBuilderConfig
): Promise<void> {
  return new Promise((resolve) => {
    const tween = scene.tweens.add(config);
    tween.once(Phaser.Tweens.Events.TWEEN_COMPLETE, () => resolve());
    tween.once(Phaser.Tweens.Events.TWEEN_STOP, () => resolve());
  });
}
