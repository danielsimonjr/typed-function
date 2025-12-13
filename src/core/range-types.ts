/**
 * Range Types
 *
 * This module provides type definitions for numeric ranges with optional step.
 */

import type { TypeDef } from './types.js';

// =============================================================================
// Type Interfaces
// =============================================================================

/**
 * Numeric range with step
 */
export interface Range {
  start: number;
  end: number;
  step?: number;
}

// =============================================================================
// Type Test Functions
// =============================================================================

/**
 * Test if value is a Range
 */
export function isRange(x: unknown): x is Range {
  if (x === null || typeof x !== 'object') return false;
  const r = x as Range;
  return 'start' in r && 'end' in r && typeof r.start === 'number' && typeof r.end === 'number';
}

// =============================================================================
// Type Definitions for Registration
// =============================================================================

/**
 * Range types
 */
export const RANGE_TYPES: TypeDef[] = [{ name: 'Range', test: isRange }];

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a Range
 */
export function range(start: number, end: number, step?: number): Range {
  if (step !== undefined) {
    return { start, end, step };
  }
  return { start, end };
}
