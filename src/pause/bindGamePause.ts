import type * as Phaser from 'phaser';
import { AudioMng } from '../audio/AudioMng';
import { EventBus } from '../events/EventBus';
import { FrontEvent } from '../events/FrontEvent';
import { PauseMng } from './PauseMng';

/**
 * Connects `PauseMng` to the game: while paused, the game loop stops, and the audio is
 * muted (except while the game only waits for an ad to start, see `PauseReason`). Also
 * turns a hidden browser tab into the `hidden` reason.
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
    if (!loaded) return;
    if (paused) game.pause();
    else game.resume();
  };
  const mute = (muted: boolean) => AudioMng.setMuted(muted, 'pause');

  PauseMng.onChange(apply);
  PauseMng.onMuteChange(mute);
  if (PauseMng.isMuted()) mute(true);
  EventBus.once(FrontEvent.GAME_LOADED, () => {
    loaded = true;
    if (PauseMng.isPaused()) apply(true);
  });

  const onVisibilityChange = () => PauseMng.set('hidden', document.hidden);
  document.addEventListener('visibilitychange', onVisibilityChange);
  onVisibilityChange();
}
