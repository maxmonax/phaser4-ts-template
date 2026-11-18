import { LogMng } from '../utils/LogMng';
import type { ISaveStorage } from './ISaveStorage';
import { DEFAULT_SAVE, parseSave, type SaveData } from './SaveData';

/** Keeps the data in memory until `init()` gives a real storage. */
class MemorySaveStorage implements ISaveStorage {
  async load() {
    return null;
  }
  async save() {}
}

/**
 * Game state between sessions.
 *
 * Reads are synchronous, from memory. Writes are batched: a change is written
 * to the storage `delayMs` after the last change, and right away on `flush()`.
 */
export class SaveMng {
  private static storage: ISaveStorage = new MemorySaveStorage();
  private static data: SaveData = { ...DEFAULT_SAVE };
  private static delayMs = 1000;
  private static timer: ReturnType<typeof setTimeout> | null = null;
  private static dirty = false;
  private static writing: Promise<void> = Promise.resolve();

  /**
   * Loads the saved state. Call once at startup, before the game reads it.
   * Never rejects: if loading fails, the game starts with default values.
   */
  static async init(storage: ISaveStorage, delayMs = 1000): Promise<void> {
    SaveMng.cancelTimer();
    SaveMng.storage = storage;
    SaveMng.delayMs = delayMs;
    SaveMng.dirty = false;

    let raw = null;
    try {
      raw = await storage.load();
    } catch (e) {
      LogMng.warn('SaveMng: cannot load the saved state, defaults are used', e);
    }
    SaveMng.data = parseSave(raw);
  }

  static get<K extends keyof SaveData>(key: K): SaveData[K] {
    return SaveMng.data[key];
  }

  static set<K extends keyof SaveData>(key: K, value: SaveData[K]): void {
    if (Object.is(SaveMng.data[key], value)) return;
    SaveMng.data[key] = value;
    SaveMng.dirty = true;

    SaveMng.cancelTimer();
    SaveMng.timer = setTimeout(() => void SaveMng.write(false), SaveMng.delayMs);
  }

  /**
   * Writes pending changes right away. Call it when the page is being hidden,
   * and after important moments (a level is completed, a purchase is made).
   */
  static flush(): Promise<void> {
    return SaveMng.write(true);
  }

  private static write(flush: boolean): Promise<void> {
    SaveMng.cancelTimer();
    if (!SaveMng.dirty) return SaveMng.writing;
    SaveMng.dirty = false;

    const snapshot = { ...SaveMng.data };
    const storage = SaveMng.storage;
    // Writes go one after another, so an older snapshot never overwrites a newer one.
    SaveMng.writing = SaveMng.writing
      .then(() => storage.save(snapshot, flush))
      .catch((e) => {
        // Keep the changes pending: the next set() or flush() tries again.
        SaveMng.dirty = true;
        LogMng.warn('SaveMng: cannot write the game state', e);
      });
    return SaveMng.writing;
  }

  private static cancelTimer(): void {
    if (SaveMng.timer === null) return;
    clearTimeout(SaveMng.timer);
    SaveMng.timer = null;
  }
}
