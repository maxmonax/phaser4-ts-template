import * as Phaser from 'phaser';
import { MyMath } from '../utils/MyMath';
import { AUDIO_LOAD_DATA } from '../data/AudioData';
import { Fader, type FadeHandle } from './Fader';

type ManagedSound = Phaser.Sound.BaseSound & {
  volume: number;
  setVolume(value: number): ManagedSound;
};

type MusicEntry = {
  key: string;
  sound: ManagedSound;
  baseVolume: number;
  currentBaseVolume: number;
  fade?: FadeHandle;
};

export type PlayMusicOptions = {
  volume?: number;
  fadeDuration?: number;
  fadeFrom?: number;
  loop?: boolean;
  restart?: boolean;
  config?: Phaser.Types.Sound.SoundConfig;
};

export type CrossfadeMusicOptions = PlayMusicOptions & {
  duration?: number;
  stopFrom?: boolean;
  fromFadeTo?: number;
};

export type StopMusicOptions = {
  fadeDuration?: number;
  fadeTo?: number;
  destroy?: boolean;
};

export type PlaySfxOptions = Phaser.Types.Sound.SoundConfig & {
  force?: boolean;
  maxInstances?: number;
  marker?: string;
};

export type DuckMusicOptions = {
  volume?: number;
  duration?: number;
  fadeOut?: number;
  fadeIn?: number;
  hold?: number;
};

/**
 * Who muted the audio. Sources do not override each other: audio is muted
 * while at least one of them wants it muted.
 *
 * - `user` — the player's sound toggle;
 * - `pause` — the game is paused (see `PauseMng`);
 * - `shell` — the host page (`ShellInEvent.MUTE`);
 * - `platform` — the game portal (e.g. CrazyGames `settings.muteAudio`).
 */
export type MuteSource = 'user' | 'pause' | 'shell' | 'platform';

export class AudioMng {
  private static readonly DEFAULT_MUSIC_FADE = 500;
  private static readonly DEFAULT_MUSIC_VOLUME = 1;
  private static readonly MIN_VOLUME = 0;
  private static readonly MAX_VOLUME = 1;

  private static game: Phaser.Game | null = null;
  private static fader = new Fader();
  private static musicEnabled = true;
  private static musicEnabledVolume = 1;
  private static sfxEnabled = true;
  private static muteSources = new Set<MuteSource>();
  private static musicVolume = 1;
  private static musicDuckVolume = 1;
  private static sfxVolume = 1;
  private static musicVolumeFade?: FadeHandle;
  private static musicEnabledFade?: FadeHandle;
  private static duckFade?: FadeHandle;
  private static duckTimer?: FadeHandle;
  private static musics = new Map<string, MusicEntry>();
  private static activeSfx = new Map<string, Set<Phaser.Sound.BaseSound>>();
  private static sfxMaxInstances = new Map<string, number>(
    AUDIO_LOAD_DATA.filter((item) => item.maxInstances !== undefined).map((item) => [
      item.alias,
      AudioMng.normalizeMaxInstances(item.maxInstances!),
    ])
  );

  /**
   * Call once at startup. The manager is bound to the game, not to a scene:
   * sounds and fades keep working while scenes are stopped and started.
   */
  static init(game: Phaser.Game): void {
    if (AudioMng.game === game) return;
    AudioMng.dispose();
    AudioMng.game = game;
    game.sound.mute = AudioMng.muteSources.size > 0;
    game.events.on(Phaser.Core.Events.STEP, AudioMng.onGameStep);
    game.events.once(Phaser.Core.Events.DESTROY, AudioMng.dispose);
  }

  private static onGameStep(_time: number, delta: number): void {
    AudioMng.fader.update(delta);
  }

  private static dispose(): void {
    AudioMng.game?.events.off(Phaser.Core.Events.STEP, AudioMng.onGameStep);
    AudioMng.fader.clear();
    AudioMng.musics.clear();
    AudioMng.activeSfx.clear();
    AudioMng.game = null;
  }

  static getSoundFileByName(alias: string): string {
    return AUDIO_LOAD_DATA.find((item) => item.alias === alias)?.file ?? '';
  }

  static getMusic(name: string): Phaser.Sound.BaseSound | null {
    return AudioMng.musics.get(name)?.sound ?? null;
  }

  static isMusicPlaying(name: string): boolean {
    return AudioMng.musics.get(name)?.sound.isPlaying ?? false;
  }

