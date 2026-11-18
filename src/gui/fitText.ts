type Fittable = {
  /** Unscaled size, as in Phaser game objects. */
  width: number;
  height: number;
  setScale(scale: number): unknown;
};

/**
 * Scales a text (or any game object) down so that it fits into the given size.
 * It never scales up. Call it again after the text changes: a translation
 * is often longer than the original.
 *
 * The object is scaled instead of changing the font size, so the call does not
 * depend on the previous one and the original size does not have to be kept.
 *
 * @returns the applied scale
 */
export function fitText(obj: Fittable, maxWidth: number, maxHeight = Infinity): number {
  let scale = 1;
  if (obj.width > 0) scale = Math.min(scale, maxWidth / obj.width);
  if (obj.height > 0) scale = Math.min(scale, maxHeight / obj.height);
  scale = Math.max(scale, 0);
  obj.setScale(scale);
  return scale;
}
