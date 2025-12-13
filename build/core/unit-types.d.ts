/**
 * Unit Types
 *
 * This module provides type definitions for values with physical units.
 */
import type { TypeDef } from './types.js';
/**
 * Value with physical unit
 */
export interface Unit<T = number> {
    value: T;
    unit: string;
}
/**
 * Test if value is a Unit
 */
export declare function isUnit(x: unknown): x is Unit;
/**
 * Unit types
 */
export declare const UNIT_TYPES: TypeDef[];
/**
 * Create a Unit value
 */
export declare function unit<T = number>(value: T, unitStr: string): Unit<T>;
//# sourceMappingURL=unit-types.d.ts.map