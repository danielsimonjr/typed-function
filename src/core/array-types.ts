/**
 * TypedArray Types
 *
 * This module provides type definitions for JavaScript TypedArrays
 * including all standard variants.
 */

import type { TypeDef } from './types.js';

// =============================================================================
// Type Test Functions
// =============================================================================

/**
 * Test if value is a TypedArray (any variant)
 */
export function isTypedArray(
  x: unknown
): x is
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array
  | BigInt64Array
  | BigUint64Array {
  return (
    x instanceof Int8Array ||
    x instanceof Uint8Array ||
    x instanceof Int16Array ||
    x instanceof Uint16Array ||
    x instanceof Int32Array ||
    x instanceof Uint32Array ||
    x instanceof Float32Array ||
    x instanceof Float64Array ||
    x instanceof BigInt64Array ||
    x instanceof BigUint64Array
  );
}

/**
 * Test if value is a Float32Array
 */
export function isFloat32Array(x: unknown): x is Float32Array {
  return x instanceof Float32Array;
}

/**
 * Test if value is a Float64Array
 */
export function isFloat64Array(x: unknown): x is Float64Array {
  return x instanceof Float64Array;
}

/**
 * Test if value is an Int8Array
 */
export function isInt8Array(x: unknown): x is Int8Array {
  return x instanceof Int8Array;
}

/**
 * Test if value is an Int16Array
 */
export function isInt16Array(x: unknown): x is Int16Array {
  return x instanceof Int16Array;
}

/**
 * Test if value is an Int32Array
 */
export function isInt32Array(x: unknown): x is Int32Array {
  return x instanceof Int32Array;
}

/**
 * Test if value is a Uint8Array
 */
export function isUint8Array(x: unknown): x is Uint8Array {
  return x instanceof Uint8Array;
}

/**
 * Test if value is a Uint16Array
 */
export function isUint16Array(x: unknown): x is Uint16Array {
  return x instanceof Uint16Array;
}

/**
 * Test if value is a Uint32Array
 */
export function isUint32Array(x: unknown): x is Uint32Array {
  return x instanceof Uint32Array;
}

/**
 * Test if value is a BigInt64Array
 */
export function isBigInt64Array(x: unknown): x is BigInt64Array {
  return x instanceof BigInt64Array;
}

/**
 * Test if value is a BigUint64Array
 */
export function isBigUint64Array(x: unknown): x is BigUint64Array {
  return x instanceof BigUint64Array;
}

// =============================================================================
// Type Definitions for Registration
// =============================================================================

/**
 * Array types
 */
export const ARRAY_TYPES: TypeDef[] = [
  { name: 'TypedArray', test: isTypedArray },
  { name: 'Int8Array', test: isInt8Array },
  { name: 'Int16Array', test: isInt16Array },
  { name: 'Int32Array', test: isInt32Array },
  { name: 'Uint8Array', test: isUint8Array },
  { name: 'Uint16Array', test: isUint16Array },
  { name: 'Uint32Array', test: isUint32Array },
  { name: 'Float32Array', test: isFloat32Array },
  { name: 'Float64Array', test: isFloat64Array },
  { name: 'BigInt64Array', test: isBigInt64Array },
  { name: 'BigUint64Array', test: isBigUint64Array },
];
