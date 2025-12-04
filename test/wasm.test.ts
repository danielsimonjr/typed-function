/**
 * WASM-specific tests for typed-function
 * Tests type masks, fallback dispatch, and WASM bindings
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  TYPE_NUMBER,
  TYPE_STRING,
  TYPE_BOOLEAN,
  TYPE_FUNCTION,
  TYPE_ARRAY,
  TYPE_DATE,
  TYPE_REGEXP,
  TYPE_OBJECT,
  TYPE_NULL,
  TYPE_UNDEFINED,
  TYPE_ANY_MASK,
  getTypeBit,
  getTypeMaskForName,
  getTypeMaskForValue,
  getParamMask,
  getArgMasks,
  typeMatches,
  resetTypeMasks,
  registerCustomType,
  maskToTypeNames,
} from '../src/wasm/type-masks.js';
import {
  fallbackAddSignature,
  fallbackDispatchFind,
  fallbackGetFunction,
  fallbackClear,
  fallbackClearCache,
  fallbackGetSignatureCount,
  fallbackGetCacheStats,
  fallbackGetBuiltinMask,
  TYPE_ANY,
} from '../src/wasm/fallback.js';

describe('Type Masks', () => {
  beforeEach(() => {
    resetTypeMasks();
  });

  describe('built-in type IDs', () => {
    it('should have correct bit positions for built-in types', () => {
      expect(TYPE_NUMBER).toBe(0);
      expect(TYPE_STRING).toBe(1);
      expect(TYPE_BOOLEAN).toBe(2);
      expect(TYPE_FUNCTION).toBe(3);
      expect(TYPE_ARRAY).toBe(4);
      expect(TYPE_DATE).toBe(5);
      expect(TYPE_REGEXP).toBe(6);
      expect(TYPE_OBJECT).toBe(7);
      expect(TYPE_NULL).toBe(8);
      expect(TYPE_UNDEFINED).toBe(9);
    });

    it('should have correct any mask', () => {
      expect(TYPE_ANY_MASK).toBe(0xffffffff);
    });
  });

  describe('getTypeBit', () => {
    it('should return correct bits for built-in types', () => {
      expect(getTypeBit('number')).toBe(TYPE_NUMBER);
      expect(getTypeBit('string')).toBe(TYPE_STRING);
      expect(getTypeBit('boolean')).toBe(TYPE_BOOLEAN);
      expect(getTypeBit('Function')).toBe(TYPE_FUNCTION);
      expect(getTypeBit('Array')).toBe(TYPE_ARRAY);
      expect(getTypeBit('Date')).toBe(TYPE_DATE);
      expect(getTypeBit('RegExp')).toBe(TYPE_REGEXP);
      expect(getTypeBit('Object')).toBe(TYPE_OBJECT);
      expect(getTypeBit('null')).toBe(TYPE_NULL);
      expect(getTypeBit('undefined')).toBe(TYPE_UNDEFINED);
    });

    it('should return -1 for any type', () => {
      expect(getTypeBit('any')).toBe(-1);
    });

    it('should assign new bits for custom types', () => {
      const bit1 = getTypeBit('CustomType1');
      const bit2 = getTypeBit('CustomType2');

      expect(bit1).toBeGreaterThanOrEqual(10);
      expect(bit2).toBe(bit1 + 1);
    });

    it('should return same bit for same custom type', () => {
      const bit1 = getTypeBit('MyType');
      const bit2 = getTypeBit('MyType');

      expect(bit1).toBe(bit2);
    });
  });

  describe('getTypeMaskForName', () => {
    it('should return correct masks for built-in types', () => {
      expect(getTypeMaskForName('number')).toBe(1 << TYPE_NUMBER);
      expect(getTypeMaskForName('string')).toBe(1 << TYPE_STRING);
      expect(getTypeMaskForName('boolean')).toBe(1 << TYPE_BOOLEAN);
      expect(getTypeMaskForName('Array')).toBe(1 << TYPE_ARRAY);
    });

    it('should return ANY_MASK for any type', () => {
      expect(getTypeMaskForName('any')).toBe(TYPE_ANY_MASK);
    });

    it('should return correct mask for custom types', () => {
      const bit = getTypeBit('MyCustom');
      expect(getTypeMaskForName('MyCustom')).toBe(1 << bit);
    });
  });

  describe('getTypeMaskForValue', () => {
    it('should return correct mask for null', () => {
      expect(getTypeMaskForValue(null)).toBe(1 << TYPE_NULL);
    });

    it('should return correct mask for undefined', () => {
      expect(getTypeMaskForValue(undefined)).toBe(1 << TYPE_UNDEFINED);
    });

    it('should return correct mask for number', () => {
      expect(getTypeMaskForValue(42)).toBe(1 << TYPE_NUMBER);
      expect(getTypeMaskForValue(3.14)).toBe(1 << TYPE_NUMBER);
      expect(getTypeMaskForValue(NaN)).toBe(1 << TYPE_NUMBER);
      expect(getTypeMaskForValue(Infinity)).toBe(1 << TYPE_NUMBER);
    });

    it('should return correct mask for string', () => {
      expect(getTypeMaskForValue('hello')).toBe(1 << TYPE_STRING);
      expect(getTypeMaskForValue('')).toBe(1 << TYPE_STRING);
    });

    it('should return correct mask for boolean', () => {
      expect(getTypeMaskForValue(true)).toBe(1 << TYPE_BOOLEAN);
      expect(getTypeMaskForValue(false)).toBe(1 << TYPE_BOOLEAN);
    });

    it('should return correct mask for function', () => {
      expect(getTypeMaskForValue(() => {})).toBe(1 << TYPE_FUNCTION);
      expect(getTypeMaskForValue(function() {})).toBe(1 << TYPE_FUNCTION);
    });

    it('should return correct mask for array', () => {
      expect(getTypeMaskForValue([])).toBe(1 << TYPE_ARRAY);
      expect(getTypeMaskForValue([1, 2, 3])).toBe(1 << TYPE_ARRAY);
    });

    it('should return correct mask for Date', () => {
      expect(getTypeMaskForValue(new Date())).toBe(1 << TYPE_DATE);
    });

    it('should return correct mask for RegExp', () => {
      expect(getTypeMaskForValue(/test/)).toBe(1 << TYPE_REGEXP);
      expect(getTypeMaskForValue(new RegExp('test'))).toBe(1 << TYPE_REGEXP);
    });

    it('should return correct mask for plain object', () => {
      expect(getTypeMaskForValue({})).toBe(1 << TYPE_OBJECT);
      expect(getTypeMaskForValue({ a: 1 })).toBe(1 << TYPE_OBJECT);
    });
  });

  describe('getParamMask', () => {
    it('should return ANY_MASK for empty array', () => {
      expect(getParamMask([])).toBe(TYPE_ANY_MASK);
    });

    it('should return single type mask', () => {
      expect(getParamMask(['number'])).toBe(1 << TYPE_NUMBER);
    });

    it('should combine multiple type masks', () => {
      const mask = getParamMask(['number', 'string']);
      expect(mask).toBe((1 << TYPE_NUMBER) | (1 << TYPE_STRING));
    });

    it('should return ANY_MASK if any is included', () => {
      expect(getParamMask(['number', 'any', 'string'])).toBe(TYPE_ANY_MASK);
    });
  });

  describe('getArgMasks', () => {
    it('should return array of masks for arguments', () => {
      const args = [42, 'hello', true];
      const masks = getArgMasks(args);

      expect(masks).toHaveLength(3);
      expect(masks[0]).toBe(1 << TYPE_NUMBER);
      expect(masks[1]).toBe(1 << TYPE_STRING);
      expect(masks[2]).toBe(1 << TYPE_BOOLEAN);
    });

    it('should handle empty arguments', () => {
      expect(getArgMasks([])).toHaveLength(0);
    });
  });

  describe('typeMatches', () => {
    it('should match when value mask is set in param mask', () => {
      const valueMask = 1 << TYPE_NUMBER;
      const paramMask = (1 << TYPE_NUMBER) | (1 << TYPE_STRING);

      expect(typeMatches(valueMask, paramMask)).toBe(true);
    });

    it('should not match when value mask is not set', () => {
      const valueMask = 1 << TYPE_BOOLEAN;
      const paramMask = (1 << TYPE_NUMBER) | (1 << TYPE_STRING);

      expect(typeMatches(valueMask, paramMask)).toBe(false);
    });

    it('should always match ANY_MASK', () => {
      expect(typeMatches(1 << TYPE_NUMBER, TYPE_ANY_MASK)).toBe(true);
      expect(typeMatches(1 << TYPE_OBJECT, TYPE_ANY_MASK)).toBe(true);
    });
  });

  describe('resetTypeMasks', () => {
    it('should remove custom types but keep built-ins', () => {
      const customBit = getTypeBit('CustomType');
      expect(customBit).toBeGreaterThanOrEqual(10);

      resetTypeMasks();

      // Custom type should get a new bit after reset
      const newBit = getTypeBit('CustomType');
      expect(newBit).toBe(10); // First custom type slot

      // Built-ins should still work
      expect(getTypeBit('number')).toBe(TYPE_NUMBER);
    });
  });

  describe('registerCustomType', () => {
    it('should assign a new bit for custom type', () => {
      const bit = registerCustomType('MyType');
      expect(bit).toBeGreaterThanOrEqual(10);
    });

    it('should return same bit for same type', () => {
      const bit1 = registerCustomType('SameType');
      const bit2 = registerCustomType('SameType');
      expect(bit1).toBe(bit2);
    });
  });

  describe('maskToTypeNames', () => {
    it('should return any for ANY_MASK', () => {
      expect(maskToTypeNames(TYPE_ANY_MASK)).toEqual(['any']);
    });

    it('should return correct names for single type', () => {
      expect(maskToTypeNames(1 << TYPE_NUMBER)).toEqual(['number']);
    });

    it('should return multiple names for combined mask', () => {
      const mask = (1 << TYPE_NUMBER) | (1 << TYPE_STRING);
      const names = maskToTypeNames(mask);
      expect(names).toContain('number');
      expect(names).toContain('string');
      expect(names).toHaveLength(2);
    });
  });
});

describe('Fallback Dispatch', () => {
  beforeEach(() => {
    fallbackClear();
  });

  describe('fallbackAddSignature', () => {
    it('should add a signature and return index', () => {
      const fn = () => 'result';
      const paramMasks = [1 << TYPE_NUMBER];

      const idx = fallbackAddSignature(fn, paramMasks);
      expect(idx).toBe(0);
    });

    it('should increment index for each signature', () => {
      const fn1 = () => 'a';
      const fn2 = () => 'b';

      const idx1 = fallbackAddSignature(fn1, [1 << TYPE_NUMBER]);
      const idx2 = fallbackAddSignature(fn2, [1 << TYPE_STRING]);

      expect(idx1).toBe(0);
      expect(idx2).toBe(1);
    });
  });

  describe('fallbackDispatchFind', () => {
    it('should find matching single-param signature', () => {
      const fn = () => 'found';
      fallbackAddSignature(fn, [1 << TYPE_NUMBER]);

      const result = fallbackDispatchFind([1 << TYPE_NUMBER]);
      expect(result).toBe(fn);
    });

    it('should find matching multi-param signature', () => {
      const fn = (a: number, b: string) => `${a}-${b}`;
      fallbackAddSignature(fn, [1 << TYPE_NUMBER, 1 << TYPE_STRING]);

      const result = fallbackDispatchFind([1 << TYPE_NUMBER, 1 << TYPE_STRING]);
      expect(result).toBe(fn);
    });

    it('should return null for no match', () => {
      fallbackAddSignature(() => 'x', [1 << TYPE_NUMBER]);

      const result = fallbackDispatchFind([1 << TYPE_STRING]);
      expect(result).toBeNull();
    });

    it('should match union types', () => {
      const fn = () => 'union';
      fallbackAddSignature(fn, [(1 << TYPE_NUMBER) | (1 << TYPE_STRING)]);

      expect(fallbackDispatchFind([1 << TYPE_NUMBER])).toBe(fn);
      expect(fallbackDispatchFind([1 << TYPE_STRING])).toBe(fn);
      expect(fallbackDispatchFind([1 << TYPE_BOOLEAN])).toBeNull();
    });

    it('should match any type', () => {
      const fn = () => 'any';
      fallbackAddSignature(fn, [TYPE_ANY]);

      expect(fallbackDispatchFind([1 << TYPE_NUMBER])).toBe(fn);
      expect(fallbackDispatchFind([1 << TYPE_STRING])).toBe(fn);
      expect(fallbackDispatchFind([1 << TYPE_OBJECT])).toBe(fn);
    });

    it('should respect argument count', () => {
      const fn1 = () => 'zero';
      const fn2 = (a: number) => 'one';

      fallbackAddSignature(fn1, []);
      fallbackAddSignature(fn2, [1 << TYPE_NUMBER]);

      expect(fallbackDispatchFind([])).toBe(fn1);
      expect(fallbackDispatchFind([1 << TYPE_NUMBER])).toBe(fn2);
    });

    it('should return first matching signature', () => {
      const fn1 = () => 'first';
      const fn2 = () => 'second';

      fallbackAddSignature(fn1, [1 << TYPE_NUMBER]);
      fallbackAddSignature(fn2, [1 << TYPE_NUMBER]);

      expect(fallbackDispatchFind([1 << TYPE_NUMBER])).toBe(fn1);
    });
  });

  describe('cache behavior', () => {
    it('should use cache on repeated lookups', () => {
      const fn = () => 'cached';
      fallbackAddSignature(fn, [1 << TYPE_NUMBER]);

      // First lookup
      const result1 = fallbackDispatchFind([1 << TYPE_NUMBER]);
      expect(result1).toBe(fn);

      // Cached lookup
      const result2 = fallbackDispatchFind([1 << TYPE_NUMBER]);
      expect(result2).toBe(fn);

      // Cache should have entry
      expect(fallbackGetCacheStats()).toBeGreaterThan(0);
    });

    it('should clear cache', () => {
      const fn = () => 'x';
      fallbackAddSignature(fn, [1 << TYPE_NUMBER]);
      fallbackDispatchFind([1 << TYPE_NUMBER]);

      expect(fallbackGetCacheStats()).toBeGreaterThan(0);

      fallbackClearCache();
      expect(fallbackGetCacheStats()).toBe(0);
    });
  });

  describe('fallbackGetFunction', () => {
    it('should return function by index', () => {
      const fn = () => 'get';
      fallbackAddSignature(fn, [1 << TYPE_NUMBER]);

      expect(fallbackGetFunction(0)).toBe(fn);
    });

    it('should return null for invalid index', () => {
      expect(fallbackGetFunction(999)).toBeNull();
    });
  });

  describe('fallbackGetSignatureCount', () => {
    it('should return correct count', () => {
      expect(fallbackGetSignatureCount()).toBe(0);

      fallbackAddSignature(() => 'a', [1 << TYPE_NUMBER]);
      expect(fallbackGetSignatureCount()).toBe(1);

      fallbackAddSignature(() => 'b', [1 << TYPE_STRING]);
      expect(fallbackGetSignatureCount()).toBe(2);
    });
  });

  describe('fallbackGetBuiltinMask', () => {
    it('should return correct masks for built-in type IDs', () => {
      expect(fallbackGetBuiltinMask(TYPE_NUMBER)).toBe(1 << TYPE_NUMBER);
      expect(fallbackGetBuiltinMask(TYPE_STRING)).toBe(1 << TYPE_STRING);
    });

    it('should return 0 for out-of-range type ID', () => {
      expect(fallbackGetBuiltinMask(32)).toBe(0);
      expect(fallbackGetBuiltinMask(100)).toBe(0);
    });
  });

  describe('fallbackClear', () => {
    it('should clear all signatures', () => {
      fallbackAddSignature(() => 'a', [1 << TYPE_NUMBER]);
      fallbackAddSignature(() => 'b', [1 << TYPE_STRING]);

      expect(fallbackGetSignatureCount()).toBe(2);

      fallbackClear();

      expect(fallbackGetSignatureCount()).toBe(0);
      expect(fallbackDispatchFind([1 << TYPE_NUMBER])).toBeNull();
    });
  });
});

describe('WASM/Fallback Integration', () => {
  beforeEach(() => {
    fallbackClear();
    resetTypeMasks();
  });

  it('should dispatch using type masks from values', () => {
    const numFn = (n: number) => n * 2;
    const strFn = (s: string) => s + '!';

    fallbackAddSignature(numFn, [getTypeMaskForName('number')]);
    fallbackAddSignature(strFn, [getTypeMaskForName('string')]);

    const numMasks = getArgMasks([42]);
    const strMasks = getArgMasks(['hello']);

    expect(fallbackDispatchFind(numMasks)).toBe(numFn);
    expect(fallbackDispatchFind(strMasks)).toBe(strFn);
  });

  it('should handle complex union types', () => {
    const fn = () => 'matched';
    const paramMask = getParamMask(['number', 'string', 'boolean']);
    fallbackAddSignature(fn, [paramMask]);

    expect(fallbackDispatchFind(getArgMasks([42]))).toBe(fn);
    expect(fallbackDispatchFind(getArgMasks(['hi']))).toBe(fn);
    expect(fallbackDispatchFind(getArgMasks([true]))).toBe(fn);
    expect(fallbackDispatchFind(getArgMasks([null]))).toBeNull();
  });

  it('should handle multiple parameters with different types', () => {
    const fn = (a: number, b: string, c: boolean) => 'ok';
    fallbackAddSignature(fn, [
      getTypeMaskForName('number'),
      getTypeMaskForName('string'),
      getTypeMaskForName('boolean'),
    ]);

    expect(fallbackDispatchFind(getArgMasks([1, 'two', true]))).toBe(fn);
    expect(fallbackDispatchFind(getArgMasks([1, 'two']))).toBeNull();
    expect(fallbackDispatchFind(getArgMasks([1, 2, true]))).toBeNull();
  });

  it('should support custom types', () => {
    const customBit = registerCustomType('CustomClass');
    const fn = () => 'custom';
    fallbackAddSignature(fn, [1 << customBit]);

    // Simulate matching a custom type by using its mask directly
    expect(fallbackDispatchFind([1 << customBit])).toBe(fn);
    expect(fallbackDispatchFind([1 << TYPE_NUMBER])).toBeNull();
  });
});