  /**
   * Starts a music track, or fades an already playing one to the given volume.
   * While music is disabled the track plays silently (see `setMusicEnabled`).
   */
  static playMusic(name: string, options?: PlayMusicOptions): Phaser.Sound.BaseSound;
  static playMusic(
    name: string,
    volumeFrom: number,
    volumeTo?: number,
    fadeDuration?: number
  ): Phaser.Sound.BaseSound;
  static playMusic(
    name: string,
    optionsOrVolumeFrom: PlayMusicOptions | number = {},
    volumeTo = AudioMng.DEFAULT_MUSIC_VOLUME,
    fadeDuration = AudioMng.DEFAULT_MUSIC_FADE
  ): Phaser.Sound.BaseSound {
    const manager = AudioMng.getSoundManager();
    const options = AudioMng.normalizeMusicOptions(optionsOrVolumeFrom, volumeTo, fadeDuration);
    const volume = AudioMng.clampVolume(options.volume ?? AudioMng.DEFAULT_MUSIC_VOLUME);
    const fadeFrom = AudioMng.clampVolume(options.fadeFrom ?? 0);
    const fadeMs = Math.max(0, options.fadeDuration ?? AudioMng.DEFAULT_MUSIC_FADE);
    const startVolume = AudioMng.getEffectiveMusicVolume(fadeFrom);
    const loop = options.loop ?? true;
    const existing = AudioMng.musics.get(name);

    if (existing) {
      if (options.restart) {
        existing.currentBaseVolume = fadeFrom;
        existing.sound.stop();
        existing.sound.play({ ...options.config, loop, volume: startVolume });
      } else if (!existing.sound.isPlaying) {
        existing.currentBaseVolume = fadeFrom;
        existing.sound.play({ ...options.config, loop, volume: startVolume });
      }
      AudioMng.fadeMusic(existing, volume, fadeMs);
      return existing.sound;
    }

    const sound = manager.add(name, {
      ...options.config,
      loop,
      volume: AudioMng.getEffectiveMusicVolume(fadeMs > 0 ? fadeFrom : volume),
    }) as ManagedSound;

    const entry: MusicEntry = {
      key: name,
      sound,
      baseVolume: volume,
      currentBaseVolume: fadeMs > 0 ? fadeFrom : volume,
    };

    sound.once(Phaser.Sound.Events.DESTROY, () => AudioMng.removeMusicEntry(name, sound));
    sound.play();
    AudioMng.musics.set(name, entry);

    if (fadeMs > 0 && fadeFrom !== volume) {
      AudioMng.fadeMusic(entry, volume, fadeMs);
    }

    return sound;
  }

  static stopMusic(name: string, options: StopMusicOptions = {}): void {
    const entry = AudioMng.musics.get(name);
    if (!entry) return;

    const fadeMs = Math.max(0, options.fadeDuration ?? AudioMng.DEFAULT_MUSIC_FADE);
    const fadeTo = AudioMng.clampVolume(options.fadeTo ?? 0);
    const destroy = options.destroy ?? true;

    AudioMng.stopMusicEntry(entry, fadeMs, fadeTo, destroy);
  }

  static crossfadeMusic(
    fromName: string,
    toName: string,
    options: CrossfadeMusicOptions = {}
  ): Phaser.Sound.BaseSound {
    const duration = Math.max(
      0,
      options.duration ?? options.fadeDuration ?? AudioMng.DEFAULT_MUSIC_FADE
    );
    const fromFadeTo = AudioMng.clampVolume(options.fromFadeTo ?? 0);
    const stopFrom = options.stopFrom ?? true;

    const music = AudioMng.playMusic(toName, {
      ...options,
      fadeFrom: options.fadeFrom ?? 0,
      fadeDuration: duration,
    });

    if (stopFrom) {
      AudioMng.stopMusic(fromName, {
        fadeDuration: duration,
        fadeTo: fromFadeTo,
      });
    } else {
      AudioMng.fadeMusicVolume(fromName, fromFadeTo, duration);
    }

    return music;
  }

  static stopMusicByName(name: string, volume = 0, duration = AudioMng.DEFAULT_MUSIC_FADE): void {
    AudioMng.stopMusic(name, { fadeDuration: duration, fadeTo: volume });
  }

  static stopMusicById(id: number, volume = 0, duration = AudioMng.DEFAULT_MUSIC_FADE): void {
    const entry = Array.from(AudioMng.musics.values())[id];
    if (!entry) return;
    AudioMng.stopMusicEntry(entry, duration, volume, true);
  }

