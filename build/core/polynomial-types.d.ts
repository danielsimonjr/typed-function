/**
 * Polynomial Types
 *
 * This module provides type definitions for polynomials represented by coefficients.
 */
import type { TypeDef } from './types.js';
/**
 * Polynomial represented by coefficients
 */
export interface Polynomial {
    coefficients: number[];
    variable?: string;
}
/**
 * Test if value is a Polynomial
 */
export declare function isPolynomial(x: unknown): x is Polynomial;
/**
 * Polynomial types
 */
export declare const POLYNOMIAL_TYPES: TypeDef[];
/**
 * Create a Polynomial from coefficients
 */
export declare function polynomial(coefficients: number[], variable?: string): Polynomial;
//# sourceMappingURL=polynomial-types.d.ts.map