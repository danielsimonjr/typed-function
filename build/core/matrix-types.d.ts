/**
 * Matrix Types
 *
 * This module provides type definitions for matrices in linear algebra.
 */
import type { TypeDef } from './types.js';
/**
 * Matrix interface for linear algebra
 */
export interface Matrix {
    data: number[] | Float32Array | Float64Array;
    rows: number;
    cols: number;
}
/**
 * Test if value is a Matrix
 */
export declare function isMatrix(x: unknown): x is Matrix;
/**
 * Matrix types
 */
export declare const MATRIX_TYPES: TypeDef[];
/**
 * Create a Matrix
 */
export declare function matrix(data: number[] | Float32Array | Float64Array, rows: number, cols: number): Matrix;
//# sourceMappingURL=matrix-types.d.ts.map