  static stopAllMusic(volume = 0, duration = AudioMng.DEFAULT_MUSIC_FADE): void {
    for (const entry of Array.from(AudioMng.musics.values())) {
      AudioMng.stopMusicEntry(entry, duration, volume, true);
    }
  }

  static changeMusicVol(
    name: string,
    volume: number,
    _tweenScene?: Phaser.Scene,
    duration = AudioMng.DEFAULT_MUSIC_FADE
  ): void {
    AudioMng.fadeMusicVolume(name, volume, duration);
  }

  static fadeMusicVolume(
    name: string,
    volume: number,
    duration = AudioMng.DEFAULT_MUSIC_FADE
  ): void {
    const entry = AudioMng.musics.get(name);
    if (!entry) return;
    AudioMng.fadeMusic(entry, AudioMng.clampVolume(volume), Math.max(0, duration));
  }

  static setMusicVolume(volume: number, fadeDuration = 0): void {
    AudioMng.tweenMusicVolume(AudioMng.clampVolume(volume), Math.max(0, fadeDuration));
  }

  static getMusicVolume(): number {
    return AudioMng.musicVolume;
  }

  static setSfxVolume(volume: number): void {
    AudioMng.sfxVolume = AudioMng.clampVolume(volume);
  }

  static getSfxVolume(): number {
    return AudioMng.sfxVolume;
  }

  static setSfxMaxInstances(name: string, maxInstances: number): void {
    AudioMng.sfxMaxInstances.set(name, AudioMng.normalizeMaxInstances(maxInstances));
  }

  static getSfxMaxInstances(name: string): number {
    return AudioMng.sfxMaxInstances.get(name) ?? 1;
  }

  static clearSfxMaxInstances(name: string): void {
    AudioMng.sfxMaxInstances.delete(name);
  }

  static duckMusic(options: DuckMusicOptions = {}): void {
    const duckVolume = AudioMng.clampVolume(options.volume ?? 0.35);
    const fadeOut = Math.max(0, options.fadeOut ?? options.duration ?? 150);
    const fadeIn = Math.max(0, options.fadeIn ?? options.duration ?? 350);
    const hold = Math.max(0, options.hold ?? 0);

    AudioMng.stopDuckTweens();

    AudioMng.tweenDuckVolume(duckVolume, fadeOut, () => {
      if (hold > 0) {
        AudioMng.duckTimer = AudioMng.fader.delay(hold, () => {
          AudioMng.restoreMusicDuck(fadeIn);
        });
      }
    });
  }

  static restoreMusicDuck(fadeDuration = 350): void {
    AudioMng.stopDuckTweens();
    AudioMng.tweenDuckVolume(1, Math.max(0, fadeDuration));
  }

  /**
   * Turns music on or off. Disabled music keeps playing silently,
   * so enabling it again continues the tracks instead of losing them.
   */
  static setMusicEnabled(enabled: boolean, fadeDuration = AudioMng.DEFAULT_MUSIC_FADE): void {
    AudioMng.musicEnabled = enabled;
    AudioMng.musicEnabledFade?.stop();
    AudioMng.musicEnabledFade = undefined;

    const target = enabled ? 1 : 0;
    const duration = Math.max(0, fadeDuration);
    // Without a game nothing drives the fader yet: apply the value right away.
    if (duration <= 0 || !AudioMng.game) {
      AudioMng.musicEnabledVolume = target;
      AudioMng.refreshMusicVolumes(0);
      return;
    }

    AudioMng.musicEnabledFade = AudioMng.fader.add(
      AudioMng.musicEnabledVolume,
      target,
      duration,
      (value) => {
        AudioMng.musicEnabledVolume = value;
        AudioMng.refreshMusicVolumes(0);
      },
      () => {
        AudioMng.musicEnabledFade = undefined;
      }
    );
  }

  static getMusicEnabled(): boolean {
    return AudioMng.musicEnabled;
  }

  static setSfxEnabled(enabled: boolean): void {
    AudioMng.sfxEnabled = enabled;
    if (!enabled) {
      AudioMng.stopAllSfx();
    }
  }

  static getSfxEnabled(): boolean {
    return AudioMng.sfxEnabled;
  }

  static setEnabled(enabled: boolean): void {
    AudioMng.setMusicEnabled(enabled);
    AudioMng.setSfxEnabled(enabled);
  }

  static getEnabled(): boolean {
    return AudioMng.musicEnabled && AudioMng.sfxEnabled;
  }

