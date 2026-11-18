import { LogMng } from './LogMng';

/**
 * A font file is fetched only when some text needs it, and every script
 * (Latin, Cyrillic, ...) lives in its own file. The sample must contain
 * a character of each script the game renders.
 */
const SAMPLE_TEXT = 'Abc Абв 123';

/**
 * Waits until the given web fonts are ready for canvas text.
 * Phaser draws text to a canvas: if the font is not loaded at that moment,
 * the text is rendered with a fallback font and does not update later.
 *
 * Never rejects: on failure or timeout the game starts with fallback fonts.
 */
export async function loadFonts(
  families: readonly string[],
  weights: readonly number[] = [400],
  timeoutMs = 3000
): Promise<void> {
  if (!document.fonts) return;

  const loading = Promise.all(
    families.flatMap((family) =>
      weights.map((weight) => document.fonts.load(`${weight} 16px "${family}"`, SAMPLE_TEXT))
    )
  );
  const timeout = new Promise<'timeout'>((resolve) => setTimeout(resolve, timeoutMs, 'timeout'));

  try {
    const result = await Promise.race([loading, timeout]);
    if (result === 'timeout') LogMng.warn(`Fonts are not loaded in ${timeoutMs} ms`, families);
  } catch (e) {
    LogMng.warn('Font loading failed', e);
  }
}
