import * as Phaser from 'phaser';
import { MyContainer } from './basic/MyContainer';
import { Theme } from './Theme';

/** A full-screen fill that fades in and out, e.g. between scenes. Blocks the input below it. */
export class Curtain extends MyContainer {
  protected _className = 'Curtain';
  private _curtain: Phaser.GameObjects.Rectangle;

  constructor(aParams: {
    scene: Phaser.Scene;
    w: number;
    h: number;
    x?: number;
    y?: number;
    color?: number;
  }) {
    super(aParams.scene, aParams.x ?? 0, aParams.y ?? 0);

    this._curtain = new Phaser.GameObjects.Rectangle(
      this.scene,
      0,
      0,
      aParams.w,
      aParams.h,
      aParams.color ?? Theme.color.dark
    );
    this._curtain.setInteractive();
    this._curtain.visible = false;

    this.add(this._curtain);
  }

  /** Changes the covered area around the curtain position, e.g. when the screen size changes. */
  resize(w: number, h: number): void {
    // Also resizes the input area.
    this._curtain.setSize(w, h);
  }

  private _fadeTo(
    alpha: number,
    duration: number,
    ease: string | ((v: number) => number),
    onStart?: () => void,
    onComplete?: () => void
  ): void {
    if (duration > 0) {
      this.scene.tweens.killTweensOf(this._curtain);
      this.scene.tweens.add({
        targets: this._curtain,
        alpha,
        duration,
        ease,
        onStart,
        onComplete,
      });
    } else {
      onStart?.();
      this._curtain.alpha = alpha;
      onComplete?.();
    }
  }

  showCurtain(aParams?: {
    dur?: number;
    alpha?: number;
    ease?: string | ((v: number) => number);
    cb?: () => void;
    ctx?: object;
  }) {
    const dur = aParams?.dur ?? 0;
    const alpha = aParams?.alpha ?? 1;
    const ease = aParams?.ease ?? Phaser.Math.Easing.Sine.InOut;
    const cb = aParams?.cb;
    const ctx = aParams?.ctx;

    this._curtain.alpha = 0;
    this._fadeTo(
      alpha,
      dur,
      ease,
      () => {
        this._curtain.visible = true;
      },
      () => {
        if (cb) cb.call(ctx);
      }
    );
  }

  hideCurtain(
    aDur = 0,
    aCallback?: () => void,
    aCtx?: object,
    aEase: string | ((v: number) => number) = Phaser.Math.Easing.Sine.InOut
  ) {
    this._fadeTo(0, aDur, aEase, undefined, () => {
      this._curtain.visible = false;
      if (aCallback) aCallback.call(aCtx);
    });
  }
}
