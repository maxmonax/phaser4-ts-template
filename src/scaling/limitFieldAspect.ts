/**
 * Limits the shape of the game field: its long side is at most `maxAspect` times its short
 * side, centered in the window, and the page background fills the rest. Yandex Games asks
 * for at most 2:1 on a desktop (`IPlatform.getMaxAspect()`). `null`: the field fills the
 * window. Call before the game is created: Phaser sizes the canvas by its parent.
 */
export function limitFieldAspect(maxAspect: number | null): void {
  if (!maxAspect) return;
  const root = document.documentElement;
  root.style.setProperty('--field-max-aspect', String(maxAspect));
  root.classList.add('field-limited');
}
