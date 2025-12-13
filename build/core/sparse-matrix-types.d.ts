/**
 * Sparse Matrix Types
 *
 * This module provides type definitions for sparse matrices in COO format.
 */
import type { TypeDef } from './types.js';
/**
 * Sparse matrix in COO (Coordinate) format
 */
export interface SparseMatrix {
    rows: number[];
    cols: number[];
    values: number[];
    shape: [number, number];
}
/**
 * Test if value is a SparseMatrix
 */
export declare function isSparseMatrix(x: unknown): x is SparseMatrix;
/**
 * Sparse matrix types
 */
export declare const SPARSE_MATRIX_TYPES: TypeDef[];
//# sourceMappingURL=sparse-matrix-types.d.ts.map