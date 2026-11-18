import { describe, expect, it } from 'vitest';
import { en } from '@/locale/en';
import { LANGS, type LocaleKey } from '@/locale/LocaleKeys';
import { LOCALES } from '@/locale/LocaleMng';

const KEYS = Object.keys(en).sort() as LocaleKey[];

/** `{name}` and `{name|form|form}`: the parameter name and the forms, if any. */
const PLACEHOLDER = /\{(\w+)(?:\|([^{}]*))?\}/g;

function parametersOf(text: string): string[] {
  return [...new Set([...text.matchAll(PLACEHOLDER)].map((match) => match[1]))].sort();
}

function pluralBlocksOf(text: string): string[][] {
  return [...text.matchAll(PLACEHOLDER)]
    .filter((match) => match[2] !== undefined)
    .map((match) => match[2].split('|'));
}

// Checks of every translation against the reference locale: a missing parameter or
// a plural form too many are easy to miss by eye in ten languages.
describe.each(LANGS)('the "%s" locale', (lang) => {
  const texts = LOCALES[lang];
  const pluralCategories = new Intl.PluralRules(lang).resolvedOptions().pluralCategories.length;

  it('translates every key of the reference locale, and no other', () => {
    expect(Object.keys(texts).sort()).toEqual(KEYS);
  });

  it('has no empty texts', () => {
    for (const key of KEYS) expect(texts[key].trim(), key).not.toBe('');
  });

  it('uses the same parameters as English', () => {
    for (const key of KEYS) expect(parametersOf(texts[key]), key).toEqual(parametersOf(en[key]));
  });

  it('gives no more plural forms than the language has, and none empty', () => {
    for (const key of KEYS) {
      for (const forms of pluralBlocksOf(texts[key])) {
        expect(forms.length, key).toBeLessThanOrEqual(pluralCategories);
        for (const form of forms) expect(form.trim(), key).not.toBe('');
      }
    }
  });
});
