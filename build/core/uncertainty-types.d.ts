/**
 * Uncertainty Types
 *
 * This module provides type definitions for values with uncertainty/error bounds.
 */
import type { TypeDef } from './types.js';
/**
 * Value with uncertainty/error bounds
 */
export interface Uncertainty {
    value: number;
    uncertainty: number;
}
/**
 * Test if value is an Uncertainty
 */
export declare function isUncertainty(x: unknown): x is Uncertainty;
/**
 * Uncertainty types
 */
export declare const UNCERTAINTY_TYPES: TypeDef[];
/**
 * Create an Uncertainty value
 */
export declare function uncertainty(value: number, error: number): Uncertainty;
//# sourceMappingURL=uncertainty-types.d.ts.map