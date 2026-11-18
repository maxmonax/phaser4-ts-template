const GW = 2400;
const GH = 1080;
const GW_SAFE = 1440;
const GH_SAFE = 1080;

export const Config = {
  // 20:9
  GW,
  GH,
  GW_HALF: GW / 2,
  GH_HALF: GH / 2,
  GW_SAFE,
  GH_SAFE,

  ORIENTATION: {
    check: true,
    inLandscape: true,
    ar: GW_SAFE / GH_SAFE,
  },

  /**
   * Font families used in the game. Every family listed here is loaded
   * before the game starts; the font files are imported in index.ts.
   * Chinese, Japanese and Korean are drawn with a system font, see `Theme`.
   */
  FONT: {
    MAIN: 'Ubuntu',
  },
  /** Font weights the game uses. Each one needs its CSS import in index.ts. */
  FONT_WEIGHTS: [400, 700],

  SAVE: {
    /** Storage key of the game state. Make it unique for every game on the same site. */
    KEY: 'phaser-template',
    /** A change is written this long after the last change. */
    DELAY_MS: 1000,
  },

  PRELOADER: {
    BAR: true,
    TAP_TO_START: true,
    DRAW_DEBUG_BORDER: false,
  },
} as const;
