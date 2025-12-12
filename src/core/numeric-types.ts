/**
 * Numeric Types for Scientific Computing
 *
 * This module provides type definitions for fixed-width integer
 * and floating-point types.
 */

import type { TypeDef } from './types.js';

// =============================================================================
// Type Test Functions
// =============================================================================

/**
 * Test if value is an Int8
 */
export function isInt8(x: unknown): x is number {
  return typeof x === 'number' && Number.isInteger(x) && x >= -128 && x <= 127;
}

/**
 * Test if value is an Int16
 */
export function isInt16(x: unknown): x is number {
  return typeof x === 'number' && Number.isInteger(x) && x >= -32768 && x <= 32767;
}

/**
 * Test if value is an Int32
 */
export function isInt32(x: unknown): x is number {
  return typeof x === 'number' && Number.isInteger(x) && x >= -2147483648 && x <= 2147483647;
}

/**
 * Test if value is an Int64 (using BigInt)
 */
export function isInt64(x: unknown): x is bigint {
  if (typeof x !== 'bigint') return false;
  const MIN = BigInt('-9223372036854775808');
  const MAX = BigInt('9223372036854775807');
  return x >= MIN && x <= MAX;
}

/**
 * Test if value is a UInt8
 */
export function isUInt8(x: unknown): x is number {
  return typeof x === 'number' && Number.isInteger(x) && x >= 0 && x <= 255;
}

/**
 * Test if value is a UInt16
 */
export function isUInt16(x: unknown): x is number {
  return typeof x === 'number' && Number.isInteger(x) && x >= 0 && x <= 65535;
}

/**
 * Test if value is a UInt32
 */
export function isUInt32(x: unknown): x is number {
  return typeof x === 'number' && Number.isInteger(x) && x >= 0 && x <= 4294967295;
}

/**
 * Test if value is a UInt64 (using BigInt)
 */
export function isUInt64(x: unknown): x is bigint {
  if (typeof x !== 'bigint') return false;
  const MAX = BigInt('18446744073709551615');
  return x >= BigInt(0) && x <= MAX;
}

/**
 * Test if value is a Float32 (any number, conceptually 32-bit)
 */
export function isFloat32(x: unknown): x is number {
  return typeof x === 'number' && !Number.isNaN(x);
}

/**
 * Test if value is a Float64 (any number)
 */
export function isFloat64(x: unknown): x is number {
  return typeof x === 'number';
}

// =============================================================================
// Type Definitions for Registration
// =============================================================================

/**
 * Numeric types for scientific computing (integers and floats)
 */
export const NUMERIC_TYPES: TypeDef[] = [
  { name: 'Int8', test: isInt8 },
  { name: 'Int16', test: isInt16 },
  { name: 'Int32', test: isInt32 },
  { name: 'Int64', test: isInt64 },
  { name: 'UInt8', test: isUInt8 },
  { name: 'UInt16', test: isUInt16 },
  { name: 'UInt32', test: isUInt32 },
  { name: 'UInt64', test: isUInt64 },
  { name: 'Float32', test: isFloat32 },
  { name: 'Float64', test: isFloat64 },
];
