/**
 * Phase 2 Sprint 8: WASM & Utils Complete Coverage Tests
 *
 * Tests covering:
 * - Fallback cache edge cases
 * - Fallback dispatch no-match
 * - Fallback with custom types
 * - Type mask edge cases
 * - Object helpers
 * - WASM state management
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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
  NO_MATCH,
} from '../src/wasm/fallback.js';
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
  addSignature,
  dispatchFind,
} from '../src/wasm/index.js';
import {
  isPlainObject,
  hasOwnProperty,
  getProperty,
  shallowCopy,
  mapObject,
  objectSize,
  isEmptyObject,
  mergeObjects,
  pick,
  omit,
} from '../src/utils/object-helpers.js';

describe('Phase 2 Sprint 8: WASM & Utils Complete Coverage', () => {
  describe('Fallback Dispatch', () => {
    beforeEach(() => {
      fallbackClear();
    });

    afterEach(() => {
      fallbackClear();
    });

    describe('fallbackAddSignature', () => {
      it('should add a signature and return index', () => {
        const fn = (n: number) => n * 2;
        const index = fallbackAddSignature(fn, [1 << TYPE_NUMBER]);
        expect(index).toBe(0);
        expect(fallbackGetSignatureCount()).toBe(1);
      });

      it('should return NO_MATCH for too many params', () => {
        const fn = () => 42;
        // Create array with more than MAX_PARAMS (8)
        const paramMasks = new Array(10).fill(1 << TYPE_NUMBER);
        const result = fallbackAddSignature(fn, paramMasks);
        expect(result).toBe(NO_MATCH);
      });

      it('should add multiple signatures', () => {
        const fn1 = (n: number) => n;
        const fn2 = (s: string) => s;
        fallbackAddSignature(fn1, [1 << TYPE_NUMBER]);
        fallbackAddSignature(fn2, [1 << TYPE_STRING]);
        expect(fallbackGetSignatureCount()).toBe(2);
      });
    });

    describe('fallbackDispatchFind', () => {
      it('should find matching function', () => {
        const fn = (n: number) => n * 2;
        fallbackAddSignature(fn, [1 << TYPE_NUMBER]);
        const result = fallbackDispatchFind([1 << TYPE_NUMBER]);
        expect(result).toBe(fn);
      });

      it('should return null for no match', () => {
        const fn = (n: number) => n;
        fallbackAddSignature(fn, [1 << TYPE_NUMBER]);
        const result = fallbackDispatchFind([1 << TYPE_STRING]);
        expect(result).toBeNull();
      });

      it('should match ANY type', () => {
        const fn = (x: unknown) => x;
        fallbackAddSignature(fn, [TYPE_ANY]);
        const result = fallbackDispatchFind([1 << TYPE_STRING]);
        expect(result).toBe(fn);
      });

      it('should cache results', () => {
        const fn = (n: number) => n;
        fallbackAddSignature(fn, [1 << TYPE_NUMBER]);

        // First call populates cache
        fallbackDispatchFind([1 << TYPE_NUMBER]);
        expect(fallbackGetCacheStats()).toBeGreaterThan(0);

        // Second call uses cache
        const result = fallbackDispatchFind([1 << TYPE_NUMBER]);
        expect(result).toBe(fn);
      });

      it('should handle cache miss when hash matches but content differs', () => {
        const fn1 = (n: number) => n;
        const fn2 = (s: string) => s;
        fallbackAddSignature(fn1, [1 << TYPE_NUMBER]);
        fallbackAddSignature(fn2, [1 << TYPE_STRING]);

        // Call with number
        const result1 = fallbackDispatchFind([1 << TYPE_NUMBER]);
        expect(result1).toBe(fn1);

        // Call with string (may land in same cache slot due to hash collision)
        const result2 = fallbackDispatchFind([1 << TYPE_STRING]);
        expect(result2).toBe(fn2);
      });

      it('should handle multiple arguments', () => {
        const fn = (a: number, b: string) => `${a}${b}`;
        fallbackAddSignature(fn, [1 << TYPE_NUMBER, 1 << TYPE_STRING]);

        const result = fallbackDispatchFind([1 << TYPE_NUMBER, 1 << TYPE_STRING]);
        expect(result).toBe(fn);
      });

      it('should return null when argument count mismatches', () => {
        const fn = (n: number) => n;
        fallbackAddSignature(fn, [1 << TYPE_NUMBER]);

        // Wrong argument count
        const result = fallbackDispatchFind([1 << TYPE_NUMBER, 1 << TYPE_STRING]);
        expect(result).toBeNull();
      });
    });

    describe('fallbackGetFunction', () => {
      it('should return function by index', () => {
        const fn = (n: number) => n;
        fallbackAddSignature(fn, [1 << TYPE_NUMBER]);
        const result = fallbackGetFunction(0);
        expect(result).toBe(fn);
      });

      it('should return null for invalid index', () => {
        expect(fallbackGetFunction(999)).toBeNull();
      });
    });

    describe('fallbackClear', () => {
      it('should clear all signatures', () => {
        fallbackAddSignature(() => 1, [1 << TYPE_NUMBER]);
        fallbackAddSignature(() => 2, [1 << TYPE_STRING]);
        expect(fallbackGetSignatureCount()).toBe(2);

        fallbackClear();
        expect(fallbackGetSignatureCount()).toBe(0);
      });

      it('should clear cache', () => {
        const fn = () => 42;
        fallbackAddSignature(fn, [1 << TYPE_NUMBER]);
        fallbackDispatchFind([1 << TYPE_NUMBER]);
        expect(fallbackGetCacheStats()).toBeGreaterThan(0);

        fallbackClear();
        expect(fallbackGetCacheStats()).toBe(0);
      });
    });

    describe('fallbackClearCache', () => {
      it('should clear only cache', () => {
        const fn = () => 42;
        fallbackAddSignature(fn, [1 << TYPE_NUMBER]);
        fallbackDispatchFind([1 << TYPE_NUMBER]);

        const sigCountBefore = fallbackGetSignatureCount();
        fallbackClearCache();

        expect(fallbackGetCacheStats()).toBe(0);
        expect(fallbackGetSignatureCount()).toBe(sigCountBefore);
      });
    });

    describe('fallbackGetBuiltinMask', () => {
      it('should return mask for valid type ID', () => {
        expect(fallbackGetBuiltinMask(0)).toBe(1);
        expect(fallbackGetBuiltinMask(1)).toBe(2);
        expect(fallbackGetBuiltinMask(5)).toBe(32);
      });

      it('should return 0 for type ID >= 32', () => {
        expect(fallbackGetBuiltinMask(32)).toBe(0);
        expect(fallbackGetBuiltinMask(100)).toBe(0);
      });
    });
  });

  describe('Type Masks', () => {
    beforeEach(() => {
      resetTypeMasks();
    });

    afterEach(() => {
      resetTypeMasks();
    });

    describe('Type constants', () => {
      it('should export correct type IDs', () => {
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

      it('should export ANY mask', () => {
        expect(TYPE_ANY_MASK).toBe(0xffffffff);
      });
    });

    describe('getTypeBit', () => {
      it('should return builtin type bits', () => {
        expect(getTypeBit('number')).toBe(0);
        expect(getTypeBit('string')).toBe(1);
        expect(getTypeBit('boolean')).toBe(2);
      });

      it('should return -1 for any', () => {
        expect(getTypeBit('any')).toBe(-1);
      });

      it('should assign new bit for custom type', () => {
        const bit = getTypeBit('customType');
        expect(bit).toBeGreaterThanOrEqual(10);
      });

      it('should return same bit for same custom type', () => {
        const bit1 = getTypeBit('myCustom');
        const bit2 = getTypeBit('myCustom');
        expect(bit1).toBe(bit2);
      });
    });

    describe('getTypeMaskForName', () => {
      it('should return mask for builtin types', () => {
        expect(getTypeMaskForName('number')).toBe(1 << 0);
        expect(getTypeMaskForName('string')).toBe(1 << 1);
        expect(getTypeMaskForName('boolean')).toBe(1 << 2);
      });

      it('should return ANY_MASK for any', () => {
        expect(getTypeMaskForName('any')).toBe(TYPE_ANY_MASK);
      });

      it('should return mask for custom type', () => {
        const mask = getTypeMaskForName('customType');
        expect(mask).toBeGreaterThan(0);
        expect(mask).not.toBe(TYPE_ANY_MASK);
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
      });

      it('should return correct mask for string', () => {
        expect(getTypeMaskForValue('hello')).toBe(1 << TYPE_STRING);
      });

      it('should return correct mask for boolean', () => {
        expect(getTypeMaskForValue(true)).toBe(1 << TYPE_BOOLEAN);
      });

      it('should return correct mask for function', () => {
        expect(getTypeMaskForValue(() => {})).toBe(1 << TYPE_FUNCTION);
      });

      it('should return correct mask for array', () => {
        expect(getTypeMaskForValue([1, 2, 3])).toBe(1 << TYPE_ARRAY);
      });

      it('should return correct mask for Date', () => {
        expect(getTypeMaskForValue(new Date())).toBe(1 << TYPE_DATE);
      });

      it('should return correct mask for RegExp', () => {
        expect(getTypeMaskForValue(/test/)).toBe(1 << TYPE_REGEXP);
      });

      it('should return correct mask for plain object', () => {
        expect(getTypeMaskForValue({ a: 1 })).toBe(1 << TYPE_OBJECT);
      });

      it('should return Object mask for unknown object types', () => {
        class CustomClass {}
        expect(getTypeMaskForValue(new CustomClass())).toBe(1 << TYPE_OBJECT);
      });

      it('should return Symbol mask for symbol values', () => {
        // Symbol is now a built-in modern type (bit 11)
        expect(getTypeMaskForValue(Symbol('test'))).toBe(1 << 11);
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
        expect(getParamMask(['number', 'any'])).toBe(TYPE_ANY_MASK);
      });
    });

    describe('getArgMasks', () => {
      it('should return empty array for no args', () => {
        expect(getArgMasks([])).toEqual([]);
      });

      it('should return masks for all arguments', () => {
        const masks = getArgMasks([42, 'hello', true]);
        expect(masks).toEqual([
          1 << TYPE_NUMBER,
          1 << TYPE_STRING,
          1 << TYPE_BOOLEAN,
        ]);
      });
    });

    describe('typeMatches', () => {
      it('should return true for ANY_MASK', () => {
        expect(typeMatches(1 << TYPE_NUMBER, TYPE_ANY_MASK)).toBe(true);
      });

      it('should return true for matching type', () => {
        expect(typeMatches(1 << TYPE_NUMBER, 1 << TYPE_NUMBER)).toBe(true);
      });

      it('should return true for type in union mask', () => {
        const unionMask = (1 << TYPE_NUMBER) | (1 << TYPE_STRING);
        expect(typeMatches(1 << TYPE_NUMBER, unionMask)).toBe(true);
        expect(typeMatches(1 << TYPE_STRING, unionMask)).toBe(true);
      });

      it('should return false for non-matching type', () => {
        expect(typeMatches(1 << TYPE_NUMBER, 1 << TYPE_STRING)).toBe(false);
      });
    });

    describe('resetTypeMasks', () => {
      it('should remove custom types but keep builtins and modern types', () => {
        const customBit = getTypeBit('myCustomType');
        expect(customBit).toBeGreaterThanOrEqual(16);

        resetTypeMasks();

        // Builtin should still work
        expect(getTypeBit('number')).toBe(0);

        // Modern type should still work
        expect(getTypeBit('Symbol')).toBe(11);

        // Custom type should get new assignment
        const newBit = getTypeBit('myCustomType');
        expect(newBit).toBe(16); // Reset to first custom slot (after modern types)
      });
    });

    describe('registerCustomType', () => {
      it('should register and return type bit', () => {
        const bit = registerCustomType('myType');
        expect(bit).toBeGreaterThanOrEqual(10);
        expect(getTypeBit('myType')).toBe(bit);
      });
    });

    describe('maskToTypeNames', () => {
      it('should return any for ANY_MASK', () => {
        expect(maskToTypeNames(TYPE_ANY_MASK)).toEqual(['any']);
      });

      it('should return type name for single mask', () => {
        expect(maskToTypeNames(1 << TYPE_NUMBER)).toContain('number');
      });

      it('should return multiple type names for union mask', () => {
        const mask = (1 << TYPE_NUMBER) | (1 << TYPE_STRING);
        const names = maskToTypeNames(mask);
        expect(names).toContain('number');
        expect(names).toContain('string');
      });

      it('should return unknown for empty mask', () => {
        expect(maskToTypeNames(0)).toEqual(['unknown']);
      });
    });
  });

  describe('Unified Interface (wasm/index.ts)', () => {
    beforeEach(() => {
      fallbackClear();
      resetTypeMasks();
    });

    afterEach(() => {
      fallbackClear();
      resetTypeMasks();
    });

    describe('addSignature', () => {
      it('should add signature via unified interface', () => {
        const fn = (n: number) => n;
        const index = addSignature(fn, [1 << TYPE_NUMBER]);
        expect(index).toBeGreaterThanOrEqual(0);
      });
    });

    describe('dispatchFind', () => {
      it('should find function via unified interface', () => {
        const fn = (n: number) => n * 2;
        addSignature(fn, [1 << TYPE_NUMBER]);
        const result = dispatchFind([1 << TYPE_NUMBER]);
        expect(result).toBe(fn);
      });

      it('should return null for no match', () => {
        const fn = (n: number) => n;
        addSignature(fn, [1 << TYPE_NUMBER]);
        const result = dispatchFind([1 << TYPE_STRING]);
        expect(result).toBeNull();
      });
    });
  });

  describe('Object Helpers', () => {
    describe('isPlainObject', () => {
      it('should return true for plain objects', () => {
        expect(isPlainObject({})).toBe(true);
        expect(isPlainObject({ a: 1 })).toBe(true);
        expect(isPlainObject({})).toBe(true);
      });

      it('should return false for arrays', () => {
        expect(isPlainObject([])).toBe(false);
        expect(isPlainObject([1, 2, 3])).toBe(false);
      });

      it('should return false for null', () => {
        expect(isPlainObject(null)).toBe(false);
      });

      it('should return false for class instances', () => {
        class MyClass {}
        expect(isPlainObject(new MyClass())).toBe(false);
      });

      it('should return false for primitives', () => {
        expect(isPlainObject(42)).toBe(false);
        expect(isPlainObject('hello')).toBe(false);
        expect(isPlainObject(true)).toBe(false);
      });
    });

    describe('hasOwnProperty', () => {
      it('should return true for own property', () => {
        expect(hasOwnProperty({ a: 1 }, 'a')).toBe(true);
      });

      it('should return false for inherited property', () => {
        const obj = Object.create({ inherited: true });
        expect(hasOwnProperty(obj, 'inherited')).toBe(false);
      });

      it('should return false for non-existent property', () => {
        expect(hasOwnProperty({}, 'missing')).toBe(false);
      });
    });

    describe('getProperty', () => {
      it('should return property value', () => {
        expect(getProperty({ a: 42 }, 'a')).toBe(42);
      });

      it('should return undefined for missing property', () => {
        expect(getProperty({}, 'missing')).toBeUndefined();
      });

      it('should not return inherited properties', () => {
        const obj = Object.create({ inherited: true });
        expect(getProperty(obj, 'inherited')).toBeUndefined();
      });
    });

    describe('shallowCopy', () => {
      it('should create a shallow copy', () => {
        const original = { a: 1, b: { c: 2 } };
        const copy = shallowCopy(original);
        expect(copy).toEqual(original);
        expect(copy).not.toBe(original);
        expect(copy.b).toBe(original.b); // Same reference for nested
      });
    });

    describe('mapObject', () => {
      it('should transform values', () => {
        const obj = { a: 1, b: 2, c: 3 };
        const result = mapObject(obj, (v) => v * 2);
        expect(result).toEqual({ a: 2, b: 4, c: 6 });
      });

      it('should pass key to callback', () => {
        const obj = { a: 1, b: 2 };
        const result = mapObject(obj, (v, k) => `${k}:${v}`);
        expect(result).toEqual({ a: 'a:1', b: 'b:2' });
      });

      it('should skip inherited properties', () => {
        const proto = { inherited: 100 };
        const obj = Object.create(proto);
        obj.own = 42;
        const result = mapObject(obj, (v) => v * 2);
        expect(result).toEqual({ own: 84 });
        expect('inherited' in result).toBe(false);
      });
    });

    describe('objectSize', () => {
      it('should return number of own properties', () => {
        expect(objectSize({})).toBe(0);
        expect(objectSize({ a: 1 })).toBe(1);
        expect(objectSize({ a: 1, b: 2, c: 3 })).toBe(3);
      });
    });

    describe('isEmptyObject', () => {
      it('should return true for empty object', () => {
        expect(isEmptyObject({})).toBe(true);
      });

      it('should return false for non-empty object', () => {
        expect(isEmptyObject({ a: 1 })).toBe(false);
      });
    });

    describe('mergeObjects', () => {
      it('should merge multiple objects', () => {
        const result = mergeObjects({ a: 1 }, { b: 2 }, { c: 3 });
        expect(result).toEqual({ a: 1, b: 2, c: 3 });
      });

      it('should override earlier values with later', () => {
        const result = mergeObjects({ a: 1 }, { a: 2 });
        expect(result).toEqual({ a: 2 });
      });
    });

    describe('pick', () => {
      it('should pick specified keys', () => {
        const obj = { a: 1, b: 2, c: 3 };
        const result = pick(obj, ['a', 'c']);
        expect(result).toEqual({ a: 1, c: 3 });
      });

      it('should ignore missing keys', () => {
        const obj = { a: 1, b: 2 };
        const result = pick(obj, ['a', 'missing' as keyof typeof obj]);
        expect(result).toEqual({ a: 1 });
      });
    });

    describe('omit', () => {
      it('should omit specified keys', () => {
        const obj = { a: 1, b: 2, c: 3 };
        const result = omit(obj, ['b']);
        expect(result).toEqual({ a: 1, c: 3 });
      });

      it('should handle missing keys gracefully', () => {
        const obj = { a: 1, b: 2 };
        const result = omit(obj, ['missing' as keyof typeof obj]);
        expect(result).toEqual({ a: 1, b: 2 });
      });
    });
  });

  describe('Cache edge cases', () => {
    beforeEach(() => {
      fallbackClear();
    });

    afterEach(() => {
      fallbackClear();
    });

    it('should handle cache slot collision', () => {
      // Add many signatures to increase chance of collision
      for (let i = 0; i < 20; i++) {
        fallbackAddSignature(() => i, [1 << (i % 10)]);
      }

      // Try to find various signatures
      for (let i = 0; i < 10; i++) {
        const result = fallbackDispatchFind([1 << i]);
        expect(result).not.toBeNull();
      }
    });

    it('should evict old cache entries', () => {
      const fn = () => 42;
      fallbackAddSignature(fn, [1 << TYPE_NUMBER]);

      // Fill cache with many lookups
      for (let i = 0; i < 300; i++) {
        fallbackDispatchFind([1 << TYPE_NUMBER]);
      }

      // Cache should still work
      const result = fallbackDispatchFind([1 << TYPE_NUMBER]);
      expect(result).toBe(fn);
    });
  });
});
