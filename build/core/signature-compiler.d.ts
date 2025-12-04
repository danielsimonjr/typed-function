/**
 * Signature Compiler Module for typed-function
 *
 * This module compiles signature parameters into optimized test functions
 * and argument preprocessing functions.
 */
import type { Param, TypeTest, SignatureTest, SignatureFunction, ArgConverter } from './types.js';
import type { TypeRegistry } from './type-registry.js';
/**
 * Create a type test for a single parameter
 *
 * Optimized for common cases (0, 1, 2 types)
 *
 * @param param - The parameter to create a test for
 * @param registry - The type registry
 * @returns A function that tests if a value matches the parameter
 */
export declare function compileTest(param: Param | undefined, registry: TypeRegistry): TypeTest;
/**
 * Create a test function for all parameters of a signature
 *
 * Optimized for common cases (0, 1, 2 params without rest)
 *
 * @param params - The parameters to compile tests for
 * @param registry - The type registry
 * @returns A function that tests if an argument list matches the signature
 */
export declare function compileTests(params: Param[], registry: TypeRegistry): SignatureTest;
/**
 * Compile a conversion function for a single argument
 *
 * @param param - The parameter containing conversion info
 * @param registry - The type registry
 * @returns A function that converts an argument if needed
 */
export declare function compileArgConversion(param: Param, registry: TypeRegistry): ArgConverter;
/**
 * Compile argument preprocessing for a signature
 *
 * This handles:
 * - Converting arguments if needed
 * - Collecting rest parameters into an array
 *
 * @param params - The signature parameters
 * @param fn - The original function
 * @param registry - The type registry
 * @returns A wrapped function that preprocesses arguments
 */
export declare function compileArgsPreprocessing(params: Param[], fn: SignatureFunction, registry: TypeRegistry): SignatureFunction;
//# sourceMappingURL=signature-compiler.d.ts.map