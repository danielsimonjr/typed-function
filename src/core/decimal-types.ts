/**
 * Decimal and Arbitrary Precision Types
 *
 * This module provides type definitions for arbitrary precision decimals,
 * IEEE 754 decimal formats, and currency-aware numeric types.
 */

import type { TypeDef } from './types.js';

// =============================================================================
// Type Interfaces
// =============================================================================

/**
 * General arbitrary precision decimal number
 * Compatible with libraries like decimal.js, bignumber.js
 */
export interface Decimal {
  /** String representation of the decimal value */
  toString: () => string;
  /** Convert to primitive number (may lose precision) */
  toNumber: () => number;
  /** The coefficient/mantissa digits */
  d?: number[];
  /** The exponent */
  e?: number;
  /** The sign: 1 for positive, -1 for negative */
  s?: number;
}

/**
 * Arbitrary precision floating point number
 * For high-precision scientific calculations
 */
export interface BigFloat {
  /** The mantissa as a bigint */
  mantissa: bigint;
  /** The exponent */
  exponent: number;
  /** Precision in bits or decimal places */
  precision: number;
}

/**
 * IEEE 754 Decimal32 representation
 * 7 significant digits, exponent range -95 to 96
 */
export interface Decimal32 {
  /** Coefficient (7 significant digits max) */
  coefficient: number;
  /** Exponent (-95 to 96) */
  exponent: number;
  /** Sign: true for negative */
  sign: boolean;
  /** Type discriminator */
  _decimal32: true;
}

/**
 * IEEE 754 Decimal64 representation
 * 16 significant digits, exponent range -383 to 384
 */
export interface Decimal64 {
  /** Coefficient (16 significant digits max) */
  coefficient: bigint;
  /** Exponent (-383 to 384) */
  exponent: number;
  /** Sign: true for negative */
  sign: boolean;
  /** Type discriminator */
  _decimal64: true;
}

/**
 * IEEE 754 Decimal128 representation
 * 34 significant digits, exponent range -6143 to 6144
 */
export interface Decimal128 {
  /** Coefficient (34 significant digits max) */
  coefficient: bigint;
  /** Exponent (-6143 to 6144) */
  exponent: number;
  /** Sign: true for negative */
  sign: boolean;
  /** Type discriminator */
  _decimal128: true;
}

/**
 * Money/Currency type with fixed decimal precision
 * Useful for financial calculations
 */
export interface Money {
  /** Amount in smallest currency unit (e.g., cents) */
  amount: bigint;
  /** Currency code (ISO 4217) */
  currency: string;
  /** Decimal places for the currency (e.g., 2 for USD, 0 for JPY) */
  decimals: number;
}

/**
 * Fixed-point decimal with configurable scale
 */
export interface FixedDecimal {
  /** The value as an integer, scaled by 10^scale */
  value: bigint;
  /** Number of decimal places */
  scale: number;
}

/**
 * Rational number as exact fraction (extended from numeric-types)
 * Allows for exact representation of repeating decimals
 */
export interface Rational {
  /** The numerator */
  num: bigint;
  /** The denominator (never zero) */
  den: bigint;
}

// =============================================================================
// Type Test Functions
// =============================================================================

/**
 * Test if value is a Decimal (arbitrary precision)
 */
export function isDecimal(x: unknown): x is Decimal {
  if (x === null || typeof x !== 'object') return false;
  const d = x as Decimal;
  return typeof d.toString === 'function' && typeof d.toNumber === 'function';
}

/**
 * Test if value is a BigFloat
 */
export function isBigFloat(x: unknown): x is BigFloat {
  if (x === null || typeof x !== 'object') return false;
  const bf = x as BigFloat;
  return (
    'mantissa' in bf &&
    'exponent' in bf &&
    'precision' in bf &&
    typeof bf.mantissa === 'bigint' &&
    typeof bf.exponent === 'number' &&
    typeof bf.precision === 'number'
  );
}

/**
 * Test if value is a Decimal32
 */
export function isDecimal32(x: unknown): x is Decimal32 {
  if (x === null || typeof x !== 'object') return false;
  const d = x as Decimal32;
  return (
    '_decimal32' in d &&
    d._decimal32 === true &&
    typeof d.coefficient === 'number' &&
    typeof d.exponent === 'number' &&
    typeof d.sign === 'boolean'
  );
}

