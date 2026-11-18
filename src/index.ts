// Web fonts are bundled with the game: no requests to external servers.
// One file per script; add more subsets here when you add languages.
import '@fontsource/ubuntu/latin-400.css';
import '@fontsource/ubuntu/cyrillic-400.css';
import './styles/main.css';
import * as Phaser from 'phaser';
import { AudioMng } from './audio/AudioMng';
import { Config } from './data/Config';
import { DevParams } from './data/DevParams';
import { FpsMeter } from './debug/FpsMeter';
import { Params } from './data/Params';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { PreloaderScene } from './scenes/PreloaderScene';
import { MenuScene } from './scenes/MenuScene';
import { TransitionScene } from './scenes/TransitionScene';
import { EventBus } from './events/EventBus';
import { FrontEvent } from './events/FrontEvent';
import { ShellBridge } from './events/ShellBridge';
import { detectLang, LocaleMng } from './locale/LocaleMng';
import { bindGamePause } from './pause/bindGamePause';
import { PauseMng } from './pause/PauseMng';
import { PlatformMng } from './platform/PlatformMng';
import { SaveMng } from './save/SaveMng';
import { OrientationAlert } from './scaling/OrientationAlert';
import { loadFonts } from './utils/FontLoader';

const GAME_CONTAINER_ID = 'game';

function startGame(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    // The canvas is transparent: the page background from main.css shows through.
    transparent: true,
    scale: {
      mode: Phaser.Scale.HEIGHT_CONTROLS_WIDTH,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: Config.GW,
      height: Config.GH,
    },
    scene: [BootScene, PreloaderScene, MenuScene, GameScene, TransitionScene],
  });
}

function windowResizeCalculate() {
  const gw = Config.GW;
  const gh = Config.GH;
  const ww = window.innerWidth;
  const wh = window.innerHeight;
  const scale = wh / gh; // scale by height
  Params.gameWidth = Math.min(gw, ww / scale);
}

window.addEventListener(
  'resize',
  () => {
    if (Config.ORIENTATION.check) {
      OrientationAlert.checkOrientation();
    }
    windowResizeCalculate();
    EventBus.emit(FrontEvent.WINDOW_RESIZE);
  },
  false
);

/** Writes pending changes when the player leaves: the tab may never come back. */
function bindSaveFlush(): void {
  const flush = () => void SaveMng.flush();
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) flush();
  });
}

async function boot(): Promise<void> {
  const gameContainer = document.getElementById(GAME_CONTAINER_ID);
  if (!gameContainer) {
    throw new Error(`Game container #${GAME_CONTAINER_ID} not found`);
  }

  if (Config.ORIENTATION.check) {
    OrientationAlert.initOrientation();
    OrientationAlert.checkOrientation();
  }
  ShellBridge.init();
  windowResizeCalculate();

  await Promise.all([
    PlatformMng.init({
      setPaused: (paused) => PauseMng.set('platform', paused),
      setMuted: (muted) => AudioMng.setMuted(muted, 'platform'),
    }),
    loadFonts(Object.values(Config.FONT)),
  ]);
  await SaveMng.init(await PlatformMng.createStorage(Config.SAVE.KEY), Config.SAVE.DELAY_MS);
  bindSaveFlush();

  // The language the player picked in the menu wins, then the platform, then the browser.
  const langs = [SaveMng.get('lang'), PlatformMng.getLang(), ...navigator.languages];
  LocaleMng.getInstance().setLang(detectLang(langs.filter((lang) => lang !== null)));

  const game = startGame(gameContainer);
  bindGamePause(game);
  if (DevParams.debug) FpsMeter.attach(game);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => void boot());
} else {
  void boot();
}
