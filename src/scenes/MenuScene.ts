import * as Phaser from 'phaser';
import { AdMng } from '@/ads/AdMng';
import { MyButton } from '@/gui/basic/MyButton';
import { MyTextButton } from '@/gui/basic/MyTextButton';
import { Config } from '../data/Config';
import { LANG_NAMES, type Lang } from '../locale/LocaleKeys';
import { LocaleMng } from '../locale/LocaleMng';
import { SaveMng } from '../save/SaveMng';
import { LogMng } from '../utils/LogMng';
import { BaseScene } from './BaseScene';
import { SceneNames } from './SceneNames';
import { TransitionScene } from './TransitionScene';

export class MenuScene extends BaseScene {
  /** Rounds started in this session. */
  private static _roundsStarted = 0;
  private _dummyMain!: Phaser.GameObjects.Container;
  private _btnPlay!: MyButton;
  private _title!: Phaser.GameObjects.Text;
  private _btnLang!: MyTextButton;
  private _starting = false;

  constructor() {
    super(SceneNames.MenuScene);
  }

  public init(_aData: unknown) {}

  public preload(): void {}

  public create(): void {
    this._starting = false;
    this._dummyMain = this.add.container(0, 0);

    this._title = this.add
      .text(Config.GW_HALF, Config.GH_HALF - 400, this.t('menu_title'), {
        fontFamily: Config.FONT.MAIN,
        fontSize: '80px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    this._dummyMain.add(this._title);

    this._btnPlay = new MyButton(this, Config.GW_HALF, Config.GH_HALF, {
      texture: 'game',
      frame: 'btnPlay',
      onClick: this.onPlayBtnClick,
      context: this,
    });
    this._dummyMain.add(this._btnPlay);

    this._btnLang = new MyTextButton(this, Config.GW_HALF, Config.GH_HALF + 400, {
      size: { w: 360, h: 80 },
      onClick: this.onLangBtnClick,
      context: this,
    });
    this._btnLang.setText(LANG_NAMES[LocaleMng.getInstance().getLang()]);
    this._dummyMain.add(this._btnLang);

    this.registerLangChange(this.onLangChange);
    this.events.once('shutdown', this.onSceneShutdown, this);

    this.registerResize(this.onResize);
    this.onResize();
  }

  private onLangChange(lang: Lang): void {
    this._title.setText(this.t('menu_title'));
    this._btnLang.setText(LANG_NAMES[lang]);
  }

  private onLangBtnClick(): void {
    const next = LocaleMng.getInstance().nextLang();
    LocaleMng.getInstance().setLang(next);
    SaveMng.set('lang', next);
  }

  private onResize() {
    this.updateLayout();
  }

  private updateLayout() {}

  private async onPlayBtnClick() {
    if (this._starting) return;
    this._starting = true;
    // An ad break before every round except the first one: what Poki asks for,
    // and a natural break on other platforms.
    if (MenuScene._roundsStarted++ > 0) await AdMng.showInterstitial();
    TransitionScene.change(this, SceneNames.GameScene);
  }

  private onSceneShutdown() {
    LogMng.debug(`${SceneNames.MenuScene}: onSceneShutdown()...`);
  }
}
