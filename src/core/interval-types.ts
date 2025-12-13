/**
 * Interval Types
 *
 * This module provides type definitions for numeric intervals.
 */

import type { TypeDef } from './types.js';

// =============================================================================
// Type Interfaces
// =============================================================================

/**
 * Interval for interval arithmetic
 */
export interface Interval {
  low: number;
  high: number;
}

// =============================================================================
// Type Test Functions
// =============================================================================

/**
 * Test if value is an Interval
 */
export function isInterval(x: unknown): x is Interval {
  if (x === null || typeof x !== 'object') return false;
  const i = x as Interval;
  return 'low' in i && 'high' in i && typeof i.low === 'number' && typeof i.high === 'number';
}

// =============================================================================
// Type Definitions for Registration
// =============================================================================

/**
 * Interval types
 */
export const INTERVAL_TYPES: TypeDef[] = [{ name: 'Interval', test: isInterval }];

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create an Interval
 */
export function interval(low: number, high: number): Interval {
  return { low, high };
}
