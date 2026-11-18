import * as Phaser from 'phaser';
import { fitText } from '../fitText';
import { cssColor, Theme } from '../Theme';
import { MyBtnParams, MyButton } from './MyButton';
import { MyText } from './MyText';

/** Space between the caption and the left and right edges of the button. */
const PADDING = 40;
const ICON_GAP = 18;

/**
 * A button with a caption. The image of the button (`texture` + `frame`), if any,
 * is an icon to the left of the caption. The caption is scaled down when it does not
 * fit, so a long translation does not break the button.
 */
export class MyTextButton extends MyButton {
  protected _className = 'MyTextButton';
  protected _caption: MyText;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    aParams: MyBtnParams,
    style?: Phaser.Types.GameObjects.Text.TextStyle
  ) {
    super(scene, x, y, aParams);

    const color = aParams.skin ? { color: cssColor(aParams.skin.ink) } : {};
    this._caption = new MyText(scene, 0, 0, '', { ...Theme.text.button, ...color, ...style });
    this._caption.setOrigin(0.5);
    this._dummy.add(this._caption);
  }

  setText(text: string): this {
    this._caption.setText(text);
    this.layout();
    return this;
  }

  /** Centers the icon and the caption as one group and fits the caption into the button. */
  private layout(): void {
    const { w, h } = this.size;
    const iconW = this._img ? this._img.displayWidth + ICON_GAP : 0;
    if (w > 0) fitText(this._caption, w - PADDING * 2 - iconW, h > 0 ? h : Infinity);

    const textW = this._caption.displayWidth;
    const left = -(iconW + textW) / 2;
    if (this._img) this._img.x = left + this._img.displayWidth / 2;
    this._caption.x = left + iconW + textW / 2;
  }
}
