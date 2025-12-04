/**
 * Rest params tests ported from rest_params.mjs
 * Tests for rest parameter handling in typed functions
 */

import { describe, it, expect } from 'vitest';
import typed from '../src/index.js';

/**
 * Test strict equality of all elements in two arrays.
 */
function strictEqualArray<T>(a: T[], b: T[]) {
  expect(a.length).toBe(b.length);
  for (let i = 0; i < a.length; i++) {
    expect(a[i]).toBe(b[i]);
  }
}

describe('rest parameters (legacy)', () => {
  it('should create a typed function with rest parameters', () => {
    const sum = typed({
      '...number': function (values: number[]) {
        expect(Array.isArray(values)).toBe(true);
        let sum = 0;
        for (let i = 0; i < values.length; i++) {
          sum += values[i];
        }
        return sum;
      },
    });

    expect(sum(2)).toBe(2);
    expect(sum(2, 3, 4)).toBe(9);
    expect(() => sum()).toThrow(/Too few arguments in function unnamed \(expected: number, index: 0\)/);
    expect(() => sum(true)).toThrow(/Unexpected type of argument in function unnamed \(expected: number, actual: boolean, index: 0\)/);
    expect(() => sum('string')).toThrow(/Unexpected type of argument in function unnamed \(expected: number, actual: string, index: 0\)/);
    expect(() => sum(2, 'string')).toThrow(/Unexpected type of argument in function unnamed \(expected: number, actual: string, index: 1\)/);
    expect(() => sum(2, 3, 'string')).toThrow(/Unexpected type of argument in function unnamed \(expected: number, actual: string, index: 2\)/);
  });

  it('should create a typed function with rest parameters (2)', () => {
    const fn = typed({
      'string, ...number': function (str: string, values: number[]) {
        expect(typeof str).toBe('string');
        expect(Array.isArray(values)).toBe(true);
        return str + ': ' + values.join(', ');
      },
    });

    expect(fn('foo', 2)).toBe('foo: 2');
    expect(fn('foo', 2, 4)).toBe('foo: 2, 4');
    expect(() => fn(2, 4)).toThrow(/Unexpected type of argument in function unnamed \(expected: string, actual: number, index: 0\)/);
    expect(() => fn('string')).toThrow(/Too few arguments in function unnamed \(expected: number, index: 1\)/);
    expect(() => fn('string', 'string')).toThrow(/Unexpected type of argument in function unnamed \(expected: number, actual: string, index: 1\)/);
  });

  it('should create a typed function with any type arguments (1)', () => {
    const fn = typed({
      'string, ...any': function (str: string, values: unknown[]) {
        expect(typeof str).toBe('string');
        expect(Array.isArray(values)).toBe(true);
        return str + ': ' + values.join(', ');
      },
    });

    expect(fn('foo', 2)).toBe('foo: 2');
    expect(fn('foo', 2, true, 'bar')).toBe('foo: 2, true, bar');
    expect(fn('foo', 'bar')).toBe('foo: bar');
    expect(() => fn(2, 4)).toThrow(/Unexpected type of argument in function unnamed \(expected: string, actual: number, index: 0\)/);
    expect(() => fn('string')).toThrow(/Too few arguments in function unnamed \(expected: any, index: 1\)/);
  });

  it('should create a typed function with implicit any type arguments', () => {
    const fn = typed({
      'string, ...': function (str: string, values: unknown[]) {
        expect(typeof str).toBe('string');
        expect(Array.isArray(values)).toBe(true);
        return str + ': ' + values.join(', ');
      },
    });

    expect(fn('foo', 2)).toBe('foo: 2');
    expect(fn('foo', 2, true, 'bar')).toBe('foo: 2, true, bar');
    expect(fn('foo', 'bar')).toBe('foo: bar');
    expect(() => fn(2, 4)).toThrow(/Unexpected type of argument in function unnamed \(expected: string, actual: number, index: 0\)/);
    expect(() => fn('string')).toThrow(/Too few arguments in function unnamed \(expected: any, index: 1\)/);
  });

  it('should create a typed function with any type arguments (2)', () => {
    const fn = typed({
      'any, ...number': function (any: unknown, values: number[]) {
        expect(Array.isArray(values)).toBe(true);
        return any + ': ' + values.join(', ');
      },
    });

    expect(fn('foo', 2)).toBe('foo: 2');
    expect(fn(1, 2, 4)).toBe('1: 2, 4');
    expect(fn(null, 2, 4)).toBe('null: 2, 4');
    expect(() => fn('string')).toThrow(/Too few arguments in function unnamed \(expected: number, index: 1\)/);
    expect(() => fn('string', 'string')).toThrow(/Unexpected type of argument in function unnamed \(expected: number, actual: string, index: 1\)/);
  });

  it('should create a typed function with union type arguments', () => {
    const fn = typed({
      '...number|string': function (values: (number | string)[]) {
        expect(Array.isArray(values)).toBe(true);
        return values;
      },
    });

    strictEqualArray(fn(2, 3, 4), [2, 3, 4]);
    strictEqualArray(fn('a', 'b', 'c'), ['a', 'b', 'c']);
    strictEqualArray(fn('a', 2, 'c', 3), ['a', 2, 'c', 3]);
    expect(() => fn()).toThrow(/Too few arguments in function unnamed \(expected: number or string, index: 0\)/);
    expect(() => fn('string', true)).toThrow(/Unexpected type of argument. Index: 1 in function unnamed \(expected: string | number/);
    expect(() => fn(2, false)).toThrow(/Unexpected type of argument. Index: 1 in function unnamed \(expected: string | number/);
    expect(() => fn(2, 3, false)).toThrow(/Unexpected type of argument. Index: 2 in function unnamed \(expected: string | number/);
  });

  it('should create a composed function with rest parameters', () => {
    const fn = typed({
      'string, ...number': function (str: string, values: number[]) {
        expect(typeof str).toBe('string');
        expect(Array.isArray(values)).toBe(true);
        return str + ': ' + values.join(', ');
      },

      '...boolean': function (values: boolean[]) {
        expect(Array.isArray(values)).toBe(true);
        return 'booleans';
      },
    });

    expect(fn('foo', 2)).toBe('foo: 2');
    expect(fn('foo', 2, 4)).toBe('foo: 2, 4');
    expect(fn(true, false, false)).toBe('booleans');
    expect(() => fn(2, 4)).toThrow(/Unexpected type of argument in function unnamed \(expected: string or boolean, actual: number, index: 0\)/);
    expect(() => fn('string')).toThrow(/Too few arguments in function unnamed \(expected: number, index: 1\)/);
    expect(() => fn('string', true)).toThrow(/Unexpected type of argument in function unnamed \(expected: number, actual: boolean, index: 1\)/);
  });

  it('should continue with other options if rest params do not match', () => {
    const fn = typed({
      '...number': function (_values: number[]) {
        return '...number';
      },

      Object: function (_value: object) {
        return 'Object';
      },
    });

    expect(fn(2, 3)).toBe('...number');
    expect(fn(2)).toBe('...number');
    expect(fn({})).toBe('Object');

    expect(Object.keys(fn.signatures).length).toBe(2);
    expect('Object' in fn.signatures).toBe(true);
    expect('...number' in fn.signatures).toBe(true);
  });

  it('should split rest params with conversions in two and order them correctly', () => {
    const typed2 = typed.create();
    typed2.addConversion({
      from: 'string',
      to: 'number',
      convert: function (x: string) { return parseFloat(x); },
    });

    const fn = typed2({
      '...number': function (values: number[]) {
        return values;
      },

      '...string': function (value: string[]) {
        return value;
      },
    });

    expect(fn(2, 3)).toEqual([2, 3]);
    expect(fn(2)).toEqual([2]);
    expect(fn(2, '4')).toEqual([2, 4]);
    expect(fn('2', 4)).toEqual([2, 4]);
    expect(fn('foo')).toEqual(['foo']);
    expect(Object.keys(fn.signatures)).toEqual(['...number', '...string']);
  });

  it('should throw an error in case of unexpected rest parameters', () => {
    expect(() => {
      typed({ '...number, string': function () {} });
    }).toThrow(/Unexpected rest parameter "...number": only allowed for the last parameter/);
  });

  it('should correctly interact with any', () => {
    const fn = typed({
      string: function () {
        return 'one';
      },
      '...any': function () {
        return 'two';
      },
    });

    expect(fn('a')).toBe('one');
    expect(fn([])).toBe('two');
    expect(fn('a', 'a')).toBe('two');
    expect(fn('a', [])).toBe('two');
    expect(fn([], [])).toBe('two');
  });
});
