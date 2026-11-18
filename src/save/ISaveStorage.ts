/** Saved state as it is stored: a plain JSON-compatible object. */
export type SaveRecord = Record<string, unknown>;

/**
 * Where the game state is persisted: `localStorage`, a portal's cloud save, ...
 * `SaveMng` keeps the whole state as one record and decides when to write it.
 */
export interface ISaveStorage {
  /** Returns the saved record, or `null` when nothing is saved yet. */
  load(): Promise<SaveRecord | null>;
  /**
   * Writes the whole record.
   * @param flush `true` when the data must be sent right away (the page is being hidden);
   *   storages that batch writes may queue the data otherwise.
   */
  save(data: SaveRecord, flush: boolean): Promise<void>;
}
