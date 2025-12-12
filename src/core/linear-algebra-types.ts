/**
 * Linear Algebra Types for Scientific Computing
 *
 * This module provides type definitions for linear algebra including
 * vectors, matrices, tensors, sparse matrices, and quaternions.
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

/**
 * Matrix interface for linear algebra
 */
export interface Matrix {
  data: number[] | Float32Array | Float64Array;
  rows: number;
  cols: number;
}

/**
 * Tensor interface for N-dimensional arrays
 */
export interface Tensor {
  data: number[] | Float32Array | Float64Array;
  shape: number[];
  strides?: number[];
}

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
 * Quaternion for 3D rotations
 */
export interface Quaternion {
  w: number;
  x: number;
  y: number;
  z: number;
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

/**
 * Test if value is a Tensor
 */
export function isTensor(x: unknown): x is Tensor {
  if (x === null || typeof x !== 'object') return false;
  const t = x as Tensor;
  return (
    'data' in t &&
    'shape' in t &&
    Array.isArray(t.shape) &&
    (Array.isArray(t.data) || t.data instanceof Float32Array || t.data instanceof Float64Array)
  );
}

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

/**
 * Test if value is a Quaternion
 */
export function isQuaternion(x: unknown): x is Quaternion {
  if (x === null || typeof x !== 'object') return false;
  const q = x as Quaternion;
  return (
    'w' in q &&
    'x' in q &&
    'y' in q &&
    'z' in q &&
    typeof q.w === 'number' &&
    typeof q.x === 'number' &&
    typeof q.y === 'number' &&
    typeof q.z === 'number'
  );
}

// =============================================================================
// Type Definitions for Registration
// =============================================================================

/**
 * Linear algebra types
 */
export const LINEAR_ALGEBRA_TYPES: TypeDef[] = [
  { name: 'Vector', test: isVector },
  { name: 'Matrix', test: isMatrix },
  { name: 'Tensor', test: isTensor },
  { name: 'SparseMatrix', test: isSparseMatrix },
  { name: 'Quaternion', test: isQuaternion },
];

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a Vector
 */
export function vector(data: number[] | Float32Array | Float64Array): Vector {
  return { data, length: data.length };
}

/**
 * Create a Matrix
 */
export function matrix(data: number[] | Float32Array | Float64Array, rows: number, cols: number): Matrix {
  return { data, rows, cols };
}

/**
 * Create a Tensor
 */
export function tensor(data: number[] | Float32Array | Float64Array, shape: number[]): Tensor {
  return { data, shape };
}

/**
 * Create a Quaternion
 */
export function quaternion(w: number, x: number, y: number, z: number): Quaternion {
  return { w, x, y, z };
}
