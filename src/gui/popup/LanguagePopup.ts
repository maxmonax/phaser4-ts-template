import type * as Phaser from 'phaser';
import { LANG_NAMES, LANGS, type Lang } from '@/locale/LocaleKeys';
import { LocaleMng, t } from '@/locale/LocaleMng';
import { SaveMng } from '@/save/SaveMng';
import { textButton } from '../buttons';
import { Theme } from '../Theme';
import { Popup } from './Popup';

const COLUMNS = 2;
const BUTTON_W = 380;
const BUTTON_H = 100;
const GAP = 24;
/** From the top of the panel to the first row: room for the title. */
const GRID_TOP = 200;
const PADDING_X = 60;
const PADDING_BOTTOM = 90;

/**
 * The list of languages, each named in its own language. A tap switches the language,
 * saves the choice and closes the popup. `PopupScene.open(this, LanguagePopup)`
 */
export class LanguagePopup extends Popup {
  protected _className = 'LanguagePopup';

  constructor(scene: Phaser.Scene) {
    const rows = Math.ceil(LANGS.length / COLUMNS);
    const gridWidth = COLUMNS * BUTTON_W + (COLUMNS - 1) * GAP;
    const gridHeight = rows * BUTTON_H + (rows - 1) * GAP;
    super(scene, gridWidth + PADDING_X * 2, GRID_TOP + gridHeight + PADDING_BOTTOM);

    const current = LocaleMng.getInstance().getLang();
    const firstRowY = -this.panelHeight / 2 + GRID_TOP + BUTTON_H / 2;
    LANGS.forEach((lang, i) => {
      const column = i % COLUMNS;
      const row = Math.floor(i / COLUMNS);
      const button = textButton(scene, LANG_NAMES[lang], () => this.select(lang), this, {
        width: BUTTON_W,
        height: BUTTON_H,
        skin: lang === current ? Theme.skin.primary : Theme.skin.neutral,
      });
      button.setPosition(
        (column - (COLUMNS - 1) / 2) * (BUTTON_W + GAP),
        firstRowY + row * (BUTTON_H + GAP)
      );
      this.content.add(button);
    });

    this.allowDismiss();
    this.updateTexts();
  }

  protected updateTexts(): void {
    this.setTitle(t('language_title'));
  }

  private select(lang: Lang): void {
    LocaleMng.getInstance().setLang(lang);
    SaveMng.set('lang', lang);
    this.close();
  }
}
