import type { en } from './en';

/**
 * Supported languages. To add one: extend this list, then add what the compiler
 * asks for — the name below and a locale file in `LocaleMng`. Remember the font:
 * import the subset with the letters of the new language in `index.ts`.
 */
export const LANGS = ['en', 'ru'] as const;

export type Lang = (typeof LANGS)[number];

/** Language names for a language switch, each in its own language. */
export const LANG_NAMES: Record<Lang, string> = {
  en: 'English',
  ru: 'Русский',
};

export const DEFAULT_LANG: Lang = 'en';

/** Translation keys. English is the reference locale: add new keys to `en.ts` first. */
export type LocaleKey = keyof typeof en;

/** Every other locale must translate every key. */
export type LocaleData = Record<LocaleKey, string>;
