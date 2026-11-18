import type * as Phaser from 'phaser';
import type { AtlasFrame } from '@/data/Assets';
import { MyButton } from './basic/MyButton';
import { MyTextButton } from './basic/MyTextButton';
import { Theme, type ButtonSkin } from './Theme';

type Click = (btn: MyButton) => void;

export type IconButtonOptions = {
  /** Diameter of the button. */
  size?: number;
  skin?: ButtonSkin;
};

/**
 * A round button with an icon from the UI atlas. Created at (0, 0):
 * place it with `BaseScene.anchor()` or add it to a container.
 */
export function iconButton(
  scene: Phaser.Scene,
  frame: AtlasFrame,
  onClick: Click,
  context: object,
  options: IconButtonOptions = {}
): MyButton {
  const size = options.size ?? 120;
  const skin = options.skin ?? Theme.skin.neutral;
  return new MyButton(scene, 0, 0, {
    texture: Theme.atlas,
    frame,
    imageSize: size * 0.56,
    imageTint: skin.ink,
    skin,
    size: { w: size, h: size },
    radius: size / 2,
    onClick,
    context,
  });
}

export type TextButtonOptions = {
  width?: number;
  height?: number;
  skin?: ButtonSkin;
  /** An icon from the UI atlas to the left of the caption. */
  icon?: AtlasFrame;
};

/** A button with a caption and an optional icon. Created at (0, 0). */
export function textButton(
  scene: Phaser.Scene,
  text: string,
  onClick: Click,
  context: object,
  options: TextButtonOptions = {}
): MyTextButton {
  const height = options.height ?? 120;
  const skin = options.skin ?? Theme.skin.neutral;
  const button = new MyTextButton(scene, 0, 0, {
    texture: options.icon ? Theme.atlas : undefined,
    frame: options.icon,
    imageSize: height * 0.5,
    imageTint: skin.ink,
    skin,
    size: { w: options.width ?? 480, h: height },
    hoverScaleFactor: 1.05,
    onClick,
    context,
  });
  return button.setText(text);
}
