/**
 * Numeric Types for Scientific Computing
 *
 * This module provides type definitions for fixed-width integer
 * and floating-point types.
 */
import type { TypeDef } from './types.js';
/**
 * Test if value is an Int8
 */
export declare function isInt8(x: unknown): x is number;
/**
 * Test if value is an Int16
 */
export declare function isInt16(x: unknown): x is number;
/**
 * Test if value is an Int32
 */
export declare function isInt32(x: unknown): x is number;
/**
 * Test if value is an Int64 (using BigInt)
 */
export declare function isInt64(x: unknown): x is bigint;
/**
 * Test if value is a UInt8
 */
export declare function isUInt8(x: unknown): x is number;
/**
 * Test if value is a UInt16
 */
export declare function isUInt16(x: unknown): x is number;
/**
 * Test if value is a UInt32
 */
export declare function isUInt32(x: unknown): x is number;
/**
 * Test if value is a UInt64 (using BigInt)
 */
export declare function isUInt64(x: unknown): x is bigint;
/**
 * Test if value is a Float32 (any number, conceptually 32-bit)
 */
export declare function isFloat32(x: unknown): x is number;
/**
 * Test if value is a Float64 (any number)
 */
export declare function isFloat64(x: unknown): x is number;
/**
 * Numeric types for scientific computing (integers and floats)
 */
export declare const NUMERIC_TYPES: TypeDef[];
//# sourceMappingURL=numeric-types.d.ts.map