/**
 * Test if value is a Decimal64
 */
export function isDecimal64(x: unknown): x is Decimal64 {
  if (x === null || typeof x !== 'object') return false;
  const d = x as Decimal64;
  return (
    '_decimal64' in d &&
    d._decimal64 === true &&
    typeof d.coefficient === 'bigint' &&
    typeof d.exponent === 'number' &&
    typeof d.sign === 'boolean'
  );
}

/**
 * Test if value is a Decimal128
 */
export function isDecimal128(x: unknown): x is Decimal128 {
  if (x === null || typeof x !== 'object') return false;
  const d = x as Decimal128;
  return (
    '_decimal128' in d &&
    d._decimal128 === true &&
    typeof d.coefficient === 'bigint' &&
    typeof d.exponent === 'number' &&
    typeof d.sign === 'boolean'
  );
}

/**
 * Test if value is a Money type
 */
export function isMoney(x: unknown): x is Money {
  if (x === null || typeof x !== 'object') return false;
  const m = x as Money;
  return (
    'amount' in m &&
    'currency' in m &&
    'decimals' in m &&
    typeof m.amount === 'bigint' &&
    typeof m.currency === 'string' &&
    typeof m.decimals === 'number'
  );
}

/**
 * Test if value is a FixedDecimal
 */
export function isFixedDecimal(x: unknown): x is FixedDecimal {
  if (x === null || typeof x !== 'object') return false;
  const fd = x as FixedDecimal;
  return (
    'value' in fd && 'scale' in fd && typeof fd.value === 'bigint' && typeof fd.scale === 'number'
  );
}

/**
 * Test if value is a Rational
 */
export function isRational(x: unknown): x is Rational {
  if (x === null || typeof x !== 'object') return false;
  const r = x as Rational;
  return 'num' in r && 'den' in r && typeof r.num === 'bigint' && typeof r.den === 'bigint';
}

// =============================================================================
// Type Definitions for Registration
// =============================================================================

/**
 * Decimal types for arbitrary precision arithmetic
 */
export const DECIMAL_TYPES: TypeDef[] = [
  { name: 'Decimal', test: isDecimal },
  { name: 'BigFloat', test: isBigFloat },
  { name: 'Decimal32', test: isDecimal32 },
  { name: 'Decimal64', test: isDecimal64 },
  { name: 'Decimal128', test: isDecimal128 },
  { name: 'Money', test: isMoney },
  { name: 'FixedDecimal', test: isFixedDecimal },
  { name: 'Rational', test: isRational },
];

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a BigFloat
 */
export function bigFloat(mantissa: bigint, exponent: number, precision: number = 53): BigFloat {
  return { mantissa, exponent, precision };
}

/**
 * Create a Decimal32
 */
export function decimal32(coefficient: number, exponent: number, sign: boolean = false): Decimal32 {
  return { coefficient, exponent, sign, _decimal32: true };
}

/**
 * Create a Decimal64
 */
export function decimal64(coefficient: bigint, exponent: number, sign: boolean = false): Decimal64 {
  return { coefficient, exponent, sign, _decimal64: true };
}

/**
 * Create a Decimal128
 */
export function decimal128(coefficient: bigint, exponent: number, sign: boolean = false): Decimal128 {
  return { coefficient, exponent, sign, _decimal128: true };
}

/**
 * Create a Money value
 * @param amount Amount in smallest unit (e.g., cents)
 * @param currency ISO 4217 currency code
 * @param decimals Number of decimal places (default 2)
 */
export function money(amount: bigint, currency: string, decimals: number = 2): Money {
  return { amount, currency, decimals };
}

/**
 * Create a FixedDecimal
 * @param value The scaled integer value
 * @param scale Number of decimal places
 */
export function fixedDecimal(value: bigint, scale: number): FixedDecimal {
  return { value, scale };
}

/**
 * Create a Rational number
 * @param num Numerator
 * @param den Denominator (must not be zero)
 */
export function rational(num: bigint, den: bigint): Rational {
  if (den === BigInt(0)) {
    throw new Error('Denominator cannot be zero');
  }
  return { num, den };
}
