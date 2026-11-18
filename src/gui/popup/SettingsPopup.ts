import type * as Phaser from 'phaser';
import { AudioSettings } from '@/audio/AudioSettings';
import { t } from '@/locale/LocaleMng';
import { LangButton } from '../LangButton';
import { ToggleButton } from '../ToggleButton';
import { Popup } from './Popup';

/** Sound, music and language. `PopupScene.open(this, SettingsPopup)` */
export class SettingsPopup extends Popup {
  protected _className = 'SettingsPopup';

  constructor(scene: Phaser.Scene) {
    super(scene, 820, 640);

    const sfx = new ToggleButton(scene, -110, -20, {
      on: 'icons/sound-on',
      off: 'icons/sound-off',
      value: AudioSettings.sfx,
      onChange: (on) => (AudioSettings.sfx = on),
    });
    const music = new ToggleButton(scene, 110, -20, {
      on: 'icons/music-on',
      off: 'icons/music-off',
      value: AudioSettings.music,
      onChange: (on) => (AudioSettings.music = on),
    });
    this.content.add([sfx, music, new LangButton(scene, 0, 180, { width: 460 })]);

    this.allowDismiss();
    this.updateTexts();
  }

  protected updateTexts(): void {
    this.setTitle(t('settings_title'));
  }
}
