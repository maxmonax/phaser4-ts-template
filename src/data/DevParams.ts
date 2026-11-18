/**
 * Central registry of all URL debug/dev parameters.
 * Parsed once at module load — use the exported object everywhere.
 *
 * ── Hash params ────────────────────────────────────────────────────────────
 *   #debug          Verbose logging (LogMng.MODE_DEBUG), dev builds only;
 *                   frame rate (FpsMeter) and errors on screen (ErrorOverlay),
 *                   any build
 *
 * ── GET params ─────────────────────────────────────────────────────────────
 *   ?scene=         Dev builds only: the scene to open right after loading
 *                   instead of the menu, e.g. ?scene=GameScene
 *   ?testParam=     Logged to console in BootScene (example param)
 */

const _search = new URLSearchParams(location.search);

export const DevParams = {
  debug: location.hash === '#debug',
  scene: _search.get('scene'),
  testParam: _search.get('testParam'),
} as const;
