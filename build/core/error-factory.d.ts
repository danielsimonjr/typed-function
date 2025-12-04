/**
 * Error Factory Module for typed-function
 *
 * This module provides functions for creating detailed error messages
 * when typed function calls fail due to type mismatches.
 */
import type { Signature, Param, TypedError, TypeTest } from './types.js';
import type { TypeRegistry } from './type-registry.js';
/**
 * Test whether a set of params contains a rest param
 *
 * @param params - The parameters to check
 * @returns true if the last parameter is a rest param
 */
export declare function hasRestParam(params: Param[]): boolean;
/**
 * Get the parameter at a specific index, handling rest params
 *
 * @param params - The parameters array
 * @param index - The index to retrieve
 * @returns The parameter at that index, or null if out of bounds
 */
export declare function getParamAtIndex(params: Param[], index: number): Param | null;
/**
 * Get the set of type names in a parameter
 *
 * Caches the result on the parameter for efficiency
 *
 * @param param - The parameter
 * @returns Set of type names
 */
export declare function paramTypeSet(param: Param): Set<string>;
/**
 * Get the type set at a specific index in a params array
 *
 * @param params - The parameters array
 * @param index - The index to retrieve
 * @returns Set of type names, or empty set if no param at index
 */
export declare function getTypeSetAtIndex(params: Param[], index: number): Set<string>;
/**
 * Merge expected parameters from multiple signatures at a given index
 *
 * @param signatures - Array of signatures
 * @param index - The parameter index
 * @returns Array of unique type names expected at this index
 */
export declare function mergeExpectedParams(signatures: Signature[], index: number): string[];
/**
 * Create a test function for a parameter
 *
 * @param param - The parameter to create a test for
 * @param registry - The type registry
 * @returns A function that tests if a value matches the parameter
 */
export declare function createParamTest(param: Param | undefined | null, registry: TypeRegistry): TypeTest;
/**
 * Create a detailed error for a failed typed function call
 *
 * @param name - The name of the function
 * @param args - The actual arguments passed
 * @param signatures - The available signatures
 * @param registry - The type registry
 * @returns A TypeError with detailed information
 */
export declare function createError(name: string, args: ArrayLike<unknown>, signatures: Signature[], registry: TypeRegistry): TypedError;
/**
 * Default mismatch handler that throws an error
 *
 * @param name - The function name
 * @param args - The actual arguments
 * @param signatures - The available signatures
 * @param registry - The type registry
 * @throws TypedError
 */
export declare function defaultOnMismatch(name: string, args: ArrayLike<unknown>, signatures: Signature[], registry: TypeRegistry): never;
/**
 * Stringify parameters in a normalized way
 *
 * @param params - The parameters to stringify
 * @param separator - The separator to use (default: ',')
 * @returns A string representation of the parameters
 */
export declare function stringifyParams(params: Param[], separator?: string): string;
//# sourceMappingURL=error-factory.d.ts.map