import * as Phaser from 'phaser';
import { AudioMng } from '@/audio/AudioMng';
import { AudioAlias } from '@/data/AudioData';
import { roundBreak } from '@/demo/roundBreak';
import { ROUND_SECONDS } from '@/demo/roundConfig';
import type { MyTextButton } from '@/gui/basic/MyTextButton';
import { iconButton, textButton } from '@/gui/buttons';
import { fitText } from '@/gui/fitText';
import { LangButton } from '@/gui/LangButton';
import { SettingsPopup } from '@/gui/popup/SettingsPopup';
import { Theme } from '@/gui/Theme';
import { Config } from '../data/Config';
import { SaveMng } from '../save/SaveMng';
import { BaseScene } from './BaseScene';
import { PopupScene } from './PopupScene';
import { SceneNames } from './SceneNames';
import { TransitionScene } from './TransitionScene';

const MUSIC_VOLUME = 0.5;
/** The texts stay inside the safe area, which is always on screen. */
const TEXT_WIDTH = Config.GW_SAFE - 120;

export class MenuScene extends BaseScene {
  private _title!: Phaser.GameObjects.Text;
  private _subtitle!: Phaser.GameObjects.Text;
  private _best!: Phaser.GameObjects.Text;
  private _btnPlay!: MyTextButton;
  private _starting = false;

  constructor() {
    super(SceneNames.MenuScene);
  }

  public create(): void {
    this._starting = false;

    // Laid out from the middle of the screen: it works in landscape and in portrait.
    const x = Config.GW_HALF;
    const y = Config.GH_HALF;
    this._title = this.add.text(x, y - 270, '', Theme.text.title).setOrigin(0.5);
    this._subtitle = this.add.text(x, y - 130, '', Theme.text.body).setOrigin(0.5);

    this._btnPlay = textButton(this, '', this.onPlayBtnClick, this, {
      width: 580,
      height: 170,
      skin: Theme.skin.primary,
      icon: 'icons/play',
    });
    this.add.existing(this._btnPlay.setPosition(x, y + 110));

    this._best = this.add.text(x, y + 310, '', Theme.text.body).setOrigin(0.5);

    // The corner of the visible area, whatever the window width is.
    const btnSettings = iconButton(this, 'icons/settings', this.onSettingsClick, this);
    this.add.existing(btnSettings);
    this.anchor(btnSettings, { right: 110, top: 110 });

    // The language switch: every text on screen follows it, see updateTexts().
    const btnLang = new LangButton(this);
    this.add.existing(btnLang);
    this.anchor(btnLang, { right: 410, top: 110 });

    this.registerLangChange(this.updateTexts);
    this.updateTexts();

    // Starts the music on the first visit and keeps it playing on the next ones.
    AudioMng.playMusic(AudioAlias.Music, { volume: MUSIC_VOLUME, fadeDuration: 800 });
  }

  private updateTexts(): void {
    this._title.setText(this.t('menu_title'));
    this._subtitle.setText(this.t('demo_subtitle', { seconds: ROUND_SECONDS }));
    this._btnPlay.setText(this.t('btn_play'));

    const best = SaveMng.get('best');
    this._best.setText(best > 0 ? this.t('demo_best', { count: best }) : '');

    // A translation may be longer than the original, a portrait screen is narrow.
    for (const text of [this._title, this._subtitle, this._best]) fitText(text, TEXT_WIDTH);
  }

  private onSettingsClick(): void {
    void PopupScene.open(this, SettingsPopup);
  }

  private async onPlayBtnClick() {
    if (this._starting) return;
    this._starting = true;
    await roundBreak();
    TransitionScene.change(this, SceneNames.GameScene);
  }
}
