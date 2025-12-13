/**
 * GPU and Accelerator Types
 *
 * This module provides type definitions for GPU-accelerated computing
 * including WebGPU buffers and GPU tensors.
 */
import type { TypeDef } from './types.js';
/**
 * GPU buffer interface
 */
export interface GPUBufferType {
    size: number;
    usage: number;
    mapState?: string;
}
/**
 * GPU tensor for GPU-accelerated computation
 */
export interface GPUTensor {
    shape: number[];
    dtype: string;
    device: string;
}
/**
 * Test if value is a GPUBuffer (WebGPU)
 */
export declare function isGPUBuffer(x: unknown): x is GPUBufferType;
/**
 * Test if value is a GPUTensor
 */
export declare function isGPUTensor(x: unknown): x is GPUTensor;
/**
 * GPU/Accelerator types
 */
export declare const GPU_TYPES: TypeDef[];
//# sourceMappingURL=gpu-types.d.ts.map