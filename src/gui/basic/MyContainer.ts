import * as Phaser from 'phaser';
import { ILogger } from '@/interfaces/ILogger';
import { LogMng } from '@/utils/LogMng';

export class MyContainer extends Phaser.GameObjects.Container implements ILogger {
  /**
   * Name in log messages. Subclasses override it: `protected _className = 'MyButton';`
   * (class names are not usable for that: the production build minifies them).
   */
  protected _className: string = 'MyContainer';

  constructor(
    scene: Phaser.Scene,
    x?: number,
    y?: number,
    children?: Phaser.GameObjects.GameObject[]
  ) {
    super(scene, x, y, children);
  }

  logDebug(aMsg: string, aData?: unknown): void {
    LogMng.debug(`${this._className}: ${aMsg}`, aData);
  }
  logWarn(aMsg: string, aData?: unknown): void {
    LogMng.warn(`${this._className}: ${aMsg}`, aData);
  }
  logError(aMsg: string, aData?: unknown): void {
    LogMng.error(`${this._className}: ${aMsg}`, aData);
  }

  public get className(): string {
    return this._className;
  }
}
