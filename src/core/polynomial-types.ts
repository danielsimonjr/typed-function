/**
 * Polynomial Types
 *
 * This module provides type definitions for polynomials represented by coefficients.
 */

import type { TypeDef } from './types.js';

// =============================================================================
// Type Interfaces
// =============================================================================

/**
 * Polynomial represented by coefficients
 */
export interface Polynomial {
  coefficients: number[];
  variable?: string;
}

// =============================================================================
// Type Test Functions
// =============================================================================

/**
 * Test if value is a Polynomial
 */
export function isPolynomial(x: unknown): x is Polynomial {
  if (x === null || typeof x !== 'object') return false;
  const p = x as Polynomial;
  return 'coefficients' in p && Array.isArray(p.coefficients);
}

// =============================================================================
// Type Definitions for Registration
// =============================================================================

/**
 * Polynomial types
 */
export const POLYNOMIAL_TYPES: TypeDef[] = [{ name: 'Polynomial', test: isPolynomial }];

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a Polynomial from coefficients
 */
export function polynomial(coefficients: number[], variable: string = 'x'): Polynomial {
  return { coefficients, variable };
}
