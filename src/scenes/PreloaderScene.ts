import * as Phaser from 'phaser';
import { ATLASES } from '@/data/Assets';
import { AUDIO_LOAD_DATA } from '@/data/AudioData';
import { Theme } from '@/gui/Theme';
import { Config } from '../data/Config';
import { PreloaderBar } from '../gui/preloader/PreloaderBar';
import { PlatformMng } from '../platform/PlatformMng';
import { LogMng } from '../utils/LogMng';
import { BaseScene } from './BaseScene';
import { SceneNames } from './SceneNames';

export class PreloaderScene extends BaseScene {
  private _bar?: PreloaderBar;

  constructor() {
    super(SceneNames.PreloaderScene);
  }

  public preload(): void {
    if (Config.PRELOADER.BAR) {
      this._bar = new PreloaderBar(this, Config.GW_HALF, Config.GH_HALF + 170);
      this.add.existing(this._bar);
    }

    // atlases: the list is generated from public/assets/atlases (npm run gen:assets)
    this.load.setPath('./assets/atlases/');
    for (const key of ATLASES) {
      this.load.atlas(key, `${key}.png`, `${key}.json`);
    }

    // audio
    this.load.setPath('./assets/audio/');
    for (let i = 0; i < AUDIO_LOAD_DATA.length; i++) {
      const sndData = AUDIO_LOAD_DATA[i];
      this.load.audio(sndData.alias, sndData.file);
    }

    // events
    this.load.on(
      'progress',
      (value: number) => {
        if (this._bar) this._bar.progress = value;
      },
      this
    );

    this.load.on(
      'complete',
      () => {
        if (this._bar) this._bar.progress = 1;
      },
      this
    );
  }

  public create(): void {
    LogMng.debug('PreloaderScene create...');
    // Everything is loaded: the player can start playing.
    PlatformMng.loadingFinished();

    if (Config.PRELOADER.DRAW_DEBUG_BORDER) {
      this.add.rectangle(Config.GW / 2, Config.GH / 2, Config.GW, Config.GH, 0x0, 0.1);
      this.add.rectangle(Config.GW / 2, Config.GH / 2, Config.GW_SAFE, Config.GH_SAFE, 0x0, 0.1);
    }

    if (Config.PRELOADER.TAP_TO_START) {
      this.showTapToStart();
    } else {
      this.startGame();
    }
  }

  /**
   * Browsers do not play audio before the first tap, so the game waits for one:
   * the menu music starts right away.
   */
  private showTapToStart(): void {
    this.add
      .text(Config.GW_HALF, Config.GH_HALF - 90, this.t('menu_title'), Theme.text.title)
      .setOrigin(0.5);

    const hint = this.add
      .text(Config.GW_HALF, Config.GH_HALF + 170, this.t('preloader_start'), Theme.text.body)
      .setOrigin(0.5)
      .setAlpha(0);
    if (this._bar) this.tweens.add({ targets: this._bar, alpha: 0, duration: 250 });
    this.tweens.add({
      targets: hint,
      alpha: { from: 0.35, to: 1 },
      duration: 700,
      delay: 250,
      ease: Phaser.Math.Easing.Sine.InOut,
      yoyo: true,
      repeat: -1,
    });

    this.input.once('pointerdown', () => {
      this.startGame();
    });
  }

  private startGame() {
    this.scene.start(SceneNames.MenuScene);
  }
}
