import { Config, type Orientation } from '@/data/Config';
import { PauseMng } from '@/pause/PauseMng';

const rotClassName = 'rotate-image-container';
const imgId = 'rotate__image';

/**
 * Whether the player must rotate the device: the game is designed for one orientation
 * and the device is held the other way. Only phones and tablets are asked: a desktop
 * window of any shape shows the game, with the safe area whole.
 */
export function needsRotation(
  orientation: Orientation,
  width: number,
  height: number,
  isTouch: boolean
): boolean {
  if (orientation === 'any' || !isTouch) return false;
  const isLandscape = width >= height;
  return isLandscape !== (orientation === 'landscape');
}

/** The primary input is a finger: a phone or a tablet. */
function isTouchDevice(): boolean {
  return window.matchMedia('(pointer: coarse)').matches;
}

/**
 * Shows the "rotate your device" overlay when a phone or a tablet is held the wrong way
 * for `Config.ORIENTATION`. While the overlay is shown, the game is paused with the
 * `orientation` reason.
 */
export class OrientationAlert {
  /** `null` until the first check, so that the first check always applies its result. */
  private static _blocked: boolean | null = null;

  /** Call once before the first check: prepares the overlay image. */
  public static initOrientation(): void {
    const img = document.getElementById(imgId) as HTMLImageElement | null;
    if (img && Config.ORIENTATION === 'portrait') {
      img.style.rotate = '-90deg';
    }
  }

  public static checkOrientation(): void {
    const blocked = needsRotation(
      Config.ORIENTATION,
      window.innerWidth,
      window.innerHeight,
      isTouchDevice()
    );
    if (blocked === OrientationAlert._blocked) return;
    OrientationAlert._blocked = blocked;

    const divGame = document.getElementById('game');
    const divRotate = document.getElementsByClassName(rotClassName)[0] as HTMLElement | undefined;
    if (divGame) divGame.style.display = blocked ? 'none' : 'flex';
    if (divRotate) divRotate.style.display = blocked ? 'flex' : 'none';

    PauseMng.set('orientation', blocked);
  }
}
