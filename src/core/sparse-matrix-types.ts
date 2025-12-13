/**
 * Sparse Matrix Types
 *
 * This module provides type definitions for sparse matrices in COO format.
 */

import type { TypeDef } from './types.js';

// =============================================================================
// Type Interfaces
// =============================================================================

/**
 * Sparse matrix in COO (Coordinate) format
 */
export interface SparseMatrix {
  rows: number[];
  cols: number[];
  values: number[];
  shape: [number, number];
}

// =============================================================================
// Type Test Functions
// =============================================================================

/**
 * Test if value is a SparseMatrix
 */
export function isSparseMatrix(x: unknown): x is SparseMatrix {
  if (x === null || typeof x !== 'object') return false;
  const s = x as SparseMatrix;
  return (
    'rows' in s &&
    'cols' in s &&
    'values' in s &&
    'shape' in s &&
    Array.isArray(s.rows) &&
    Array.isArray(s.cols) &&
    Array.isArray(s.values) &&
    Array.isArray(s.shape) &&
    s.shape.length === 2
  );
}

// =============================================================================
// Type Definitions for Registration
// =============================================================================

/**
 * Sparse matrix types
 */
export const SPARSE_MATRIX_TYPES: TypeDef[] = [{ name: 'SparseMatrix', test: isSparseMatrix }];
