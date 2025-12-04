/**
 * Integration tests with math.js patterns
 *
 * These tests simulate common usage patterns from math.js,
 * a major consumer of the typed-function library.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import typed from '../src/index.js';

/**
 * Simulate math.js type system
 */
function createMathJsTyped() {
  const math = typed.create();

  // Add math.js-style custom types
  math.addType({
    name: 'Complex',
    test: (x: unknown) => x !== null && typeof x === 'object' && 're' in x && 'im' in x,
  });

  math.addType({
    name: 'Matrix',
    test: (x: unknown) => x !== null && typeof x === 'object' && 'data' in x && Array.isArray((x as { data: unknown }).data),
  });

  math.addType({
    name: 'BigNumber',
    test: (x: unknown) => x !== null && typeof x === 'object' && 'type' in x && (x as { type: string }).type === 'BigNumber',
  });

  math.addType({
    name: 'Unit',
    test: (x: unknown) => x !== null && typeof x === 'object' && 'value' in x && 'unit' in x,
  });

  math.addType({
    name: 'Fraction',
    test: (x: unknown) => x !== null && typeof x === 'object' && 'n' in x && 'd' in x,
  });

  // Add conversions
  math.addConversion({
    from: 'number',
    to: 'Complex',
    convert: (x: number) => ({ re: x, im: 0 }),
  });

  math.addConversion({
    from: 'number',
    to: 'BigNumber',
    convert: (x: number) => ({ type: 'BigNumber', value: x.toString() }),
  });

  math.addConversion({
    from: 'Array',
    to: 'Matrix',
    convert: (x: unknown[]) => ({ data: x }),
  });

  return math;
}

describe('math.js Patterns: Basic Arithmetic', () => {
  let math: ReturnType<typeof createMathJsTyped>;

  beforeEach(() => {
    math = createMathJsTyped();
  });

  it('should implement add with multiple types', () => {
    const add = math({
      'number, number': (a: number, b: number) => a + b,
      'string, string': (a: string, b: string) => a + b,
      'Complex, Complex': (a: { re: number; im: number }, b: { re: number; im: number }) =>
        ({ re: a.re + b.re, im: a.im + b.im }),
      'Matrix, Matrix': (a: { data: number[] }, b: { data: number[] }) =>
        ({ data: a.data.map((v, i) => v + b.data[i]!) }),
    });

    expect(add(1, 2)).toBe(3);
    expect(add('a', 'b')).toBe('ab');
    expect(add({ re: 1, im: 2 }, { re: 3, im: 4 })).toEqual({ re: 4, im: 6 });
    expect(add({ data: [1, 2] }, { data: [3, 4] })).toEqual({ data: [4, 6] });
  });

  it('should implement multiply with conversions', () => {
    const multiply = math({
      'number, number': (a: number, b: number) => a * b,
      'Complex, Complex': (a: { re: number; im: number }, b: { re: number; im: number }) => ({
        re: a.re * b.re - a.im * b.im,
        im: a.re * b.im + a.im * b.re,
      }),
    });

    expect(multiply(2, 3)).toBe(6);
    expect(multiply({ re: 1, im: 2 }, { re: 3, im: 4 })).toEqual({ re: -5, im: 10 });

    // With conversion: number -> Complex
    expect(multiply(2, { re: 3, im: 4 })).toEqual({ re: 6, im: 8 });
  });

  it('should implement sqrt with type-based behavior', () => {
    const sqrt = math({
      number: (x: number) => {
        if (x >= 0) return Math.sqrt(x);
        // Return complex for negative numbers
        return { re: 0, im: Math.sqrt(-x) };
      },
      Complex: (x: { re: number; im: number }) => {
        // Simplified complex sqrt
        const r = Math.sqrt(x.re * x.re + x.im * x.im);
        return {
          re: Math.sqrt((r + x.re) / 2),
          im: Math.sign(x.im) * Math.sqrt((r - x.re) / 2),
        };
      },
    });

    expect(sqrt(4)).toBe(2);
    expect(sqrt(-4)).toEqual({ re: 0, im: 2 });
  });
});

