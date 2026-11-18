import type { SaveRecord } from './ISaveStorage';

/**
 * Everything the game persists between sessions.
 *
 * To add a field: declare it here, give it a default in `DEFAULT_SAVE`
 * and read it in `parseSave`.
 */
export type SaveData = {
  /** Language picked by the player in the menu; `null` until the player picks one. */
  lang: string | null;
  /** Demo progress value, see `GameScene`. */
  coins: number;
};

export const DEFAULT_SAVE: Readonly<SaveData> = {
  lang: null,
  coins: 0,
};

/**
 * Builds the game state from a stored record. Saved data may come from an older
 * version of the game or be edited by hand: every field is checked, and a missing
 * or invalid field gets its default value.
 */
export function parseSave(raw: SaveRecord | null): SaveData {
  const data: SaveData = { ...DEFAULT_SAVE };
  if (!raw) return data;

  if (typeof raw.lang === 'string') data.lang = raw.lang;
  if (typeof raw.coins === 'number' && Number.isFinite(raw.coins)) data.coins = raw.coins;

  return data;
}
