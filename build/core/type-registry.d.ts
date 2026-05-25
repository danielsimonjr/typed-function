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
    /** Factory function for creating instances (bundler-safe) */
    factory?: (...args: unknown[]) => unknown;
    /** Constructor reference for bundler-safe identification */
    constructor?: Function;
}
/**
 * Type Registry class for managing type definitions
 */
export declare class TypeRegistry {
    /** Primary store of all types */
    private typeMap;
    /** Ordered array of type names */
    private typeList;
    /** Map from type name to bit position for WASM dispatch */
    private typeIdMap;
    /** Next available bit position for custom types */
    private nextTypeBit;
    /** Built-in type bit positions */
    private static readonly BUILTIN_TYPE_BITS;
    /**
     * Create a new TypeRegistry instance
     */
    constructor();
    /**
     * Get the number of registered types
     */
    get size(): number;
    /**
     * Alias for size - get the number of registered types
     */
    get typeCount(): number;
    /**
     * Get a copy of the type list
     */
    getTypeList(): string[];
    /**
     * Check if a type exists
     */
    hasType(typeName: string): boolean;
    /**
     * Find a type by name, throwing a helpful error if not found
     *
     * @param typeName - The name of the type to find
     * @returns The type definition
     * @throws TypeError if the type is not found
     */
    findType(typeName: string): InternalTypeDef;
    /**
     * Get a type by name, or undefined if not found
     */
    getType(typeName: string): InternalTypeDef | undefined;
    /**
     * Add an array of type definitions to the registry
     *
     * @param types - Array of type definitions to add
     * @param beforeSpec - Name of type to insert before, or false to append
     * @throws TypeError if types are invalid or duplicate
     */
    addTypes(types: TypeDef[], beforeSpec?: string | boolean): void;
    /**
     * Get the bit mask for a value based on its runtime type
     *
     * This is used for WASM-accelerated dispatch
     *
     * @param value - The value to get the type mask for
     * @returns A bit mask representing the value's type
     */
    getTypeMask(value: unknown): number;
    /**
     * Get the bit position for a type name
     */
    getTypeBit(typeName: string): number;
    /**
     * Find all type names that match a value
     *
     * @param value - The value to check
     * @returns Array of matching type names, or ['any'] if no specific matches
     */
    findTypeNames(value: unknown): string[];
    /**
     * Clear all types and conversions, resetting to default 'any' type
     */
    clear(): void;
    /**
     * Clear all conversions, keeping types intact
     */
    clearConversions(): void;
    /**
     * Iterate over all types
     */
    [Symbol.iterator](): Iterator<[string, InternalTypeDef]>;
    /**
     * Get all type names in order
     */
    keys(): string[];
    /**
     * Get all type definitions in order
     */
    values(): InternalTypeDef[];
}
/**
 * Default built-in types for initialization
 */
export declare const BUILTIN_TYPES: TypeDef[];
/**
 * Create and initialize a new TypeRegistry with default types
 */
export declare function createTypeRegistry(): TypeRegistry;
//# sourceMappingURL=type-registry.d.ts.map