describe('math.js Patterns: Matrix Operations', () => {
  let math: ReturnType<typeof createMathJsTyped>;

  beforeEach(() => {
    math = createMathJsTyped();
  });

  it('should implement matrix creation', () => {
    const matrix = math({
      Array: (arr: unknown[]) => ({ data: arr }),
      'Array, string': (arr: unknown[], type: string) => ({ data: arr, type }),
    });

    expect(matrix([1, 2, 3])).toEqual({ data: [1, 2, 3] });
    expect(matrix([1, 2], 'dense')).toEqual({ data: [1, 2], type: 'dense' });
  });

  it('should implement matrix size', () => {
    const size = math({
      Array: (arr: unknown[]) => [arr.length],
      Matrix: (m: { data: unknown[] }) => [m.data.length],
      string: (s: string) => [s.length],
    });

    expect(size([1, 2, 3])).toEqual([3]);
    expect(size({ data: [1, 2] })).toEqual([2]);
    expect(size('hello')).toEqual([5]);
  });

  it('should implement element access', () => {
    const subset = math({
      'Array, number': (arr: unknown[], idx: number) => arr[idx],
      'Matrix, number': (m: { data: unknown[] }, idx: number) => m.data[idx],
      'string, number': (s: string, idx: number) => s[idx],
    });

    expect(subset([1, 2, 3], 1)).toBe(2);
    expect(subset({ data: ['a', 'b', 'c'] }, 0)).toBe('a');
    expect(subset('hello', 4)).toBe('o');
  });
});

describe('math.js Patterns: Function Chaining', () => {
  let math: ReturnType<typeof createMathJsTyped>;

  beforeEach(() => {
    math = createMathJsTyped();
  });

  it('should support referTo for signature references', () => {
    const fn = math({
      'number, number': (a: number, b: number) => a + b,
      'string': math.referTo('number, number', (addNums) => {
        return (s: string) => {
          const parts = s.split(',').map(Number);
          return addNums(parts[0]!, parts[1]!);
        };
      }),
    });

    expect(fn(1, 2)).toBe(3);
    expect(fn('4,5')).toBe(9);
  });

  it('should support referToSelf for recursive operations', () => {
    const flatten = math({
      Array: math.referToSelf((self) => {
        return function flattenArray(arr: unknown[]): unknown[] {
          const result: unknown[] = [];
          for (const item of arr) {
            if (Array.isArray(item)) {
              result.push(...(self(item) as unknown[]));
            } else {
              result.push(item);
            }
          }
          return result;
        };
      }),
      any: (x: unknown) => [x],
    });

    expect(flatten([1, [2, [3, 4]], 5])).toEqual([1, 2, 3, 4, 5]);
    expect(flatten([[[[1]]]])).toEqual([1]);
    expect(flatten(42)).toEqual([42]);
  });
});

describe('math.js Patterns: Type Coercion', () => {
  let math: ReturnType<typeof createMathJsTyped>;

  beforeEach(() => {
    math = createMathJsTyped();
  });

  it('should coerce numbers to complex', () => {
    const abs = math({
      number: (x: number) => Math.abs(x),
      Complex: (x: { re: number; im: number }) => Math.sqrt(x.re * x.re + x.im * x.im),
    });

    expect(abs(-5)).toBe(5);
    expect(abs({ re: 3, im: 4 })).toBe(5);
  });

  it('should coerce arrays to matrices', () => {
    const transpose = math({
      Matrix: (m: { data: number[][] }) => ({
        data: m.data[0]?.map((_, i) => m.data.map((row) => row[i]!)) || [],
      }),
    });

    // Array gets converted to Matrix
    expect(transpose([[1, 2], [3, 4]])).toEqual({ data: [[1, 3], [2, 4]] });
  });
});

