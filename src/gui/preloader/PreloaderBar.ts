import * as Phaser from 'phaser';
import { Theme } from '../Theme';

export type PreloaderBarConfig = {
  width?: number;
  height?: number;
  trackColor?: number;
  fillColor?: number;
};

/**
 * Loading progress bar drawn with Graphics: needs no textures,
 * so it can be shown before any asset is loaded.
 */
export class PreloaderBar extends Phaser.GameObjects.Container {
  private _fill: Phaser.GameObjects.Graphics;
  private _barWidth: number;
  private _barHeight: number;
  private _fillColor: number;
  private _progress = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, config: PreloaderBarConfig = {}) {
    super(scene, x, y);

    this._barWidth = config.width ?? 640;
    this._barHeight = config.height ?? 36;
    this._fillColor = config.fillColor ?? Theme.color.accent;

    const w = this._barWidth;
    const h = this._barHeight;

    const track = new Phaser.GameObjects.Graphics(scene);
    track.fillStyle(config.trackColor ?? Theme.color.track, 1);
    track.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    this.add(track);

    this._fill = new Phaser.GameObjects.Graphics(scene);
    this.add(this._fill);
  }

  /** Loading progress in [0..1]. */
  public get progress(): number {
    return this._progress;
  }

  public set progress(v: number) {
    this._progress = Phaser.Math.Clamp(v, 0, 1);

    this._fill.clear();
    if (this._progress <= 0) return;

    const h = this._barHeight;
    // Never narrower than a circle: the rounded ends need that much room.
    const w = Math.max(this._barWidth * this._progress, h);
    this._fill.fillStyle(this._fillColor, 1);
    this._fill.fillRoundedRect(-this._barWidth / 2, -h / 2, w, h, h / 2);
  }
}
