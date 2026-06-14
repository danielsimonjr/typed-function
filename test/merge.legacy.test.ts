/**
 * Merge tests ported from merge.test.mjs
 * Tests for merging typed functions
 */

import { describe, it, expect } from 'vitest';
import typed from '../src/index.js';

describe('merge (legacy)', () => {
  it('should merge two typed-functions', () => {
    const typed1 = typed({ boolean: function (value: boolean) { return 'boolean:' + value; } });
    const typed2 = typed({ number: function (value: number) { return 'number:' + value; } });

    const typed3 = typed(typed1, typed2);

    expect(Object.keys(typed3.signatures).sort()).toEqual(['boolean', 'number']);

    expect(typed3(true)).toBe('boolean:true');
    expect(typed3(2)).toBe('number:2');
    expect(() => typed3('foo')).toThrow(
      /Unexpected type of argument in function unnamed \(expected: number or boolean, actual: string, index: 0\)/
    );
  });

  it('should merge three typed-functions', () => {
    const typed1 = typed({ boolean: function (value: boolean) { return 'boolean:' + value; } });
    const typed2 = typed({ number: function (value: number) { return 'number:' + value; } });
    const typed3 = typed({ string: function (value: string) { return 'string:' + value; } });

    const typed4 = typed(typed1, typed2, typed3);

    expect(Object.keys(typed4.signatures).sort()).toEqual(['boolean', 'number', 'string']);

    expect(typed4(true)).toBe('boolean:true');
    expect(typed4(2)).toBe('number:2');
    expect(typed4('foo')).toBe('string:foo');
    expect(() => typed4(new Date())).toThrow(
      /Unexpected type of argument in function unnamed \(expected: number or string or boolean, actual: Date, index: 0\)/
    );
  });

  it('should merge two typed-functions with a custom name', () => {
    const typed1 = typed('typed1', { boolean: function (value: boolean) { return 'boolean:' + value; } });
    const typed2 = typed('typed2', { number: function (value: number) { return 'number:' + value; } });

    const typed3 = typed('typed3', typed1, typed2);

    expect(typed3.name).toBe('typed3');
  });

  it('should merge a typed function with an object of signatures', () => {
    const typed1 = typed({ boolean: (b: boolean) => !b, string: (s: string) => '!' + s });
    const typed2 = typed(typed1, { number: (n: number) => 1 - n });

    expect(typed2(true)).toBe(false);
    expect(typed2('true')).toBe('!true');
    expect(typed2(1)).toBe(0);
  });

  it('should merge two objects of signatures', () => {
    const typed1 = typed(
      { boolean: (b: boolean) => !b, string: (s: string) => '!' + s },
      { number: (n: number) => 1 - n }
    );

    expect(typed1(true)).toBe(false);
    expect(typed1('true')).toBe('!true');
    expect(typed1(1)).toBe(0);
  });

  it('should not copy conversions as exact signatures', () => {
    const typed2 = typed.create();
    typed2.addConversion({
      from: 'string',
      to: 'number',
      convert: function (x: string) { return parseFloat(x); },
    });

    const fn2 = typed2({ number: function (value: number) { return value; } });

    expect(fn2(2)).toBe(2);
    expect(fn2('123')).toBe(123);

    const fn1 = typed({ Date: function (value: Date) { return value; } });
    const fn3 = typed(fn1, fn2); // create via typed which has no conversions

    const date = new Date();
    expect(fn3(2)).toBe(2);
    expect(fn3(date)).toBe(date);
    expect(() => fn3('123')).toThrow(
      /Unexpected type of argument in function unnamed \(expected: number or Date, actual: string, index: 0\)/
    );
  });

  it('should allow merging duplicate signatures when pointing to the same function', () => {
    const typed1 = typed({ boolean: function (value: boolean) { return 'boolean:' + value; } });

    const merged = typed(typed1, typed1);

    expect(Object.keys(merged.signatures).sort()).toEqual(['boolean']);
  });

  it('should throw an error in case of conflicting signatures when merging', () => {
    const typed1 = typed({ boolean: function (value: boolean) { return 'boolean:' + value; } });
    const typed2 = typed({ boolean: function (value: boolean) { return 'boolean:' + value; } });

    expect(() => {
      typed(typed1, typed2);
    }).toThrow(/Signature "boolean" is defined twice/);
  });

  it('should throw an error in case of conflicting names when merging', () => {
    const typed1 = typed('fn1', { boolean: function () {} });
    const typed2 = typed('fn2', { string: function () {} });
    const typed3 = typed({ number: function () {} });

    expect(() => {
      typed(typed1, typed2);
    }).toThrow(/Function names do not match \(expected: fn1, actual: fn2\)/);

    const typed4 = typed(typed2, typed3);
    expect(typed4.name).toBe('fn2');
  });

  it('should be able to use referTo when merging signatures from multiple typed-functions', () => {
    function add1(a: number, b: number) {
      return 'add1:' + (a + b);
    }

    function add2(a: number, b: number) {
      return 'add2:' + (a + b);
    }

    const fn1 = typed({
      'number,number': add1,
      string: typed.referTo('number,number', (fnNumberNumber) => {
        return function (valuesString: string) {
          const values = valuesString.split(',').map(Number);
          return fnNumberNumber.apply(null, values as [number, number]);
        };
      }),
    });

    const fn2 = typed({
      'number,number': add2,
    });

    expect(fn1('2,3')).toBe('add1:5');
    expect(fn2(2, 3)).toBe('add2:5');

    const fn3 = typed({
      ...fn1.signatures,
      ...fn2.signatures, // <-- will override the 'number,number' signature of fn1 with the one of fn2
    });

    expect(fn3('2,3')).toBe('add2:5');
  });

  it('should be able to use referToSelf across merged signatures', () => {
    const fn1 = typed({
      '...number': function (values: number[]) {
        let sum = 0;
        for (let i = 0; i < values.length; i++) {
          sum += values[i];
        }
        return sum;
      },
    });

    const fn2 = typed({
      '...string': typed.referToSelf((self) => {
        return function (values: string[]) {
          expect(self).toBe(fn3); // only holds after merging fn1 and fn2

          const newValues: number[] = [];
          for (let i = 0; i < values.length; i++) {
            newValues[i] = parseInt(values[i], 10);
          }
          return self.apply(null, newValues);
        };
      }),
    });

    const fn3 = typed(fn1, fn2);

    // Both return numbers since fn1's ...number signature returns sum (a number)
    expect(fn3('1', '2', '3')).toBe(6);
    expect(fn3(1, 2, 3)).toBe(6);
  });
});
