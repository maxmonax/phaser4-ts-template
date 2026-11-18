import * as Phaser from 'phaser';
import { LANG_NAMES, type Lang } from '@/locale/LocaleKeys';
import { LocaleMng } from '@/locale/LocaleMng';
import { PopupScene } from '@/scenes/PopupScene';
import { MyTextButton } from './basic/MyTextButton';
import { LanguagePopup } from './popup/LanguagePopup';
import { Theme } from './Theme';

export type LangButtonOptions = {
  width?: number;
  height?: number;
};

/**
 * Language button: shows the name of the current language, a click opens the list
 * of languages (`LanguagePopup`). Everything subscribed to the language change
 * (`BaseScene.registerLangChange`, popups) updates its texts.
 */
export class LangButton extends MyTextButton {
  protected _className = 'LangButton';

  constructor(scene: Phaser.Scene, x = 0, y = 0, options: LangButtonOptions = {}) {
    const height = options.height ?? 110;
    const skin = Theme.skin.neutral;
    super(scene, x, y, {
      texture: Theme.atlas,
      frame: 'icons/globe',
      imageSize: height * 0.5,
      imageTint: skin.ink,
      skin,
      size: { w: options.width ?? 400, h: height },
      hoverScaleFactor: 1.05,
    });
    this.setClickListener(this.onClickOpen, this);

    const locale = LocaleMng.getInstance();
    const onLangChange = (lang: Lang) => this.setText(LANG_NAMES[lang]);
    locale.onLangChange(onLangChange);
    this.once(Phaser.GameObjects.Events.DESTROY, () => locale.offLangChange(onLangChange));
    onLangChange(locale.getLang());
  }

  private onClickOpen(): void {
    void PopupScene.open(this.scene, LanguagePopup);
  }
}
