import type * as Phaser from 'phaser';
import { cssColor, Theme, type ButtonSkin } from './Theme';

/**
 * Rounded shapes of the UI, drawn once into a texture and then shown as an image.
 * A `Graphics` object would be tessellated again on every frame; a texture costs
 * one quad, and its edges are smooth.
 *
 * Textures are cached by their parameters: the second button of the same size
 * and skin reuses the texture of the first one.
 */

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
): void {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function bake(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  paint: (ctx: CanvasRenderingContext2D) => void
): string {
  if (scene.textures.exists(key)) return key;
  const texture = scene.textures.createCanvas(key, Math.ceil(width), Math.ceil(height));
  if (texture) {
    paint(texture.getContext());
    texture.refresh();
  }
  return key;
}

/**
 * Background of a button: a rounded rectangle `width` × `height` with a lower edge
 * of `Theme.lip` pixels under it. The texture is `Theme.lip` higher than the button.
 */
export function skinTexture(
  scene: Phaser.Scene,
  width: number,
  height: number,
  radius: number,
  skin: ButtonSkin
): string {
  const key = `skin-${width}x${height}-${radius}-${skin.fill}-${skin.lip}`;
  return bake(scene, key, width, height + Theme.lip, (ctx) => {
    ctx.fillStyle = cssColor(skin.lip);
    roundedRect(ctx, 0, Theme.lip, width, height, radius);
    ctx.fill();
    ctx.fillStyle = cssColor(skin.fill);
    roundedRect(ctx, 0, 0, width, height, radius);
    ctx.fill();
  });
}

export type PanelStyle = {
  radius?: number;
  fill?: number;
  fillAlpha?: number;
  /** Color and width of the outline. */
  edge?: number;
  edgeWidth?: number;
  /** Height of the shadow under the panel; the texture is this much higher. */
  shadow?: number;
};

/** A panel: a rounded rectangle with an outline and an optional shadow under it. */
export function panelTexture(
  scene: Phaser.Scene,
  width: number,
  height: number,
  style: PanelStyle = {}
): string {
  const radius = style.radius ?? Theme.radius.panel;
  const fill = style.fill ?? Theme.color.panel;
  const fillAlpha = style.fillAlpha ?? 1;
  const edge = style.edge ?? Theme.color.panelEdge;
  const edgeWidth = style.edgeWidth ?? 5;
  const shadow = style.shadow ?? 0;

  const key = `panel-${width}x${height}-${radius}-${fill}-${fillAlpha}-${edge}-${edgeWidth}-${shadow}`;
  return bake(scene, key, width, height + shadow, (ctx) => {
    if (shadow > 0) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      roundedRect(ctx, 0, shadow, width, height, radius);
      ctx.fill();
    }
    ctx.globalAlpha = fillAlpha;
    ctx.fillStyle = cssColor(fill);
    roundedRect(ctx, 0, 0, width, height, radius);
    ctx.fill();
    ctx.globalAlpha = 1;
    if (edgeWidth > 0) {
      // The outline is drawn inside the shape.
      const half = edgeWidth / 2;
      ctx.lineWidth = edgeWidth;
      ctx.strokeStyle = cssColor(edge);
      roundedRect(ctx, half, half, width - edgeWidth, height - edgeWidth, radius - half);
      ctx.stroke();
    }
  });
}
