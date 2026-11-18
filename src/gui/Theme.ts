import type * as Phaser from 'phaser';
import { Config } from '@/data/Config';

type TextStyle = Phaser.Types.GameObjects.Text.TextStyle;

/** Colors of a drawn button: the body, its darker lower edge, the text and the icon. */
export type ButtonSkin = {
  fill: number;
  lip: number;
  ink: number;
};

/** `0xffc233` → `'#ffc233'`, for text styles. */
export function cssColor(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

function font(size: number, bold: boolean, color: number): TextStyle {
  return {
    fontFamily: Config.FONT.MAIN,
    fontSize: `${size}px`,
    fontStyle: bold ? 'bold' : 'normal',
    color: cssColor(color),
    align: 'center',
  };
}

const INK = 0xffffff;
const INK_DIM = 0xbdb6ee;

/**
 * The look of the game in one place: colors, sizes and text styles.
 * The UI is drawn in code from these values (buttons, panels, bars), and the icons
 * in the atlas are white and tinted with them, so a new game is restyled here.
 * The canvas is transparent: the background of every scene is the page background
 * in `styles/main.css`, which costs nothing to render.
 */
export const Theme = {
  color: {
    /** Scene transitions and the shade behind popups. */
    dark: 0x120c2e,
    panel: 0x2a2166,
    panelEdge: 0x6a59e0,
    /** The empty part of a progress bar. */
    track: 0x1b1447,
    accent: 0xffc233,
    ink: INK,
    inkDim: INK_DIM,
    /** For game objects: orbs, particles. */
    palette: [0xff6b8b, 0x4dd6ff, 0x7dffa1, 0xffd24d, 0xb58cff],
  },

  skin: {
    /** The main action of a screen. */
    primary: { fill: 0xffc233, lip: 0xc8860f, ink: 0x3b2500 },
    secondary: { fill: 0x7461f2, lip: 0x4a3bbf, ink: 0xffffff },
    /** A reward, a bonus. */
    reward: { fill: 0x35d6a0, lip: 0x1e9d75, ink: 0x06382a },
    neutral: { fill: 0x43378f, lip: 0x211a55, ink: 0xffffff },
    /** A switch that is turned off. */
    off: { fill: 0x2f2670, lip: 0x1f1850, ink: 0x8f87cf },
  } satisfies Record<string, ButtonSkin>,

  text: {
    title: font(124, true, INK),
    heading: font(76, true, INK),
    body: font(46, false, INK_DIM),
    button: font(54, true, INK),
    hud: font(64, true, INK),
  } satisfies Record<string, TextStyle>,

  radius: {
    button: 36,
    panel: 48,
  },

  /** Height of the lower edge of a button. */
  lip: 12,

  /** The atlas with the UI icons. */
  atlas: 'game',
} as const;
