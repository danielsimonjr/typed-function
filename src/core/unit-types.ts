/**
 * Unit Types
 *
 * This module provides type definitions for values with physical units.
 */

import type { TypeDef } from './types.js';

// =============================================================================
// Type Interfaces
// =============================================================================

/**
 * Value with physical unit
 */
export interface Unit<T = number> {
  value: T;
  unit: string;
}

// =============================================================================
// Type Test Functions
// =============================================================================

/**
 * Test if value is a Unit
 */
export function isUnit(x: unknown): x is Unit {
  if (x === null || typeof x !== 'object') return false;
  const u = x as Unit;
  return 'value' in u && 'unit' in u && typeof u.unit === 'string';
}

// =============================================================================
// Type Definitions for Registration
// =============================================================================

/**
 * Unit types
 */
export const UNIT_TYPES: TypeDef[] = [{ name: 'Unit', test: isUnit }];

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a Unit value
 */
export function unit<T = number>(value: T, unitStr: string): Unit<T> {
  return { value, unit: unitStr };
}
