import { SaveMng } from '../save/SaveMng';
import { AudioMng } from './AudioMng';

/**
 * The player's sound switches, kept between sessions.
 * `AudioMng` does the switching, this class also saves the choice.
 *
 * ```ts
 * AudioSettings.music = !AudioSettings.music; // a music button in the settings
 * ```
 */
export class AudioSettings {
  /** Applies the saved switches. Call once at startup, after `SaveMng.init()`. */
  static apply(): void {
    AudioMng.setSfxEnabled(SaveMng.get('sfx'));
    AudioMng.setMusicEnabled(SaveMng.get('music'), 0);
  }

  static get sfx(): boolean {
    return AudioMng.getSfxEnabled();
  }

  static set sfx(enabled: boolean) {
    AudioMng.setSfxEnabled(enabled);
    SaveMng.set('sfx', enabled);
  }

  static get music(): boolean {
    return AudioMng.getMusicEnabled();
  }

  static set music(enabled: boolean) {
    AudioMng.setMusicEnabled(enabled);
    SaveMng.set('music', enabled);
  }
}
