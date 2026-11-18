import * as Phaser from 'phaser';
import { MyBtnParams, MyButton } from './MyButton';
import { Config } from '@/data/Config';
import { MyText } from './MyText';

const DEFAULT_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: Config.FONT.MAIN,
  fontSize: '70px',
  align: 'center',
  color: '#ffffff',
};

export class MyTextButton extends MyButton {
  protected _caption: MyText;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    aParams: MyBtnParams,
    style?: Phaser.Types.GameObjects.Text.TextStyle
  ) {
    super(scene, x, y, aParams);

    this._caption = new MyText(scene, 0, 0, 'Button', { ...DEFAULT_STYLE, ...style }).setOrigin(
      0.5
    );

    this.add(this._caption);
  }

  setText(text: string): this {
    this._caption.setText(text);
    return this;
  }
}
