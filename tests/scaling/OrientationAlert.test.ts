import { describe, expect, it } from 'vitest';
import { needsRotation } from '@/scaling/OrientationAlert';

const PHONE_UPRIGHT = [390, 844] as const;
const PHONE_SIDEWAYS = [844, 390] as const;

describe('needsRotation', () => {
  it('asks to rotate a phone held the wrong way', () => {
    expect(needsRotation('landscape', ...PHONE_UPRIGHT, true)).toBe(true);
    expect(needsRotation('portrait', ...PHONE_SIDEWAYS, true)).toBe(true);
  });

  it('lets a phone held the right way play', () => {
    expect(needsRotation('landscape', ...PHONE_SIDEWAYS, true)).toBe(false);
    expect(needsRotation('portrait', ...PHONE_UPRIGHT, true)).toBe(false);
  });

  it('never asks a desktop window: it cannot be rotated', () => {
    expect(needsRotation('landscape', ...PHONE_UPRIGHT, false)).toBe(false);
    expect(needsRotation('portrait', 1920, 1080, false)).toBe(false);
  });

  it('never asks a game that works in both orientations', () => {
    expect(needsRotation('any', ...PHONE_UPRIGHT, true)).toBe(false);
    expect(needsRotation('any', ...PHONE_SIDEWAYS, true)).toBe(false);
  });

  it('counts a square screen as landscape', () => {
    expect(needsRotation('landscape', 800, 800, true)).toBe(false);
    expect(needsRotation('portrait', 800, 800, true)).toBe(true);
  });
});
