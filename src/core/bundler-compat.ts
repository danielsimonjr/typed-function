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
export const TYPE_SYMBOL = Symbol.for('typed-function:type');

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
export const BRAND_SYMBOL = Symbol.for('typed-function:brand');

/**
 * Constructor registry - maps constructors to type names.
 *
 * This WeakMap allows type identification even when:
 * - Classes are compiled/transpiled
 * - Constructor names are minified
 * - Multiple bundle versions exist
 */
const constructorRegistry = new WeakMap<Function, string>();

/**
 * Instance registry - for WeakSet-based instance tracking.
 *
 * Maps type names to WeakSets of instances.
 */
const instanceRegistry = new Map<string, WeakSet<object>>();

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
export function registerConstructor(constructor: Function, typeName: string): void {
  constructorRegistry.set(constructor, typeName);
}

/**
 * Unregister a constructor from the registry.
 *
 * @param constructor - The constructor to unregister
 * @returns true if the constructor was registered and removed, false otherwise
 */
export function unregisterConstructor(constructor: Function): boolean {
  return constructorRegistry.delete(constructor);
}

/**
 * Get the type name for a registered constructor.
 *
 * @param constructor - The constructor to look up
 * @returns The type name, or undefined if not registered
 */
export function getTypeByConstructor(constructor: Function | undefined | null): string | undefined {
  if (!constructor) return undefined;
  return constructorRegistry.get(constructor);
}

/**
 * Check if a value is an instance of a registered type by constructor lookup.
 *
 * @param value - The value to check
 * @param typeName - The expected type name
 * @returns true if the value's constructor is registered with the given type name
 */
export function isRegisteredType(value: unknown, typeName: string): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value !== 'object' && typeof value !== 'function') return false;

  const constructor = (value as object).constructor;
  return constructorRegistry.get(constructor) === typeName;
}

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
export function registerInstance(instance: object, typeName: string): void {
  let weakSet = instanceRegistry.get(typeName);
  if (!weakSet) {
    weakSet = new WeakSet();
    instanceRegistry.set(typeName, weakSet);
  }
  weakSet.add(instance);
}

/**
 * Check if an instance is registered with a specific type name.
 *
 * @param instance - The instance to check
 * @param typeName - The expected type name
 * @returns true if the instance is registered with the given type name
 */
export function isRegisteredInstance(instance: unknown, typeName: string): boolean {
  if (instance === null || instance === undefined) return false;
  if (typeof instance !== 'object') return false;

  const weakSet = instanceRegistry.get(typeName);
  return weakSet ? weakSet.has(instance) : false;
}

/**
 * Clear all registered instances for a type name.
 *
 * Note: This creates a new WeakSet, existing instances will no longer be tracked.
 *
 * @param typeName - The type name to clear instances for
 */
export function clearInstanceRegistry(typeName: string): void {
  instanceRegistry.delete(typeName);
}

/**
 * Clear all instance registries.
 */
export function clearAllInstanceRegistries(): void {
  instanceRegistry.clear();
}

/**
 * Check if a value has a typed-function type symbol.
 *
 * @param value - The value to check
 * @returns The type name from the symbol, or undefined if not present
 */
export function getTypeFromSymbol(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== 'object' && typeof value !== 'function') return undefined;

  const typeValue = (value as Record<symbol, unknown>)[TYPE_SYMBOL];
  return typeof typeValue === 'string' ? typeValue : undefined;
}

/**
 * Check if a value has a brand symbol.
 *
 * @param value - The value to check
 * @returns The brand name from the symbol, or undefined if not present
 */
export function getBrandFromSymbol(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== 'object' && typeof value !== 'function') return undefined;

  const brandValue = (value as Record<symbol, unknown>)[BRAND_SYMBOL];
  return typeof brandValue === 'string' ? brandValue : undefined;
}

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
export function createBundlerSafeTest(
  typeName: string,
  options?: {
    /** Custom fallback test function */
    fallback?: (value: unknown) => boolean;
    /** Whether to check the constructor registry (default: true) */
    checkConstructor?: boolean;
    /** Whether to check the instance registry (default: true) */
    checkInstance?: boolean;
    /** Whether to check symbols (default: true) */
    checkSymbols?: boolean;
  }
): (value: unknown) => boolean {
  const {
    fallback,
    checkConstructor = true,
    checkInstance = true,
    checkSymbols = true,
  } = options || {};

  return function bundlerSafeTest(value: unknown): boolean {
    if (value === null || value === undefined) return false;

    // Check symbol-based identification first (most reliable)
    if (checkSymbols) {
      if (getTypeFromSymbol(value) === typeName) return true;
      if (getBrandFromSymbol(value) === typeName) return true;
    }

    // Check constructor registry
    if (checkConstructor && typeof value === 'object') {
      if (isRegisteredType(value, typeName)) return true;
    }

    // Check instance registry
    if (checkInstance) {
      if (isRegisteredInstance(value, typeName)) return true;
    }

    // Fall back to custom test
    if (fallback) {
      return fallback(value);
    }

    return false;
  };
}

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
export function createTypedClass<T extends new (...args: unknown[]) => object>(
  typeName: string,
  BaseClass: T
): T {
  // Create a new class that extends the base and adds type identification
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const TypedClass = class extends (BaseClass as new (...args: any[]) => object) {
    readonly [TYPE_SYMBOL] = typeName;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);
      // Also register the instance for WeakSet-based lookup
      registerInstance(this, typeName);
    }
  };

  // Register the constructor
  registerConstructor(TypedClass, typeName);

  // Try to preserve the class name
  try {
    Object.defineProperty(TypedClass, 'name', {
      value: typeName,
      configurable: true,
    });
  } catch {
    // Some environments don't allow setting Function.name
  }

  return TypedClass as T;
}

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
export function addTypeIdentification<T extends new (...args: unknown[]) => object>(
  Class: T,
  typeName: string
): void {
  // Register the constructor
  registerConstructor(Class, typeName);

  // Add TYPE_SYMBOL to the prototype
  Object.defineProperty(Class.prototype, TYPE_SYMBOL, {
    value: typeName,
    writable: false,
    enumerable: false,
    configurable: false,
  });
}

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
export function identifyType(value: unknown, expectedType?: string): TypeIdentificationResult {
  if (value === null || value === undefined) {
    return { typeName: null, method: 'none' };
  }

  // Check TYPE_SYMBOL
  const symbolType = getTypeFromSymbol(value);
  if (symbolType) {
    if (!expectedType || symbolType === expectedType) {
      return { typeName: symbolType, method: 'symbol' };
    }
  }

  // Check BRAND_SYMBOL
  const brandType = getBrandFromSymbol(value);
  if (brandType) {
    if (!expectedType || brandType === expectedType) {
      return { typeName: brandType, method: 'brand' };
    }
  }

  // Check constructor registry
  if (typeof value === 'object' || typeof value === 'function') {
    const constructorType = getTypeByConstructor((value as object).constructor);
    if (constructorType) {
      if (!expectedType || constructorType === expectedType) {
        return { typeName: constructorType, method: 'constructor' };
      }
    }

    // Check instance registry (only if we have an expected type)
    if (expectedType && isRegisteredInstance(value, expectedType)) {
      return { typeName: expectedType, method: 'instance' };
    }
  }

  return { typeName: null, method: 'none' };
}
