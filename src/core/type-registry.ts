/**
 * Type Registry - Manages type storage and lookup for typed-function
 *
 * This module provides a Map-based registry for storing type definitions,
 * with support for type ordering, bit masks (for future WASM optimization),
 * and helpful error messages.
 */

import type { TypeDef, ConversionDef } from './types.js';

/**
 * Internal type definition with guaranteed index and conversionsTo
 */
export interface InternalTypeDef {
  name: string;
  test: (x: unknown) => boolean;
  isAny: boolean;
  index: number;
  conversionsTo: ConversionDef[];
}

/**
 * Type Registry class for managing type definitions
 */
export class TypeRegistry {
  /** Primary store of all types */
  private typeMap: Map<string, InternalTypeDef> = new Map();

  /** Ordered array of type names */
  private typeList: string[] = [];

  /** Map from type name to bit position for WASM dispatch */
  private typeIdMap: Map<string, number> = new Map();

  /** Next available bit position for custom types */
  private nextTypeBit = 10;

  /** Built-in type bit positions */
  private static readonly BUILTIN_TYPE_BITS: Record<string, number> = {
    number: 0,
    string: 1,
    boolean: 2,
    Function: 3,
    Array: 4,
    Date: 5,
    RegExp: 6,
    Object: 7,
    null: 8,
    undefined: 9,
  };

  /**
   * Create a new TypeRegistry instance
   */
  constructor() {
    // Initialize with empty state - call clear() to add default types
  }

  /**
   * Get the number of registered types
   */
  get size(): number {
    return this.typeList.length;
  }

  /**
   * Alias for size - get the number of registered types
   */
  get typeCount(): number {
    return this.typeList.length;
  }

  /**
   * Get a copy of the type list
   */
  getTypeList(): string[] {
    return [...this.typeList];
  }

  /**
   * Check if a type exists
   */
  hasType(typeName: string): boolean {
    return this.typeMap.has(typeName);
  }

  /**
   * Find a type by name, throwing a helpful error if not found
   *
   * @param typeName - The name of the type to find
   * @returns The type definition
   * @throws TypeError if the type is not found
   */
  findType(typeName: string): InternalTypeDef {
    const type = this.typeMap.get(typeName);
    if (type) {
      return type;
    }

    // Provide helpful error message with suggestions
    let message = `Unknown type "${typeName}"`;
    const nameLower = typeName.toLowerCase();

    for (const otherName of this.typeList) {
      if (otherName.toLowerCase() === nameLower) {
        message += `. Did you mean "${otherName}"?`;
        break;
      }
    }

    throw new TypeError(message);
  }

  /**
   * Get a type by name, or undefined if not found
   */
  getType(typeName: string): InternalTypeDef | undefined {
    return this.typeMap.get(typeName);
  }

  /**
   * Add an array of type definitions to the registry
   *
   * @param types - Array of type definitions to add
   * @param beforeSpec - Name of type to insert before, or false to append
   * @throws TypeError if types are invalid or duplicate
   */
  addTypes(types: TypeDef[], beforeSpec: string | boolean = 'any'): void {
    const beforeIndex = beforeSpec
      ? this.findType(beforeSpec as string).index
      : this.typeList.length;

    const newTypes: string[] = [];

    for (let i = 0; i < types.length; i++) {
      const typeDef = types[i];

      if (!typeDef || typeof typeDef.name !== 'string' || typeof typeDef.test !== 'function') {
        throw new TypeError('Object with properties {name: string, test: function} expected');
      }

      const typeName = typeDef.name;

      if (this.typeMap.has(typeName)) {
        throw new TypeError(`Duplicate type name "${typeName}"`);
      }

      newTypes.push(typeName);

      const internalType: InternalTypeDef = {
        name: typeName,
        test: typeDef.test,
        isAny: typeDef.isAny === true,
        index: beforeIndex + i,
        conversionsTo: [],
      };

      this.typeMap.set(typeName, internalType);

      // Assign bit position for WASM dispatch
      const builtinBit = TypeRegistry.BUILTIN_TYPE_BITS[typeName];
      if (builtinBit !== undefined) {
        this.typeIdMap.set(typeName, builtinBit);
      } else if (typeName === 'any') {
        // 'any' type gets all bits set (handled specially)
        this.typeIdMap.set(typeName, -1);
      } else {
        this.typeIdMap.set(typeName, this.nextTypeBit++);
      }
    }

    // Update the typeList
    const affectedTypes = this.typeList.slice(beforeIndex);
    this.typeList = this.typeList.slice(0, beforeIndex).concat(newTypes).concat(affectedTypes);

    // Fix the indices for affected types
    for (let i = beforeIndex + newTypes.length; i < this.typeList.length; i++) {
      const typeName = this.typeList[i];
      if (typeName !== undefined) {
        const type = this.typeMap.get(typeName);
        if (type) {
          type.index = i;
        }
      }
    }
  }

