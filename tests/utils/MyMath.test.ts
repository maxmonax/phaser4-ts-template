import { afterEach, describe, expect, it, vi } from 'vitest';
import { MyMath, RectABCD, Vec2 } from '@/utils/MyMath';

afterEach(() => {
  vi.restoreAllMocks();
});

/** Makes Math.random() return the given values one after another, cycling. */
function mockRandom(values: number[]) {
  let i = 0;
  vi.spyOn(Math, 'random').mockImplementation(() => values[i++ % values.length]);
}

describe('MyMath.randomIntInRange', () => {
  it('returns both ends of the range', () => {
    mockRandom([0, 0.999999]);
    expect(MyMath.randomIntInRange(3, 7)).toBe(3);
    expect(MyMath.randomIntInRange(3, 7)).toBe(7);
  });

  it('gives every value the same share of the random range', () => {
    const steps = 1000;
    mockRandom(Array.from({ length: steps }, (_, i) => i / steps));

    const counts = new Map<number, number>();
    for (let i = 0; i < steps; i++) {
      const v = MyMath.randomIntInRange(1, 4);
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }

    expect([...counts.keys()].sort()).toEqual([1, 2, 3, 4]);
    expect([...counts.values()]).toEqual([250, 250, 250, 250]);
  });

  it('works for a single-value range', () => {
    expect(MyMath.randomIntInRange(5, 5)).toBe(5);
  });

  it('throws when min is greater than max', () => {
    expect(() => MyMath.randomIntInRange(2, 1)).toThrow();
  });
});

