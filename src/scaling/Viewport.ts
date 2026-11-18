import { Config } from '../data/Config';

/**
 * Position of an object relative to the edges of the visible area, in game pixels.
 * One anchor per axis; an axis without an anchor is left as is.
 *
 * `{ left: 90, top: 80 }` — 90 px from the left edge, 80 px from the top.
 * `{ right: 90 }` — 90 px from the right edge.
 * `{ centerX: -200 }` — 200 px to the left of the center.
 */
export type Anchor = {
  left?: number;
  right?: number;
  centerX?: number;
  top?: number;
  bottom?: number;
  centerY?: number;
};

/** A rectangle in world coordinates. */
export type ScreenRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * The part of the game world that is on screen.
 *
 * The canvas always shows the safe area (`Config.GW_SAFE` × `Config.GH_SAFE`) whole and grows
 * by as much as the window allows (`Phaser.Scale.EXPAND`). The main camera of every scene looks
 * at the middle of the full area (`CenterCameraPlugin`), so world coordinates do not depend
 * on the window: `Config.GW_HALF, Config.GH_HALF` is the middle of the screen.
 *
 * The edges below are the visible part of the full area (`Config.GW` × `Config.GH`): the
 * layout never goes beyond the full area, even on a wider screen. Anchor the UI to them with
 * `BaseScene.anchor()`.
 */
export class Viewport {
  /** The visible area in world pixels: the whole full area until the game reports its size. */
  private static screenWidth: number = Config.GW;
  private static screenHeight: number = Config.GH;

  /** The game size has changed. Called by `index.ts` on every resize of the game. */
  static setScreenSize(width: number, height: number): void {
    Viewport.screenWidth = width;
    Viewport.screenHeight = height;
  }

  /**
   * The whole visible area. On a screen wider or taller than the full area it goes beyond it:
   * size a full-screen shade or background by this rectangle, not by `Config.GW` × `Config.GH`.
   */
  static get screen(): ScreenRect {
    return {
      x: Config.GW_HALF - Viewport.screenWidth / 2,
      y: Config.GH_HALF - Viewport.screenHeight / 2,
      width: Viewport.screenWidth,
      height: Viewport.screenHeight,
    };
  }

  /** The screen is taller than wide. For a game that works in both orientations. */
  static get isPortrait(): boolean {
    return Viewport.screenHeight > Viewport.screenWidth;
  }

  static get left(): number {
    return Math.max(0, Config.GW_HALF - Viewport.screenWidth / 2);
  }

  static get right(): number {
    return Math.min(Config.GW, Config.GW_HALF + Viewport.screenWidth / 2);
  }

  static get top(): number {
    return Math.max(0, Config.GH_HALF - Viewport.screenHeight / 2);
  }

  static get bottom(): number {
    return Math.min(Config.GH, Config.GH_HALF + Viewport.screenHeight / 2);
  }

  static get width(): number {
    return Viewport.right - Viewport.left;
  }

  static get height(): number {
    return Viewport.bottom - Viewport.top;
  }

  static get centerX(): number {
    return Config.GW_HALF;
  }

  static get centerY(): number {
    return Config.GH_HALF;
  }

  /** Moves `obj` to the anchored position. In a scene use `BaseScene.anchor()` instead. */
  static place(obj: { x: number; y: number }, anchor: Anchor): void {
    if (anchor.left !== undefined) obj.x = Viewport.left + anchor.left;
    else if (anchor.right !== undefined) obj.x = Viewport.right - anchor.right;
    else if (anchor.centerX !== undefined) obj.x = Viewport.centerX + anchor.centerX;

    if (anchor.top !== undefined) obj.y = Viewport.top + anchor.top;
    else if (anchor.bottom !== undefined) obj.y = Viewport.bottom - anchor.bottom;
    else if (anchor.centerY !== undefined) obj.y = Viewport.centerY + anchor.centerY;
  }
}
