import * as Phaser from 'phaser';

/**
 * Frame rate overlay in the corner of the page. Turned on with `#debug` in the URL,
 * in any build, so it also works in a draft on a game portal.
 */
export class FpsMeter {
  static attach(game: Phaser.Game, intervalMs = 500): void {
    const el = document.createElement('div');
    el.className = 'fps-meter';
    document.body.appendChild(el);

    let elapsed = intervalMs;
    game.events.on(Phaser.Core.Events.POST_STEP, (_time: number, delta: number) => {
      elapsed += delta;
      if (elapsed < intervalMs) return;
      elapsed = 0;
      el.textContent = `${Math.round(game.loop.actualFps)} FPS`;
    });
  }
}
