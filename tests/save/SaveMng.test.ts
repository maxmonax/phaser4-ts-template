import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ISaveStorage, SaveRecord } from '@/save/ISaveStorage';
import { DEFAULT_SAVE, parseSave } from '@/save/SaveData';
import { SaveMng } from '@/save/SaveMng';

class FakeStorage implements ISaveStorage {
  saved: SaveRecord | null;
  writes: Array<{ data: SaveRecord; flush: boolean }> = [];
  failNextWrite = false;

  constructor(initial: SaveRecord | null = null) {
    this.saved = initial;
  }

  async load() {
    return this.saved;
  }

  async save(data: SaveRecord, flush: boolean) {
    if (this.failNextWrite) {
      this.failNextWrite = false;
      throw new Error('write failed');
    }
    this.saved = data;
    this.writes.push({ data, flush });
  }
}

describe('parseSave', () => {
  it('returns defaults for an empty storage', () => {
    expect(parseSave(null)).toEqual(DEFAULT_SAVE);
  });

  it('keeps valid fields and replaces invalid ones with defaults', () => {
    expect(parseSave({ lang: 'ru', sfx: 'off', music: false, extra: 1 })).toEqual({
      ...DEFAULT_SAVE,
      lang: 'ru',
      music: false,
    });
  });

  it('checks the demo field', () => {
    expect(parseSave({ best: 5 }).best).toBe(5);
    expect(parseSave({ best: 'many' }).best).toBe(DEFAULT_SAVE.best);
    expect(parseSave({ best: Number.NaN }).best).toBe(DEFAULT_SAVE.best);
  });
});

describe('SaveMng', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('loads the saved state', async () => {
    await SaveMng.init(new FakeStorage({ lang: 'ru', music: false }));

    expect(SaveMng.get('lang')).toBe('ru');
    expect(SaveMng.get('music')).toBe(false);
    expect(SaveMng.get('sfx')).toBe(DEFAULT_SAVE.sfx);
  });

  it('starts with defaults when loading fails', async () => {
    const storage = new FakeStorage();
    storage.load = () => Promise.reject(new Error('no storage'));

    await SaveMng.init(storage);

    expect(SaveMng.get('lang')).toBe(DEFAULT_SAVE.lang);
  });

  it('writes once, after the last change', async () => {
    const storage = new FakeStorage();
    await SaveMng.init(storage, 1000);

    SaveMng.set('lang', 'en');
    await vi.advanceTimersByTimeAsync(500);
    SaveMng.set('lang', 'ru');
    await vi.advanceTimersByTimeAsync(999);
    expect(storage.writes).toHaveLength(0);

    await vi.advanceTimersByTimeAsync(1);
    expect(storage.writes).toEqual([{ data: { ...DEFAULT_SAVE, lang: 'ru' }, flush: false }]);
  });

  it('does not write when the value did not change', async () => {
    const storage = new FakeStorage({ lang: 'ru' });
    await SaveMng.init(storage);

    SaveMng.set('lang', 'ru');
    await vi.runAllTimersAsync();

    expect(storage.writes).toHaveLength(0);
  });

  it('flush() writes pending changes right away', async () => {
    const storage = new FakeStorage();
    await SaveMng.init(storage);

    SaveMng.set('lang', 'en');
    await SaveMng.flush();

    expect(storage.writes).toEqual([{ data: { ...DEFAULT_SAVE, lang: 'en' }, flush: true }]);
    await vi.runAllTimersAsync();
    expect(storage.writes).toHaveLength(1); // the scheduled write was cancelled
  });

  it('keeps changes pending after a failed write', async () => {
    const storage = new FakeStorage();
    await SaveMng.init(storage);
    storage.failNextWrite = true;

    SaveMng.set('sfx', false);
    await SaveMng.flush();
    expect(storage.writes).toHaveLength(0);

    await SaveMng.flush();
    expect(storage.saved).toEqual({ ...DEFAULT_SAVE, sfx: false });
  });
});
