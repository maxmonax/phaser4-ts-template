import * as Phaser from 'phaser';
import { AdMng } from '@/ads/AdMng';
import { MyButton } from '@/gui/basic/MyButton';
import { MyContainer } from '@/gui/basic/MyContainer';
import { MyTextButton } from '@/gui/basic/MyTextButton';
import { PlatformMng } from '@/platform/PlatformMng';
import { SaveMng } from '@/save/SaveMng';
import { Config } from '../data/Config';
import { BaseScene } from './BaseScene';
import { SceneNames } from './SceneNames';
import { TransitionScene } from './TransitionScene';

const REWARD_COINS = 10;

export class GameScene extends BaseScene {
  private _dummyGame!: MyContainer;
  private _dummyGui!: MyContainer;
  // GUI
  private _btnBack!: MyButton;
  private _coinsText!: Phaser.GameObjects.Text;
  private _btnReward?: MyTextButton;

  constructor() {
    super(SceneNames.GameScene);
  }

  public create(): void {
    this._dummyGame = new MyContainer(this, 0, 0);
    this.add.existing(this._dummyGame);

    this._dummyGui = new MyContainer(this, 0, 0);
    this.add.existing(this._dummyGui);

    this._btnBack = new MyButton(this, 0, 0, {
      texture: 'game',
      frame: 'btnBack',
      onClick: this.onBackClick,
      context: this,
    });
    this.add.existing(this._btnBack);
    this.anchor(this._btnBack, { left: 90, top: 80 });

    const scoreText = new Phaser.GameObjects.Text(
      this,
      Config.GW / 2,
      Config.GH_HALF,
      'Game Screen\nCustom web font',
      {
        fontFamily: Config.FONT.MAIN,
        color: '#ffffff',
        align: 'center',
      }
    )
      .setFontSize(80)
      .setOrigin(0.5, 0.5);
    this.add.existing(scoreText);

    this.createRewardDemo();

    // poiter events example
    // this.input.on('pointerdown', this.onPointerDown, this);
    // this.input.on('pointermove', this.onPointerMove, this);
    // this.input.on('pointerup', this.onPointerUp, this);

    // drag n drop events example
    // this.input.on('dragstart', this.onDragStart, this);
    // this.input.on('drag', this.onDrag, this);
    // this.input.on('dragend', this.onDragEnd, this);

    this.registerLangChange(this.updateTexts);

    // The round starts right away; tell the platform when it ends.
    PlatformMng.gameplayStart();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => PlatformMng.gameplayStop());
  }

  /** Demo of a rewarded ad and of the saved state: coins survive a page reload. */
  private createRewardDemo(): void {
    this._coinsText = this.add
      .text(Config.GW_HALF, Config.GH - 260, '', {
        fontFamily: Config.FONT.MAIN,
        fontSize: '50px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    // Without ads (e.g. a web release build) the button makes no sense.
    this._btnReward = undefined;
    if (AdMng.isAvailable()) {
      this._btnReward = new MyTextButton(
        this,
        Config.GW_HALF,
        Config.GH - 150,
        { size: { w: 480, h: 90 }, onClick: this.onRewardClick, context: this },
        { fontSize: '50px' }
      );
      this.add.existing(this._btnReward);
    }

    this.updateTexts();
  }

  private updateTexts(): void {
    this._coinsText.setText(this.t('game_coins', { coins: SaveMng.get('coins') }));
    this._btnReward?.setText(this.t('game_reward_btn'));
  }

  private async onRewardClick() {
    if (!this._btnReward) return;
    this._btnReward.disabled = true;
    const rewarded = await AdMng.showRewarded();
    // The scene may have been left while the ad was on screen.
    if (!this.scene.isActive()) return;
    if (rewarded) {
      SaveMng.set('coins', SaveMng.get('coins') + REWARD_COINS);
      this.updateTexts();
    }
    this._btnReward.disabled = false;
  }

  private onBackClick() {
    TransitionScene.change(this, SceneNames.MenuScene);
  }

  update(_allTime: number, _dtMs: number) {}
}
