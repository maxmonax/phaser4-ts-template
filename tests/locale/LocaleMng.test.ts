import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { en } from '@/locale/en';
import { LANG_NAMES, LANGS } from '@/locale/LocaleKeys';
import { ru } from '@/locale/ru';
import { detectLang, LocaleMng, t } from '@/locale/LocaleMng';

describe('LocaleMng', () => {
  const locale = LocaleMng.getInstance();

  beforeEach(() => {
    locale.setLang('en');
  });

  it('is a singleton', () => {
    expect(LocaleMng.getInstance()).toBe(locale);
  });

  it('translates with the current language', () => {
    expect(t('menu_title')).toBe(en.menu_title);

    locale.setLang('ru');

    expect(locale.getLang()).toBe('ru');
    expect(t('menu_title')).toBe(ru.menu_title);
  });

  it('notifies listeners about a language change, once per change', () => {
    const listener = vi.fn();
    locale.onLangChange(listener);

    locale.setLang('ru');
    locale.setLang('ru'); // same language: no notification

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('ru');
    locale.offLangChange(listener);
  });

  it('stops notifying a removed listener', () => {
    const listener = vi.fn();
    locale.onLangChange(listener);
    locale.offLangChange(listener);

    locale.setLang('ru');

    expect(listener).not.toHaveBeenCalled();
  });

  describe('parameters', () => {
    const original = en.menu_title;

    afterEach(() => {
      en.menu_title = original;
    });

    it('replaces every occurrence of every parameter', () => {
      en.menu_title = '{name} scored {score}. Well done, {name}!';

      expect(t('menu_title', { name: 'Max', score: 42 })).toBe('Max scored 42. Well done, Max!');
    });

    it('leaves unknown placeholders untouched', () => {
      en.menu_title = 'Hello, {name}!';

      expect(t('menu_title', { other: 1 })).toBe('Hello, {name}!');
    });
  });

  describe('plural forms', () => {
    const originalEn = en.menu_title;
    const originalRu = ru.menu_title;

    beforeEach(() => {
      en.menu_title = '{count} {count|orb|orbs}';
      ru.menu_title = '{count} {count|шар|шара|шаров}';
    });

    afterEach(() => {
      en.menu_title = originalEn;
      ru.menu_title = originalRu;
    });

    it('picks the English form', () => {
      expect(t('menu_title', { count: 0 })).toBe('0 orbs');
      expect(t('menu_title', { count: 1 })).toBe('1 orb');
      expect(t('menu_title', { count: 2 })).toBe('2 orbs');
      expect(t('menu_title', { count: 21 })).toBe('21 orbs');
    });

    it('picks the Russian form', () => {
      locale.setLang('ru');

      expect(t('menu_title', { count: 1 })).toBe('1 шар');
      expect(t('menu_title', { count: 2 })).toBe('2 шара');
      expect(t('menu_title', { count: 5 })).toBe('5 шаров');
      expect(t('menu_title', { count: 11 })).toBe('11 шаров');
      expect(t('menu_title', { count: 21 })).toBe('21 шар');
      expect(t('menu_title', { count: 104 })).toBe('104 шара');
      expect(t('menu_title', { count: 0 })).toBe('0 шаров');
    });

    it('falls back to the last form when a form is missing', () => {
      locale.setLang('ru');
      ru.menu_title = '{count|шар|шара}';

      expect(t('menu_title', { count: 5 })).toBe('шара');
    });

    it('leaves the forms untouched without a number', () => {
      expect(t('menu_title', { count: 'many' })).toBe('many {count|orb|orbs}');
      expect(t('menu_title', { other: 1 })).toBe('{count} {count|orb|orbs}');
    });

    it('accepts a number passed as a string', () => {
      expect(t('menu_title', { count: '1' })).toBe('1 orb');
    });
  });

  describe('formatNumber', () => {
    it('groups digits the way the language does', () => {
      expect(locale.formatNumber(1234567)).toBe('1,234,567');

      locale.setLang('ru');

      // Russian groups digits with a no-break space.
      expect(locale.formatNumber(1234567)).toMatch(/^1\s234\s567$/);
    });

    it('accepts Intl options', () => {
      expect(locale.formatNumber(1200000, { notation: 'compact' })).toBe('1.2M');
    });
  });

  it('nextLang() cycles through the languages', () => {
    expect(locale.nextLang()).toBe('ru');

    locale.setLang('ru');

    expect(locale.nextLang()).toBe('en');
  });

  it('names every language', () => {
    expect(Object.keys(LANG_NAMES).sort()).toEqual([...LANGS].sort());
  });

  it('every locale defines the same keys', () => {
    expect(Object.keys(ru).sort()).toEqual(Object.keys(en).sort());
  });
});

describe('detectLang', () => {
  it('picks the first supported language', () => {
    expect(detectLang(['ru-RU', 'en-US'])).toBe('ru');
    expect(detectLang(['de-DE', 'ru', 'en'])).toBe('ru');
    expect(detectLang(['en-GB', 'ru'])).toBe('en');
  });

  it('ignores the letter case and the region', () => {
    expect(detectLang(['RU'])).toBe('ru');
    expect(detectLang(['ru-Cyrl-RU'])).toBe('ru');
  });

  it('falls back to the default language', () => {
    expect(detectLang(['de-DE', 'fr'])).toBe('en');
    expect(detectLang([])).toBe('en');
  });

  it('returns only supported languages', () => {
    expect(LANGS).toContain(detectLang(['zz']));
  });
});
