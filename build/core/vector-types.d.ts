/**
 * Vector Types
 *
 * This module provides type definitions for vectors in linear algebra.
 */
import type { TypeDef } from './types.js';
/**
 * Vector interface for linear algebra
 */
export interface Vector {
    data: number[] | Float32Array | Float64Array;
    length: number;
}
/**
 * Test if value is a Vector
 */
export declare function isVector(x: unknown): x is Vector;
/**
 * Vector types
 */
export declare const VECTOR_TYPES: TypeDef[];
/**
 * Create a Vector
 */
export declare function vector(data: number[] | Float32Array | Float64Array): Vector;
//# sourceMappingURL=vector-types.d.ts.map