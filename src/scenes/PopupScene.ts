import * as Phaser from 'phaser';
import type { Popup } from '@/gui/popup/Popup';
import { SceneNames } from './SceneNames';

/**
 * The scene the popups live in. It runs all the time above the game scenes
 * (and below the scene transition), so a popup keeps working while the scene
 * that opened it is paused:
 *
 * ```ts
 * this.scene.pause(); // the timers, tweens and update() of the game scene stop
 * const answer = await PopupScene.open(this, PausePopup);
 * this.scene.resume();
 * ```
 *
 * Popups stack: one opened from another is shown above it, and closing it
 * returns to the previous one.
 */
export class PopupScene extends Phaser.Scene {
  private _open: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super(SceneNames.PopupScene);
  }

  /**
   * Opens a popup and resolves with its result when it is closed.
   *
   * @param from any running scene
   * @param popupClass a class derived from `Popup`
   * @param args the arguments of its constructor after `scene`
   */
  static open<TResult, TArgs extends unknown[]>(
    from: Phaser.Scene,
    popupClass: new (scene: Phaser.Scene, ...args: TArgs) => Popup<TResult>,
    ...args: TArgs
  ): Promise<TResult> {
    const host = PopupScene.get(from);
    const popup = new popupClass(host, ...args);
    host.add.existing(popup);
    host._open.push(popup);
    popup.once(Phaser.GameObjects.Events.DESTROY, () => {
      host._open = host._open.filter((item) => item !== popup);
    });
    popup.show();
    return popup.result;
  }

  /** Whether any popup is open. */
  static isOpen(from: Phaser.Scene): boolean {
    return PopupScene.get(from)._open.length > 0;
  }

  /** Removes all popups at once. Their results are never resolved. */
  static closeAll(from: Phaser.Scene): void {
    for (const popup of [...PopupScene.get(from)._open]) popup.destroy();
  }

  private static get(from: Phaser.Scene): PopupScene {
    return from.scene.get(SceneNames.PopupScene) as PopupScene;
  }
}
