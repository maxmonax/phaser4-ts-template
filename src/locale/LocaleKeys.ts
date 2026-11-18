import type { en } from './en';

/**
 * Supported languages: the ten languages games are usually translated into.
 * `pt` is Brazilian Portuguese, `zh` is Simplified Chinese.
 *
 * To add one: extend this list, then add what the compiler asks for — the name below
 * and a locale file in `LocaleMng`. Check that the font has its letters: see
 * "Adding a language" in README.md.
 */
export const LANGS = ['en', 'ru', 'de', 'fr', 'es', 'pt', 'it', 'ja', 'ko', 'zh'] as const;

export type Lang = (typeof LANGS)[number];

export const DEFAULT_LANG: Lang = 'en';

/** Language names for the language list, each in its own language. */
export const LANG_NAMES: Record<Lang, string> = {
  en: 'English',
  ru: 'Русский',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  pt: 'Português',
  it: 'Italiano',
  ja: '日本語',
  ko: '한국어',
  zh: '简体中文',
};

/** Translation keys. English is the reference locale: add new keys to `en.ts` first. */
export type LocaleKey = keyof typeof en;

/** Every other locale must translate every key. */
export type LocaleData = Record<LocaleKey, string>;
