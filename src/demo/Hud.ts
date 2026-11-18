import * as Phaser from 'phaser';
import { MyContainer } from '@/gui/basic/MyContainer';
import { MyImage } from '@/gui/basic/MyImage';
import { panelTexture } from '@/gui/shapes';
import { cssColor, Theme } from '@/gui/Theme';
import { LocaleMng } from '@/locale/LocaleMng';

const WIDTH = 600;
const HEIGHT = 116;
const ICON_SIZE = 64;
/** The timer changes its color and pulses when this many seconds are left. */
const HURRY_SECONDS = 3;

/** The panel at the top of the game scene: the time left and the score. */
export class Hud extends MyContainer {
  protected _className = 'Hud';
  private _time: Phaser.GameObjects.Text;
  private _score: Phaser.GameObjects.Text;
  private _seconds = -1;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    const panel = panelTexture(scene, WIDTH, HEIGHT, {
      radius: HEIGHT / 2,
      fillAlpha: 0.9,
      edgeWidth: 4,
    });
    this.add(new Phaser.GameObjects.Image(scene, 0, 0, panel));

    this.add(this.icon('icons/clock', -220, Theme.color.inkDim));
    this._time = new Phaser.GameObjects.Text(scene, -170, 0, '', Theme.text.hud).setOrigin(0, 0.5);
    this.add(this._time);

    this.add(this.icon('icons/star', 70, Theme.color.accent));
    this._score = new Phaser.GameObjects.Text(scene, 120, 0, '', Theme.text.hud).setOrigin(0, 0.5);
    this.add(this._score);
  }

  private icon(frame: 'icons/clock' | 'icons/star', x: number, tint: number): MyImage {
    const img = new MyImage(this.scene, x, 0, Theme.atlas, frame).setTint(tint);
    return img.setScale(ICON_SIZE / img.height);
  }

  setTime(seconds: number): void {
    if (seconds === this._seconds) return;
    this._seconds = seconds;
    const text = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    this._time.setText(text);

    const hurry = seconds <= HURRY_SECONDS;
    this._time.setColor(cssColor(hurry ? Theme.color.palette[0] : Theme.color.ink));
    if (hurry && seconds > 0) {
      this.scene.tweens.add({
        targets: this._time,
        scale: { from: 1.25, to: 1 },
        duration: 300,
        ease: Phaser.Math.Easing.Cubic.Out,
      });
    }
  }

  setScore(score: number): void {
    this._score.setText(LocaleMng.getInstance().formatNumber(score));
  }
}
