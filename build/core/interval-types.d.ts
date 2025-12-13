/**
 * Interval Types
 *
 * This module provides type definitions for numeric intervals.
 */
import type { TypeDef } from './types.js';
/**
 * Interval for interval arithmetic
 */
export interface Interval {
    low: number;
    high: number;
}
/**
 * Test if value is an Interval
 */
export declare function isInterval(x: unknown): x is Interval;
/**
 * Interval types
 */
export declare const INTERVAL_TYPES: TypeDef[];
/**
 * Create an Interval
 */
export declare function interval(low: number, high: number): Interval;
//# sourceMappingURL=interval-types.d.ts.map