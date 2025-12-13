/**
 * Uncertainty Types
 *
 * This module provides type definitions for values with uncertainty/error bounds.
 */

import type { TypeDef } from './types.js';

// =============================================================================
// Type Interfaces
// =============================================================================

/**
 * Value with uncertainty/error bounds
 */
export interface Uncertainty {
  value: number;
  uncertainty: number;
}

// =============================================================================
// Type Test Functions
// =============================================================================

/**
 * Test if value is an Uncertainty
 */
export function isUncertainty(x: unknown): x is Uncertainty {
  if (x === null || typeof x !== 'object') return false;
  const u = x as Uncertainty;
  return (
    'value' in u && 'uncertainty' in u && typeof u.value === 'number' && typeof u.uncertainty === 'number'
  );
}

// =============================================================================
// Type Definitions for Registration
// =============================================================================

/**
 * Uncertainty types
 */
export const UNCERTAINTY_TYPES: TypeDef[] = [{ name: 'Uncertainty', test: isUncertainty }];

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create an Uncertainty value
 */
export function uncertainty(value: number, error: number): Uncertainty {
  return { value, uncertainty: error };
}
