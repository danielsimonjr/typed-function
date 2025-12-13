/**
 * Matrix Types
 *
 * This module provides type definitions for matrices in linear algebra.
 */

import type { TypeDef } from './types.js';

// =============================================================================
// Type Interfaces
// =============================================================================

/**
 * Matrix interface for linear algebra
 */
export interface Matrix {
  data: number[] | Float32Array | Float64Array;
  rows: number;
  cols: number;
}

// =============================================================================
// Type Test Functions
// =============================================================================

/**
 * Test if value is a Matrix
 */
export function isMatrix(x: unknown): x is Matrix {
  if (x === null || typeof x !== 'object') return false;
  const m = x as Matrix;
  return (
    'data' in m &&
    'rows' in m &&
    'cols' in m &&
    typeof m.rows === 'number' &&
    typeof m.cols === 'number' &&
    (Array.isArray(m.data) || m.data instanceof Float32Array || m.data instanceof Float64Array)
  );
}

// =============================================================================
// Type Definitions for Registration
// =============================================================================

/**
 * Matrix types
 */
export const MATRIX_TYPES: TypeDef[] = [{ name: 'Matrix', test: isMatrix }];

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a Matrix
 */
export function matrix(data: number[] | Float32Array | Float64Array, rows: number, cols: number): Matrix {
  return { data, rows, cols };
}
