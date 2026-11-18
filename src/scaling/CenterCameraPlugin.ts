import * as Phaser from 'phaser';
import { Config } from '../data/Config';

/**
 * Points the main camera of a scene at the middle of the full area: when the scene starts
 * and whenever the game size changes. With it, world coordinates do not depend on the window,
 * `Config.GW_HALF, Config.GH_HALF` is always the middle of the screen. See `Viewport`.
 *
 * Installed into every scene by the game config (`index.ts`). A scene that moves its camera
 * itself turns it off: `this.centerCamera.enabled = false` in `create()`. A camera that follows
 * a target (`startFollow`) needs nothing: following sets the camera position every frame.
 */
export class CenterCameraPlugin extends Phaser.Plugins.ScenePlugin {
  /** The key of the plugin in the game config. */
  static readonly KEY = 'CenterCameraPlugin';
  /** The scene property the plugin is available as: `this.centerCamera`. */
  static readonly MAPPING = 'centerCamera';

  enabled = true;

  boot(): void {
    const events = this.systems?.events;
    if (!events) return;
    const scale = this.game.scale;
    // The camera manager of the scene has subscribed to both events before this plugin:
    // by the time these handlers run, the camera is created or resized.
    events.on(Phaser.Scenes.Events.START, this.center, this);
    scale.on(Phaser.Scale.Events.RESIZE, this.center, this);
    events.once(Phaser.Scenes.Events.DESTROY, () => {
      scale.off(Phaser.Scale.Events.RESIZE, this.center, this);
    });
  }

  private center(): void {
    // A scene that is not running has no main camera.
    const camera = this.scene?.cameras?.main;
    if (!this.enabled || !camera) return;
    camera.centerOn(Config.GW_HALF, Config.GH_HALF);
    // Whole pixels: text and sprites stay sharp.
    camera.setScroll(Math.round(camera.scrollX), Math.round(camera.scrollY));
  }
}