describe('MyMath.shuffleArray', () => {
  it('keeps all elements and returns the same array', () => {
    const arr = [1, 2, 3, 4, 5, 6];
    const result = MyMath.shuffleArray(arr);

    expect(result).toBe(arr);
    expect([...arr].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('is a Fisher–Yates shuffle', () => {
    // random = 0 always picks index 0: each step moves the last unplaced item to the front
    mockRandom([0]);
    expect(MyMath.shuffleArray(['a', 'b', 'c', 'd'])).toEqual(['b', 'c', 'd', 'a']);
  });

  it('handles empty and single-item arrays', () => {
    expect(MyMath.shuffleArray([])).toEqual([]);
    expect(MyMath.shuffleArray([1])).toEqual([1]);
  });
});

describe('MyMath number helpers', () => {
  it('randomSign returns -1 or 1', () => {
    mockRandom([0.1, 0.9]);
    expect(MyMath.randomSign()).toBe(-1);
    expect(MyMath.randomSign()).toBe(1);
  });

  it('clamp and sat limit the value', () => {
    expect(MyMath.clamp(5, 0, 3)).toBe(3);
    expect(MyMath.clamp(-5, 0, 3)).toBe(0);
    expect(MyMath.clamp(2, 0, 3)).toBe(2);
    expect(MyMath.sat(1.5)).toBe(1);
    expect(MyMath.sat(-0.5)).toBe(0);
  });

  it('map re-maps a value between ranges', () => {
    expect(MyMath.map(25, 0, 100, 0, 1000)).toBe(250);
    expect(MyMath.map(5, 0, 10, 10, 0)).toBe(5);
  });

  it('lerp interpolates linearly', () => {
    expect(MyMath.lerp(10, 20, 0)).toBe(10);
    expect(MyMath.lerp(10, 20, 0.5)).toBe(15);
    expect(MyMath.lerp(10, 20, 1)).toBe(20);
  });

  it('converts between degrees and radians', () => {
    expect(MyMath.toRadian(180)).toBeCloseTo(Math.PI);
    expect(MyMath.toDeg(Math.PI / 2)).toBeCloseTo(90);
  });

  it('factorial', () => {
    expect(MyMath.factorial(0)).toBe(1);
    expect(MyMath.factorial(1)).toBe(1);
    expect(MyMath.factorial(5)).toBe(120);
    expect(() => MyMath.factorial(-1)).toThrow();
    expect(() => MyMath.factorial(2.5)).toThrow();
  });

  it('calculatePosition spreads elements evenly', () => {
    const at = (elementId: number) =>
      MyMath.calculatePosition({ containerSize: 100, elementsCount: 3, elementId });
    expect([at(0), at(1), at(2)]).toEqual([0, 50, 100]);

    expect(
      MyMath.calculatePosition({
        containerSize: 100,
        elementsCount: 2,
        elementId: 1,
        padding: { left: 10, right: 20 },
      })
    ).toBe(80);
    expect(() =>
      MyMath.calculatePosition({ containerSize: 100, elementsCount: 2, elementId: 2 })
    ).toThrow();
  });
});

describe('MyMath vectors and geometry', () => {
  it('measures distances', () => {
    expect(MyMath.getVec2Length(0, 0, 3, 4)).toBe(5);
    expect(MyMath.distanceBetween({ x: 1, y: 1 }, { x: 4, y: 5 })).toBe(5);
    expect(MyMath.getVec3Length({ x: 2, y: 3, z: 6 })).toBe(7);
    expect(MyMath.getVec3Length(1, 1, 1, 3, 4, 7)).toBe(7);
    expect(new Vec2(3, 4).length).toBe(5);
  });

  it('normalizeVector returns a unit vector and keeps a zero vector', () => {
    const n = MyMath.normalizeVector({ x: 3, y: 4 });
    expect(n.x).toBeCloseTo(0.6);
    expect(n.y).toBeCloseTo(0.8);
    expect(MyMath.normalizeVector({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
  });

  it('angleBetweenATan returns the direction angle', () => {
    expect(MyMath.angleBetweenATan(0, 0, 1, 1)).toBeCloseTo(Math.PI / 4);
    expect(MyMath.angleBetweenATan(0, 0, -1, 0)).toBeCloseTo(Math.PI);
  });

  it('isPointInTriangle', () => {
    // inside, outside, on an edge, on a vertex
    expect(MyMath.isPointInTriangle(0, 0, 10, 0, 0, 10, 2, 2)).toBe(true);
    expect(MyMath.isPointInTriangle(0, 0, 10, 0, 0, 10, 8, 8)).toBe(false);
    expect(MyMath.isPointInTriangle(0, 0, 10, 0, 0, 10, 5, 0)).toBe(true);
    expect(MyMath.isPointInTriangle(0, 0, 10, 0, 0, 10, 0, 0)).toBe(true);
  });

  it('isPointInTriangle works when edge AB is vertical', () => {
    expect(MyMath.isPointInTriangle(0, 0, 0, 10, 10, 0, 1, 1)).toBe(true);
    expect(MyMath.isPointInTriangle(0, 0, 0, 10, 10, 0, 9, 9)).toBe(false);
  });

  it('isPointInTriangle does not depend on the winding order', () => {
    expect(MyMath.isPointInTriangle(0, 0, 0, 10, 10, 0, 2, 2)).toBe(true);
    expect(MyMath.isPointInTriangle(0, 0, 10, 0, 0, 10, 2, 2)).toBe(true);
  });

  it('isPointInRect', () => {
    const rect = new RectABCD(new Vec2(0, 0), new Vec2(10, 0), new Vec2(10, 5), new Vec2(0, 5));
    expect(MyMath.isPointInRect(rect, new Vec2(5, 2))).toBe(true);
    expect(MyMath.isPointInRect(rect, new Vec2(1, 4))).toBe(true);
    expect(MyMath.isPointInRect(rect, new Vec2(11, 2))).toBe(false);
    expect(MyMath.isPointInRect(rect, new Vec2(5, 6))).toBe(false);
  });

  it('circle checks', () => {
    expect(MyMath.isPointInCircle(1, 1, 0, 0, 2)).toBe(true);
    expect(MyMath.isPointInCircle(3, 3, 0, 0, 2)).toBe(false);
    expect(MyMath.isCirclesIntersect(0, 0, 1, 1.5, 0, 1)).toBe(true);
    expect(MyMath.isCirclesIntersect(0, 0, 1, 3, 0, 1)).toBe(false);
  });
});
