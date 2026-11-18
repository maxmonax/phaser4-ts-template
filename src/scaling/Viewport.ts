import { Config } from '../data/Config';
import { Params } from '../data/Params';

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

/**
 * The part of the game area that is visible in the window.
 *
 * The game is scaled by height, so the visible height is always `Config.GH`,
 * and the visible width changes with the window: from `Config.GW_SAFE` to `Config.GW`,
 * centered in the game area.
 */
export class Viewport {
  static get width(): number {
    return Params.gameWidth > 0 ? Params.gameWidth : Config.GW;
  }

  static get height(): number {
    return Config.GH;
  }

  static get left(): number {
    return (Config.GW - Viewport.width) / 2;
  }

  static get right(): number {
    return (Config.GW + Viewport.width) / 2;
  }

  static get top(): number {
    return 0;
  }

  static get bottom(): number {
    return Config.GH;
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
