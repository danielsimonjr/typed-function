/**
 * Convert tests ported from convert.test.mjs
 * Tests for typed.convert() functionality
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import typed from '../src/index.js';

describe('convert (legacy)', () => {
  beforeAll(() => {
    typed.addConversions([
      { from: 'boolean', to: 'number', convert: function (x: boolean) { return +x; } },
      { from: 'boolean', to: 'string', convert: function (x: boolean) { return x + ''; } },
      { from: 'number', to: 'string', convert: function (x: number) { return x + ''; } },
      {
        from: 'string',
        to: 'Date',
        convert: function (x: string) {
          const d = new Date(x);
          return isNaN(d.valueOf()) ? undefined : d;
        },
        fallible: true, // TODO: not yet supported
      },
    ]);
  });

  afterAll(() => {
    // cleanup conversions
    typed.clearConversions();
  });

  it('should convert a value', () => {
    expect(typed.convert(2, 'string')).toBe('2');
    expect(typed.convert(true, 'string')).toBe('true');
    expect(typed.convert(true, 'number')).toBe(1);
  });

  it('should return same value when conversion is not needed', () => {
    expect(typed.convert(2, 'number')).toBe(2);
    expect(typed.convert(true, 'boolean')).toBe(true);
  });

  it('should throw an error when an unknown type is requested', () => {
    expect(() => typed.convert(2, 'foo')).toThrow(/Unknown type.*foo/);
  });

  it('should throw an error when no conversion function is found', () => {
    expect(() => typed.convert(2, 'boolean')).toThrow(/no conversions to boolean/);
    expect(() => typed.convert(null, 'string')).toThrow(/Cannot convert null to string/);
  });

  it('should pick the right conversion function when a value matches multiple types', () => {
    // based on https://github.com/josdejong/typed-function/issues/128
    const typed2 = typed.create();

    typed2.clear();
    typed2.addTypes([
      {
        name: 'number',
        test: (x: unknown) => typeof x === 'number',
      },
      {
        name: 'identifier',
        test: (x: unknown) => typeof x === 'string' && /^\p{Alphabetic}[\d\p{Alphabetic}]*$/u.test(x),
      },
      {
        name: 'string',
        test: (x: unknown) => typeof x === 'string',
      },
      {
        name: 'boolean',
        test: (x: unknown) => typeof x === 'boolean',
      },
    ]);

    typed2.addConversion({ from: 'string', to: 'number', convert: (x: string) => parseFloat(x) });

    const check = typed2('check', {
      identifier: (i: string) => 'found an identifier: ' + i,
      string: (s: string) => s + ' is just a string',
    });

    expect(check('xy33')).toBe('found an identifier: xy33');
    expect(check('Wow!')).toBe('Wow! is just a string');

    expect(typed2.convert('123.5', 'number')).toBe(123.5);
    expect(typed2.convert('Infinity', 'number')).toBe(Infinity);

    const check2 = typed2({ boolean: () => 'yes' });
    expect(() => check2('x')).toThrow(/TypeError:.*identifier.?|.?string/);
  });
});
