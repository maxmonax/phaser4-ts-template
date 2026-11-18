import type * as Phaser from 'phaser';
import { t } from '@/locale/LocaleMng';
import { PopupScene } from '@/scenes/PopupScene';
import type { MyTextButton } from '../basic/MyTextButton';
import { textButton } from '../buttons';
import { Theme } from '../Theme';
import { Popup } from './Popup';
import { SettingsPopup } from './SettingsPopup';

export type PauseResult = 'resume' | 'menu';

/**
 * Pause menu. The scene that opens it pauses itself:
 *
 * ```ts
 * this.scene.pause();
 * const answer = await PopupScene.open(this, PausePopup);
 * ```
 */
export class PausePopup extends Popup<PauseResult> {
  protected _className = 'PausePopup';
  private _btnResume: MyTextButton;
  private _btnSettings: MyTextButton;
  private _btnMenu: MyTextButton;

  constructor(scene: Phaser.Scene) {
    super(scene, 760, 760);

    const width = 520;
    this._btnResume = textButton(scene, '', () => this.close('resume'), this, {
      width,
      skin: Theme.skin.primary,
      icon: 'icons/play',
    });
    this._btnSettings = textButton(scene, '', this.onSettingsClick, this, {
      width,
      icon: 'icons/settings',
    });
    this._btnMenu = textButton(scene, '', () => this.close('menu'), this, {
      width,
      icon: 'icons/home',
    });
    this.content.add([
      this._btnResume.setPosition(0, -100),
      this._btnSettings.setPosition(0, 60),
      this._btnMenu.setPosition(0, 220),
    ]);

    this.allowDismiss('resume');
    this.updateTexts();
  }

  protected updateTexts(): void {
    this.setTitle(t('pause_title'));
    this._btnResume.setText(t('btn_resume'));
    this._btnSettings.setText(t('btn_settings'));
    this._btnMenu.setText(t('btn_menu'));
  }

  private onSettingsClick(): void {
    void PopupScene.open(this.scene, SettingsPopup);
  }
}
