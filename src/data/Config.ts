const GW = 2400;
const GH = 1080;
const GW_SAFE = 1440;
const GH_SAFE = 1080;

/** See `Config.ORIENTATION`. */
export type Orientation = 'landscape' | 'portrait' | 'any';

export const Config = {
  /**
   * The full area, 20:9 here: the most of the game world a screen can show. The layout
   * never goes beyond it (see `Viewport`); on a wider screen the page background shows
   * at the sides. Draw backgrounds to this size.
   */
  GW,
  GH,
  GW_HALF: GW / 2,
  GH_HALF: GH / 2,
  /**
   * The safe area in the middle of the full area, 4:3 here: always on screen, whatever the
   * window shape. Keep the gameplay and the main UI inside it. The canvas starts from this
   * size and grows towards the full area as the window allows (`Phaser.Scale.EXPAND`).
   *
   * The height is also the resolution the art is drawn for: a lower one (e.g. 720) means
   * smaller atlases for weak phones.
   */
  GW_SAFE,
  GH_SAFE,

  /**
   * The orientation the game is designed for. A phone or a tablet held the other way gets
   * the "rotate your device" overlay, and the game is paused meanwhile. `'any'`: no overlay,
   * the layout must work both ways (`Viewport.isPortrait`).
   */
  ORIENTATION: 'landscape' as Orientation,

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
