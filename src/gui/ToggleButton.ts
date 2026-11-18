import type * as Phaser from 'phaser';
import type { AtlasFrame } from '@/data/Assets';
import { MyButton } from './basic/MyButton';
import { Theme } from './Theme';

export type ToggleButtonParams = {
  /** Icons of the two states. */
  on: AtlasFrame;
  off: AtlasFrame;
  value: boolean;
  onChange: (value: boolean) => void;
  /** Diameter of the button. */
  size?: number;
};

/**
 * A round on/off switch, e.g. for sound:
 *
 * ```ts
 * new ToggleButton(scene, 0, 0, {
 *   on: 'icons/sound-on',
 *   off: 'icons/sound-off',
 *   value: AudioSettings.sfx,
 *   onChange: (on) => (AudioSettings.sfx = on),
 * });
 * ```
 */
export class ToggleButton extends MyButton {
  protected _className = 'ToggleButton';
  private _value: boolean;
  private _toggle: ToggleButtonParams;

  constructor(scene: Phaser.Scene, x: number, y: number, params: ToggleButtonParams) {
    const size = params.size ?? 140;
    super(scene, x, y, {
      texture: Theme.atlas,
      frame: params.value ? params.on : params.off,
      imageSize: size * 0.56,
      skin: Theme.skin.secondary,
      size: { w: size, h: size },
      radius: size / 2,
    });
    this._toggle = params;
    this._value = params.value;
    this.setClickListener(this.onToggle, this);
    this.refresh();
  }

  get value(): boolean {
    return this._value;
  }

  /** Sets the state without calling `onChange`. */
  set value(value: boolean) {
    this._value = value;
    this.refresh();
  }

  private onToggle(): void {
    this.value = !this._value;
    this._toggle.onChange(this._value);
  }

  private refresh(): void {
    this.setFrame(this._value ? this._toggle.on : this._toggle.off);
    this.setSkin(this._value ? Theme.skin.secondary : Theme.skin.off);
  }
}
