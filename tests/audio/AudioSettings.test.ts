import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ISaveStorage, SaveRecord } from '@/save/ISaveStorage';
import { SaveMng } from '@/save/SaveMng';

// AudioMng needs Phaser and a browser; the switches are all this test is about.
const audio = vi.hoisted(() => {
  const state = { sfx: true, music: true, musicFade: undefined as number | undefined };
  return {
    state,
    AudioMng: {
      setSfxEnabled: (enabled: boolean) => (state.sfx = enabled),
      getSfxEnabled: () => state.sfx,
      setMusicEnabled: (enabled: boolean, fade?: number) => {
        state.music = enabled;
        state.musicFade = fade;
      },
      getMusicEnabled: () => state.music,
    },
  };
});
vi.mock('@/audio/AudioMng', () => ({ AudioMng: audio.AudioMng }));

const { AudioSettings } = await import('@/audio/AudioSettings');

function storageWith(saved: SaveRecord | null): ISaveStorage {
  return { load: async () => saved, save: async () => {} };
}

describe('AudioSettings', () => {
  beforeEach(() => {
    audio.state.sfx = true;
    audio.state.music = true;
    audio.state.musicFade = undefined;
  });

  it('applies the saved switches, without a fade', async () => {
    await SaveMng.init(storageWith({ sfx: false, music: false }));

    AudioSettings.apply();

    expect(AudioSettings.sfx).toBe(false);
    expect(AudioSettings.music).toBe(false);
    expect(audio.state.musicFade).toBe(0);
  });

  it('keeps the sound on for a new player', async () => {
    await SaveMng.init(storageWith(null));

    AudioSettings.apply();

    expect(AudioSettings.sfx).toBe(true);
    expect(AudioSettings.music).toBe(true);
  });

  it('switches the audio and saves the choice', async () => {
    await SaveMng.init(storageWith(null));
    AudioSettings.apply();

    AudioSettings.sfx = false;
    AudioSettings.music = false;

    expect(audio.state).toMatchObject({ sfx: false, music: false });
    expect(SaveMng.get('sfx')).toBe(false);
    expect(SaveMng.get('music')).toBe(false);

    AudioSettings.music = true;

    expect(audio.state.music).toBe(true);
    expect(SaveMng.get('music')).toBe(true);
  });
});
