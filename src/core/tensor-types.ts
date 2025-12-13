/**
 * Tensor Types
 *
 * This module provides type definitions for N-dimensional tensors.
 */

import type { TypeDef } from './types.js';

// =============================================================================
// Type Interfaces
// =============================================================================

/**
 * Tensor interface for N-dimensional arrays
 */
export interface Tensor {
  data: number[] | Float32Array | Float64Array;
  shape: number[];
  strides?: number[];
}

// =============================================================================
// Type Test Functions
// =============================================================================

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

// =============================================================================
// Type Definitions for Registration
// =============================================================================

/**
 * Tensor types
 */
export const TENSOR_TYPES: TypeDef[] = [{ name: 'Tensor', test: isTensor }];

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a Tensor
 */
export function tensor(data: number[] | Float32Array | Float64Array, shape: number[]): Tensor {
  return { data, shape };
}
