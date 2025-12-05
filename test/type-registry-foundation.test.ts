/**
 * Sprint 1 Tests - Foundation & TypeScript Scaffolding
 *
 * Tests for the core modules created in Sprint 1:
 * - Type Registry
 * - Utility Functions
 * - Error Factory
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  TypeRegistry,
  createTypeRegistry,
  BUILTIN_TYPES,
} from '../src/core/type-registry.js';
import {
  last,
  initial,
  slice,
  flatMap,
  findInArray,
} from '../src/utils/array-helpers.js';
import {
  isPlainObject,
  hasOwnProperty,
} from '../src/utils/object-helpers.js';
import {
  hasRestParam,
  stringifyParams,
} from '../src/core/error-factory.js';
import type { Param, Type } from '../src/core/types.js';

describe('TypeRegistry', () => {
  let registry: TypeRegistry;

  beforeEach(() => {
    registry = createTypeRegistry();
  });

  describe('initialization', () => {
    it('should have built-in types after creation', () => {
      expect(registry.size).toBeGreaterThan(0);
      expect(registry.hasType('number')).toBe(true);
      expect(registry.hasType('string')).toBe(true);
      expect(registry.hasType('boolean')).toBe(true);
      expect(registry.hasType('any')).toBe(true);
    });

    it('should have all 11 default types', () => {
      // 10 built-in types + 'any'
      expect(registry.size).toBe(11);
    });
  });

  describe('findType', () => {
    it('should return type definition for existing type', () => {
      const numType = registry.findType('number');
      expect(numType.name).toBe('number');
      expect(typeof numType.test).toBe('function');
    });

    it('should throw for unknown type', () => {
      expect(() => registry.findType('unknown')).toThrow(TypeError);
    });

    it('should suggest correct casing', () => {
      expect(() => registry.findType('NUMBER')).toThrow(/Did you mean "number"/);
    });
  });

  describe('type tests', () => {
    it('should correctly test number', () => {
      const numType = registry.findType('number');
      expect(numType.test(42)).toBe(true);
      expect(numType.test('42')).toBe(false);
      expect(numType.test(NaN)).toBe(true); // NaN is a number
    });

    it('should correctly test string', () => {
      const strType = registry.findType('string');
      expect(strType.test('hello')).toBe(true);
      expect(strType.test('')).toBe(true);
      expect(strType.test(42)).toBe(false);
    });

    it('should correctly test boolean', () => {
      const boolType = registry.findType('boolean');
      expect(boolType.test(true)).toBe(true);
      expect(boolType.test(false)).toBe(true);
      expect(boolType.test(1)).toBe(false);
    });

    it('should correctly test Array', () => {
      const arrType = registry.findType('Array');
      expect(arrType.test([])).toBe(true);
      expect(arrType.test([1, 2, 3])).toBe(true);
      expect(arrType.test('array')).toBe(false);
    });

    it('should correctly test Object', () => {
      const objType = registry.findType('Object');
      expect(objType.test({})).toBe(true);
      expect(objType.test({ a: 1 })).toBe(true);
      expect(objType.test([])).toBe(false); // Arrays are not plain objects
      expect(objType.test(new Date())).toBe(false);
    });

    it('should correctly test null and undefined', () => {
      const nullType = registry.findType('null');
      const undefType = registry.findType('undefined');
      expect(nullType.test(null)).toBe(true);
      expect(nullType.test(undefined)).toBe(false);
      expect(undefType.test(undefined)).toBe(true);
      expect(undefType.test(null)).toBe(false);
    });

    it('should correctly test any', () => {
      const anyType = registry.findType('any');
      expect(anyType.test(42)).toBe(true);
      expect(anyType.test('hello')).toBe(true);
      expect(anyType.test(null)).toBe(true);
      expect(anyType.test(undefined)).toBe(true);
      expect(anyType.isAny).toBe(true);
    });
  });

  describe('addTypes', () => {
    it('should add custom type', () => {
      registry.addTypes([
        {
          name: 'positive',
          test: (x) => typeof x === 'number' && x > 0,
        },
      ]);

      expect(registry.hasType('positive')).toBe(true);
      const posType = registry.findType('positive');
      expect(posType.test(5)).toBe(true);
      expect(posType.test(-5)).toBe(false);
    });

    it('should throw on duplicate type', () => {
      expect(() =>
        registry.addTypes([{ name: 'number', test: () => true }])
      ).toThrow(/Duplicate type name/);
    });

    it('should throw on invalid type definition', () => {
      expect(() => registry.addTypes([{ name: 123 } as any])).toThrow(TypeError);
    });
  });

  describe('findTypeNames', () => {
    it('should find matching type names for a value', () => {
      expect(registry.findTypeNames(42)).toContain('number');
      expect(registry.findTypeNames('hello')).toContain('string');
      expect(registry.findTypeNames([])).toContain('Array');
    });

    it('should return ["any"] for no specific matches', () => {
      // Symbol is not a built-in type, so it should return 'any'
      expect(registry.findTypeNames(Symbol('test'))).toEqual(['any']);
    });
  });

  describe('getTypeMask', () => {
    it('should return correct bit mask for built-in types', () => {
      expect(registry.getTypeMask(42)).toBe(1 << 0); // number = bit 0
      expect(registry.getTypeMask('hello')).toBe(1 << 1); // string = bit 1
      expect(registry.getTypeMask(true)).toBe(1 << 2); // boolean = bit 2
      expect(registry.getTypeMask(null)).toBe(1 << 8); // null = bit 8
      expect(registry.getTypeMask(undefined)).toBe(1 << 9); // undefined = bit 9
    });
  });

  describe('clear', () => {
    it('should reset to only have any type', () => {
      registry.clear();
      expect(registry.size).toBe(1);
      expect(registry.hasType('any')).toBe(true);
      expect(registry.hasType('number')).toBe(false);
    });
  });
});

describe('Array Helpers', () => {
  describe('last', () => {
    it('should return last element', () => {
      expect(last([1, 2, 3])).toBe(3);
      expect(last(['a', 'b'])).toBe('b');
    });

    it('should return undefined for empty array', () => {
      expect(last([])).toBeUndefined();
    });
  });

  describe('initial', () => {
    it('should return all but last element', () => {
      expect(initial([1, 2, 3])).toEqual([1, 2]);
      expect(initial([1])).toEqual([]);
    });
  });

  describe('slice', () => {
    it('should work like Array.slice', () => {
      expect(slice([1, 2, 3, 4], 1, 3)).toEqual([2, 3]);
      expect(slice([1, 2, 3], 1)).toEqual([2, 3]);
    });

    it('should work with array-like objects', () => {
      const arrayLike = { 0: 'a', 1: 'b', 2: 'c', length: 3 };
      expect(slice(arrayLike, 1)).toEqual(['b', 'c']);
    });
  });

  describe('flatMap', () => {
    it('should flatten mapped arrays', () => {
      const result = flatMap([1, 2, 3], (x) => [x, x * 2]);
      expect(result).toEqual([1, 2, 2, 4, 3, 6]);
    });

    it('should handle empty arrays', () => {
      const result = flatMap([1, 2], () => []);
      expect(result).toEqual([]);
    });
  });

  describe('findInArray', () => {
    it('should find first matching element', () => {
      expect(findInArray([1, 2, 3], (x) => x > 1)).toBe(2);
    });

    it('should return undefined if not found', () => {
      expect(findInArray([1, 2, 3], (x) => x > 10)).toBeUndefined();
    });
  });
});

describe('Object Helpers', () => {
  describe('isPlainObject', () => {
    it('should return true for plain objects', () => {
      expect(isPlainObject({})).toBe(true);
      expect(isPlainObject({ a: 1 })).toBe(true);
    });

    it('should return false for arrays', () => {
      expect(isPlainObject([])).toBe(false);
    });

    it('should return false for null', () => {
      expect(isPlainObject(null)).toBe(false);
    });

    it('should return false for class instances', () => {
      expect(isPlainObject(new Date())).toBe(false);
      expect(isPlainObject(new Map())).toBe(false);
    });
  });

  describe('hasOwnProperty', () => {
    it('should check own properties', () => {
      const obj = { a: 1 };
      expect(hasOwnProperty(obj, 'a')).toBe(true);
      expect(hasOwnProperty(obj, 'b')).toBe(false);
      expect(hasOwnProperty(obj, 'toString')).toBe(false);
    });
  });
});

describe('Error Factory Helpers', () => {
  const createMockType = (name: string): Type => ({
    name,
    typeIndex: 0,
    test: () => true,
    isAny: false,
    conversion: null,
    conversionIndex: -1,
  });

  const createMockParam = (name: string, restParam = false): Param => ({
    types: [createMockType(name)],
    name,
    hasAny: name === 'any',
    hasConversion: false,
    restParam,
  });

  describe('hasRestParam', () => {
    it('should detect rest param', () => {
      const params: Param[] = [
        createMockParam('number'),
        createMockParam('...string', true),
      ];
      expect(hasRestParam(params)).toBe(true);
    });

    it('should return false when no rest param', () => {
      const params: Param[] = [
        createMockParam('number'),
        createMockParam('string'),
      ];
      expect(hasRestParam(params)).toBe(false);
    });

    it('should return false for empty params', () => {
      expect(hasRestParam([])).toBe(false);
    });
  });

  describe('stringifyParams', () => {
    it('should join param names', () => {
      const params: Param[] = [
        createMockParam('number'),
        createMockParam('string'),
      ];
      expect(stringifyParams(params)).toBe('number,string');
    });

    it('should use custom separator', () => {
      const params: Param[] = [
        createMockParam('number'),
        createMockParam('string'),
      ];
      expect(stringifyParams(params, ', ')).toBe('number, string');
    });

    it('should handle empty params', () => {
      expect(stringifyParams([])).toBe('');
    });
  });
});

describe('Module Exports', () => {
  it('should export all expected types and functions', async () => {
    const module = await import('../src/index.js');

    // Types and constants
    expect(module.NOT_TYPED_FUNCTION).toBeDefined();

    // Type Registry
    expect(module.TypeRegistry).toBeDefined();
    expect(module.createTypeRegistry).toBeDefined();
    expect(module.BUILTIN_TYPES).toBeDefined();

    // Array helpers
    expect(module.last).toBeDefined();
    expect(module.initial).toBeDefined();
    expect(module.slice).toBeDefined();
    expect(module.flatMap).toBeDefined();

    // Object helpers
    expect(module.isPlainObject).toBeDefined();
    expect(module.hasOwnProperty).toBeDefined();

    // Error factory
    expect(module.createError).toBeDefined();
    expect(module.stringifyParams).toBeDefined();
    expect(module.hasRestParam).toBeDefined();

    // Main exports
    expect(module.isTypedFunction).toBeDefined();
    expect(module.default).toBeDefined();
  });
});
