// Web fonts are bundled with the game: no requests to external servers.
// One file per script; add more subsets here when you add languages.
import '@fontsource/ubuntu/latin-400.css';
import '@fontsource/ubuntu/latin-700.css';
import '@fontsource/ubuntu/cyrillic-400.css';
import '@fontsource/ubuntu/cyrillic-700.css';
import './styles/main.css';
import * as Phaser from 'phaser';
import { AudioMng } from './audio/AudioMng';
import { AudioSettings } from './audio/AudioSettings';
import { Config } from './data/Config';
import { DevParams } from './data/DevParams';
import { ErrorOverlay } from './debug/ErrorOverlay';
import { FpsMeter } from './debug/FpsMeter';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { PreloaderScene } from './scenes/PreloaderScene';
import { MenuScene } from './scenes/MenuScene';
import { PopupScene } from './scenes/PopupScene';
import { TransitionScene } from './scenes/TransitionScene';
import { EventBus } from './events/EventBus';
import { FrontEvent } from './events/FrontEvent';
import { ShellBridge } from './events/ShellBridge';
import { detectLang, LocaleMng } from './locale/LocaleMng';
import { bindGamePause } from './pause/bindGamePause';
import { PauseMng } from './pause/PauseMng';
import { PlatformMng } from './platform/PlatformMng';
import { SaveMng } from './save/SaveMng';
import { CenterCameraPlugin } from './scaling/CenterCameraPlugin';
import { OrientationAlert } from './scaling/OrientationAlert';
import { Viewport } from './scaling/Viewport';
import { loadFonts } from './utils/FontLoader';

const GAME_CONTAINER_ID = 'game';

function startGame(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    // The canvas is transparent: the page background from main.css shows through.
    transparent: true,
    scale: {
      // The canvas shows the safe area whole and grows by as much as the window allows:
      // it is always exactly the visible area, nothing off screen is rendered. See Viewport.
      mode: Phaser.Scale.EXPAND,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: Config.GW_SAFE,
      height: Config.GH_SAFE,
    },
    plugins: {
      scene: [
        // Keeps world coordinates independent of the window, see CenterCameraPlugin.
        {
          key: CenterCameraPlugin.KEY,
          plugin: CenterCameraPlugin,
          mapping: CenterCameraPlugin.MAPPING,
        },
      ],
    },
    // The order is the drawing order: popups above the game, the transition above all.
    scene: [BootScene, PreloaderScene, MenuScene, GameScene, PopupScene, TransitionScene],
  });
}

/** Keeps `Viewport` in step with the game size and tells the scenes when it changes. */
function bindViewport(game: Phaser.Game): void {
  const update = () => {
    Viewport.setScreenSize(game.scale.width, game.scale.height);
    EventBus.emit(FrontEvent.WINDOW_RESIZE);
  };
  game.scale.on(Phaser.Scale.Events.RESIZE, update);
  update();
}

window.addEventListener('resize', () => OrientationAlert.checkOrientation(), false);

/** Writes pending changes when the player leaves: the tab may never come back. */
function bindSaveFlush(): void {
  const flush = () => void SaveMng.flush();
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) flush();
  });
}

async function boot(): Promise<void> {
  // First of all: the errors of the startup itself are worth seeing too.
  if (DevParams.debug) ErrorOverlay.attach();

  const gameContainer = document.getElementById(GAME_CONTAINER_ID);
  if (!gameContainer) {
    throw new Error(`Game container #${GAME_CONTAINER_ID} not found`);
  }

  OrientationAlert.initOrientation();
  OrientationAlert.checkOrientation();
  ShellBridge.init();

  await Promise.all([
    PlatformMng.init({
      setPaused: (paused) => PauseMng.set('platform', paused),
      setMuted: (muted) => AudioMng.setMuted(muted, 'platform'),
    }),
    loadFonts(Object.values(Config.FONT), Config.FONT_WEIGHTS),
  ]);
  await SaveMng.init(await PlatformMng.createStorage(Config.SAVE.KEY), Config.SAVE.DELAY_MS);
  bindSaveFlush();
  AudioSettings.apply();

  // The language the player picked in the menu wins, then the platform, then the browser.
  const langs = [SaveMng.get('lang'), PlatformMng.getLang(), ...navigator.languages];
  const locale = LocaleMng.getInstance();
  locale.setLang(detectLang(langs.filter((lang) => lang !== null)));
  // The page language follows the game language: screen readers, hyphenation, portal checks.
  document.documentElement.lang = locale.getLang();
  locale.onLangChange((lang) => (document.documentElement.lang = lang));

  const game = startGame(gameContainer);
  bindViewport(game);
  bindGamePause(game);
  if (DevParams.debug) FpsMeter.attach(game);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => void boot());
} else {
  void boot();
}
