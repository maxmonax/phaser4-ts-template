import * as Phaser from 'phaser';
import type { AtlasFrame, AtlasKey } from '@/data/Assets';

/**
 * An image from a texture atlas. The atlas and the frame are checked at compile time
 * against `src/data/Assets.ts` (`npm run gen:assets`). For a texture that is not
 * in an atlas use `Phaser.GameObjects.Image`.
 */
export class MyImage extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x: number, y: number, texture: AtlasKey, frame: AtlasFrame) {
    super(scene, x, y, texture, frame);
  }
}