  /**
   * Mutes or unmutes all game audio (music and sfx) without stopping it.
   * Can be called before `init()`: the state is applied when the game appears.
   */
  static setMuted(muted: boolean, source: MuteSource = 'user'): void {
    if (muted) AudioMng.muteSources.add(source);
    else AudioMng.muteSources.delete(source);
    if (AudioMng.game) AudioMng.game.sound.mute = AudioMng.muteSources.size > 0;
  }

  /**
   * With a source: whether that source muted the audio.
   * Without: whether the audio is muted by any source.
   */
  static isMuted(source?: MuteSource): boolean {
    // Kept here on purpose: the sound manager reports the new state
    // only after the audio thread has applied it.
    return source ? AudioMng.muteSources.has(source) : AudioMng.muteSources.size > 0;
  }

  static playSfx(
    name: string,
    volume = 1,
    delay = 0,
    force = false
  ): Phaser.Sound.BaseSound | undefined {
    return AudioMng.playSfxEx(name, { volume, delay: delay / 1000, force });
  }

  static playSfxEx(name: string, options: PlaySfxOptions = {}): Phaser.Sound.BaseSound | undefined {
    if (!AudioMng.sfxEnabled) return undefined;

    const manager = AudioMng.getSoundManager();
    const { force = false, marker, maxInstances, ...config } = options;
    if (!force && !AudioMng.canPlaySfx(name, maxInstances)) return undefined;

    const sfxConfig = {
      ...config,
      volume: AudioMng.clampVolume((config.volume ?? 1) * AudioMng.sfxVolume),
    };
    const sound = manager.add(name, sfxConfig);
    AudioMng.registerSfx(name, sound);

    const isStarted = marker ? sound.play(marker, sfxConfig) : sound.play(sfxConfig);
    if (!isStarted) {
      AudioMng.unregisterSfx(name, sound);
      sound.destroy();
      return undefined;
    }

    return sound;
  }

  static playSfxForced(name: string, volume = 1, delay = 0): Phaser.Sound.BaseSound | undefined {
    return AudioMng.playSfx(name, volume, delay, true);
  }

  static playRandomSfx(
    names: string[],
    volume = 1,
    force = false
  ): Phaser.Sound.BaseSound | undefined {
    if (names.length === 0) return undefined;
    const name = names[MyMath.randomIntInRange(0, names.length - 1)];
    return AudioMng.playSfx(name, volume, 0, force);
  }

  static isSfxPlaying(name: string): boolean {
    const sounds = AudioMng.activeSfx.get(name);
    if (!sounds) return false;

    return sounds.size > 0;
  }

  static getSfxInstancesCount(name: string): number {
    return AudioMng.activeSfx.get(name)?.size ?? 0;
  }

  static stopSfx(name: string): void {
    const sounds = AudioMng.activeSfx.get(name);
    if (!sounds) return;

    for (const sound of Array.from(sounds)) {
      sound.stop();
    }
  }

  static stopAllSfx(): void {
    for (const sounds of AudioMng.activeSfx.values()) {
      for (const sound of Array.from(sounds)) {
        sound.stop();
      }
    }
  }

  private static getSoundManager() {
    if (!AudioMng.game) {
      throw new Error('AudioMng: call AudioMng.init(game) before using sounds.');
    }
    return AudioMng.game.sound;
  }

  private static normalizeMusicOptions(
    optionsOrVolumeFrom: PlayMusicOptions | number,
    volumeTo: number,
    fadeDuration: number
  ): PlayMusicOptions {
    if (typeof optionsOrVolumeFrom === 'number') {
      return {
        fadeFrom: optionsOrVolumeFrom,
        volume: volumeTo,
        fadeDuration,
      };
    }

    return optionsOrVolumeFrom;
  }

  private static fadeMusic(
    entry: MusicEntry,
    volume: number,
    duration: number,
    onComplete?: () => void
  ): void {
    const baseVolume = AudioMng.clampVolume(volume);
    entry.baseVolume = baseVolume;

    entry.fade?.stop();
    entry.fade = undefined;

    if (duration <= 0) {
      entry.currentBaseVolume = baseVolume;
      entry.sound.setVolume(AudioMng.getEffectiveMusicVolume(entry.currentBaseVolume));
      onComplete?.();
      return;
    }

    entry.fade = AudioMng.fader.add(
      entry.currentBaseVolume,
      baseVolume,
      duration,
      (value) => {
        entry.currentBaseVolume = value;
        entry.sound.setVolume(AudioMng.getEffectiveMusicVolume(value));
      },
      () => {
        entry.fade = undefined;
        onComplete?.();
      }
    );
  }

