/**
 * Utility Helper Tests
 *
 * Tests for array and object helper functions
 */

import { describe, it, expect } from 'vitest';
import {
  last,
  initial,
  slice,
  flatMap,
  findInArray,
  hasItem,
  createArray,
  arraysEqual,
} from '../src/utils/array-helpers.js';
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

describe('Array Helpers', () => {
  describe('last', () => {
    it('should return the last element of an array', () => {
      expect(last([1, 2, 3])).toBe(3);
      expect(last(['a', 'b', 'c'])).toBe('c');
    });

    it('should return undefined for empty array', () => {
      expect(last([])).toBe(undefined);
    });

    it('should work with array-like objects', () => {
      const args = { 0: 'a', 1: 'b', length: 2 };
      expect(last(args)).toBe('b');
    });
  });

  describe('initial', () => {
    it('should return all but the last element', () => {
      expect(initial([1, 2, 3])).toEqual([1, 2]);
      expect(initial(['a', 'b', 'c'])).toEqual(['a', 'b']);
    });

    it('should return empty array for single element', () => {
      expect(initial([1])).toEqual([]);
    });

    it('should return empty array for empty array', () => {
      expect(initial([])).toEqual([]);
    });
  });

  describe('slice', () => {
    it('should slice from start index', () => {
      expect(slice([1, 2, 3, 4], 1)).toEqual([2, 3, 4]);
    });

    it('should slice with start and end', () => {
      expect(slice([1, 2, 3, 4], 1, 3)).toEqual([2, 3]);
    });

    it('should work with array-like objects', () => {
      const args = { 0: 'a', 1: 'b', 2: 'c', length: 3 };
      expect(slice(args, 1)).toEqual(['b', 'c']);
    });
  });

  describe('flatMap', () => {
    it('should flatten mapped arrays', () => {
      const result = flatMap([1, 2, 3], x => [x, x * 2]);
      expect(result).toEqual([1, 2, 2, 4, 3, 6]);
    });

    it('should handle empty arrays', () => {
      const result = flatMap([], (x: number) => [x]);
      expect(result).toEqual([]);
    });

    it('should pass index and array to callback', () => {
      const indices: number[] = [];
      flatMap([10, 20], (_, index) => {
        indices.push(index);
        return [];
      });
      expect(indices).toEqual([0, 1]);
    });
  });

  describe('findInArray', () => {
    it('should find first matching element', () => {
      const result = findInArray([1, 2, 3, 4], x => x > 2);
      expect(result).toBe(3);
    });

    it('should return undefined if not found', () => {
      const result = findInArray([1, 2, 3], x => x > 10);
      expect(result).toBe(undefined);
    });

    it('should pass index to predicate', () => {
      const result = findInArray(['a', 'b', 'c'], (_, i) => i === 1);
      expect(result).toBe('b');
    });
  });

  describe('hasItem', () => {
    it('should return true if item exists', () => {
      expect(hasItem([1, 2, 3], x => x === 2)).toBe(true);
    });

    it('should return false if item does not exist', () => {
      expect(hasItem([1, 2, 3], x => x === 5)).toBe(false);
    });
  });

  describe('createArray', () => {
    it('should create array with callback values', () => {
      const result = createArray(3, i => i * 2);
      expect(result).toEqual([0, 2, 4]);
    });

    it('should create empty array for length 0', () => {
      const result = createArray(0, i => i);
      expect(result).toEqual([]);
    });
  });

  describe('arraysEqual', () => {
    it('should return true for equal arrays', () => {
      expect(arraysEqual([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(arraysEqual(['a', 'b'], ['a', 'b'])).toBe(true);
    });

    it('should return false for different lengths', () => {
      expect(arraysEqual([1, 2], [1, 2, 3])).toBe(false);
    });

    it('should return false for different elements', () => {
      expect(arraysEqual([1, 2, 3], [1, 2, 4])).toBe(false);
    });

    it('should return true for empty arrays', () => {
      expect(arraysEqual([], [])).toBe(true);
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
      expect(isPlainObject('string')).toBe(false);
      expect(isPlainObject(123)).toBe(false);
      expect(isPlainObject(true)).toBe(false);
    });
  });

  describe('hasOwnProperty', () => {
    it('should return true for own properties', () => {
      expect(hasOwnProperty({ a: 1 }, 'a')).toBe(true);
    });

    it('should return false for inherited properties', () => {
      const obj = Object.create({ inherited: true });
      expect(hasOwnProperty(obj, 'inherited')).toBe(false);
    });

    it('should return false for non-existent properties', () => {
      expect(hasOwnProperty({}, 'missing')).toBe(false);
    });
  });

  describe('getProperty', () => {
    it('should return property value if it exists', () => {
      expect(getProperty({ a: 1, b: 2 }, 'a')).toBe(1);
    });

    it('should return undefined for non-existent property', () => {
      expect(getProperty({ a: 1 }, 'b')).toBe(undefined);
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
    it('should transform object values', () => {
      const result = mapObject({ a: 1, b: 2 }, v => v * 2);
      expect(result).toEqual({ a: 2, b: 4 });
    });

    it('should pass key to callback', () => {
      const result = mapObject({ a: 1, b: 2 }, (v, k) => `${k}:${v}`);
      expect(result).toEqual({ a: 'a:1', b: 'b:2' });
    });

    it('should handle empty objects', () => {
      const result = mapObject({}, v => v);
      expect(result).toEqual({});
    });
  });

  describe('objectSize', () => {
    it('should return number of own properties', () => {
      expect(objectSize({ a: 1, b: 2, c: 3 })).toBe(3);
      expect(objectSize({})).toBe(0);
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

    it('should override earlier properties', () => {
      const result = mergeObjects({ a: 1 }, { a: 2 });
      expect(result).toEqual({ a: 2 });
    });

    it('should return empty object for no arguments', () => {
      const result = mergeObjects();
      expect(result).toEqual({});
    });
  });

  describe('pick', () => {
    it('should pick specified keys', () => {
      const result = pick({ a: 1, b: 2, c: 3 }, ['a', 'c']);
      expect(result).toEqual({ a: 1, c: 3 });
    });

    it('should ignore non-existent keys', () => {
      const result = pick({ a: 1 }, ['a', 'b' as keyof { a: number }]);
      expect(result).toEqual({ a: 1 });
    });
  });

  describe('omit', () => {
    it('should omit specified keys', () => {
      const result = omit({ a: 1, b: 2, c: 3 }, ['b']);
      expect(result).toEqual({ a: 1, c: 3 });
    });

    it('should return copy for empty keys array', () => {
      const result = omit({ a: 1, b: 2 }, []);
      expect(result).toEqual({ a: 1, b: 2 });
    });
  });
});
