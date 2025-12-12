/**
 * Extended tests for type-masks.ts - covering createMask, optionalMask,
 * nullableMask, combineMasks, and edge cases
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  TYPE_NUMBER,
  TYPE_STRING,
  TYPE_BOOLEAN,
  TYPE_NULL,
  TYPE_UNDEFINED,
  TYPE_OBJECT,
  TYPE_ARRAY,
  TYPE_FUNCTION,
  TYPE_DATE,
  TYPE_REGEXP,
  TYPE_BIGINT,
  TYPE_SYMBOL,
  TYPE_MAP,
  TYPE_SET,
  TYPE_WEAKMAP,
  TYPE_WEAKSET,
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
  TypeMasks,
  createMask,
  optionalMask,
  nullableMask,
  combineMasks,
} from '../src/wasm/type-masks.js';

describe('type-masks extended coverage', () => {
  beforeEach(() => {
    resetTypeMasks();
  });

  describe('createMask', () => {
    it('should create mask from single type name', () => {
      const mask = createMask(['number']);
      expect(mask).toBe(1 << TYPE_NUMBER);
    });

    it('should create mask from multiple type names', () => {
      const mask = createMask(['number', 'string', 'boolean']);
      expect(mask).toBe((1 << TYPE_NUMBER) | (1 << TYPE_STRING) | (1 << TYPE_BOOLEAN));
    });

    it('should return ANY_MASK for empty array', () => {
      const mask = createMask([]);
      expect(mask).toBe(TYPE_ANY_MASK);
    });

    it('should return ANY_MASK if any type includes "any"', () => {
      const mask = createMask(['number', 'any', 'string']);
      expect(mask).toBe(TYPE_ANY_MASK);
    });

    it('should handle custom types', () => {
      const mask = createMask(['number', 'CustomType']);
      expect(mask).not.toBe(1 << TYPE_NUMBER);
      expect((mask & (1 << TYPE_NUMBER)) !== 0).toBe(true);
    });
  });

  describe('optionalMask', () => {
    it('should add null and undefined to number mask', () => {
      const baseMask = 1 << TYPE_NUMBER;
      const optional = optionalMask(baseMask);

      expect((optional & (1 << TYPE_NUMBER)) !== 0).toBe(true);
      expect((optional & (1 << TYPE_NULL)) !== 0).toBe(true);
      expect((optional & (1 << TYPE_UNDEFINED)) !== 0).toBe(true);
    });

    it('should add null and undefined to string mask', () => {
      const baseMask = 1 << TYPE_STRING;
      const optional = optionalMask(baseMask);

      expect((optional & (1 << TYPE_STRING)) !== 0).toBe(true);
      expect((optional & (1 << TYPE_NULL)) !== 0).toBe(true);
      expect((optional & (1 << TYPE_UNDEFINED)) !== 0).toBe(true);
    });

    it('should add null and undefined to complex mask', () => {
      const baseMask = (1 << TYPE_NUMBER) | (1 << TYPE_STRING);
      const optional = optionalMask(baseMask);

      expect((optional & (1 << TYPE_NUMBER)) !== 0).toBe(true);
      expect((optional & (1 << TYPE_STRING)) !== 0).toBe(true);
      expect((optional & (1 << TYPE_NULL)) !== 0).toBe(true);
      expect((optional & (1 << TYPE_UNDEFINED)) !== 0).toBe(true);
    });

    it('should be idempotent', () => {
      const baseMask = 1 << TYPE_NUMBER;
      const optional1 = optionalMask(baseMask);
      const optional2 = optionalMask(optional1);

      expect(optional1).toBe(optional2);
    });
  });

  describe('nullableMask', () => {
    it('should add null to number mask', () => {
      const baseMask = 1 << TYPE_NUMBER;
      const nullable = nullableMask(baseMask);

      expect((nullable & (1 << TYPE_NUMBER)) !== 0).toBe(true);
      expect((nullable & (1 << TYPE_NULL)) !== 0).toBe(true);
      expect((nullable & (1 << TYPE_UNDEFINED)) !== 0).toBe(false);
    });

    it('should add null to string mask', () => {
      const baseMask = 1 << TYPE_STRING;
      const nullable = nullableMask(baseMask);

      expect((nullable & (1 << TYPE_STRING)) !== 0).toBe(true);
      expect((nullable & (1 << TYPE_NULL)) !== 0).toBe(true);
    });

    it('should NOT add undefined', () => {
      const baseMask = 1 << TYPE_NUMBER;
      const nullable = nullableMask(baseMask);

      expect((nullable & (1 << TYPE_UNDEFINED)) !== 0).toBe(false);
    });

    it('should be idempotent', () => {
      const baseMask = 1 << TYPE_NUMBER;
      const nullable1 = nullableMask(baseMask);
      const nullable2 = nullableMask(nullable1);

      expect(nullable1).toBe(nullable2);
    });
  });

  describe('combineMasks', () => {
    it('should combine two masks', () => {
      const mask1 = 1 << TYPE_NUMBER;
      const mask2 = 1 << TYPE_STRING;
      const combined = combineMasks(mask1, mask2);

      expect(combined).toBe((1 << TYPE_NUMBER) | (1 << TYPE_STRING));
    });

    it('should combine multiple masks', () => {
      const mask1 = 1 << TYPE_NUMBER;
      const mask2 = 1 << TYPE_STRING;
      const mask3 = 1 << TYPE_BOOLEAN;
      const combined = combineMasks(mask1, mask2, mask3);

      expect(combined).toBe(
        (1 << TYPE_NUMBER) | (1 << TYPE_STRING) | (1 << TYPE_BOOLEAN)
      );
    });

    it('should return 0 for no arguments', () => {
      const combined = combineMasks();
      expect(combined).toBe(0);
    });

    it('should handle single mask', () => {
      const mask = 1 << TYPE_NUMBER;
      const combined = combineMasks(mask);
      expect(combined).toBe(mask);
    });

    it('should handle overlapping masks', () => {
      const mask1 = (1 << TYPE_NUMBER) | (1 << TYPE_STRING);
      const mask2 = (1 << TYPE_STRING) | (1 << TYPE_BOOLEAN);
      const combined = combineMasks(mask1, mask2);

      expect(combined).toBe(
        (1 << TYPE_NUMBER) | (1 << TYPE_STRING) | (1 << TYPE_BOOLEAN)
      );
    });

    it('should work with TypeMasks constants', () => {
      const combined = combineMasks(TypeMasks.NUMBER, TypeMasks.STRING, TypeMasks.BOOLEAN);
      expect(combined).toBe(TypeMasks.SCALAR);
    });
  });

  describe('getTypeMaskForValue - edge cases', () => {
    it('should handle BigInt values', () => {
      const mask = getTypeMaskForValue(BigInt(123));
      expect(mask).toBe(1 << TYPE_BIGINT);
    });

    it('should handle Symbol values', () => {
      const mask = getTypeMaskForValue(Symbol('test'));
      expect(mask).toBe(1 << TYPE_SYMBOL);
    });

    it('should handle Map values', () => {
      const mask = getTypeMaskForValue(new Map());
      expect(mask).toBe(1 << TYPE_MAP);
    });

    it('should handle Set values', () => {
      const mask = getTypeMaskForValue(new Set());
      expect(mask).toBe(1 << TYPE_SET);
    });

    it('should handle WeakMap values', () => {
      const mask = getTypeMaskForValue(new WeakMap());
      expect(mask).toBe(1 << TYPE_WEAKMAP);
    });

    it('should handle WeakSet values', () => {
      const mask = getTypeMaskForValue(new WeakSet());
      expect(mask).toBe(1 << TYPE_WEAKSET);
    });
  });

  describe('TypeMasks constants - modern types', () => {
    it('should have BIGINT mask', () => {
      expect(TypeMasks.BIGINT).toBe(1 << TYPE_BIGINT);
    });

    it('should have SYMBOL mask', () => {
      expect(TypeMasks.SYMBOL).toBe(1 << TYPE_SYMBOL);
    });

    it('should have MAP mask', () => {
      expect(TypeMasks.MAP).toBe(1 << TYPE_MAP);
    });

    it('should have SET mask', () => {
      expect(TypeMasks.SET).toBe(1 << TYPE_SET);
    });

    it('should have WEAKMAP mask', () => {
      expect(TypeMasks.WEAKMAP).toBe(1 << TYPE_WEAKMAP);
    });

    it('should have WEAKSET mask', () => {
      expect(TypeMasks.WEAKSET).toBe(1 << TYPE_WEAKSET);
    });

    it('should have NUMERIC mask (number | BigInt)', () => {
      expect(TypeMasks.NUMERIC).toBe((1 << TYPE_NUMBER) | (1 << TYPE_BIGINT));
    });

    it('should have COLLECTION mask (Map | Set)', () => {
      expect(TypeMasks.COLLECTION).toBe((1 << TYPE_MAP) | (1 << TYPE_SET));
    });

    it('should have WEAK_COLLECTION mask (WeakMap | WeakSet)', () => {
      expect(TypeMasks.WEAK_COLLECTION).toBe((1 << TYPE_WEAKMAP) | (1 << TYPE_WEAKSET));
    });

    it('should have ANY_COLLECTION mask (Array | Map | Set)', () => {
      expect(TypeMasks.ANY_COLLECTION).toBe(
        (1 << TYPE_ARRAY) | (1 << TYPE_MAP) | (1 << TYPE_SET)
      );
    });

    it('should have ALL_ITERABLE mask (Array | Map | Set | string)', () => {
      expect(TypeMasks.ALL_ITERABLE).toBe(
        (1 << TYPE_ARRAY) | (1 << TYPE_MAP) | (1 << TYPE_SET) | (1 << TYPE_STRING)
      );
    });
  });

  describe('TypeMasks constants - existing types', () => {
    it('should have NUMBER mask', () => {
      expect(TypeMasks.NUMBER).toBe(1 << TYPE_NUMBER);
    });

    it('should have STRING mask', () => {
      expect(TypeMasks.STRING).toBe(1 << TYPE_STRING);
    });

    it('should have BOOLEAN mask', () => {
      expect(TypeMasks.BOOLEAN).toBe(1 << TYPE_BOOLEAN);
    });

    it('should have NUMERIC_OR_STRING mask', () => {
      expect(TypeMasks.NUMERIC_OR_STRING).toBe(
        (1 << TYPE_NUMBER) | (1 << TYPE_STRING)
      );
    });

    it('should have NUMERIC_OR_BOOLEAN mask', () => {
      expect(TypeMasks.NUMERIC_OR_BOOLEAN).toBe(
        (1 << TYPE_NUMBER) | (1 << TYPE_BOOLEAN)
      );
    });

    it('should have ARRAY mask', () => {
      expect(TypeMasks.ARRAY).toBe(1 << TYPE_ARRAY);
    });

    it('should have OBJECT mask', () => {
      expect(TypeMasks.OBJECT).toBe(1 << TYPE_OBJECT);
    });

    it('should have ARRAY_LIKE mask', () => {
      expect(TypeMasks.ARRAY_LIKE).toBe((1 << TYPE_ARRAY) | (1 << TYPE_OBJECT));
    });

    it('should have ITERABLE mask', () => {
      expect(TypeMasks.ITERABLE).toBe(
        (1 << TYPE_ARRAY) | (1 << TYPE_STRING) | (1 << TYPE_OBJECT)
      );
    });

    it('should have FUNCTION mask', () => {
      expect(TypeMasks.FUNCTION).toBe(1 << TYPE_FUNCTION);
    });

    it('should have OPTIONAL_FUNCTION mask', () => {
      expect(TypeMasks.OPTIONAL_FUNCTION).toBe(
        (1 << TYPE_FUNCTION) | (1 << TYPE_NULL)
      );
    });

    it('should have DATE mask', () => {
      expect(TypeMasks.DATE).toBe(1 << TYPE_DATE);
    });

    it('should have REGEXP mask', () => {
      expect(TypeMasks.REGEXP).toBe(1 << TYPE_REGEXP);
    });

    it('should have DATE_LIKE mask', () => {
      expect(TypeMasks.DATE_LIKE).toBe(
        (1 << TYPE_DATE) | (1 << TYPE_STRING) | (1 << TYPE_NUMBER)
      );
    });

    it('should have NULL mask', () => {
      expect(TypeMasks.NULL).toBe(1 << TYPE_NULL);
    });

    it('should have UNDEFINED mask', () => {
      expect(TypeMasks.UNDEFINED).toBe(1 << TYPE_UNDEFINED);
    });

    it('should have NULLISH mask', () => {
      expect(TypeMasks.NULLISH).toBe((1 << TYPE_NULL) | (1 << TYPE_UNDEFINED));
    });

    it('should have PRIMITIVE mask', () => {
      expect(TypeMasks.PRIMITIVE).toBe(
        (1 << TYPE_NUMBER) | (1 << TYPE_STRING) | (1 << TYPE_BOOLEAN) |
        (1 << TYPE_NULL) | (1 << TYPE_UNDEFINED)
      );
    });

    it('should have SCALAR mask', () => {
      expect(TypeMasks.SCALAR).toBe(
        (1 << TYPE_NUMBER) | (1 << TYPE_STRING) | (1 << TYPE_BOOLEAN)
      );
    });

    it('should have OPTIONAL_NUMBER mask', () => {
      expect(TypeMasks.OPTIONAL_NUMBER).toBe(
        (1 << TYPE_NUMBER) | (1 << TYPE_NULL) | (1 << TYPE_UNDEFINED)
      );
    });

    it('should have OPTIONAL_STRING mask', () => {
      expect(TypeMasks.OPTIONAL_STRING).toBe(
        (1 << TYPE_STRING) | (1 << TYPE_NULL) | (1 << TYPE_UNDEFINED)
      );
    });

    it('should have OPTIONAL_BOOLEAN mask', () => {
      expect(TypeMasks.OPTIONAL_BOOLEAN).toBe(
        (1 << TYPE_BOOLEAN) | (1 << TYPE_NULL) | (1 << TYPE_UNDEFINED)
      );
    });

    it('should have OPTIONAL_ARRAY mask', () => {
      expect(TypeMasks.OPTIONAL_ARRAY).toBe(
        (1 << TYPE_ARRAY) | (1 << TYPE_NULL) | (1 << TYPE_UNDEFINED)
      );
    });

    it('should have OPTIONAL_OBJECT mask', () => {
      expect(TypeMasks.OPTIONAL_OBJECT).toBe(
        (1 << TYPE_OBJECT) | (1 << TYPE_NULL) | (1 << TYPE_UNDEFINED)
      );
    });

    it('should have ANY_OBJECT mask', () => {
      expect(TypeMasks.ANY_OBJECT).toBe(
        (1 << TYPE_OBJECT) | (1 << TYPE_ARRAY) | (1 << TYPE_DATE) |
        (1 << TYPE_REGEXP) | (1 << TYPE_FUNCTION)
      );
    });

    it('should have ANY mask', () => {
      expect(TypeMasks.ANY).toBe(TYPE_ANY_MASK);
    });
  });

  describe('mask utility functions combined usage', () => {
    it('should create complex masks with utility functions', () => {
      // Create a mask for: number | string | null | undefined
      const mask = optionalMask(combineMasks(TypeMasks.NUMBER, TypeMasks.STRING));

      expect(typeMatches(getTypeMaskForValue(42), mask)).toBe(true);
      expect(typeMatches(getTypeMaskForValue('hello'), mask)).toBe(true);
      expect(typeMatches(getTypeMaskForValue(null), mask)).toBe(true);
      expect(typeMatches(getTypeMaskForValue(undefined), mask)).toBe(true);
      expect(typeMatches(getTypeMaskForValue(true), mask)).toBe(false);
    });

    it('should create nullable arrays', () => {
      const mask = nullableMask(TypeMasks.ARRAY);

      expect(typeMatches(getTypeMaskForValue([1, 2, 3]), mask)).toBe(true);
      expect(typeMatches(getTypeMaskForValue(null), mask)).toBe(true);
      expect(typeMatches(getTypeMaskForValue(undefined), mask)).toBe(false);
    });

    it('should combine custom types with built-ins', () => {
      registerCustomType('MyCustom');
      const customMask = createMask(['MyCustom']);
      const combined = combineMasks(TypeMasks.NUMBER, customMask);

      expect(typeMatches(getTypeMaskForValue(42), combined)).toBe(true);
    });
  });

  describe('maskToTypeNames with complex masks', () => {
    it('should return multiple type names for combined mask', () => {
      const mask = combineMasks(TypeMasks.NUMBER, TypeMasks.STRING, TypeMasks.BOOLEAN);
      const names = maskToTypeNames(mask);

      expect(names).toContain('number');
      expect(names).toContain('string');
      expect(names).toContain('boolean');
    });

    it('should return ["any"] for ANY_MASK', () => {
      const names = maskToTypeNames(TYPE_ANY_MASK);
      expect(names).toEqual(['any']);
    });

    it('should return ["unknown"] for zero mask', () => {
      const names = maskToTypeNames(0);
      expect(names).toEqual(['unknown']);
    });
  });
});
