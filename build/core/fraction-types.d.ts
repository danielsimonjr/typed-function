/**
 * Fraction Types
 *
 * This module provides type definitions for fractions (rational numbers)
 * with numerator and denominator components.
 */
import type { TypeDef } from './types.js';
/**
 * Fraction (rational number) interface
 */
export interface Fraction {
    numerator: number | bigint;
    denominator: number | bigint;
}
/**
 * Test if value is a Fraction
 */
export declare function isFraction(x: unknown): x is Fraction;
/**
 * Fraction types
 */
export declare const FRACTION_TYPES: TypeDef[];
/**
 * Create a Fraction
 */
export declare function fraction(numerator: number | bigint, denominator?: number | bigint): Fraction;
//# sourceMappingURL=fraction-types.d.ts.map