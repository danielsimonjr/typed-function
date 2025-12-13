/**
 * Vector Types
 *
 * This module provides type definitions for vectors in linear algebra.
 */

import type { TypeDef } from './types.js';

// =============================================================================
// Type Interfaces
// =============================================================================

/**
 * Vector interface for linear algebra
 */
export interface Vector {
  data: number[] | Float32Array | Float64Array;
  length: number;
}

// =============================================================================
// Type Test Functions
// =============================================================================

/**
 * Test if value is a Vector
 */
export function isVector(x: unknown): x is Vector {
  if (x === null || typeof x !== 'object') return false;
  const v = x as Vector;
  return (
    'data' in v &&
    'length' in v &&
    typeof v.length === 'number' &&
    (Array.isArray(v.data) || v.data instanceof Float32Array || v.data instanceof Float64Array)
  );
}

// =============================================================================
// Type Definitions for Registration
// =============================================================================

/**
 * Vector types
 */
export const VECTOR_TYPES: TypeDef[] = [{ name: 'Vector', test: isVector }];

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a Vector
 */
export function vector(data: number[] | Float32Array | Float64Array): Vector {
  return { data, length: data.length };
}
