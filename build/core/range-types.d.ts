/**
 * Range Types
 *
 * This module provides type definitions for numeric ranges with optional step.
 */
import type { TypeDef } from './types.js';
/**
 * Numeric range with step
 */
export interface Range {
    start: number;
    end: number;
    step?: number;
}
/**
 * Test if value is a Range
 */
export declare function isRange(x: unknown): x is Range;
/**
 * Range types
 */
export declare const RANGE_TYPES: TypeDef[];
/**
 * Create a Range
 */
export declare function range(start: number, end: number, step?: number): Range;
//# sourceMappingURL=range-types.d.ts.map