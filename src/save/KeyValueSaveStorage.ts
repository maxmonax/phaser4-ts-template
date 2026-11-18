import { LogMng } from '../utils/LogMng';
import type { ISaveStorage, SaveRecord } from './ISaveStorage';

/** The part of the Web Storage API the storage needs. */
export type KeyValueStore = Pick<Storage, 'getItem' | 'setItem'>;

/**
 * Keeps the record as a JSON string under one key of a `localStorage`-like store:
 * `localStorage` itself, Yandex `getStorage()`, CrazyGames `SDK.data`.
 *
 * Never throws: storage can be unavailable (private mode, sandboxed iframe,
 * full quota). Then the record lives in memory until the page is closed.
 */
export class KeyValueSaveStorage implements ISaveStorage {
  private memory: string | null = null;

  constructor(
    private readonly store: KeyValueStore | null,
    private readonly key: string
  ) {}

  /** Storage on top of `window.localStorage`, or in memory when it is not available. */
  static local(key: string): KeyValueSaveStorage {
    let store: KeyValueStore | null = null;
    try {
      // Reading the property itself throws when storage is blocked.
      store = globalThis.localStorage ?? null;
    } catch (e) {
      LogMng.warn('localStorage is not available, the game state is kept in memory', e);
    }
    return new KeyValueSaveStorage(store, key);
  }

  async load(): Promise<SaveRecord | null> {
    let json = this.memory;
    try {
      if (this.store) json = this.store.getItem(this.key);
    } catch (e) {
      LogMng.warn(`Cannot read "${this.key}" from storage`, e);
    }
    if (json === null) return null;

    try {
      const data: unknown = JSON.parse(json);
      return typeof data === 'object' && data !== null && !Array.isArray(data)
        ? (data as SaveRecord)
        : null;
    } catch (e) {
      LogMng.warn(`Saved data under "${this.key}" is not valid JSON, ignored`, e);
      return null;
    }
  }

  async save(data: SaveRecord, _flush: boolean): Promise<void> {
    const json = JSON.stringify(data);
    this.memory = json;
    try {
      this.store?.setItem(this.key, json);
    } catch (e) {
      LogMng.warn(`Cannot write "${this.key}" to storage`, e);
    }
  }
}
