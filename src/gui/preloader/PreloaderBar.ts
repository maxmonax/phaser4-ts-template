import * as Phaser from 'phaser';

export type PreloaderBarConfig = {
  width?: number;
  height?: number;
  /** Thickness of the frame around the bar. */
  border?: number;
  borderColor?: number;
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

    const border = config.border ?? 4;
    this._barWidth = config.width ?? 600;
    this._barHeight = config.height ?? 50;
    this._fillColor = config.fillColor ?? 0xffffff;

    const w = this._barWidth;
    const h = this._barHeight;

    const frame = new Phaser.GameObjects.Graphics(scene);
    frame.lineStyle(border, config.borderColor ?? 0xffffff, 1);
    frame.strokeRect(-w / 2 - border, -h / 2 - border, w + border * 2, h + border * 2);
    this.add(frame);

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

    const w = this._barWidth;
    const h = this._barHeight;
    this._fill.fillStyle(this._fillColor, 1);
    this._fill.fillRect(-w / 2, -h / 2, w * this._progress, h);
  }
}
