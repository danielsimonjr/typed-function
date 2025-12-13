/**
 * BigDouble Types
 *
 * This module provides type definitions for arbitrary precision
 * double-precision floating point numbers using bigint and scale.
 */
import type { TypeDef } from './types.js';
/**
 * BigDouble interface for arbitrary precision doubles
 * Represents a number as value * 10^(-scale)
 */
export interface BigDouble {
    value: bigint;
    scale: number;
}
/**
 * @deprecated Use BigDouble instead
 */
export type BigDecimal = BigDouble;
/**
 * Test if value is a BigDouble
 */
export declare function isBigDouble(x: unknown): x is BigDouble;
/**
 * @deprecated Use isBigDouble instead
 */
export declare const isBigDecimal: typeof isBigDouble;
/**
 * BigDouble types
 */
export declare const BIGDOUBLE_TYPES: TypeDef[];
/**
 * Create a BigDouble
 * @param value The integer value
 * @param scale The number of decimal places (value * 10^(-scale))
 */
export declare function bigDouble(value: bigint, scale?: number): BigDouble;
/**
 * @deprecated Use bigDouble instead
 */
export declare const bigDecimal: typeof bigDouble;
//# sourceMappingURL=bigdouble-types.d.ts.map