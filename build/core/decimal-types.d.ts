/**
 * Decimal and Arbitrary Precision Types
 *
 * This module provides type definitions for arbitrary precision decimals,
 * IEEE 754 decimal formats, and currency-aware numeric types.
 */
import type { TypeDef } from './types.js';
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
/**
 * Test if value is a Decimal (arbitrary precision)
 */
export declare function isDecimal(x: unknown): x is Decimal;
/**
 * Test if value is a BigFloat
 */
export declare function isBigFloat(x: unknown): x is BigFloat;
/**
 * Test if value is a Decimal32
 */
export declare function isDecimal32(x: unknown): x is Decimal32;
/**
 * Test if value is a Decimal64
 */
export declare function isDecimal64(x: unknown): x is Decimal64;
/**
 * Test if value is a Decimal128
 */
export declare function isDecimal128(x: unknown): x is Decimal128;
/**
 * Test if value is a Money type
 */
export declare function isMoney(x: unknown): x is Money;
/**
 * Test if value is a FixedDecimal
 */
export declare function isFixedDecimal(x: unknown): x is FixedDecimal;
/**
 * Test if value is a Rational
 */
export declare function isRational(x: unknown): x is Rational;
/**
 * Decimal types for arbitrary precision arithmetic
 */
export declare const DECIMAL_TYPES: TypeDef[];
/**
 * Create a BigFloat
 */
export declare function bigFloat(mantissa: bigint, exponent: number, precision?: number): BigFloat;
/**
 * Create a Decimal32
 */
export declare function decimal32(coefficient: number, exponent: number, sign?: boolean): Decimal32;
/**
 * Create a Decimal64
 */
export declare function decimal64(coefficient: bigint, exponent: number, sign?: boolean): Decimal64;
/**
 * Create a Decimal128
 */
export declare function decimal128(coefficient: bigint, exponent: number, sign?: boolean): Decimal128;
/**
 * Create a Money value
 * @param amount Amount in smallest unit (e.g., cents)
 * @param currency ISO 4217 currency code
 * @param decimals Number of decimal places (default 2)
 */
export declare function money(amount: bigint, currency: string, decimals?: number): Money;
/**
 * Create a FixedDecimal
 * @param value The scaled integer value
 * @param scale Number of decimal places
 */
export declare function fixedDecimal(value: bigint, scale: number): FixedDecimal;
/**
 * Create a Rational number
 * @param num Numerator
 * @param den Denominator (must not be zero)
 */
export declare function rational(num: bigint, den: bigint): Rational;
//# sourceMappingURL=decimal-types.d.ts.map