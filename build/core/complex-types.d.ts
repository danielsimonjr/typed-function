/**
 * Complex Number Types
 *
 * This module provides type definitions for complex numbers
 * with real and imaginary components.
 */
import type { TypeDef } from './types.js';
/**
 * Complex number interface
 */
export interface Complex {
    re: number;
    im: number;
}
/**
 * Test if value is a Complex number
 */
export declare function isComplex(x: unknown): x is Complex;
/**
 * Complex number types
 */
export declare const COMPLEX_TYPES: TypeDef[];
/**
 * Create a Complex number
 */
export declare function complex(re: number, im?: number): Complex;
//# sourceMappingURL=complex-types.d.ts.map