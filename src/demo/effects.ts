import * as Phaser from 'phaser';
import { MyImage } from '@/gui/basic/MyImage';
import { cssColor, Theme } from '@/gui/Theme';
import { MyMath } from '@/utils/MyMath';

const DOTS = 8;

/** An orb is popped: a ring, a few flying dots and the points going up. */
export function popBurst(
  scene: Phaser.Scene,
  parent: Phaser.GameObjects.Container,
  x: number,
  y: number,
  color: number,
  points: number
): void {
  const ring = new MyImage(scene, x, y, Theme.atlas, 'ring').setTint(color).setScale(0.45);
  parent.add(ring);
  scene.tweens.add({
    targets: ring,
    scale: 1.05,
    alpha: 0,
    duration: 320,
    ease: Phaser.Math.Easing.Cubic.Out,
    onComplete: () => ring.destroy(),
  });

  for (let i = 0; i < DOTS; i++) {
    const angle = MyMath.toRadian((360 / DOTS) * i + MyMath.randomInRange(-15, 15));
    const distance = MyMath.randomInRange(130, 210);
    const dot = new MyImage(scene, x, y, Theme.atlas, 'dot').setTint(color);
    parent.add(dot);
    scene.tweens.add({
      targets: dot,
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance,
      scale: 0.2,
      alpha: 0,
      duration: 420,
      ease: Phaser.Math.Easing.Cubic.Out,
      onComplete: () => dot.destroy(),
    });
  }

  const label = new Phaser.GameObjects.Text(scene, x, y - 30, `+${points}`, {
    ...Theme.text.hud,
    color: cssColor(Theme.color.ink),
  }).setOrigin(0.5);
  parent.add(label);
  scene.tweens.add({
    targets: label,
    y: y - 150,
    alpha: 0,
    duration: 650,
    ease: Phaser.Math.Easing.Cubic.Out,
    onComplete: () => label.destroy(),
  });
}
