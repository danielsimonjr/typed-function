/**
 * Compose tests ported from compose.test.mjs
 * Tests for composing typed functions
 */

import { describe, it, expect } from 'vitest';
import typed from '../src/index.js';

describe('compose (legacy)', () => {
  it('should create a composed function with multiple types per argument', () => {
    const fn = typed({
      'string | number, boolean': function () {
        return 'A';
      },
      'boolean, boolean | number': function () {
        return 'B';
      },
      string: function () {
        return 'C';
      },
    });

    expect(fn('str', false)).toBe('A');
    expect(fn(2, true)).toBe('A');
    expect(fn(false, true)).toBe('B');
    expect(fn(false, 2)).toBe('B');
    expect(fn('str')).toBe('C');
    expect(() => fn()).toThrow(/Too few arguments in function unnamed \(expected: string or number or boolean, index: 0\)/);
    expect(() => fn(1, 2, 3)).toThrow(
      /Unexpected type of argument in function unnamed \(expected: boolean, actual: number, index: 1\)/
    );
    expect(() => fn('str', 2)).toThrow(
      /Unexpected type of argument in function unnamed \(expected: boolean, actual: number, index: 1\)/
    );
    expect(() => fn(true, 'str')).toThrow(
      /Unexpected type of argument in function unnamed \(expected: number or boolean, actual: string, index: 1\)/
    );
    expect(() => fn(2, 3)).toThrow(
      /Unexpected type of argument in function unnamed \(expected: boolean, actual: number, index: 1\)/
    );
    expect(() => fn(2, 'str')).toThrow(
      /Unexpected type of argument in function unnamed \(expected: boolean, actual: string, index: 1\)/
    );
  });

  it('should compose a function with one argument', () => {
    const signatures = {
      number: function (value: number) {
        return 'number:' + value;
      },
      string: function (value: string) {
        return 'string:' + value;
      },
      boolean: function (value: boolean) {
        return 'boolean:' + value;
      },
    };
    const fn = typed(signatures);

    expect(fn(2)).toBe('number:2');
    expect(fn('foo')).toBe('string:foo');
    expect(fn(false)).toBe('boolean:false');
    expect(fn.signatures).toBeInstanceOf(Object);
    expect(Object.keys(fn.signatures).length).toBe(3);
    expect(fn.signatures.number).toBe(signatures.number);
    expect(fn.signatures.string).toBe(signatures.string);
    expect(fn.signatures.boolean).toBe(signatures.boolean);
  });

  it('should compose a function with multiple arguments', () => {
    const signatures = {
      number: function (value: number) {
        return 'number:' + value;
      },
      string: function (value: string) {
        return 'string:' + value;
      },
      'number, boolean': function (a: number, b: boolean) {
        // mind space after the comma, should be normalized by composer
        return 'number,boolean:' + a + ',' + b;
      },
    };
    const fn = typed(signatures);

    expect(fn(2)).toBe('number:2');
    expect(fn('foo')).toBe('string:foo');
    expect(fn(2, false)).toBe('number,boolean:2,false');
    expect(fn.signatures).toBeInstanceOf(Object);
    expect(Object.keys(fn.signatures).length).toBe(3);
    expect(fn.signatures.number).toBe(signatures.number);
    expect(fn.signatures.string).toBe(signatures.string);
    expect(fn.signatures['number,boolean']).toBe(signatures['number, boolean']);
  });
});
