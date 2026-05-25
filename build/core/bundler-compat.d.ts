/**
 * Bundler Compatibility Module for typed-function
 *
 * This module provides robust type identification mechanisms that survive
 * bundler transformations (esbuild, webpack, rollup, etc.) including:
 *
 * - Symbol-based type identification
 * - Constructor registry using WeakMap
 * - Brand checking patterns
 *
 * These mechanisms address issues where class instances are not recognized
 * after compilation due to prototype chain breakage or constructor renaming.
 *
 * @see docs/TYPED_FUNCTION_IMPROVEMENTS.md
 */
/**
 * Well-known symbol for typed-function type identification.
 *
 * Classes can implement this to ensure type recognition survives bundling:
 *
 * @example
 * ```typescript
 * import { TYPE_SYMBOL } from 'typed-function';
 *
 * class DenseMatrix {
 *   [TYPE_SYMBOL] = 'DenseMatrix';
 * }
 *
 * // Type test becomes bundler-safe:
 * typed.addType({
 *   name: 'DenseMatrix',
 *   test: (x) => x && x[TYPE_SYMBOL] === 'DenseMatrix'
 * });
 * ```
 */
export declare const TYPE_SYMBOL: unique symbol;
/**
 * Symbol for brand-based type checking (TypeScript branded types pattern).
 *
 * This provides an alternative to TYPE_SYMBOL for cases where you want
 * TypeScript-style branded types.
 *
 * @example
 * ```typescript
 * import { BRAND_SYMBOL } from 'typed-function';
 *
 * interface Branded<T extends string> {
 *   readonly [BRAND_SYMBOL]: T;
 * }
 *
 * class Complex implements Branded<'Complex'> {
 *   readonly [BRAND_SYMBOL] = 'Complex' as const;
 * }
 * ```
 */
export declare const BRAND_SYMBOL: unique symbol;
/**
 * Register a constructor with a type name.
 *
 * This allows type identification by constructor reference rather than name.
 *
 * @example
 * ```typescript
 * import { registerConstructor, getTypeByConstructor } from 'typed-function';
 *
 * class DenseMatrix { }
 * registerConstructor(DenseMatrix, 'DenseMatrix');
 *
 * // Later, in type test:
 * test: (x) => getTypeByConstructor(x?.constructor) === 'DenseMatrix'
 * ```
 *
 * @param constructor - The constructor function to register
 * @param typeName - The type name to associate with this constructor
 */
export declare function registerConstructor(constructor: Function, typeName: string): void;
/**
 * Unregister a constructor from the registry.
 *
 * @param constructor - The constructor to unregister
 * @returns true if the constructor was registered and removed, false otherwise
 */
export declare function unregisterConstructor(constructor: Function): boolean;
/**
 * Get the type name for a registered constructor.
 *
 * @param constructor - The constructor to look up
 * @returns The type name, or undefined if not registered
 */
export declare function getTypeByConstructor(constructor: Function | undefined | null): string | undefined;
/**
 * Check if a value is an instance of a registered type by constructor lookup.
 *
 * @param value - The value to check
 * @param typeName - The expected type name
 * @returns true if the value's constructor is registered with the given type name
 */
export declare function isRegisteredType(value: unknown, typeName: string): boolean;
/**
 * Register an instance with a type name using WeakSet tracking.
 *
 * This is useful for cases where constructor-based identification doesn't work,
 * such as objects created with Object.create() or cross-realm objects.
 *
 * @example
 * ```typescript
 * import { registerInstance, isRegisteredInstance } from 'typed-function';
 *
 * class Matrix {
 *   constructor() {
 *     registerInstance(this, 'Matrix');
 *   }
 * }
 *
 * // Type test:
 * test: (x) => isRegisteredInstance(x, 'Matrix')
 * ```
 *
 * @param instance - The instance to register
 * @param typeName - The type name to associate with this instance
 */
export declare function registerInstance(instance: object, typeName: string): void;
/**
 * Check if an instance is registered with a specific type name.
 *
 * @param instance - The instance to check
 * @param typeName - The expected type name
 * @returns true if the instance is registered with the given type name
 */
