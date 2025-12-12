/**
 * Fraction Types
 *
 * This module provides type definitions for fractions (rational numbers)
 * with numerator and denominator components.
 */

import type { TypeDef } from './types.js';

// =============================================================================
// Type Interfaces
// =============================================================================

/**
 * Fraction (rational number) interface
 */
export interface Fraction {
  numerator: number | bigint;
  denominator: number | bigint;
}

// =============================================================================
// Type Test Functions
// =============================================================================

/**
 * Test if value is a Fraction
 */
export function isFraction(x: unknown): x is Fraction {
  if (x === null || typeof x !== 'object') return false;
  const f = x as Fraction;
  return (
    'numerator' in f &&
    'denominator' in f &&
    (typeof f.numerator === 'number' || typeof f.numerator === 'bigint') &&
    (typeof f.denominator === 'number' || typeof f.denominator === 'bigint')
  );
}

// =============================================================================
// Type Definitions for Registration
// =============================================================================

/**
 * Fraction types
 */
export const FRACTION_TYPES: TypeDef[] = [{ name: 'Fraction', test: isFraction }];

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a Fraction
 */
export function fraction(numerator: number | bigint, denominator: number | bigint = 1): Fraction {
  return { numerator, denominator };
}
