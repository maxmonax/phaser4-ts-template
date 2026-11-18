import * as Phaser from 'phaser';
import { AudioMng } from '@/audio/AudioMng';
import type { AtlasFrame, AtlasKey } from '@/data/Assets';
import { AudioAlias } from '@/data/AudioData';
import { skinTexture } from '../shapes';
import { Theme, type ButtonSkin } from '../Theme';
import { MyContainer } from './MyContainer';
import { MyImage } from './MyImage';

export type ButtonAnimConfig = {
  overDuration?: number;
  hoverScaleFactor?: number;
  clickScaleFactor?: number;
};

export type MyBtnParams = ButtonAnimConfig & {
  /** Atlas image: the whole button, or an icon on top of `skin`. */
  texture?: AtlasKey;
  frame?: AtlasFrame;
  /** Height of the image in game pixels. By default the image keeps its size. */
  imageSize?: number;
  imageTint?: number;
  /** Drawn background: a rounded rectangle with a darker lower edge. Needs `size`. */
  skin?: ButtonSkin;
  /** Corner radius of the skin. */
  radius?: number;
  size?: {
    w: number;
    h?: number;
  };
  interactivePos?: {
    x: number;
    y: number;
  };
  scale?: number;
  isHoverAnim?: boolean;
  clickScale?: boolean;
  /** Button alpha while it is disabled. */
  disabledAlpha?: number;
  audioClickAlias?: string;
  onClick?: (btn: MyButton) => void;
  context?: object;
};

const DEFAULT: MyBtnParams = {
  scale: 1,
  isHoverAnim: true,
  overDuration: 200,
  hoverScaleFactor: 1.1,
  clickScaleFactor: 0.95,
  clickScale: true,
  disabledAlpha: 0.5,
  audioClickAlias: AudioAlias.Click,
};

export enum MyBtnEvent {
  Click = 'Click',
}

/**
 * A button: an atlas image, a drawn background (`skin`), or an icon on a drawn background.
 * For the common cases see the helpers in `gui/buttons.ts`.
 */
export class MyButton extends MyContainer {
  protected _className = 'MyButton';
  private _params: MyBtnParams;
  /** Everything visible is inside: it is scaled by the hover and click animations. */
  protected _dummy: MyContainer;
  protected _img?: MyImage;
  private _bg?: Phaser.GameObjects.Image;
  private _size: { w: number; h: number };
  private _tweenOver?: Phaser.Tweens.Tween;
  private _isOver = false;
  private _isDown = false;
  private _disabled = false;

