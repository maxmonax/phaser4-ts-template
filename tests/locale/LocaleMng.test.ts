import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { en } from '@/locale/en';
import { LANGS } from '@/locale/LocaleKeys';
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
