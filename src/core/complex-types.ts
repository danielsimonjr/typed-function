/**
 * Complex Number Types
 *
 * This module provides type definitions for complex numbers
 * with real and imaginary components.
 */

import type { TypeDef } from './types.js';

// =============================================================================
// Type Interfaces
// =============================================================================

/**
 * Complex number interface
 */
export interface Complex {
  re: number;
  im: number;
}

// =============================================================================
// Type Test Functions
// =============================================================================

/**
 * Test if value is a Complex number
 */
export function isComplex(x: unknown): x is Complex {
  return (
    x !== null &&
    typeof x === 'object' &&
    're' in x &&
    'im' in x &&
    typeof (x as Complex).re === 'number' &&
    typeof (x as Complex).im === 'number'
  );
}

// =============================================================================
// Type Definitions for Registration
// =============================================================================

/**
 * Complex number types
 */
export const COMPLEX_TYPES: TypeDef[] = [{ name: 'Complex', test: isComplex }];

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a Complex number
 */
export function complex(re: number, im: number = 0): Complex {
  return { re, im };
}