  constructor(scene: Phaser.Scene, x: number, y: number, aParams: MyBtnParams) {
    super(scene, x, y);

    this._params = { ...DEFAULT, ...aParams };

    this._dummy = new MyContainer(scene, 0, 0);
    this._dummy.scale = 0.01;
    this.add(this._dummy);

    if (this._params.texture && this._params.frame) {
      this._img = new MyImage(scene, 0, 0, this._params.texture, this._params.frame);
      if (this._params.imageSize) this._img.setScale(this._params.imageSize / this._img.height);
      if (this._params.imageTint !== undefined) this._img.setTint(this._params.imageTint);
      this._dummy.add(this._img);
    }

    const scale = this._params.scale ?? 1;
    const imgSize = this._img
      ? { w: this._img.displayWidth * scale, h: this._img.displayHeight * scale }
      : { w: 0, h: 0 };
    const w = this._params.size?.w ?? imgSize.w;
    this._size = { w, h: this._params.size?.h ?? (this._params.size ? w : imgSize.h) };
    this.drawSkin();

    // The lower edge of the skin is a part of the button.
    const lip = this._params.skin ? Theme.lip : 0;
    const pos = this._params.interactivePos ?? { x: 0, y: 0 };
    this.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(
        -this._size.w / 2 + pos.x,
        -this._size.h / 2 + pos.y,
        this._size.w,
        this._size.h + lip
      ),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    });

    this.on(Phaser.Input.Events.POINTER_OVER, this.onPointerOver, this);
    this.on(Phaser.Input.Events.POINTER_OUT, this.onPointerOut, this);
    this.on(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);
    this.on(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
    this.on(MyBtnEvent.Click, this.onClick, this);

    this.scene.tweens.add({
      targets: this._dummy,
      scale: this._params.scale,
      duration: this._params.overDuration,
      ease: 'Circ.Out',
    });
  }

  private drawSkin(): void {
    const skin = this._params.skin;
    if (!skin) return;

    const { w, h } = this._size;
    const radius = this._params.radius ?? Theme.radius.button;
    const texture = skinTexture(this.scene, w, h, radius, skin);
    if (this._bg) {
      this._bg.setTexture(texture);
    } else {
      this._bg = new Phaser.GameObjects.Image(this.scene, 0, 0, texture);
      // The texture is higher than the button by its lower edge: the body stays centered.
      this._bg.setOrigin(0.5, h / 2 / (h + Theme.lip));
      this._dummy.addAt(this._bg, 0);
    }
  }

  private overAnim() {
    if (this._tweenOver) this._tweenOver.stop();
    this._tweenOver = this.scene.tweens.add({
      targets: this._dummy,
      scale: (this._params.scale ?? 1) * (this._params.hoverScaleFactor ?? 1.1),
      duration: this._params.overDuration,
      ease: Phaser.Math.Easing.Back.Out,
    });
  }

  private outAnim() {
    if (this._tweenOver) this._tweenOver.stop();
    this._tweenOver = this.scene.tweens.add({
      targets: this._dummy,
      scale: this._params.scale,
      duration: this._params.overDuration,
      ease: Phaser.Math.Easing.Sine.Out,
    });
  }

  private clickAnim() {
    if (this._tweenOver) this._tweenOver.stop();
    this._tweenOver = this.scene.tweens.add({
      targets: this._dummy,
      scale: (this._params.scale ?? 1) * (this._params.clickScaleFactor ?? 0.95),
      duration: this._params.overDuration,
      ease: Phaser.Math.Easing.Sine.Out,
    });
  }

  private onPointerOver() {
    if (this._isOver) return;
    this._isOver = true;
    if (this._params.isHoverAnim) this.overAnim();
  }

  private onPointerOut() {
    if (!this._isOver) return;
    this._isOver = false;
    this._isDown = false;
    if (this._params.isHoverAnim) this.outAnim();
  }

  private onPointerDown(_p: Phaser.Input.Pointer) {
    this._isDown = true;
    if (this._params.clickScale) this.clickAnim();
  }

  private onPointerUp(_p: Phaser.Input.Pointer) {
    if (!this._isDown) return;
    this._isDown = false;
    if (this._params.audioClickAlias) AudioMng.playSfx(this._params.audioClickAlias);
    if (this._params.clickScale) this.overAnim();
    this.emit(MyBtnEvent.Click, this);
  }

  private onClick() {
    if (this._params.onClick) {
      this._params.onClick.call(this._params.context, this);
    }
  }

  /** A disabled button ignores input and is drawn semi-transparent. */
  public set disabled(v: boolean) {
    if (this._disabled === v) return;
    this._disabled = v;
    if (v) {
      this.disableInteractive();
      // The pointer may still be over the button: drop the hover and press state.
      this._isOver = false;
      this._isDown = false;
      this._tweenOver?.stop();
      this._dummy.setScale(this._params.scale ?? 1);
    } else {
      this.setInteractive();
    }
    this.alpha = v ? (this._params.disabledAlpha ?? 0.5) : 1;
  }

  public get disabled(): boolean {
    return this._disabled;
  }

  /** Size of the button without the hover and click animations. */
  public get size(): Readonly<{ w: number; h: number }> {
    return this._size;
  }

  setClickListener(aCb: (btn: MyButton) => void, aCtx: object) {
    this._params.onClick = aCb;
    this._params.context = aCtx;
  }

  setNewScale(aScale: number) {
    this._params.scale = aScale;
    this._dummy.setScale(this._params.scale);
  }

  /** Changes the image of the button to another frame of the same atlas. */
  setFrame(frame: AtlasFrame): this {
    this._img?.setFrame(frame);
    return this;
  }

  /** Changes the colors of the drawn background and tints the image with the skin's ink. */
  setSkin(skin: ButtonSkin): this {
    this._params.skin = skin;
    this.drawSkin();
    this._img?.setTint(skin.ink);
    return this;
  }
}
