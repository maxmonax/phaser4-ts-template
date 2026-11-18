import * as Phaser from 'phaser';
import { AudioMng } from '../audio/AudioMng';
import { DevParams } from '../data/DevParams';
import { EventBus } from '../events/EventBus';
import { ShellInEvent } from '../events/ShellEvent';
import { LogMng } from '../utils/LogMng';
import { SceneNames } from './SceneNames';

function onShellMute(payload?: { muted?: unknown }): void {
  AudioMng.setMuted(payload?.muted !== false, 'shell');
}

/** First scene: one-time setup of game-wide services. Runs once per game. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneNames.BootScene);
  }

  public init(): void {
    LogMng.setMode(DevParams.debug ? LogMng.MODE_DEBUG : LogMng.MODE_RELEASE);
    LogMng.system('log mode: ' + LogMng.getMode());

    if (DevParams.testParam != null) {
      LogMng.debug(`GET key "testParam" = ${DevParams.testParam}`);
    }

    AudioMng.init(this.game);
    EventBus.on(ShellInEvent.MUTE, onShellMute);
  }

  public preload(): void {
    // load preloader atlas and res if u need
    // this.load.atlas('preloader', './assets/atlases/preloader.png', './assets/atlases/preloader.json');
  }

  public create(): void {
    // Runs all the time, above the game scenes: see PopupScene.
    this.scene.launch(SceneNames.PopupScene);
    this.scene.start(SceneNames.PreloaderScene);
  }
}
