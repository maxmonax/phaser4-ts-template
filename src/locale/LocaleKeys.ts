import type { en } from './en';

/** Supported languages. To add one: extend this list and add a locale file to LocaleMng. */
export const LANGS = ['en', 'ru'] as const;

export type Lang = (typeof LANGS)[number];

export const DEFAULT_LANG: Lang = 'en';

/** Translation keys. English is the reference locale: add new keys to `en.ts` first. */
export type LocaleKey = keyof typeof en;

/** Every other locale must translate every key. */
export type LocaleData = Record<LocaleKey, string>;
