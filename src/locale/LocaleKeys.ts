/** Supported languages. To add one: extend this list and add a locale file to LocaleMng. */
export const LANGS = ['en', 'ru'] as const;

export type Lang = (typeof LANGS)[number];

export const DEFAULT_LANG: Lang = 'en';

export type LocaleKey = 'preloader_title' | 'preloader_start' | 'menu_title' | 'menu_lang_btn';

export type LocaleData = Record<LocaleKey, string>;