  /**
   * Get the bit mask for a value based on its runtime type
   *
   * This is used for WASM-accelerated dispatch
   *
   * @param value - The value to get the type mask for
   * @returns A bit mask representing the value's type
   */
  getTypeMask(value: unknown): number {
    // Bit positions for built-in types (constants)
    const NULL_BIT = 8;
    const UNDEFINED_BIT = 9;
    const NUMBER_BIT = 0;
    const STRING_BIT = 1;
    const BOOLEAN_BIT = 2;
    const FUNCTION_BIT = 3;
    const ARRAY_BIT = 4;
    const DATE_BIT = 5;
    const REGEXP_BIT = 6;
    const OBJECT_BIT = 7;

    if (value === null) return 1 << NULL_BIT;
    if (value === undefined) return 1 << UNDEFINED_BIT;

    switch (typeof value) {
      case 'number':
        return 1 << NUMBER_BIT;
      case 'string':
        return 1 << STRING_BIT;
      case 'boolean':
        return 1 << BOOLEAN_BIT;
      case 'function':
        return 1 << FUNCTION_BIT;
      case 'object': {
        if (Array.isArray(value)) return 1 << ARRAY_BIT;
        if (value instanceof Date) return 1 << DATE_BIT;
        if (value instanceof RegExp) return 1 << REGEXP_BIT;
        // Check custom types by iterating through registered types
        for (const [name, type] of this.typeMap) {
          if (!type.isAny && name !== 'Object' && type.test(value)) {
            const bit = this.typeIdMap.get(name);
            if (bit !== undefined && bit >= 0) {
              return 1 << bit;
            }
          }
        }
        return 1 << OBJECT_BIT;
      }
      default:
        return 0;
    }
  }

  /**
   * Get the bit position for a type name
   */
  getTypeBit(typeName: string): number {
    const bit = this.typeIdMap.get(typeName);
    if (bit !== undefined) {
      return bit;
    }
    // Assign new bit for unknown type
    const newBit = this.nextTypeBit++;
    this.typeIdMap.set(typeName, newBit);
    return newBit;
  }

  /**
   * Find all type names that match a value
   *
   * @param value - The value to check
   * @returns Array of matching type names, or ['any'] if no specific matches
   */
  findTypeNames(value: unknown): string[] {
    const matches = this.typeList.filter((name) => {
      const type = this.typeMap.get(name);
      return type && !type.isAny && type.test(value);
    });

    if (matches.length > 0) {
      return matches;
    }

    return ['any'];
  }

  /**
   * Clear all types and conversions, resetting to default 'any' type
   */
  clear(): void {
    this.typeMap = new Map();
    this.typeList = [];
    this.typeIdMap = new Map();
    this.nextTypeBit = 10;

    // Add the 'any' type which matches everything
    const anyType: TypeDef = {
      name: 'any',
      test: () => true,
      isAny: true,
    };

    this.addTypes([anyType], false);
  }

  /**
   * Clear all conversions, keeping types intact
   */
  clearConversions(): void {
    for (const typeName of this.typeList) {
      const type = this.typeMap.get(typeName);
      if (type) {
        type.conversionsTo = [];
      }
    }
  }

  /**
   * Iterate over all types
   */
  *[Symbol.iterator](): Iterator<[string, InternalTypeDef]> {
    for (const entry of this.typeMap) {
      yield entry;
    }
  }

  /**
   * Get all type names in order
   */
  keys(): string[] {
    return [...this.typeList];
  }

  /**
   * Get all type definitions in order
   */
  values(): InternalTypeDef[] {
    return this.typeList.map((name) => this.typeMap.get(name)).filter((t): t is InternalTypeDef => t !== undefined);
  }
}

/**
 * Default built-in types for initialization
 */
export const BUILTIN_TYPES: TypeDef[] = [
  { name: 'number', test: (x: unknown): x is number => typeof x === 'number' },
  { name: 'string', test: (x: unknown): x is string => typeof x === 'string' },
  { name: 'boolean', test: (x: unknown): x is boolean => typeof x === 'boolean' },
  { name: 'Function', test: (x: unknown): x is Function => typeof x === 'function' },
  { name: 'Array', test: (x: unknown): x is unknown[] => Array.isArray(x) },
  { name: 'Date', test: (x: unknown): x is Date => x instanceof Date },
  { name: 'RegExp', test: (x: unknown): x is RegExp => x instanceof RegExp },
  {
    name: 'Object',
    test: (x: unknown): x is Record<string, unknown> =>
      typeof x === 'object' && x !== null && x.constructor === Object,
  },
  { name: 'null', test: (x: unknown): x is null => x === null },
  { name: 'undefined', test: (x: unknown): x is undefined => x === undefined },
];

/**
 * Create and initialize a new TypeRegistry with default types
 */
export function createTypeRegistry(): TypeRegistry {
  const registry = new TypeRegistry();
  registry.clear();
  registry.addTypes(BUILTIN_TYPES);
  return registry;
}
