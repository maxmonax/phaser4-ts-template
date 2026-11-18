import { afterEach, describe, expect, it, vi } from 'vitest';
import { MyUtils } from '@/utils/MyUtils';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('MyUtils.getFileName', () => {
  it('strips the directory part for both separator styles', () => {
    expect(MyUtils.getFileName('assets/atlases/game.png')).toBe('game.png');
    expect(MyUtils.getFileName('C:\\art\\game.png')).toBe('game.png');
    expect(MyUtils.getFileName('game.png')).toBe('game.png');
  });
});

describe('MyUtils.getFileExt', () => {
  it('returns the lower-cased extension', () => {
    expect(MyUtils.getFileExt('game.png')).toBe('png');
    expect(MyUtils.getFileExt('assets/Game.PNG')).toBe('png');
    expect(MyUtils.getFileExt('archive.tar.gz')).toBe('gz');
  });

  it('returns an empty string when there is no extension', () => {
    expect(MyUtils.getFileExt('README')).toBe('');
    expect(MyUtils.getFileExt('dir.v2/README')).toBe('');
    expect(MyUtils.getFileExt('.gitignore')).toBe('gitignore');
  });

  it('skips ignored extensions', () => {
    expect(MyUtils.getFileExt('hero.png.meta', ['meta'])).toBe('png');
    expect(MyUtils.getFileExt('hero.meta', ['meta'])).toBe('');
  });
});

describe('MyUtils.secondsToHMS', () => {
  it('formats a duration', () => {
    expect(MyUtils.secondsToHMS(0)).toBe('00:00:00');
    expect(MyUtils.secondsToHMS(75)).toBe('00:01:15');
    expect(MyUtils.secondsToHMS(3661)).toBe('01:01:01');
  });

  it('carries rounded seconds into minutes', () => {
    expect(MyUtils.secondsToHMS(59.6)).toBe('00:01:00');
    expect(MyUtils.secondsToHMS(3599.5)).toBe('01:00:00');
  });
});

describe('MyUtils.getRandomValueFromArray', () => {
  it('can return the first and the last item', () => {
    const items = ['a', 'b', 'c'];
    vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.999999);

    expect(MyUtils.getRandomValueFromArray(items)).toBe('a');
    expect(MyUtils.getRandomValueFromArray(items)).toBe('c');
  });
});
