import type * as Phaser from 'phaser';
import { Config } from '@/data/Config';
import { Params } from '@/data/Params';

const rotClassName = 'rotate-image-container';
const imgId = 'rotate__image';

/**
 * Shows the "rotate your device" overlay when the window orientation
 * does not match the one the game is designed for.
 */
export class OrientationAlert {
  private static _game: Phaser.Game | null = null;
  /** `null` until the first check, so that the first check always applies its result. */
  private static _blocked: boolean | null = null;

  /** Call once before the first check: prepares the overlay image. */
  public static initOrientation(): void {
    const img = document.getElementById(imgId) as HTMLImageElement | null;
    if (img && !Config.ORIENTATION.inLandscape) {
      img.style.rotate = '-90deg';
    }
  }

  /** Lets the alert pause the game (loop and sound) while the overlay is shown. */
  public static setGame(game: Phaser.Game): void {
    OrientationAlert._game = game;
    if (OrientationAlert._blocked) OrientationAlert.pauseGame();
  }

  public static checkOrientation(): void {
    const isLandscape = window.innerWidth / window.innerHeight >= Config.ORIENTATION.ar;
    Params.isLandscape = isLandscape;

    const blocked = isLandscape !== Config.ORIENTATION.inLandscape;
    if (blocked === OrientationAlert._blocked) return;
    OrientationAlert._blocked = blocked;

    const divGame = document.getElementById('game');
    const divRotate = document.getElementsByClassName(rotClassName)[0] as HTMLElement | undefined;
    if (divGame) divGame.style.display = blocked ? 'none' : 'flex';
    if (divRotate) divRotate.style.display = blocked ? 'flex' : 'none';

    if (blocked) OrientationAlert.pauseGame();
    else OrientationAlert.resumeGame();
  }

  private static pauseGame(): void {
    const game = OrientationAlert._game;
    if (!game) return;
    game.pause();
    game.sound.pauseAll();
  }

  private static resumeGame(): void {
    const game = OrientationAlert._game;
    if (!game) return;
    game.resume();
    game.sound.resumeAll();
  }
}
