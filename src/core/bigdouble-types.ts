/**
 * BigDouble Types
 *
 * This module provides type definitions for arbitrary precision
 * double-precision floating point numbers using bigint and scale.
 */

import type { TypeDef } from './types.js';

// =============================================================================
// Type Interfaces
// =============================================================================

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

// =============================================================================
// Type Test Functions
// =============================================================================

/**
 * Test if value is a BigDouble
 */
export function isBigDouble(x: unknown): x is BigDouble {
  if (x === null || typeof x !== 'object') return false;
  const bd = x as BigDouble;
  return 'value' in bd && 'scale' in bd && typeof bd.value === 'bigint' && typeof bd.scale === 'number';
}

/**
 * @deprecated Use isBigDouble instead
 */
export const isBigDecimal = isBigDouble;

// =============================================================================
// Type Definitions for Registration
// =============================================================================

/**
 * BigDouble types
 */
export const BIGDOUBLE_TYPES: TypeDef[] = [{ name: 'BigDouble', test: isBigDouble }];

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a BigDouble
 * @param value The integer value
 * @param scale The number of decimal places (value * 10^(-scale))
 */
export function bigDouble(value: bigint, scale: number = 0): BigDouble {
  return { value, scale };
}

/**
 * @deprecated Use bigDouble instead
 */
export const bigDecimal = bigDouble;