export declare function isRegisteredInstance(instance: unknown, typeName: string): boolean;
/**
 * Clear all registered instances for a type name.
 *
 * Note: This creates a new WeakSet, existing instances will no longer be tracked.
 *
 * @param typeName - The type name to clear instances for
 */
export declare function clearInstanceRegistry(typeName: string): void;
/**
 * Clear all instance registries.
 */
export declare function clearAllInstanceRegistries(): void;
/**
 * Check if a value has a typed-function type symbol.
 *
 * @param value - The value to check
 * @returns The type name from the symbol, or undefined if not present
 */
export declare function getTypeFromSymbol(value: unknown): string | undefined;
/**
 * Check if a value has a brand symbol.
 *
 * @param value - The value to check
 * @returns The brand name from the symbol, or undefined if not present
 */
export declare function getBrandFromSymbol(value: unknown): string | undefined;
/**
 * Create a bundler-safe type test function.
 *
 * This function creates a type test that uses multiple identification strategies
 * in order of reliability:
 * 1. Symbol-based identification (TYPE_SYMBOL)
 * 2. Brand-based identification (BRAND_SYMBOL)
 * 3. Constructor registry lookup
 * 4. Instance registry lookup
 * 5. Fallback custom test function
 *
 * @example
 * ```typescript
 * import { createBundlerSafeTest } from 'typed-function';
 *
 * typed.addType({
 *   name: 'DenseMatrix',
 *   test: createBundlerSafeTest('DenseMatrix', {
 *     fallback: (x) => x && typeof x.get === 'function' && Array.isArray(x._size)
 *   })
 * });
 * ```
 *
 * @param typeName - The type name to check for
 * @param options - Optional configuration
 * @returns A type test function
 */
export declare function createBundlerSafeTest(typeName: string, options?: {
    /** Custom fallback test function */
    fallback?: (value: unknown) => boolean;
    /** Whether to check the constructor registry (default: true) */
    checkConstructor?: boolean;
    /** Whether to check the instance registry (default: true) */
    checkInstance?: boolean;
    /** Whether to check symbols (default: true) */
    checkSymbols?: boolean;
}): (value: unknown) => boolean;
/**
 * Helper to create a class that is automatically registered with typed-function.
 *
 * @example
 * ```typescript
 * import { createTypedClass, TYPE_SYMBOL } from 'typed-function';
 *
 * const DenseMatrix = createTypedClass('DenseMatrix', class {
 *   constructor(public data: number[][]) {}
 * });
 *
 * const m = new DenseMatrix([[1, 2], [3, 4]]);
 * m[TYPE_SYMBOL] // 'DenseMatrix'
 * ```
 *
 * @param typeName - The type name for this class
 * @param BaseClass - The base class to extend
 * @returns A new class with type identification built in
 */
export declare function createTypedClass<T extends new (...args: unknown[]) => object>(typeName: string, BaseClass: T): T;
/**
 * Decorator-style function to add type identification to an existing class.
 *
 * @example
 * ```typescript
 * import { addTypeIdentification, TYPE_SYMBOL } from 'typed-function';
 *
 * class MyMatrix {
 *   constructor(public data: number[][]) {}
 * }
 *
 * // Add type identification
 * addTypeIdentification(MyMatrix, 'Matrix');
 *
 * // Now instances have TYPE_SYMBOL
 * const m = new MyMatrix([[1, 2]]);
 * m[TYPE_SYMBOL] // 'Matrix'
 * ```
 *
 * @param Class - The class to modify
 * @param typeName - The type name to assign
 */
export declare function addTypeIdentification<T extends new (...args: unknown[]) => object>(Class: T, typeName: string): void;
/**
 * Type identification result with details about how the type was identified.
 */
export interface TypeIdentificationResult {
    /** The identified type name, or null if not identified */
    typeName: string | null;
    /** The method used to identify the type */
    method: 'symbol' | 'brand' | 'constructor' | 'instance' | 'fallback' | 'none';
}
/**
 * Identify a value's type using all available methods, returning details.
 *
 * This is useful for debugging type identification issues.
 *
 * @param value - The value to identify
 * @param expectedType - Optional expected type name to check
 * @returns Details about type identification
 */
export declare function identifyType(value: unknown, expectedType?: string): TypeIdentificationResult;
//# sourceMappingURL=bundler-compat.d.ts.map