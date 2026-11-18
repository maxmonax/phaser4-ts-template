import * as Phaser from 'phaser';
import { LANG_NAMES, type Lang } from '@/locale/LocaleKeys';
import { LocaleMng } from '@/locale/LocaleMng';
import { SaveMng } from '@/save/SaveMng';
import { MyTextButton } from './basic/MyTextButton';
import { Theme } from './Theme';

export type LangButtonOptions = {
  width?: number;
  height?: number;
};

/**
 * Language switch: shows the name of the current language, a click selects
 * the next one and saves the choice. Everything subscribed to the language change
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
    this.setClickListener(this.onClickNext, this);

    const locale = LocaleMng.getInstance();
    const onLangChange = (lang: Lang) => this.setText(LANG_NAMES[lang]);
    locale.onLangChange(onLangChange);
    this.once(Phaser.GameObjects.Events.DESTROY, () => locale.offLangChange(onLangChange));
    onLangChange(locale.getLang());
  }

  private onClickNext(): void {
    const locale = LocaleMng.getInstance();
    const next = locale.nextLang();
    locale.setLang(next);
    SaveMng.set('lang', next);
  }
}
