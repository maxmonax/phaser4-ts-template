import { de } from './de';
import { en } from './en';
import { es } from './es';
import { fr } from './fr';
import { it } from './it';
import { ja } from './ja';
import { ko } from './ko';
import { DEFAULT_LANG, LANGS, type Lang, type LocaleData, type LocaleKey } from './LocaleKeys';
import { pt } from './pt';
import { ru } from './ru';
import { zh } from './zh';

/** The texts of every language. All of them are in the bundle: about 1 kB per language. */
export const LOCALES: Readonly<Record<Lang, LocaleData>> = {
  en,
  ru,
  de,
  fr,
  es,
  pt,
  it,
  ja,
  ko,
  zh,
};

export type LocaleParams = Record<string, string | number>;

/** The order in which plural forms are listed in a string: `{count|one|few|many}`. */
const PLURAL_ORDER: readonly Intl.LDMLPluralRule[] = ['zero', 'one', 'two', 'few', 'many', 'other'];

/** `{count|orb|orbs}`: the parameter name and the forms. */
const PLURAL_RE = /\{(\w+)\|([^{}]+)\}/g;

class LocaleMng {
  private static _instance: LocaleMng;
  private _lang: Lang = DEFAULT_LANG;
  private _data: LocaleData = LOCALES[DEFAULT_LANG];
  private _listeners: Array<(lang: Lang) => void> = [];
  private _pluralRules!: Intl.PluralRules;
  private _pluralCategories: Intl.LDMLPluralRule[] = [];
  private _numberFormat!: Intl.NumberFormat;

  private constructor() {
    this.applyLang();
  }

  static getInstance(): LocaleMng {
    if (!LocaleMng._instance) LocaleMng._instance = new LocaleMng();
    return LocaleMng._instance;
  }

  setLang(lang: Lang): void {
    if (this._lang === lang) return;
    this._lang = lang;
    this.applyLang();
    this._listeners.forEach((cb) => cb(lang));
  }

  private applyLang(): void {
    this._data = LOCALES[this._lang];
    this._pluralRules = new Intl.PluralRules(this._lang);
    const categories = this._pluralRules.resolvedOptions().pluralCategories;
    this._pluralCategories = PLURAL_ORDER.filter((category) => categories.includes(category));
    this._numberFormat = new Intl.NumberFormat(this._lang);
  }

  getLang(): Lang {
    return this._lang;
  }

  onLangChange(cb: (lang: Lang) => void): void {
    this._listeners.push(cb);
  }

  offLangChange(cb: (lang: Lang) => void): void {
    this._listeners = this._listeners.filter((fn) => fn !== cb);
  }

  /**
   * The text for a key in the current language.
   *
   * - `{name}` is replaced by the parameter `name`.
   * - `{count|orb|orbs}` picks a plural form by the number in `count`. The forms are
   *   listed in the order of the language's plural categories (`Intl.PluralRules`):
   *   - English, German: `one|other`;
   *   - Russian: `one|few|many` — `{count|шар|шара|шаров}`;
   *   - French, Spanish, Portuguese, Italian: `one|many|other`, where `many` is for
   *     a million and more; two forms, singular and plural, are usually enough;
   *   - Japanese, Korean, Chinese: no plural forms, write the number without a block.
   *
   *   A missing form falls back to the last one.
   */
  t(key: LocaleKey, params?: LocaleParams): string {
    let str = this._data[key];
    if (!params) return str;

    str = str.replace(PLURAL_RE, (match, name: string, forms: string) => {
      const value = Number(params[name]);
      return Number.isFinite(value) ? this.pluralForm(value, forms.split('|')) : match;
    });
    for (const [k, v] of Object.entries(params)) {
      str = str.replaceAll(`{${k}}`, String(v));
    }
    return str;
  }

  private pluralForm(value: number, forms: string[]): string {
    const index = this._pluralCategories.indexOf(this._pluralRules.select(value));
    return forms[Math.min(Math.max(index, 0), forms.length - 1)];
  }

  /**
   * A number in the format of the current language: `1,234,567` in English,
   * `1 234 567` in Russian. Pass `options` for other styles, e.g.
   * `{ notation: 'compact' }` for `1.2M`.
   */
  formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
    if (!options) return this._numberFormat.format(value);
    return new Intl.NumberFormat(this._lang, options).format(value);
  }

  /** The language after the current one in `LANGS`, for a switch that cycles languages. */
  nextLang(): Lang {
    return LANGS[(LANGS.indexOf(this._lang) + 1) % LANGS.length];
  }
}

export { LocaleMng };

/** Shorthand: `t('key')`, `t('key', { name: 'Max' })`, see `LocaleMng.t()` for plural forms. */
export function t(key: LocaleKey, params?: LocaleParams): string {
  return LocaleMng.getInstance().t(key, params);
}

/**
 * Picks the first supported language from a list of BCP 47 tags
 * ordered by preference. Defaults to the browser's language list.
 */
export function detectLang(preferred: readonly string[] = navigator.languages): Lang {
  for (const tag of preferred) {
    const code = tag.toLowerCase().split('-')[0];
    const lang = LANGS.find((l) => l === code);
    if (lang) return lang;
  }
  return DEFAULT_LANG;
}
