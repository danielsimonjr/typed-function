/**
 * Quaternion Types
 *
 * This module provides type definitions for quaternions used in 3D rotations.
 */

import type { TypeDef } from './types.js';

// =============================================================================
// Type Interfaces
// =============================================================================

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
 * Quaternion types
 */
export const QUATERNION_TYPES: TypeDef[] = [{ name: 'Quaternion', test: isQuaternion }];

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a Quaternion
 */
export function quaternion(w: number, x: number, y: number, z: number): Quaternion {
  return { w, x, y, z };
}
