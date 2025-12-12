/**
 * GPU and Accelerator Types
 *
 * This module provides type definitions for GPU-accelerated computing
 * including WebGPU buffers and GPU tensors.
 */

import type { TypeDef } from './types.js';

// =============================================================================
// Type Interfaces
// =============================================================================

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

// =============================================================================
// Type Test Functions
// =============================================================================

/**
 * Test if value is a GPUBuffer (WebGPU)
 */
export function isGPUBuffer(x: unknown): x is GPUBufferType {
  if (x === null || typeof x !== 'object') return false;
  const b = x as GPUBufferType;
  return 'size' in b && 'usage' in b && typeof b.size === 'number' && typeof b.usage === 'number';
}

/**
 * Test if value is a GPUTensor
 */
export function isGPUTensor(x: unknown): x is GPUTensor {
  if (x === null || typeof x !== 'object') return false;
  const t = x as GPUTensor;
  return (
    'shape' in t &&
    'dtype' in t &&
    'device' in t &&
    Array.isArray(t.shape) &&
    typeof t.dtype === 'string' &&
    typeof t.device === 'string'
  );
}

// =============================================================================
// Type Definitions for Registration
// =============================================================================

/**
 * GPU/Accelerator types
 */
export const GPU_TYPES: TypeDef[] = [
  { name: 'GPUBuffer', test: isGPUBuffer },
  { name: 'GPUTensor', test: isGPUTensor },
];
