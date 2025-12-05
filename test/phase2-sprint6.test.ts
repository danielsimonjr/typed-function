/**
 * Phase 2 Sprint 6: Type Registry Complete Coverage Tests
 *
 * Tests covering:
 * - getTypeMask with custom types
 * - conversionsTo initialization
 * - Symbol.iterator iteration
 * - keys() and values() methods
 * - Type index assignment after multiple addTypes
 * - Clear and reset operations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  TypeRegistry,
  createTypeRegistry,
  BUILTIN_TYPES,
} from '../src/core/type-registry.js';

describe('Phase 2 Sprint 6: Type Registry Complete Coverage', () => {
  let registry: TypeRegistry;

  beforeEach(() => {
    registry = createTypeRegistry();
  });

  describe('Type Registry - Basic Properties', () => {
    it('should return correct size', () => {
      expect(registry.size).toBeGreaterThan(0);
      expect(registry.size).toBe(registry.typeCount);
    });

    it('should return type list copy', () => {
      const list1 = registry.getTypeList();
      const list2 = registry.getTypeList();
      expect(list1).toEqual(list2);
      expect(list1).not.toBe(list2); // Different references
    });

    it('should check type existence with hasType', () => {
      expect(registry.hasType('number')).toBe(true);
      expect(registry.hasType('nonexistent')).toBe(false);
    });
  });

  describe('Type Registry - findType', () => {
    it('should find existing type', () => {
      const type = registry.findType('number');
      expect(type.name).toBe('number');
      expect(type.index).toBeGreaterThanOrEqual(0);
    });

    it('should throw for unknown type', () => {
      expect(() => registry.findType('unknownType')).toThrow(TypeError);
      expect(() => registry.findType('unknownType')).toThrow('Unknown type "unknownType"');
    });

    it('should suggest similar type name', () => {
      // Case-insensitive match suggestion
      expect(() => registry.findType('Number')).toThrow('Did you mean "number"?');
      expect(() => registry.findType('STRING')).toThrow('Did you mean "string"?');
    });
  });

  describe('Type Registry - getType', () => {
    it('should return type or undefined', () => {
      expect(registry.getType('number')).toBeDefined();
      expect(registry.getType('nonexistent')).toBeUndefined();
    });
  });

  describe('Type Registry - addTypes', () => {
    it('should add single type', () => {
      const initialSize = registry.size;
      registry.addTypes([{ name: 'positive', test: (x) => typeof x === 'number' && x > 0 }]);
      expect(registry.size).toBe(initialSize + 1);
      expect(registry.hasType('positive')).toBe(true);
    });

    it('should add multiple types', () => {
      const initialSize = registry.size;
      registry.addTypes([
        { name: 'even', test: (x) => typeof x === 'number' && x % 2 === 0 },
        { name: 'odd', test: (x) => typeof x === 'number' && x % 2 !== 0 },
      ]);
      expect(registry.size).toBe(initialSize + 2);
    });

    it('should add type before specified type', () => {
      registry.addTypes([{ name: 'customFirst', test: () => false }], 'number');
      const types = registry.getTypeList();
      const customIndex = types.indexOf('customFirst');
      const numberIndex = types.indexOf('number');
      expect(customIndex).toBeLessThan(numberIndex);
    });

    it('should add type at end when beforeSpec is false', () => {
      registry.addTypes([{ name: 'lastType', test: () => false }], false);
      const types = registry.getTypeList();
      expect(types[types.length - 1]).toBe('lastType');
    });

    it('should throw for invalid type definition', () => {
      expect(() => registry.addTypes([{ name: 123 } as any])).toThrow(TypeError);
      expect(() => registry.addTypes([{ test: () => true } as any])).toThrow(TypeError);
      expect(() => registry.addTypes([null as any])).toThrow(TypeError);
    });

    it('should throw for duplicate type name', () => {
      expect(() =>
        registry.addTypes([{ name: 'number', test: () => true }])
      ).toThrow('Duplicate type name "number"');
    });

    it('should assign correct indices after insertion', () => {
      // Insert before 'string' and check indices
      registry.addTypes([{ name: 'beforeString', test: () => false }], 'string');
      const beforeType = registry.findType('beforeString');
      const stringType = registry.findType('string');
      expect(beforeType.index).toBeLessThan(stringType.index);
    });

    it('should update indices of affected types', () => {
      const stringTypeBefore = registry.findType('string');
      const originalStringIndex = stringTypeBefore.index;

      // Insert at beginning, after 'any' is at position 0 actually let's insert before 'number'
      registry.addTypes([{ name: 'insertedFirst', test: () => false }], 'number');

      const stringTypeAfter = registry.findType('string');
      expect(stringTypeAfter.index).toBe(originalStringIndex + 1);
    });

    it('should assign custom bit position for non-builtin types', () => {
      registry.addTypes([{ name: 'custom1', test: () => false }]);
      registry.addTypes([{ name: 'custom2', test: () => false }]);
      const bit1 = registry.getTypeBit('custom1');
      const bit2 = registry.getTypeBit('custom2');
      expect(bit1).toBeGreaterThanOrEqual(10); // Custom bits start at 10
      expect(bit2).toBeGreaterThan(bit1);
    });

    it('should add type with isAny property', () => {
      registry.addTypes([{ name: 'anything', test: () => true, isAny: true }]);
      const type = registry.findType('anything');
      expect(type.isAny).toBe(true);
    });
  });

  describe('Type Registry - getTypeMask', () => {
    it('should return correct mask for null', () => {
      const mask = registry.getTypeMask(null);
      expect(mask).toBe(1 << 8); // NULL_BIT = 8
    });

    it('should return correct mask for undefined', () => {
      const mask = registry.getTypeMask(undefined);
      expect(mask).toBe(1 << 9); // UNDEFINED_BIT = 9
    });

    it('should return correct mask for number', () => {
      const mask = registry.getTypeMask(42);
      expect(mask).toBe(1 << 0); // NUMBER_BIT = 0
    });

    it('should return correct mask for string', () => {
      const mask = registry.getTypeMask('hello');
      expect(mask).toBe(1 << 1); // STRING_BIT = 1
    });

    it('should return correct mask for boolean', () => {
      const mask = registry.getTypeMask(true);
      expect(mask).toBe(1 << 2); // BOOLEAN_BIT = 2
    });

    it('should return correct mask for function', () => {
      const mask = registry.getTypeMask(() => {});
      expect(mask).toBe(1 << 3); // FUNCTION_BIT = 3
    });

    it('should return correct mask for array', () => {
      const mask = registry.getTypeMask([1, 2, 3]);
      expect(mask).toBe(1 << 4); // ARRAY_BIT = 4
    });

    it('should return correct mask for Date', () => {
      const mask = registry.getTypeMask(new Date());
      expect(mask).toBe(1 << 5); // DATE_BIT = 5
    });

    it('should return correct mask for RegExp', () => {
      const mask = registry.getTypeMask(/test/);
      expect(mask).toBe(1 << 6); // REGEXP_BIT = 6
    });

    it('should return correct mask for plain object', () => {
      const mask = registry.getTypeMask({ a: 1 });
      expect(mask).toBe(1 << 7); // OBJECT_BIT = 7
    });

    it('should return mask for custom type', () => {
      // Add custom type that matches specific objects
      class MyClass {
        value: number = 42;
      }
      registry.addTypes([{ name: 'MyClass', test: (x) => x instanceof MyClass }]);
      const instance = new MyClass();
      const mask = registry.getTypeMask(instance);
      expect(mask).toBeGreaterThan(0);
    });

    it('should return 0 for symbol type', () => {
      const mask = registry.getTypeMask(Symbol('test'));
      expect(mask).toBe(0); // Default case
    });
  });

  describe('Type Registry - getTypeBit', () => {
    it('should return builtin bit positions', () => {
      expect(registry.getTypeBit('number')).toBe(0);
      expect(registry.getTypeBit('string')).toBe(1);
      expect(registry.getTypeBit('boolean')).toBe(2);
    });

    it('should return -1 for any type', () => {
      expect(registry.getTypeBit('any')).toBe(-1);
    });

    it('should assign new bit for unknown type', () => {
      const bit = registry.getTypeBit('newUnknownType');
      expect(bit).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Type Registry - findTypeNames', () => {
    it('should find matching types for number', () => {
      const names = registry.findTypeNames(42);
      expect(names).toContain('number');
    });

    it('should find matching types for string', () => {
      const names = registry.findTypeNames('hello');
      expect(names).toContain('string');
    });

    it('should return any for non-matching values', () => {
      const names = registry.findTypeNames(Symbol('test'));
      expect(names).toEqual(['any']);
    });

    it('should find custom type', () => {
      registry.addTypes([{ name: 'positive', test: (x) => typeof x === 'number' && (x as number) > 0 }]);
      const names = registry.findTypeNames(5);
      expect(names).toContain('positive');
      expect(names).toContain('number');
    });
  });

  describe('Type Registry - clear', () => {
    it('should reset registry to only any type', () => {
      registry.clear();
      expect(registry.size).toBe(1);
      expect(registry.hasType('any')).toBe(true);
      expect(registry.hasType('number')).toBe(false);
    });

    it('should reset type indices', () => {
      registry.clear();
      const anyType = registry.findType('any');
      expect(anyType.index).toBe(0);
    });

    it('should allow adding types after clear', () => {
      registry.clear();
      registry.addTypes([{ name: 'custom', test: () => true }], false);
      expect(registry.hasType('custom')).toBe(true);
    });
  });

  describe('Type Registry - clearConversions', () => {
    it('should clear all conversions', () => {
      // First add some conversions via a conversion manager
      const type = registry.findType('number');
      type.conversionsTo.push({
        from: 'string',
        to: 'number',
        convert: (s) => Number(s),
      });
      expect(type.conversionsTo.length).toBe(1);

      registry.clearConversions();

      const typeAfter = registry.findType('number');
      expect(typeAfter.conversionsTo.length).toBe(0);
    });

    it('should keep types intact after clearing conversions', () => {
      const sizeBefore = registry.size;
      registry.clearConversions();
      expect(registry.size).toBe(sizeBefore);
    });
  });

  describe('Type Registry - Symbol.iterator', () => {
    it('should iterate over all types', () => {
      const entries: [string, any][] = [];
      for (const entry of registry) {
        entries.push(entry);
      }
      expect(entries.length).toBe(registry.size);
    });

    it('should yield name and type definition pairs', () => {
      for (const [name, type] of registry) {
        expect(typeof name).toBe('string');
        expect(type.name).toBe(name);
        expect(typeof type.test).toBe('function');
      }
    });

    it('should work with spread operator', () => {
      const entries = [...registry];
      expect(entries.length).toBe(registry.size);
    });
  });

  describe('Type Registry - keys()', () => {
    it('should return all type names', () => {
      const keys = registry.keys();
      expect(keys.length).toBe(registry.size);
      expect(keys).toContain('number');
      expect(keys).toContain('string');
      expect(keys).toContain('any');
    });

    it('should return types in order', () => {
      const keys = registry.keys();
      expect(keys).toEqual(registry.getTypeList());
    });

    it('should return a copy, not the original', () => {
      const keys1 = registry.keys();
      const keys2 = registry.keys();
      expect(keys1).not.toBe(keys2);
    });
  });

  describe('Type Registry - values()', () => {
    it('should return all type definitions', () => {
      const values = registry.values();
      expect(values.length).toBe(registry.size);
    });

    it('should return types in order', () => {
      const values = registry.values();
      const keys = registry.keys();
      values.forEach((type, i) => {
        expect(type.name).toBe(keys[i]);
      });
    });

    it('should filter out undefined entries', () => {
      // values() uses filter to remove undefined entries
      const values = registry.values();
      expect(values.every((v) => v !== undefined)).toBe(true);
    });
  });

  describe('Type Registry - Type index assignment', () => {
    it('should maintain correct indices after multiple addTypes', () => {
      // Add types at different positions
      registry.addTypes([{ name: 'type1', test: () => false }], 'string');
      registry.addTypes([{ name: 'type2', test: () => false }], 'boolean');
      registry.addTypes([{ name: 'type3', test: () => false }], false);

      const type1 = registry.findType('type1');
      const type2 = registry.findType('type2');
      const type3 = registry.findType('type3');
      const stringType = registry.findType('string');
      const booleanType = registry.findType('boolean');

      expect(type1.index).toBeLessThan(stringType.index);
      expect(type2.index).toBeLessThan(booleanType.index);
      expect(type3.index).toBe(registry.size - 1);
    });

    it('should verify all indices are unique', () => {
      const values = registry.values();
      const indices = values.map((v) => v.index);
      const uniqueIndices = new Set(indices);
      expect(uniqueIndices.size).toBe(indices.length);
    });

    it('should have sequential indices', () => {
      const values = registry.values();
      const indices = values.map((v) => v.index).sort((a, b) => a - b);
      for (let i = 0; i < indices.length; i++) {
        expect(indices[i]).toBe(i);
      }
    });
  });

  describe('Type Registry - BUILTIN_TYPES', () => {
    it('should export BUILTIN_TYPES array', () => {
      expect(BUILTIN_TYPES).toBeDefined();
      expect(Array.isArray(BUILTIN_TYPES)).toBe(true);
    });

    it('should contain all expected types', () => {
      const typeNames = BUILTIN_TYPES.map((t) => t.name);
      expect(typeNames).toContain('number');
      expect(typeNames).toContain('string');
      expect(typeNames).toContain('boolean');
      expect(typeNames).toContain('Function');
      expect(typeNames).toContain('Array');
      expect(typeNames).toContain('Date');
      expect(typeNames).toContain('RegExp');
      expect(typeNames).toContain('Object');
      expect(typeNames).toContain('null');
      expect(typeNames).toContain('undefined');
    });

    it('should have working test functions', () => {
      const numberType = BUILTIN_TYPES.find((t) => t.name === 'number');
      expect(numberType?.test(42)).toBe(true);
      expect(numberType?.test('hello')).toBe(false);

      const arrayType = BUILTIN_TYPES.find((t) => t.name === 'Array');
      expect(arrayType?.test([1, 2, 3])).toBe(true);
      expect(arrayType?.test({})).toBe(false);
    });
  });

  describe('Type Registry - createTypeRegistry factory', () => {
    it('should create a new registry with builtin types', () => {
      const newRegistry = createTypeRegistry();
      expect(newRegistry.hasType('number')).toBe(true);
      expect(newRegistry.hasType('string')).toBe(true);
      expect(newRegistry.hasType('any')).toBe(true);
    });

    it('should create independent registries', () => {
      const registry1 = createTypeRegistry();
      const registry2 = createTypeRegistry();

      registry1.addTypes([{ name: 'onlyInRegistry1', test: () => false }]);

      expect(registry1.hasType('onlyInRegistry1')).toBe(true);
      expect(registry2.hasType('onlyInRegistry1')).toBe(false);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty type list correctly', () => {
      const emptyRegistry = new TypeRegistry();
      expect(emptyRegistry.size).toBe(0);
      expect(emptyRegistry.keys()).toEqual([]);
      expect(emptyRegistry.values()).toEqual([]);
    });

    it('should handle iteration on empty registry', () => {
      const emptyRegistry = new TypeRegistry();
      const entries = [...emptyRegistry];
      expect(entries).toEqual([]);
    });

    it('should handle findTypeNames with empty registry', () => {
      const emptyRegistry = new TypeRegistry();
      const names = emptyRegistry.findTypeNames(42);
      expect(names).toEqual(['any']);
    });

    it('should handle getTypeMask with class instance not matching custom types', () => {
      class UnknownClass {}
      const instance = new UnknownClass();
      const mask = registry.getTypeMask(instance);
      // Should fall through to Object type
      expect(mask).toBe(1 << 7); // OBJECT_BIT
    });
  });
});
