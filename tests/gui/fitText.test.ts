import { describe, expect, it } from 'vitest';
import { fitScale, fitText } from '@/gui/fitText';

function makeText(width: number, height: number) {
  return {
    width,
    height,
    scale: 1,
    setScale(scale: number) {
      this.scale = scale;
    },
  };
}

describe('fitText', () => {
  it('scales a wide text down to the width', () => {
    const text = makeText(400, 50);

    expect(fitText(text, 200)).toBe(0.5);
    expect(text.scale).toBe(0.5);
  });

  it('never scales up', () => {
    const text = makeText(100, 50);

    expect(fitText(text, 200)).toBe(1);
    expect(text.scale).toBe(1);
  });

  it('takes the height into account', () => {
    const text = makeText(100, 200);

    expect(fitText(text, 200, 50)).toBe(0.25);
  });

  it('restores the scale when a shorter text fits again', () => {
    const text = makeText(400, 50);
    fitText(text, 200);

    text.width = 150;

    expect(fitText(text, 200)).toBe(1);
    expect(text.scale).toBe(1);
  });

  it('keeps an empty text at scale 1', () => {
    const text = makeText(0, 0);

    expect(fitText(text, 200, 50)).toBe(1);
  });
});

describe('fitScale', () => {
  it('fits a box by the side that is short of room', () => {
    // A popup 900×600 on a portrait phone 646 wide.
    expect(fitScale(900, 600, 646, 1400)).toBeCloseTo(0.718, 3);
    expect(fitScale(600, 900, 1400, 450)).toBe(0.5);
  });

  it('never scales up', () => {
    expect(fitScale(800, 600, 1440, 1080)).toBe(1);
  });

  it('is never negative', () => {
    expect(fitScale(800, 600, -10)).toBe(0);
  });
});
