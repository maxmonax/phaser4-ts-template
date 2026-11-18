import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { KeyValueSaveStorage, type KeyValueStore } from '@/save/KeyValueSaveStorage';

function mapStore(): KeyValueStore & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
  };
}

const brokenStore: KeyValueStore = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('blocked');
  },
};

describe('KeyValueSaveStorage', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null when nothing is saved', async () => {
    expect(await new KeyValueSaveStorage(mapStore(), 'game').load()).toBeNull();
  });

  it('stores the record as JSON under its key', async () => {
    const store = mapStore();
    const storage = new KeyValueSaveStorage(store, 'game');

    await storage.save({ coins: 3 }, false);

    expect(store.map.get('game')).toBe('{"coins":3}');
    expect(await storage.load()).toEqual({ coins: 3 });
  });

  it('ignores data that is not a JSON object', async () => {
    const store = mapStore();
    const storage = new KeyValueSaveStorage(store, 'game');

    store.map.set('game', 'not json');
    expect(await storage.load()).toBeNull();

    store.map.set('game', '[1, 2]');
    expect(await storage.load()).toBeNull();
  });

  it('keeps the record in memory when the store throws', async () => {
    const storage = new KeyValueSaveStorage(brokenStore, 'game');

    await storage.save({ coins: 1 }, false);

    expect(await storage.load()).toEqual({ coins: 1 });
  });

  it('works without a store at all', async () => {
    const storage = new KeyValueSaveStorage(null, 'game');

    await storage.save({ coins: 2 }, true);

    expect(await storage.load()).toEqual({ coins: 2 });
  });
});
