import * as Phaser from 'phaser';
import { Config } from '@/data/Config';
import { EventBus } from '@/events/EventBus';
import { FrontEvent } from '@/events/FrontEvent';
import { LocaleMng } from '@/locale/LocaleMng';
import { Viewport } from '@/scaling/Viewport';
import { MyContainer } from '../basic/MyContainer';
import { iconButton } from '../buttons';
import { fitText } from '../fitText';
import { panelTexture } from '../shapes';
import { Theme } from '../Theme';

const SHADE_ALPHA = 0.74;
const OPEN_MS = 240;
const CLOSE_MS = 150;
const SHADOW = 18;

/**
 * Base class of a popup: a panel in the middle of the screen over a shade that
 * blocks the input of everything below. Open popups with `PopupScene.open()`.
 *
 * ```ts
 * export class ConfirmPopup extends Popup<boolean> {
 *   constructor(scene: Phaser.Scene, question: string) {
 *     super(scene, 800, 480);
 *     this.setTitle(question);
 *     const yes = textButton(scene, 'OK', () => this.close(true), this);
 *     this.content.add(yes.setPosition(0, 120));
 *     this.allowDismiss(false);
 *   }
 * }
 * const confirmed = await PopupScene.open(this, ConfirmPopup, 'Leave the game?');
 * ```
 *
 * @typeParam TResult what `close()` passes to the code that opened the popup
 */
export abstract class Popup<TResult = void> extends MyContainer {
  protected _className = 'Popup';
  /** Add the popup's objects here: (0, 0) is the center of the panel. */
  protected readonly content: MyContainer;
  /** Resolves when the popup is closed. */
  readonly result: Promise<TResult>;

  private _shade: Phaser.GameObjects.Rectangle;
  private _title?: Phaser.GameObjects.Text;
  private _resolve!: (result: TResult) => void;
  private _closing = false;

  constructor(
    scene: Phaser.Scene,
    protected readonly panelWidth = 900,
    protected readonly panelHeight = 640
  ) {
    super(scene, 0, 0);
    this.result = new Promise((resolve) => (this._resolve = resolve));

    // Covers the whole screen, which can be larger than the full area.
    this._shade = new Phaser.GameObjects.Rectangle(
      scene,
      Config.GW_HALF,
      Config.GH_HALF,
      Config.GW,
      Config.GH,
      Theme.color.dark,
      SHADE_ALPHA
    );
    // Interactive: pointer events do not reach the objects and the scenes below.
    this._shade.setInteractive();
    this.add(this._shade);
    this.fitShade();
    EventBus.on(FrontEvent.WINDOW_RESIZE, this.fitShade, this);

    this.content = new MyContainer(scene, Config.GW_HALF, Config.GH_HALF);
    this.add(this.content);
    const panel = panelTexture(scene, panelWidth, panelHeight, { shadow: SHADOW });
    this.content.add(new Phaser.GameObjects.Image(scene, 0, SHADOW / 2, panel));

    const locale = LocaleMng.getInstance();
    const onLangChange = () => this.updateTexts();
    locale.onLangChange(onLangChange);
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      locale.offLangChange(onLangChange);
      EventBus.off(FrontEvent.WINDOW_RESIZE, this.fitShade, this);
    });
  }

  /** The screen is centered on the full area: only the size changes. */
  private fitShade(): void {
    // Also resizes the input area of the shade.
    this._shade.setSize(Viewport.screen.width, Viewport.screen.height);
  }

  /** Called when the language changes while the popup is open: set the texts again. */
  protected updateTexts(): void {}

  /** A heading at the top of the panel. */
  protected setTitle(text: string): void {
    if (!this._title) {
      this._title = new Phaser.GameObjects.Text(this.scene, 0, 0, '', Theme.text.heading);
      this._title.setOrigin(0.5).setY(-this.panelHeight / 2 + 100);
      this.content.add(this._title);
    }
    this._title.setText(text);
    fitText(this._title, this.panelWidth - 240);
  }

  /**
   * Lets the player dismiss the popup: adds a close button to the corner of the panel
   * and closes the popup on a tap outside of it. `result` is what `close()` gets then.
   */
  protected allowDismiss(result: TResult): void {
    const button = iconButton(this.scene, 'icons/close', () => this.close(result), this, {
      size: 96,
    });
    button.setPosition(this.panelWidth / 2 - 30, -this.panelHeight / 2 + 30);
    this.content.add(button);

    const w = this.panelWidth;
    const h = this.panelHeight;
    const panelArea = new Phaser.Geom.Rectangle(
      Config.GW_HALF - w / 2,
      Config.GH_HALF - h / 2,
      w,
      h
    );
    this._shade.on(Phaser.Input.Events.POINTER_UP, (pointer: Phaser.Input.Pointer) => {
      if (!panelArea.contains(pointer.worldX, pointer.worldY)) this.close(result);
    });
  }

  /** Plays the opening animation. Called by `PopupScene`. */
  show(): void {
    this._shade.setAlpha(0);
    this.content.setAlpha(0).setScale(0.86);
    this.scene.tweens.add({ targets: this._shade, alpha: SHADE_ALPHA, duration: OPEN_MS });
    this.scene.tweens.add({
      targets: this.content,
      alpha: 1,
      scale: 1,
      duration: OPEN_MS,
      ease: Phaser.Math.Easing.Back.Out,
    });
  }

  /** Closes the popup and passes `result` to the code that opened it. */
  protected close(result: TResult): void {
    if (this._closing) return;
    this._closing = true;
    this.scene.tweens.add({ targets: this._shade, alpha: 0, duration: CLOSE_MS });
    this.scene.tweens.add({
      targets: this.content,
      alpha: 0,
      scale: 0.92,
      duration: CLOSE_MS,
      ease: Phaser.Math.Easing.Sine.In,
      onComplete: () => {
        this.destroy();
        this._resolve(result);
      },
    });
  }
}
