/**
 * Compatibility test suite for typed-function
 *
 * These tests verify API compatibility with the original typed-function library,
 * ensuring that the TypeScript refactor maintains backward compatibility.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import typed from '../src/index.js';

describe('API Compatibility', () => {
  describe('typed() function', () => {
    it('should be callable as a function', () => {
      expect(typeof typed).toBe('function');
    });

    it('should accept a signature object', () => {
      const fn = typed({ number: (x: number) => x });
      expect(typeof fn).toBe('function');
    });

    it('should accept a name and signature object', () => {
      const fn = typed('myFn', { number: (x: number) => x });
      expect(fn.name).toBe('myFn');
    });

    it('should accept multiple signature objects (merge)', () => {
      const fn = typed(
        { number: (x: number) => 'number' },
        { string: (x: string) => 'string' }
      );
      expect(fn(1)).toBe('number');
      expect(fn('a')).toBe('string');
    });

    it('should accept typed functions (merge)', () => {
      const fn1 = typed({ number: (x: number) => 'number' });
      const fn2 = typed({ string: (x: string) => 'string' });
      const fn3 = typed(fn1, fn2);

      expect(fn3(1)).toBe('number');
      expect(fn3('a')).toBe('string');
    });
  });

  describe('typed.create()', () => {
    it('should create an isolated typed instance', () => {
      const typed2 = typed.create();
      expect(typeof typed2).toBe('function');
      expect(typed2).not.toBe(typed);
    });

    it('should have independent type registries', () => {
      const typed2 = typed.create();
      typed2.addType({
        name: 'SpecialType',
        test: (x: unknown) => x !== null && typeof x === 'object' && 'special' in x,
      });

      // typed2 should recognize SpecialType
      const fn2 = typed2({ SpecialType: () => 'special' });
      expect(fn2({ special: true })).toBe('special');

      // Default typed should not recognize SpecialType
      expect(() => typed({ SpecialType: () => 'fail' })).toThrow();
    });

    it('should have independent conversion managers', () => {
      const typed2 = typed.create();
      typed2.addConversion({
        from: 'string',
        to: 'number',
        convert: (s: string) => parseFloat(s),
      });

      const fn2 = typed2({ number: (x: number) => x * 2 });
      expect(fn2('5')).toBe(10);

      // Default typed should not have this conversion
      const fn1 = typed({ number: (x: number) => x * 2 });
      expect(() => fn1('5')).toThrow();
    });
  });

  describe('typed.addType()', () => {
    it('should add a custom type', () => {
      const typed2 = typed.create();
      // Add 'positive' before 'number' so it takes precedence
      typed2.addTypes([{
        name: 'positive',
        test: (x: unknown) => typeof x === 'number' && x > 0,
      }], 'number');

      const fn = typed2({
        positive: (x: number) => 'positive: ' + x,
        number: (x: number) => 'number: ' + x,
      });

      expect(fn(5)).toBe('positive: 5');
      expect(fn(-5)).toBe('number: -5');
      expect(fn(0)).toBe('number: 0');
    });

    it('should respect beforeObjectTest parameter', () => {
      const typed2 = typed.create();

      // Add type that should be tested before Object
      typed2.addType({
        name: 'SpecialObj',
        test: (x: unknown) => x !== null && typeof x === 'object' && 'marker' in x,
      }, true);

      const fn = typed2({
        SpecialObj: () => 'special',
        Object: () => 'object',
      });

      expect(fn({ marker: true })).toBe('special');
      expect(fn({})).toBe('object');
    });
  });

  describe('typed.addTypes()', () => {
    it('should add multiple types at once', () => {
      const typed2 = typed.create();
      typed2.addTypes([
        { name: 'even', test: (x: unknown) => typeof x === 'number' && x % 2 === 0 },
        { name: 'odd', test: (x: unknown) => typeof x === 'number' && x % 2 !== 0 },
      ], 'number');

      const fn = typed2({
        even: (x: number) => 'even: ' + x,
        odd: (x: number) => 'odd: ' + x,
      });

      expect(fn(2)).toBe('even: 2');
      expect(fn(3)).toBe('odd: 3');
    });
  });

  describe('typed.addConversion()', () => {
    it('should add a type conversion', () => {
      const typed2 = typed.create();
      typed2.addConversion({
        from: 'string',
        to: 'number',
        convert: (s: string) => parseFloat(s),
      });

      const fn = typed2({ number: (x: number) => x + 1 });
      expect(fn(5)).toBe(6);
      expect(fn('5')).toBe(6);
    });
  });

  describe('typed.addConversions()', () => {
    it('should add multiple conversions at once', () => {
      const typed2 = typed.create();
      typed2.addConversions([
        { from: 'string', to: 'number', convert: (s: string) => parseFloat(s) },
        { from: 'boolean', to: 'number', convert: (b: boolean) => b ? 1 : 0 },
      ]);

      const fn = typed2({ number: (x: number) => x * 2 });
      expect(fn(5)).toBe(10);
      expect(fn('5')).toBe(10);
      expect(fn(true)).toBe(2);
      expect(fn(false)).toBe(0);
    });
  });

  describe('typed.removeConversion()', () => {
    it('should remove a conversion', () => {
      const typed2 = typed.create();
      const conv = {
        from: 'string',
        to: 'number',
        convert: (s: string) => parseFloat(s),
      };
      typed2.addConversion(conv);

      const fn1 = typed2({ number: (x: number) => x });
      expect(fn1('5')).toBe(5);

      typed2.removeConversion(conv);

      const fn2 = typed2({ number: (x: number) => x });
      expect(() => fn2('5')).toThrow();
    });
  });

  describe('typed.clearConversions()', () => {
    it('should clear all conversions', () => {
      const typed2 = typed.create();
      typed2.addConversion({
        from: 'string',
        to: 'number',
        convert: (s: string) => parseFloat(s),
      });
      typed2.addConversion({
        from: 'boolean',
        to: 'number',
        convert: (b: boolean) => b ? 1 : 0,
      });

      typed2.clearConversions();

      const fn = typed2({ number: (x: number) => x });
      expect(() => fn('5')).toThrow();
      expect(() => fn(true)).toThrow();
    });
  });

  describe('typed.clear()', () => {
    it('should clear types and conversions', () => {
      const typed2 = typed.create();
      typed2.addType({ name: 'custom', test: () => true });
      typed2.addConversion({
        from: 'string',
        to: 'number',
        convert: (s: string) => parseFloat(s),
      });

      typed2.clear();

      // After clear, no types should exist
      expect(() => typed2({ number: () => {} })).toThrow();
    });
  });

  describe('typed.referTo()', () => {
    it('should reference another signature', () => {
      const fn = typed({
        'number, number': (a: number, b: number) => a + b,
        string: typed.referTo('number, number', (add) => {
          return (s: string) => {
            const nums = s.split(',').map(Number);
            return add(nums[0]!, nums[1]!);
          };
        }),
      });

      expect(fn(1, 2)).toBe(3);
      expect(fn('3,4')).toBe(7);
    });

    it('should reference multiple signatures', () => {
      const fn = typed({
        number: (x: number) => x,
        string: (s: string) => s.length,
        Array: typed.referTo('number', 'string', (numFn, strFn) => {
          return (arr: unknown[]) => {
            return arr.map((x) =>
              typeof x === 'number' ? numFn(x) : strFn(String(x))
            );
          };
        }),
      });

      expect(fn([1, 'hi', 3])).toEqual([1, 2, 3]);
    });
  });

  describe('typed.referToSelf()', () => {
    it('should reference the typed function itself', () => {
      const fn = typed({
        number: (x: number) => x * 2,
        string: typed.referToSelf((self) => {
          return (s: string) => self(parseInt(s, 10));
        }),
      });

      expect(fn(5)).toBe(10);
      expect(fn('7')).toBe(14);
    });
  });

  describe('typed.convert()', () => {
    it('should convert a value to a target type', () => {
      const typed2 = typed.create();
      typed2.addConversion({
        from: 'string',
        to: 'number',
        convert: (s: string) => parseFloat(s),
      });

      expect(typed2.convert('42', 'number')).toBe(42);
    });
  });

  describe('typed.find()', () => {
    it('should find a specific signature implementation', () => {
      const fn = typed({
        number: (x: number) => x * 2,
        string: (s: string) => s.length,
      });

      const numImpl = typed.find(fn, 'number');
      expect(numImpl(5)).toBe(10);

      const strImpl = typed.find(fn, 'string');
      expect(strImpl('hello')).toBe(5);
    });
  });

  describe('typed.findSignature()', () => {
    it('should find a signature object', () => {
      const fn = typed({
        number: (x: number) => x,
        string: (s: string) => s,
      });

      const sig = typed.findSignature(fn, 'number');
      expect(sig).toBeDefined();
      expect(sig.params).toHaveLength(1);
    });
  });

  describe('typed.resolve()', () => {
    it('should resolve matching signature for arguments', () => {
      const fn = typed({
        number: (x: number) => x,
        string: (s: string) => s,
      });

      const numSig = typed.resolve(fn, [42]);
      expect(numSig).not.toBeNull();
      expect(numSig!.params).toHaveLength(1);

      const strSig = typed.resolve(fn, ['hello']);
      expect(strSig).not.toBeNull();

      const noMatch = typed.resolve(fn, [true]);
      expect(noMatch).toBeNull();
    });
  });

  describe('typed.isTypedFunction()', () => {
    it('should detect typed functions', () => {
      const fn = typed({ number: (x: number) => x });
      expect(typed.isTypedFunction(fn)).toBe(true);
    });

    it('should return false for regular functions', () => {
      const fn = (x: number) => x;
      expect(typed.isTypedFunction(fn)).toBe(false);
    });

    it('should return false for non-functions', () => {
      expect(typed.isTypedFunction({})).toBe(false);
      expect(typed.isTypedFunction(null)).toBe(false);
      expect(typed.isTypedFunction(42)).toBe(false);
    });
  });

  describe('typed.createCount', () => {
    it('should be a number', () => {
      expect(typeof typed.createCount).toBe('number');
    });

    it('should increment when creating typed functions', () => {
      const typed2 = typed.create();
      const initial = typed2.createCount;

      typed2({ number: () => {} });
      expect(typed2.createCount).toBe(initial + 1);

      typed2({ string: () => {} });
      expect(typed2.createCount).toBe(initial + 2);
    });
  });

  describe('typed.onMismatch', () => {
    it('should be assignable', () => {
      const typed2 = typed.create();
      typed2.onMismatch = () => 'custom';
      expect(typed2.onMismatch).toBeDefined();
    });

    it('should be called on type mismatch', () => {
      const typed2 = typed.create();
      let called = false;
      typed2.onMismatch = () => {
        called = true;
        return 'handled';
      };

      const fn = typed2({ number: (x: number) => x });
      const result = fn('not a number');

      expect(called).toBe(true);
      expect(result).toBe('handled');
    });
  });

  describe('typed.throwMismatchError', () => {
    it('should be the default mismatch handler', () => {
      expect(typed.throwMismatchError).toBeDefined();
      expect(typeof typed.throwMismatchError).toBe('function');
    });
  });

  describe('typed.createError()', () => {
    it('should create a TypeError with data property', () => {
      const fn = typed({ number: (x: number) => x });
      const sig = typed.findSignature(fn, 'number');

      const err = typed.createError('testFn', ['bad'], [sig]);

      expect(err).toBeInstanceOf(TypeError);
      expect((err as Error & { data?: unknown }).data).toBeDefined();
    });
  });

  describe('typed.warnAgainstDeprecatedThis', () => {
    it('should be a boolean', () => {
      expect(typeof typed.warnAgainstDeprecatedThis).toBe('boolean');
    });

    it('should be assignable', () => {
      const typed2 = typed.create();
      typed2.warnAgainstDeprecatedThis = false;
      expect(typed2.warnAgainstDeprecatedThis).toBe(false);
    });
  });
});

describe('Typed Function Properties', () => {
  describe('.signatures', () => {
    it('should be an object', () => {
      const fn = typed({ number: (x: number) => x });
      expect(typeof fn.signatures).toBe('object');
    });

    it('should contain signature functions', () => {
      const numFn = (x: number) => x;
      const fn = typed({ number: numFn });

      expect(fn.signatures['number']).toBe(numFn);
    });

    it('should have keys matching signature strings', () => {
      const fn = typed({
        number: (x: number) => x,
        string: (s: string) => s,
        'number, string': (a: number, b: string) => `${a}${b}`,
      });

      expect('number' in fn.signatures).toBe(true);
      expect('string' in fn.signatures).toBe(true);
      expect('number,string' in fn.signatures).toBe(true);
    });
  });

  describe('.name', () => {
    it('should reflect the provided name', () => {
      const fn = typed('myFunction', { number: (x: number) => x });
      expect(fn.name).toBe('myFunction');
    });

    it('should be empty string for unnamed functions', () => {
      const fn = typed({ number: (x: number) => x });
      expect(fn.name).toBe('');
    });
  });
});

describe('Signature String Formats', () => {
  it('should support simple type names', () => {
    const fn = typed({
      number: () => 'number',
      string: () => 'string',
      boolean: () => 'boolean',
    });

    expect(fn(1)).toBe('number');
    expect(fn('a')).toBe('string');
    expect(fn(true)).toBe('boolean');
  });

  it('should support multiple parameters', () => {
    const fn = typed({
      'number, number': (a: number, b: number) => a + b,
      'string, string': (a: string, b: string) => a + b,
    });

    expect(fn(1, 2)).toBe(3);
    expect(fn('a', 'b')).toBe('ab');
  });

  it('should support union types with pipe', () => {
    const fn = typed({
      'number | string': (x: number | string) => typeof x,
    });

    expect(fn(1)).toBe('number');
    expect(fn('a')).toBe('string');
  });

  it('should support rest parameters with ...', () => {
    const fn = typed({
      '...number': (nums: number[]) => nums.reduce((a, b) => a + b, 0),
    });

    expect(fn(1, 2, 3)).toBe(6);
  });

  it('should support any type', () => {
    const fn = typed({
      any: (x: unknown) => 'any: ' + typeof x,
    });

    expect(fn(1)).toBe('any: number');
    expect(fn('a')).toBe('any: string');
    expect(fn(null)).toBe('any: object');
  });

  it('should support empty signature (no arguments)', () => {
    const fn = typed({
      '': () => 'no args',
    });

    expect(fn()).toBe('no args');
  });
});

describe('Type Precedence', () => {
  it('should match more specific types first', () => {
    const fn = typed({
      Array: () => 'array',
      Object: () => 'object',
    });

    expect(fn([])).toBe('array');
    expect(fn({})).toBe('object');
  });

  it('should match custom types before generic types', () => {
    const typed2 = typed.create();
    // Add NonEmptyArray before Array so it takes precedence
    typed2.addTypes([{
      name: 'NonEmptyArray',
      test: (x: unknown) => Array.isArray(x) && x.length > 0,
    }], 'Array');

    const fn = typed2({
      NonEmptyArray: () => 'non-empty',
      Array: () => 'empty or not array',
    });

    expect(fn([1, 2, 3])).toBe('non-empty');
    expect(fn([])).toBe('empty or not array');
  });
});

describe('Error Messages', () => {
  it('should include function name in error', () => {
    const fn = typed('myFunc', { number: (x: number) => x });

    expect(() => fn('bad')).toThrow(/myFunc/);
  });

  it('should include expected type in error', () => {
    const fn = typed({ number: (x: number) => x });

    expect(() => fn('bad')).toThrow(/expected: number/);
  });

  it('should include actual type in error', () => {
    const fn = typed({ number: (x: number) => x });

    expect(() => fn('bad')).toThrow(/actual: string/);
  });

  it('should include argument index in error', () => {
    const fn = typed({ 'number, number': (a: number, b: number) => a + b });

    expect(() => fn(1, 'bad')).toThrow(/index: 1/);
  });
});

describe('Edge Cases', () => {
  it('should handle null correctly', () => {
    const fn = typed({
      null: () => 'null',
      Object: () => 'object',
    });

    expect(fn(null)).toBe('null');
  });

  it('should handle undefined correctly', () => {
    const fn = typed({
      undefined: () => 'undefined',
      any: () => 'any',
    });

    expect(fn(undefined)).toBe('undefined');
  });

  it('should handle NaN as number', () => {
    const fn = typed({
      number: (x: number) => isNaN(x) ? 'nan' : 'number',
    });

    expect(fn(NaN)).toBe('nan');
  });

  it('should handle Infinity as number', () => {
    const fn = typed({
      number: (x: number) => isFinite(x) ? 'finite' : 'infinite',
    });

    expect(fn(Infinity)).toBe('infinite');
    expect(fn(-Infinity)).toBe('infinite');
  });

  it('should handle empty string', () => {
    const fn = typed({
      string: (s: string) => s.length,
    });

    expect(fn('')).toBe(0);
  });

  it('should handle zero', () => {
    const fn = typed({
      number: (x: number) => x === 0 ? 'zero' : 'nonzero',
    });

    expect(fn(0)).toBe('zero');
    expect(fn(-0)).toBe('zero');
  });
});
