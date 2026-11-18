export class Vec2 {
  x: number;
  y: number;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  static getVec2(x = 0, y = 0): Vec2 {
    return new Vec2(x, y);
  }

  public get length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  public distanceTo(x: number, y: number): number {
    const dx = x - this.x;
    const dy = y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

export class Vec3 {
  x: number;
  y: number;
  z: number;

  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  static getVec3(x = 0, y = 0, z = 0): Vec3 {
    return new Vec3(x, y, z);
  }

  public get length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  public distanceTo(x: number, y: number, z: number): number {
    const dx = x - this.x;
    const dy = y - this.y;
    const dz = z - this.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}

export class RectABCD {
  a: Vec2;
  b: Vec2;
  c: Vec2;
  d: Vec2;
  constructor(a: Vec2, b: Vec2, c: Vec2, d: Vec2) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
  }
}

export class MyMath {
  public static randomInRange(min: number, max: number): number {
    if (min > max) throw new Error('MyMath.randomInRange(): Min > Max!');
    return Math.random() * Math.abs(max - min) + min;
  }

  /** Random integer in [min..max], both ends included, every value equally likely. */
  public static randomIntInRange(min: number, max: number): number {
    if (min > max) throw new Error('MyMath.randomIntInRange(): Min > Max!');
    const lo = Math.ceil(min);
    const hi = Math.floor(max);
    return Math.floor(Math.random() * (hi - lo + 1)) + lo;
  }

  public static isValueBetween(aValue: number, aMin: number, aMax: number): boolean {
    return aValue >= aMin && aValue <= aMax;
  }

  /**
   * Return -1 or 1 randomly
   */
  public static randomSign(): number {
    return Math.random() < 0.5 ? -1 : 1;
  }

  /**
   * Shuffles the array in place (Fisher–Yates): every permutation is equally likely.
   * @returns the same array
   */
  public static shuffleArray<T>(mas: T[]): T[] {
    for (let i = mas.length - 1; i > 0; i--) {
      const j = MyMath.randomIntInRange(0, i);
      [mas[i], mas[j]] = [mas[j], mas[i]];
    }
    return mas;
  }

  /**
   * Function restricts a given value between an upper and lower bound.
   * @param x - target value
   * @param min - minimum value
   * @param max - maximum value
   * @returns Cutted value between [min..max]
   */
  public static clamp(x: number, min: number, max: number): number {
    return Math.min(Math.max(x, min), max);
  }

  /**
   * Saturation
   * @param x - Target value
   * @returns Cutted value between [0..1]
   */
  public static sat(x: number): number {
    return this.clamp(x, 0, 1);
  }

  /**
   * Re-maps a number from one range to another.
   * Example: map(25, 0, 100, 0, 1000) = 250 the number 25 is converted from a value in the range of 0 to 100 into a value that ranges from the left edge of the window (0) to the right edge (width).
   * @param value - value
   * @param min1
   * @param max1
   * @param min2
   * @param max2
   */
  public static map(value: number, min1: number, max1: number, min2: number, max2: number): number {
    const p = (value - min1) / (max1 - min1);
    return min2 + p * (max2 - min2);
  }

  /**
   * Liener Interpolated value
   * @param a - Start value
   * @param b - Finish value
   * @param t - Time in [0..1]
   * @returns Value by time
   */
  public static lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  /**
   * Degrees to Radians
   * @param deg - Angle in degrees
   * @returns Angle in radians
   */
  public static toRadian(deg: number): number {
    return (deg * Math.PI) / 180;
  }

  /**
   * Radians to Degrees
   * @param rad - Angle in radians
   * @returns Angle in degrees
   */
  public static toDeg(rad: number): number {
    return (rad * 180) / Math.PI;
  }

  public static getVec2Length(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  public static getVec3Length(
    x1: number | { x: number; y: number; z: number },
    y1?: number,
    z1?: number,
    x2?: number,
    y2?: number,
    z2?: number
  ): number {
    let dx: number;
    let dy: number;
    let dz: number;
    if (typeof x1 == 'number') {
      dx = (x2 ?? 0) - x1;
      dy = (y2 ?? 0) - (y1 ?? 0);
      dz = (z2 ?? 0) - (z1 ?? 0);
    } else {
      dx = x1.x;
      dy = x1.y;
      dz = x1.z;
    }
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /** Unit vector with the same direction. A zero vector stays zero. */
  public static normalizeVector(v: { x: number; y: number }): { x: number; y: number } {
    const length = this.getVec2Length(0, 0, v.x, v.y);
    if (length === 0) return { x: 0, y: 0 };
    return { x: v.x / length, y: v.y / length };
  }

  public static distanceBetween(
    p1: { x: number; y: number },
    p2: { x: number; y: number }
  ): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculates the x coordinate to space elements evenly within a given width.
   *
   * @param containerSize - The total width of the container in which you want to place the elements.
   * @param elementsCount - The total number of elements to distribute.
   * @param elementId - The index of the current element (starting at 0).
   * @returns The x coordinate for the specified element.
   */
  public static calculatePosition(aParams: {
    containerSize: number;
    elementsCount: number;
    elementId: number;
    padding?: {
      left: number;
      right: number;
    };
  }): number {
    if (
      aParams.elementsCount < 1 ||
      aParams.elementId < 0 ||
      aParams.elementId >= aParams.elementsCount
    ) {
      throw new Error('Invalid input: numElements must be > 0 and elementIndex must be valid.');
    }
    const pLeft = aParams.padding?.left || 0;
    const pRight = aParams.padding?.right || 0;
    const innerWidth = aParams.containerSize - pLeft - pRight;
    const spacing = aParams.elementsCount > 1 ? innerWidth / (aParams.elementsCount - 1) : 0;
    const x = pLeft + spacing * aParams.elementId;
    return x;
  }

  /**
   * Convert angle to Vec2
   * @param aAngle angle in radians
   * @returns
   */
  public static angleToVec2(aAngle: number): Vec2 {
    return new Vec2(Math.cos(aAngle), Math.sin(aAngle));
  }

  /**
   * dot product of vectors (scalar product)
   */
  public static dotVec3(
    a: { x: number; y: number; z: number },
    b: { x: number; y: number; z: number }
  ): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  /**
   * Find the angle between 2 vectors (x1, y1) -> (x2, y2) via Math.atan2 function.
   * @param x1 - The x coordinate of the first point.
   * @param {number} y1 - The y coordinate of the first point.
   * @param {number} x2 - The x coordinate of the second point.
   * @param {number} y2 - The y coordinate of the second point.
   * @return The angle in radians.
   */
  public static angleBetweenATan(x1: number, y1: number, x2: number, y2: number): number {
    return Math.atan2(y2 - y1, x2 - x1);
  }

  /**
   * Angle between 2 vectors (x1, y1) -> (x2, y2) via Math.acos function.
   * @param x1 - The x coordinate of the first vector.
   * @param y1 - The y coordinate of the first vector.
   * @param x2 - The x coordinate of the second vector.
   * @param y2 - The y coordinate of the second vector.
   * @return The angle in radians.
   */
  public static angleBetweenACos(x1: number, y1: number, x2: number, y2: number) {
    const scalar = x1 * x2 + y1 * y2;
    const mod1 = Math.sqrt(x1 * x1 + y1 * y1);
    const mod2 = Math.sqrt(x2 * x2 + y2 * y2);
    return Math.acos(scalar / (mod1 * mod2));
  }

  /**
   * Angle between 2 vectors (x1, y1) -> (x2, y2) via Math.asin function.
   * @param x1 - The x coordinate of the first vector.
   * @param y1 - The y coordinate of the first vector.
   * @param x2 - The x coordinate of the second vector.
   * @param y2 - The y coordinate of the second vector.
   * @return The angle in radians.
   */
  public static angleBetweenASin(x1: number, y1: number, x2: number, y2: number) {
    const scalar = x1 * x2 + y1 * y2;
    const mod1 = Math.sqrt(x1 * x1 + y1 * y1);
    const mod2 = Math.sqrt(x2 * x2 + y2 * y2);
    return Math.asin(scalar / (mod1 * mod2));
  }

  /**
   * Projection of vector a to vector b
   */
  public static getVec3Projection(
    a: { x: number; y: number; z: number },
    b: { x: number; y: number; z: number }
  ): number {
    return this.dotVec3(a, b) / this.getVec3Length(b);
  }

  public static isPointInTriangle(
    ax: number,
    ay: number,
    bx: number,
    by: number,
    cx: number,
    cy: number,
    px: number,
    py: number
  ): boolean {
    // The point is inside (or on an edge) when it lies on the same side of all three edges.
    const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
    const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
    const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
    const hasNegative = d1 < 0 || d2 < 0 || d3 < 0;
    const hasPositive = d1 > 0 || d2 > 0 || d3 > 0;
    return !(hasNegative && hasPositive);
  }

  /** The rectangle may be rotated; its corners go around it in order: a, b, c, d. */
  public static isPointInRect(rect: RectABCD, p: Vec2): boolean {
    // The rectangle is split into triangles abc and cda; the point must be in one of them.
    return (
      MyMath.isPointInTriangle(
        rect.a.x,
        rect.a.y,
        rect.b.x,
        rect.b.y,
        rect.c.x,
        rect.c.y,
        p.x,
        p.y
      ) ||
      MyMath.isPointInTriangle(rect.c.x, rect.c.y, rect.d.x, rect.d.y, rect.a.x, rect.a.y, p.x, p.y)
    );
  }

  public static isPointInCircle(x: number, y: number, cx: number, cy: number, r: number): boolean {
    return MyMath.getVec2Length(x, y, cx, cy) <= r;
  }

  public static isCirclesIntersect(
    x1: number,
    y1: number,
    r1: number,
    x2: number,
    y2: number,
    r2: number
  ): boolean {
    return MyMath.getVec2Length(x1, y1, x2, y2) <= r1 + r2;
  }

  /**
   * Calculates the factorial of a non-negative integer.
   * @param aValue - A non-negative integer to calculate the factorial of.
   * @return The factorial of the given number.
   */
  public static factorial(aValue: number): number {
    if (!Number.isInteger(aValue) || aValue < 0) {
      throw new Error('MyMath.factorial(): a non-negative integer is expected');
    }
    let res = 1;
    for (let i = 2; i <= aValue; i++) res *= i;
    return res;
  }
}
