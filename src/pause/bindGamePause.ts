import type * as Phaser from 'phaser';
import { AudioMng } from '../audio/AudioMng';
import { EventBus } from '../events/EventBus';
import { FrontEvent } from '../events/FrontEvent';
import { PauseMng } from './PauseMng';

/**
 * Connects `PauseMng` to the game: while paused, all audio is muted and the game loop
 * stops. Also turns a hidden browser tab into the `hidden` reason.
 *
 * Until the game has loaded (`FrontEvent.GAME_LOADED`) a pause only mutes the audio:
 * a stopped loop would also stop the loading, and a phone held the wrong way at startup
 * would start loading only after it is rotated.
 *
 * Call once, right after the game is created.
 */
export function bindGamePause(game: Phaser.Game): void {
  let loaded = false;
  const apply = (paused: boolean) => {
    AudioMng.setMuted(paused, 'pause');
    if (!loaded) return;
    if (paused) game.pause();
    else game.resume();
  };

  PauseMng.onChange(apply);
  if (PauseMng.isPaused()) apply(true);
  EventBus.once(FrontEvent.GAME_LOADED, () => {
    loaded = true;
    if (PauseMng.isPaused()) apply(true);
  });

  const onVisibilityChange = () => PauseMng.set('hidden', document.hidden);
  document.addEventListener('visibilitychange', onVisibilityChange);
  onVisibilityChange();
}