describe('math.js Patterns: Error Handling', () => {
  let math: ReturnType<typeof createMathJsTyped>;

  beforeEach(() => {
    math = createMathJsTyped();
  });

  it('should throw descriptive errors for unsupported types', () => {
    const divide = math('divide', {
      'number, number': (a: number, b: number) => a / b,
    });

    expect(() => divide('a', 'b')).toThrow(/function divide/);
    expect(() => divide('a', 'b')).toThrow(/expected: number/);
  });

  it('should throw for too few arguments', () => {
    const add = math('add', {
      'number, number': (a: number, b: number) => a + b,
    });

    expect(() => add(1)).toThrow(/Too few arguments/);
  });

  it('should throw for too many arguments', () => {
    const negate = math('negate', {
      number: (x: number) => -x,
    });

    expect(() => negate(1, 2)).toThrow(/Too many arguments/);
  });
});

describe('math.js Patterns: Signature Merging', () => {
  let math: ReturnType<typeof createMathJsTyped>;

  beforeEach(() => {
    math = createMathJsTyped();
  });

  it('should merge signatures from multiple definitions', () => {
    const addNum = math({ 'number, number': (a: number, b: number) => a + b });
    const addStr = math({ 'string, string': (a: string, b: string) => a + b });
    const addComplex = math({
      'Complex, Complex': (a: { re: number; im: number }, b: { re: number; im: number }) =>
        ({ re: a.re + b.re, im: a.im + b.im }),
    });

    const add = math('add', addNum, addStr, addComplex);

    expect(add(1, 2)).toBe(3);
    expect(add('a', 'b')).toBe('ab');
    expect(add({ re: 1, im: 2 }, { re: 3, im: 4 })).toEqual({ re: 4, im: 6 });
  });

  it('should handle signature objects from typed functions', () => {
    const base = math({
      number: (x: number) => x,
      string: (s: string) => s.length,
    });

    // Extend with additional signatures
    const extended = math({
      ...base.signatures,
      boolean: (b: boolean) => b ? 1 : 0,
    });

    expect(extended(42)).toBe(42);
    expect(extended('hello')).toBe(5);
    expect(extended(true)).toBe(1);
  });
});

describe('math.js Patterns: Constants and Special Values', () => {
  let math: ReturnType<typeof createMathJsTyped>;

  beforeEach(() => {
    math = createMathJsTyped();
  });

  it('should handle special numeric values', () => {
    const classify = math({
      number: (x: number) => {
        if (Number.isNaN(x)) return 'NaN';
        if (!Number.isFinite(x)) return x > 0 ? '+Infinity' : '-Infinity';
        if (x === 0) return Object.is(x, -0) ? '-0' : '+0';
        return 'number';
      },
    });

    expect(classify(NaN)).toBe('NaN');
    expect(classify(Infinity)).toBe('+Infinity');
    expect(classify(-Infinity)).toBe('-Infinity');
    expect(classify(0)).toBe('+0');
    expect(classify(-0)).toBe('-0');
    expect(classify(42)).toBe('number');
  });

  it('should handle complex zero', () => {
    const isZero = math({
      number: (x: number) => x === 0,
      Complex: (x: { re: number; im: number }) => x.re === 0 && x.im === 0,
      BigNumber: (x: { value: string }) => x.value === '0',
    });

    expect(isZero(0)).toBe(true);
    expect(isZero(1)).toBe(false);
    expect(isZero({ re: 0, im: 0 })).toBe(true);
    expect(isZero({ re: 1, im: 0 })).toBe(false);
    expect(isZero({ type: 'BigNumber', value: '0' })).toBe(true);
  });
});

