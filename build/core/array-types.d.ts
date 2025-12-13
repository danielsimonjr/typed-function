/**
 * TypedArray Types
 *
 * This module provides type definitions for JavaScript TypedArrays
 * including all standard variants.
 */
import type { TypeDef } from './types.js';
/**
 * Test if value is a TypedArray (any variant)
 */
export declare function isTypedArray(x: unknown): x is Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array | BigInt64Array | BigUint64Array;
/**
 * Test if value is a Float32Array
 */
export declare function isFloat32Array(x: unknown): x is Float32Array;
/**
 * Test if value is a Float64Array
 */
export declare function isFloat64Array(x: unknown): x is Float64Array;
/**
 * Test if value is an Int8Array
 */
export declare function isInt8Array(x: unknown): x is Int8Array;
/**
 * Test if value is an Int16Array
 */
export declare function isInt16Array(x: unknown): x is Int16Array;
/**
 * Test if value is an Int32Array
 */
export declare function isInt32Array(x: unknown): x is Int32Array;
/**
 * Test if value is a Uint8Array
 */
export declare function isUint8Array(x: unknown): x is Uint8Array;
/**
 * Test if value is a Uint16Array
 */
export declare function isUint16Array(x: unknown): x is Uint16Array;
/**
 * Test if value is a Uint32Array
 */
export declare function isUint32Array(x: unknown): x is Uint32Array;
/**
 * Test if value is a BigInt64Array
 */
export declare function isBigInt64Array(x: unknown): x is BigInt64Array;
/**
 * Test if value is a BigUint64Array
 */
export declare function isBigUint64Array(x: unknown): x is BigUint64Array;
/**
 * Array types
 */
export declare const ARRAY_TYPES: TypeDef[];
//# sourceMappingURL=array-types.d.ts.map