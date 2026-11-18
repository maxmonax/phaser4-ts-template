import type { IPlatform } from './IPlatform';
import { WebPlatform } from './web/WebPlatform';

/**
 * Creates the adapter of the platform the game is built for.
 *
 * `VITE_PLATFORM` is a constant replaced at build time (see vite.config.ts), so only
 * one branch survives in a build. Adapters are loaded with dynamic `import()`:
 * the code of other platforms does not get into the bundle.
 */
export async function createPlatform(): Promise<IPlatform> {
  switch (import.meta.env.VITE_PLATFORM) {
    case 'yandex': {
      const { YandexPlatform } = await import('./yandex/YandexPlatform');
      return new YandexPlatform();
    }
    default:
      return new WebPlatform();
  }
}
