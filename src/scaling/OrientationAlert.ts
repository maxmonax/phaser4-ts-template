import { Config } from '@/data/Config';
import { Params } from '@/data/Params';
import { PauseMng } from '@/pause/PauseMng';

const rotClassName = 'rotate-image-container';
const imgId = 'rotate__image';

/**
 * Shows the "rotate your device" overlay when the window orientation
 * does not match the one the game is designed for. While the overlay is shown,
 * the game is paused with the `orientation` reason.
 */
export class OrientationAlert {
  /** `null` until the first check, so that the first check always applies its result. */
  private static _blocked: boolean | null = null;

  /** Call once before the first check: prepares the overlay image. */
  public static initOrientation(): void {
    const img = document.getElementById(imgId) as HTMLImageElement | null;
    if (img && !Config.ORIENTATION.inLandscape) {
      img.style.rotate = '-90deg';
    }
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

    PauseMng.set('orientation', blocked);
  }
}
