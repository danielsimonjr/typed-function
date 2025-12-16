/**
 * Signature Introspection Helper for typed-function
 *
 * Provides utilities for inspecting and formatting typed function signatures.
 */
import type { TypedFunction, Signature, Param } from './types.js';
/**
 * Formatted signature information
 */
export interface FormattedSignature {
    /** The signature string (e.g., "number, string") */
    signature: string;
    /** Number of parameters */
    paramCount: number;
    /** Whether it has a rest parameter */
    hasRestParam: boolean;
    /** Whether it uses any type */
    hasAnyType: boolean;
    /** Whether it uses type conversions */
    hasConversions: boolean;
    /** Parameter details */
    params: FormattedParam[];
}
/**
 * Formatted parameter information
 */
export interface FormattedParam {
    /** Parameter position (0-indexed) */
    index: number;
    /** Parameter name (e.g., "number", "string | boolean") */
    name: string;
    /** Type names accepted */
    types: string[];
    /** Whether this is a rest parameter */
    isRest: boolean;
    /** Whether this accepts any type */
    isAny: boolean;
    /** Whether conversions are applied */
    hasConversion: boolean;
}
/**
 * Typed function inspection results
 */
export interface TypedFunctionInspection {
    /** Function name */
    name: string;
    /** Total number of signatures */
    signatureCount: number;
    /** All formatted signatures */
    signatures: FormattedSignature[];
    /** Signature strings for quick reference */
    signatureStrings: string[];
    /** Whether WASM dispatch is enabled */
    wasmEnabled: boolean;
    /** Summary statistics */
    stats: {
        /** Total parameters across all signatures */
        totalParams: number;
        /** Max parameters in any signature */
        maxParams: number;
        /** Min parameters in any signature */
        minParams: number;
        /** Number of signatures with rest params */
        restParamCount: number;
        /** Number of signatures with any type */
        anyTypeCount: number;
        /** Number of signatures with conversions */
        conversionCount: number;
    };
}
/**
 * Format a single parameter for display
 *
 * @param param - The parameter to format
 * @param index - Parameter position
 * @returns Formatted parameter info
 */
export declare function formatParam(param: Param, index: number): FormattedParam;
/**
 * Format a signature for display
 *
 * @param signature - The signature to format
 * @returns Formatted signature info
 */
export declare function formatSignature(signature: Signature): FormattedSignature;
/**
 * Inspect a typed function and return detailed information
 *
 * @param fn - The typed function to inspect
 * @returns Detailed inspection results
 *
 * @example
 * ```ts
 * import typed from 'typed-function';
 * import { inspect } from 'typed-function/core/signature-inspector';
 *
 * const add = typed('add', {
 *   'number, number': (a, b) => a + b,
 *   'string, string': (a, b) => a + b,
 * });
 *
 * const info = inspect(add);
 * console.log(`Function: ${info.name}`);
 * console.log(`Signatures: ${info.signatureCount}`);
 * info.signatures.forEach((sig) => {
 *   console.log(`  - ${sig.signature}`);
 * });
 * ```
 */
export declare function inspect(fn: TypedFunction): TypedFunctionInspection;
/**
 * Get a human-readable summary of a typed function
 *
 * @param fn - The typed function
 * @returns A formatted string description
 *
 * @example
 * ```ts
 * const add = typed('add', {
 *   'number, number': (a, b) => a + b,
 * });
 *
 * console.log(summarize(add));
 * // Output:
 * // add (1 signature)
 * //   (number, number)
 * ```
 */
export declare function summarize(fn: TypedFunction): string;
/**
 * Compare two typed functions and return differences
 *
 * @param fn1 - First typed function
 * @param fn2 - Second typed function
 * @returns Object describing differences
 */
export declare function compare(fn1: TypedFunction, fn2: TypedFunction): {
    onlyInFirst: string[];
    onlyInSecond: string[];
    inBoth: string[];
};
/**
 * Find signatures that match given argument types
 *
 * @param fn - The typed function
 * @param argTypes - Array of type names for arguments
 * @returns Matching signature strings
 *
 * @example
 * ```ts
 * const fn = typed({
 *   'number': (x) => x,
 *   'string': (s) => s,
 *   'number, string': (a, b) => `${a}${b}`,
 * });
 *
 * findMatchingSignatures(fn, ['number']);
 * // Returns: ['number']
 *
 * findMatchingSignatures(fn, ['number', 'string']);
 * // Returns: ['number, string']
 * ```
 */
export declare function findMatchingSignatures(fn: TypedFunction, argTypes: string[]): string[];
//# sourceMappingURL=signature-inspector.d.ts.map