/**
 * Signature Comparator Module for typed-function
 *
 * This module handles comparing and ordering signatures for dispatch priority,
 * and detecting conflicts between signatures.
 */
import type { Param } from './types.js';
/**
 * Test whether a set of params contains a rest param
 */
export declare function hasRestParam(params: Param[]): boolean;
/**
 * Find the lowest type index among all types in a parameter
 *
 * @param param - The parameter to check
 * @param maxTypeIndex - The maximum possible type index (from registry)
 * @returns The lowest type index
 */
export declare function getLowestTypeIndex(param: Param, maxTypeIndex: number): number;
/**
 * Find the lowest conversion index among conversions in a parameter
 *
 * @param param - The parameter to check
 * @param maxConversionIndex - The maximum possible conversion index
 * @returns The lowest conversion index
 */
export declare function getLowestConversionIndex(param: Param, maxConversionIndex: number): number;
/**
 * Compare two parameters for ordering priority
 *
 * Returns:
 * - Negative if param1 should come first
 * - Positive if param2 should come first
 * - Zero if equivalent
 *
 * The absolute value indicates importance (smaller = less important difference)
 *
 * @param param1 - First parameter
 * @param param2 - Second parameter
 * @param maxTypeIndex - Maximum type index in registry
 * @param maxConversionIndex - Maximum conversion index
 * @returns A comparison value
 */
export declare function compareParams(param1: Param, param2: Param, maxTypeIndex: number, maxConversionIndex: number): number;
/**
 * Compare two signatures for ordering priority
 *
 * Returns:
 * - Negative if signature1 should come first
 * - Positive if signature2 should come first
 * - Zero if equivalent
 *
 * @param signature1 - First signature
 * @param signature2 - Second signature
 * @param maxTypeIndex - Maximum type index in registry
 * @param maxConversionIndex - Maximum conversion index
 * @returns A comparison value
 */
export declare function compareSignatures(signature1: {
    params: Param[];
}, signature2: {
    params: Param[];
}, maxTypeIndex: number, maxConversionIndex: number): number;
/**
 * Test whether two param lists represent conflicting signatures
 *
 * Signatures conflict if they could both match the same argument list.
 *
 * @param params1 - First parameter list
 * @param params2 - Second parameter list
 * @returns true if the signatures conflict
 */
export declare function conflicting(params1: Param[], params2: Param[]): boolean;
/**
 * Create a signature comparator function for sorting
 *
 * @param maxTypeIndex - Maximum type index in registry
 * @param maxConversionIndex - Maximum conversion index
 * @returns A comparator function for Array.sort
 */
export declare function createSignatureComparator(maxTypeIndex: number, maxConversionIndex: number): (a: {
    params: Param[];
}, b: {
    params: Param[];
}) => number;
//# sourceMappingURL=signature-comparator.d.ts.map