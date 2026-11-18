import * as Phaser from 'phaser';
import { MyContainer } from '@/gui/basic/MyContainer';
import { MyImage } from '@/gui/basic/MyImage';
import { Theme } from '@/gui/Theme';

/** Diameter of an orb in game pixels. */
export const ORB_SIZE = 190;
/** The tap area is larger than the picture: easier to hit on a phone. */
const TAP_RADIUS = ORB_SIZE * 0.6;

export enum OrbEvent {
  /** The player tapped the orb. */
  Pop = 'Pop',
  /** The orb is gone: popped or its time is out. */
  Gone = 'Gone',
}

/** A target of the demo round: appears, waits to be tapped, disappears. */
export class Orb extends MyContainer {
  protected _className = 'Orb';
  readonly color: number;
  private _life?: Phaser.Time.TimerEvent;
  private _leaving = false;

  constructor(scene: Phaser.Scene, x: number, y: number, color: number, lifeMs: number) {
    super(scene, x, y);
    this.color = color;

    const body = new MyImage(scene, 0, 0, Theme.atlas, 'orb').setTint(color);
    const shine = new MyImage(scene, 0, 0, Theme.atlas, 'orb-shine');
    this.add([body, shine]);
    const scale = ORB_SIZE / body.width;

    this.setInteractive({
      hitArea: new Phaser.Geom.Circle(0, 0, TAP_RADIUS / scale),
      hitAreaCallback: Phaser.Geom.Circle.Contains,
      useHandCursor: true,
    });
    this.once(Phaser.Input.Events.POINTER_DOWN, this.pop, this);

    this.setScale(0);
    scene.tweens.add({
      targets: this,
      scale,
      duration: 220,
      ease: Phaser.Math.Easing.Back.Out,
    });
    this._life = scene.time.delayedCall(lifeMs, this.vanish, undefined, this);
  }

  private pop(): void {
    if (this._leaving) return;
    this.emit(OrbEvent.Pop, this);
    this.leave();
  }

  /** Shrinks the orb away, without points. */
  vanish(): void {
    if (this._leaving) return;
    this._leaving = true;
    this._life?.remove();
    this.disableInteractive();
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      scale: 0,
      duration: 180,
      ease: Phaser.Math.Easing.Back.In,
      onComplete: () => this.leave(),
    });
  }

  private leave(): void {
    this._leaving = true;
    this._life?.remove();
    this.scene.tweens.killTweensOf(this);
    this.emit(OrbEvent.Gone, this);
    this.destroy();
  }
}
