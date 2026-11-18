import type * as Phaser from 'phaser';
import { AudioMng } from '../audio/AudioMng';
import { PauseMng } from './PauseMng';

/**
 * Connects `PauseMng` to the game: while paused, the game loop stops and all
 * audio is muted. Also turns a hidden browser tab into the `hidden` reason.
 *
 * Call once, right after the game is created.
 */
export function bindGamePause(game: Phaser.Game): void {
  const apply = (paused: boolean) => {
    if (paused) game.pause();
    else game.resume();
    AudioMng.setMuted(paused, 'pause');
  };

  PauseMng.onChange(apply);
  if (PauseMng.isPaused()) apply(true);

  const onVisibilityChange = () => PauseMng.set('hidden', document.hidden);
  document.addEventListener('visibilitychange', onVisibilityChange);
  onVisibilityChange();
}
