/**
 * Quaternion Types
 *
 * This module provides type definitions for quaternions used in 3D rotations.
 */
import type { TypeDef } from './types.js';
/**
 * Quaternion for 3D rotations
 */
export interface Quaternion {
    w: number;
    x: number;
    y: number;
    z: number;
}
/**
 * Test if value is a Quaternion
 */
export declare function isQuaternion(x: unknown): x is Quaternion;
/**
 * Quaternion types
 */
export declare const QUATERNION_TYPES: TypeDef[];
/**
 * Create a Quaternion
 */
export declare function quaternion(w: number, x: number, y: number, z: number): Quaternion;
//# sourceMappingURL=quaternion-types.d.ts.map