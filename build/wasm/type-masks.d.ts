/**
 * Type Mask Assignment for typed-function dispatch
 *
 * Maps JavaScript type checks to bit masks for WASM dispatch.
 */
/** Type ID for number */
export declare const TYPE_NUMBER = 0;
/** Type ID for string */
export declare const TYPE_STRING = 1;
/** Type ID for boolean */
export declare const TYPE_BOOLEAN = 2;
/** Type ID for Function */
export declare const TYPE_FUNCTION = 3;
/** Type ID for Array */
export declare const TYPE_ARRAY = 4;
/** Type ID for Date */
export declare const TYPE_DATE = 5;
/** Type ID for RegExp */
export declare const TYPE_REGEXP = 6;
/** Type ID for Object */
export declare const TYPE_OBJECT = 7;
/** Type ID for null */
export declare const TYPE_NULL = 8;
/** Type ID for undefined */
export declare const TYPE_UNDEFINED = 9;
/** Mask for any type (matches all) */
export declare const TYPE_ANY_MASK = 4294967295;
/**
 * Get the type bit for a type name
 *
 * @param typeName - The type name
 * @returns The type bit position
 */
export declare function getTypeBit(typeName: string): number;
/**
 * Get the type mask for a type name
 *
 * @param typeName - The type name
 * @returns The type mask (1 << bit for single types, or ANY_MASK for 'any')
 */
export declare function getTypeMaskForName(typeName: string): number;
/**
 * Get the type mask for a runtime value
 *
 * @param value - The value to check
 * @returns The type mask representing the value's type
 */
export declare function getTypeMaskForValue(value: unknown): number;
/**
 * Get combined mask for a parameter's types
 *
 * @param typeNames - Array of type names that the parameter accepts
 * @returns Combined mask (OR of all type masks)
 */
export declare function getParamMask(typeNames: string[]): number;
/**
 * Get array of type masks for all arguments
 *
 * @param args - The arguments
 * @returns Array of type masks
 */
export declare function getArgMasks(args: ArrayLike<unknown>): number[];
/**
 * Check if a value's mask matches an expected parameter mask
 *
 * @param valueMask - The value's type mask
 * @param paramMask - The expected parameter mask
 * @returns true if matches
 */
export declare function typeMatches(valueMask: number, paramMask: number): boolean;
/**
 * Reset custom type assignments (for testing)
 */
export declare function resetTypeMasks(): void;
/**
 * Register a custom type with its test function
 *
 * @param typeName - The type name
 * @returns The assigned type bit
 */
export declare function registerCustomType(typeName: string): number;
/**
 * Get human-readable type name from mask
 * (for debugging and error messages)
 *
 * @param mask - The type mask
 * @returns Type name(s) as string
 */
export declare function maskToTypeNames(mask: number): string[];
/**
 * Pre-built type masks for common type patterns
 * These combine multiple types into a single mask for efficient dispatch
 */
export declare const TypeMasks: {
    /** Matches number only */
    readonly NUMBER: number;
    /** Matches string only */
    readonly STRING: number;
    /** Matches boolean only */
    readonly BOOLEAN: number;
    /** Matches number | string (common for math operations) */
    readonly NUMERIC_OR_STRING: number;
    /** Matches number | boolean (truthy/falsy conversions) */
    readonly NUMERIC_OR_BOOLEAN: number;
    /** Matches Array only */
    readonly ARRAY: number;
    /** Matches Object only (plain objects) */
    readonly OBJECT: number;
    /** Matches Array | Object (collection-like) */
    readonly ARRAY_LIKE: number;
    /** Matches iterable types: Array | string | Object */
    readonly ITERABLE: number;
    /** Matches Function only */
    readonly FUNCTION: number;
    /** Matches Function | null (optional callback) */
    readonly OPTIONAL_FUNCTION: number;
    /** Matches Date only */
    readonly DATE: number;
    /** Matches RegExp only */
    readonly REGEXP: number;
    /** Matches Date | string (parseable dates) */
    readonly DATE_LIKE: number;
    /** Matches null only */
    readonly NULL: number;
    /** Matches undefined only */
    readonly UNDEFINED: number;
    /** Matches null | undefined (nullish) */
    readonly NULLISH: number;
    /** Matches any primitive: number | string | boolean | null | undefined */
    readonly PRIMITIVE: number;
    /** Matches any scalar: number | string | boolean */
    readonly SCALAR: number;
    /** Optional number */
    readonly OPTIONAL_NUMBER: number;
    /** Optional string */
    readonly OPTIONAL_STRING: number;
    /** Optional boolean */
    readonly OPTIONAL_BOOLEAN: number;
    /** Optional array */
    readonly OPTIONAL_ARRAY: number;
    /** Optional object */
    readonly OPTIONAL_OBJECT: number;
    /** Matches any object type: Object | Array | Date | RegExp | Function */
    readonly ANY_OBJECT: number;
    /** Matches all types (same as any) */
    readonly ANY: 4294967295;
};
/**
 * Create a custom type mask by combining type names
 *
 * @param typeNames - Array of type names to combine
 * @returns Combined mask
 *
 * @example
 * ```ts
 * const numericMask = createMask(['number', 'string', 'boolean']);
 * ```
 */
export declare function createMask(typeNames: string[]): number;
/**
 * Create an optional mask (type | null | undefined)
 *
 * @param baseMask - The base type mask
 * @returns Mask with null and undefined added
 */
export declare function optionalMask(baseMask: number): number;
/**
 * Create a nullable mask (type | null)
 *
 * @param baseMask - The base type mask
 * @returns Mask with null added
 */
export declare function nullableMask(baseMask: number): number;
/**
 * Combine multiple masks with OR
 *
 * @param masks - Masks to combine
 * @returns Combined mask
 */
export declare function combineMasks(...masks: number[]): number;
//# sourceMappingURL=type-masks.d.ts.map