describe('math.js Patterns: Unit Handling', () => {
  let math: ReturnType<typeof createMathJsTyped>;

  beforeEach(() => {
    math = createMathJsTyped();
  });

  it('should support unit arithmetic', () => {
    const addUnits = math({
      'Unit, Unit': (a: { value: number; unit: string }, b: { value: number; unit: string }) => {
        if (a.unit !== b.unit) {
          throw new Error(`Cannot add units: ${a.unit} and ${b.unit}`);
        }
        return { value: a.value + b.value, unit: a.unit };
      },
      'number, Unit': (a: number, b: { value: number; unit: string }) =>
        ({ value: a + b.value, unit: b.unit }),
      'Unit, number': (a: { value: number; unit: string }, b: number) =>
        ({ value: a.value + b, unit: a.unit }),
    });

    expect(addUnits({ value: 5, unit: 'm' }, { value: 3, unit: 'm' }))
      .toEqual({ value: 8, unit: 'm' });
    expect(addUnits(10, { value: 5, unit: 'kg' }))
      .toEqual({ value: 15, unit: 'kg' });
    expect(() => addUnits({ value: 1, unit: 'm' }, { value: 1, unit: 's' }))
      .toThrow(/Cannot add units/);
  });
});

describe('math.js Patterns: Expression Parsing', () => {
  let math: ReturnType<typeof createMathJsTyped>;

  beforeEach(() => {
    math = createMathJsTyped();
  });

  it('should support string-to-number parsing', () => {
    const parse = math({
      string: (s: string) => {
        const num = parseFloat(s);
        if (isNaN(num)) {
          throw new Error(`Cannot parse: ${s}`);
        }
        return num;
      },
      number: (x: number) => x,
    });

    expect(parse('42')).toBe(42);
    expect(parse('3.14')).toBeCloseTo(3.14);
    expect(parse(100)).toBe(100);
    expect(() => parse('abc')).toThrow(/Cannot parse/);
  });

  it('should support format function', () => {
    const format = math({
      number: (x: number) => x.toString(),
      'number, number': (x: number, precision: number) => x.toPrecision(precision),
      Complex: (x: { re: number; im: number }) =>
        `${x.re} + ${x.im}i`,
    });

    expect(format(42)).toBe('42');
    expect(format(3.14159, 3)).toBe('3.14');
    expect(format({ re: 1, im: 2 })).toBe('1 + 2i');
  });
});

describe('math.js Patterns: Collection Operations', () => {
  let math: ReturnType<typeof createMathJsTyped>;

  beforeEach(() => {
    math = createMathJsTyped();
  });

  it('should implement map with callback', () => {
    const map = math({
      'Array, Function': (arr: unknown[], fn: (x: unknown) => unknown) =>
        arr.map(fn),
      'Matrix, Function': (m: { data: unknown[] }, fn: (x: unknown) => unknown) =>
        ({ data: m.data.map(fn) }),
    });

    expect(map([1, 2, 3], (x: number) => x * 2)).toEqual([2, 4, 6]);
    expect(map({ data: [1, 2] }, (x: number) => x + 1)).toEqual({ data: [2, 3] });
  });

  it('should implement filter with callback', () => {
    const filter = math({
      'Array, Function': (arr: unknown[], fn: (x: unknown) => boolean) =>
        arr.filter(fn),
    });

    expect(filter([1, 2, 3, 4, 5], (x: number) => x % 2 === 0)).toEqual([2, 4]);
  });

  it('should implement reduce with callback', () => {
    const reduce = math({
      'Array, Function': (arr: unknown[], fn: (acc: unknown, cur: unknown) => unknown) =>
        arr.reduce(fn),
      'Array, Function, any': (arr: unknown[], fn: (acc: unknown, cur: unknown) => unknown, init: unknown) =>
        arr.reduce(fn, init),
    });

    expect(reduce([1, 2, 3, 4], (a: number, b: number) => a + b)).toBe(10);
    expect(reduce([1, 2, 3], (a: number, b: number) => a * b, 1)).toBe(6);
  });
});