  private static stopMusicEntry(
    entry: MusicEntry,
    fadeDuration: number,
    fadeTo: number,
    destroy: boolean
  ): void {
    AudioMng.fadeMusic(entry, fadeTo, Math.max(0, fadeDuration), () => {
      entry.sound.stop();
      AudioMng.musics.delete(entry.key);
      if (destroy) entry.sound.destroy();
    });
  }

  private static removeMusicEntry(name: string, sound: Phaser.Sound.BaseSound): void {
    const entry = AudioMng.musics.get(name);
    if (entry?.sound === sound) {
      entry.fade?.stop();
      entry.fade = undefined;
      AudioMng.musics.delete(name);
    }
  }

  private static registerSfx(name: string, sound: Phaser.Sound.BaseSound): void {
    let sounds = AudioMng.activeSfx.get(name);
    if (!sounds) {
      sounds = new Set();
      AudioMng.activeSfx.set(name, sounds);
    }

    sounds.add(sound);

    let isCleaned = false;
    const cleanup = () => {
      if (isCleaned) return;
      isCleaned = true;
      AudioMng.unregisterSfx(name, sound);
      sound.destroy();
    };

    sound.once(Phaser.Sound.Events.COMPLETE, cleanup);
    sound.once(Phaser.Sound.Events.STOP, cleanup);
    sound.once(Phaser.Sound.Events.DESTROY, () => AudioMng.unregisterSfx(name, sound));
  }

  private static unregisterSfx(name: string, sound: Phaser.Sound.BaseSound): void {
    const sounds = AudioMng.activeSfx.get(name);
    if (!sounds) return;

    sounds.delete(sound);
    if (sounds.size === 0) {
      AudioMng.activeSfx.delete(name);
    }
  }

  private static clampVolume(value: number): number {
    return Phaser.Math.Clamp(value, AudioMng.MIN_VOLUME, AudioMng.MAX_VOLUME);
  }

  private static getEffectiveMusicVolume(baseVolume: number): number {
    return AudioMng.clampVolume(
      AudioMng.clampVolume(baseVolume) *
        AudioMng.musicVolume *
        AudioMng.musicDuckVolume *
        AudioMng.musicEnabledVolume
    );
  }

  private static refreshMusicVolumes(duration: number): void {
    if (duration <= 0) {
      for (const entry of AudioMng.musics.values()) {
        entry.sound.setVolume(AudioMng.getEffectiveMusicVolume(entry.currentBaseVolume));
      }
      return;
    }

    for (const entry of AudioMng.musics.values()) {
      AudioMng.fadeMusic(entry, entry.baseVolume, duration);
    }
  }

  private static canPlaySfx(name: string, maxInstances?: number): boolean {
    const limit =
      maxInstances === undefined
        ? AudioMng.getSfxMaxInstances(name)
        : AudioMng.normalizeMaxInstances(maxInstances);

    if (limit < 1) {
      return false;
    }

    return AudioMng.getSfxInstancesCount(name) < limit;
  }

  private static stopDuckTweens(): void {
    AudioMng.duckFade?.stop();
    AudioMng.duckFade = undefined;
    AudioMng.duckTimer?.stop();
    AudioMng.duckTimer = undefined;
  }

  private static tweenMusicVolume(volume: number, duration: number): void {
    AudioMng.musicVolumeFade?.stop();
    AudioMng.musicVolumeFade = undefined;

    if (duration <= 0) {
      AudioMng.musicVolume = volume;
      AudioMng.refreshMusicVolumes(0);
      return;
    }

    AudioMng.musicVolumeFade = AudioMng.fader.add(
      AudioMng.musicVolume,
      volume,
      duration,
      (value) => {
        AudioMng.musicVolume = value;
        AudioMng.refreshMusicVolumes(0);
      },
      () => {
        AudioMng.musicVolumeFade = undefined;
      }
    );
  }

  private static tweenDuckVolume(volume: number, duration: number, onComplete?: () => void): void {
    if (duration <= 0) {
      AudioMng.musicDuckVolume = volume;
      AudioMng.refreshMusicVolumes(0);
      onComplete?.();
      return;
    }

    AudioMng.duckFade = AudioMng.fader.add(
      AudioMng.musicDuckVolume,
      volume,
      duration,
      (value) => {
        AudioMng.musicDuckVolume = value;
        AudioMng.refreshMusicVolumes(0);
      },
      () => {
        AudioMng.duckFade = undefined;
        onComplete?.();
      }
    );
  }

  private static normalizeMaxInstances(maxInstances: number): number {
    return Math.max(1, Math.floor(maxInstances));
  }
}
