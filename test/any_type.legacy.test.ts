/**
 * Any type tests ported from any_type.test.mjs
 * Tests for 'any' type handling in typed functions
 */

import { describe, it, expect } from 'vitest';
import typed from '../src/index.js';

describe('any type (legacy)', () => {
  it('should compose a function with one any type argument', () => {
    const fn = typed({
      any: function (value: unknown) {
        return 'any:' + value;
      },
      string: function (value: string) {
        return 'string:' + value;
      },
      boolean: function (value: boolean) {
        return 'boolean:' + value;
      },
    });

    expect(fn.signatures).toBeInstanceOf(Object);
    expect(Object.keys(fn.signatures).length).toBe(3);
    expect(fn(2)).toBe('any:2');
    expect(fn([1, 2, 3])).toBe('any:1,2,3');
    expect(fn('foo')).toBe('string:foo');
    expect(fn(false)).toBe('boolean:false');
  });

  it('should compose a function with multiple any type arguments (1)', () => {
    const fn = typed({
      'any,boolean': function () {
        return 'any,boolean';
      },
      'any,string': function () {
        return 'any,string';
      },
    });

    expect(fn.signatures).toBeInstanceOf(Object);
    expect(Object.keys(fn.signatures).length).toBe(2);
    expect(fn([], true)).toBe('any,boolean');
    expect(fn(2, 'foo')).toBe('any,string');
    expect(() => fn([], new Date())).toThrow(
      /Unexpected type of argument in function unnamed \(expected: string or boolean, actual: Date, index: 1\)/
    );
    expect(() => fn(2, 2)).toThrow(
      /Unexpected type of argument in function unnamed \(expected: string or boolean, actual: number, index: 1\)/
    );
    expect(() => fn(2)).toThrow(/Too few arguments in function unnamed \(expected: string or boolean, index: 1\)/);
  });

  it('should compose a function with multiple any type arguments (2)', () => {
    const fn = typed({
      'any,boolean': function () {
        return 'any,boolean';
      },
      'any,number': function () {
        return 'any,number';
      },
      'string,any': function () {
        return 'string,any';
      },
    });

    expect(fn.signatures).toBeInstanceOf(Object);
    expect(Object.keys(fn.signatures).length).toBe(3);
    expect(fn([], true)).toBe('any,boolean');
    expect(fn([], 2)).toBe('any,number');
    expect(fn('foo', 2)).toBe('string,any');
    expect(() => fn([], new Date())).toThrow(
      /Unexpected type of argument in function unnamed \(expected: number or boolean, actual: Date, index: 1\)/
    );
    expect(() => fn([], 'foo')).toThrow(
      /Unexpected type of argument in function unnamed \(expected: number or boolean, actual: string, index: 1\)/
    );
  });

  it('should compose a function with multiple any type arguments (3)', () => {
    const fn = typed({
      'string,any': function () {
        return 'string,any';
      },
      any: function () {
        return 'any';
      },
    });

    expect(fn.signatures).toBeInstanceOf(Object);
    expect(Object.keys(fn.signatures).length).toBe(2);
    expect('any' in fn.signatures).toBe(true);
    expect('string,any' in fn.signatures).toBe(true);
    expect(fn('foo', 2)).toBe('string,any');
    expect(fn([])).toBe('any');
    expect(fn('foo')).toBe('any');
    expect(() => fn()).toThrow(/Too few arguments in function unnamed \(expected: any, index: 0\)/);
    expect(() => fn([], 'foo')).toThrow(/Too many arguments in function unnamed \(expected: 1, actual: 2\)/);
    expect(() => fn('foo', 4, [])).toThrow(/Too many arguments in function unnamed \(expected: 2, actual: 3\)/);
  });

  it('should compose a function with multiple any type arguments (4)', () => {
    const fn = typed('fn1', {
      'number,number': function () {
        return 'number,number';
      },
      'any,string': function () {
        return 'any,string';
      },
    });

    expect(fn.signatures).toBeInstanceOf(Object);
    expect(Object.keys(fn.signatures).length).toBe(2);
    expect(fn(2, 2)).toBe('number,number');
    expect(fn(2, 'foo')).toBe('any,string');
    expect(() => fn('foo')).toThrow(/Too few arguments in function fn1 \(expected: string, index: 1\)/);
    expect(() => fn(1, 2, 3)).toThrow(/Too many arguments in function fn1 \(expected: 2, actual: 3\)/);
  });

  it('should compose a function with multiple any type arguments (5)', () => {
    const fn = typed({
      'string,string': function () {
        return 'string,string';
      },
      any: function () {
        return 'any';
      },
    });

    expect(fn.signatures).toBeInstanceOf(Object);
    expect(Object.keys(fn.signatures).length).toBe(2);
    expect(fn('foo', 'bar')).toBe('string,string');
    expect(fn([])).toBe('any');
    expect(fn('foo')).toBe('any');
    expect(() => fn('foo', 'bar', 5)).toThrow(/Too many arguments in function unnamed \(expected: 2, actual: 3\)/);
    expect(() => fn('foo', 2, 5)).toThrow(
      /Unexpected type of argument in function unnamed \(expected: string, actual: number, index: 1\)/
    );
    expect(() => fn('foo', 'bar', 5)).toThrow(/Too many arguments in function unnamed \(expected: 2, actual: 3\)/);
  });

  it('var arg any type arguments should only handle unmatched types', () => {
    const fn = typed({
      'Array,string': function () {
        return 'Array,string';
      },
      '...': function () {
        return 'any';
      },
    });

    expect(fn([], 'foo')).toBe('Array,string');
    expect(fn([], 'foo', 'bar')).toBe('any');
    expect(fn('string')).toBe('any');
    expect(fn(2)).toBe('any');
    expect(fn(2, 3, 4)).toBe('any');
    expect(fn([])).toBe('any');
    expect(() => fn()).toThrow(/Too few arguments in function unnamed \(expected: any, index: 0\)/);
  });

  it('multiple use of any', () => {
    const fn = typed({
      'number,number': function () {
        return 'numbers';
      },
      'any,any': function () {
        return 'any';
      },
    });

    expect(fn.signatures).toBeInstanceOf(Object);
    expect(Object.keys(fn.signatures).length).toBe(2);
    expect(fn('a', 'b')).toBe('any');
    expect(fn(1, 1)).toBe('numbers');
    expect(fn(1, 'b')).toBe('any');
    expect(fn('a', 1)).toBe('any');
  });

  it('use one any in combination with vararg', () => {
    const fn = typed({
      number: function () {
        return 'numbers';
      },
      'any,...any': function () {
        return 'any';
      },
    });

    expect(fn.signatures).toBeInstanceOf(Object);
    expect(Object.keys(fn.signatures).length).toBe(2);
    expect(fn('a', 'b')).toBe('any');
    expect(fn(1)).toBe('numbers');
    expect(fn(1, 'b')).toBe('any');
    expect(fn('a', 2)).toBe('any');
    expect(fn(1, 2)).toBe('any');
    expect(fn(1, 2, 3)).toBe('any');
  });

  it('use multi-layered any in combination with vararg', () => {
    const fn = typed({
      'number,number': function () {
        return 'numbers';
      },
      'any,any,...any': function () {
        return 'any';
      },
    });

    expect(fn.signatures).toBeInstanceOf(Object);
    expect(Object.keys(fn.signatures).length).toBe(2);
    expect(fn('a', 'b', 'c')).toBe('any');
    expect(fn(1, 2)).toBe('numbers');
    expect(fn(1, 'b', 2)).toBe('any');
    expect(fn('a', 2, 3)).toBe('any');
    expect(fn(1, 2, 3)).toBe('any');
  });

  it('should permit multi-layered use of any', () => {
    const fn = typed({
      'any,any': function () {
        return 'two';
      },
      'number,number,string': function () {
        return 'three';
      },
    });

    expect(fn.signatures).toBeInstanceOf(Object);
    expect(Object.keys(fn.signatures).length).toBe(2);
    expect(fn('a', 'b')).toBe('two');
    expect(fn(1, 1)).toBe('two');
    expect(fn(1, 1, 'a')).toBe('three');
    expect(() => fn(1, 1, 1)).toThrow(
      /Unexpected type of argument in function unnamed \(expected: string, actual: number, index: 2\)/
    );
  });
});
