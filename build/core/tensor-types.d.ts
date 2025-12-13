/**
 * Tensor Types
 *
 * This module provides type definitions for N-dimensional tensors.
 */
import type { TypeDef } from './types.js';
/**
 * Tensor interface for N-dimensional arrays
 */
export interface Tensor {
    data: number[] | Float32Array | Float64Array;
    shape: number[];
    strides?: number[];
}
/**
 * Test if value is a Tensor
 */
export declare function isTensor(x: unknown): x is Tensor;
/**
 * Tensor types
 */
export declare const TENSOR_TYPES: TypeDef[];
/**
 * Create a Tensor
 */
export declare function tensor(data: number[] | Float32Array | Float64Array, shape: number[]): Tensor;
//# sourceMappingURL=tensor-types.d.ts.map