/**
 * Pure-JS Fallback for typed-function dispatch
 *
 * Mirrors the WASM dispatch interface in pure JavaScript.
 * Used when WASM is not available or for type conversions.
 */
import type { SignatureFunction } from '../core/types.js';
/** Sentinel value for no match */
export declare const NO_MATCH = 4294967295;
/** Type ID for any (matches all) */
export declare const TYPE_ANY = 4294967295;
/**
 * Add a signature to the fallback dispatch
 *
 * @param fn - The function to dispatch to
 * @param paramMasks - Array of type masks for each parameter
 * @returns The signature index
 */
export declare function fallbackAddSignature(fn: SignatureFunction, paramMasks: number[]): number;
/**
 * Find matching function for argument type masks
 *
 * @param argMasks - Array of type masks for arguments
 * @returns The matching function, or null if no match
 */
export declare function fallbackDispatchFind(argMasks: number[]): SignatureFunction | null;
/**
 * Get function by index
 */
export declare function fallbackGetFunction(index: number): SignatureFunction | null;
/**
 * Clear all signatures and reset state
 */
export declare function fallbackClear(): void;
/**
 * Clear the dispatch cache
 */
export declare function fallbackClearCache(): void;
/**
 * Get the number of registered signatures
 */
export declare function fallbackGetSignatureCount(): number;
/**
 * Get cache statistics
 */
export declare function fallbackGetCacheStats(): number;
/**
 * Get the built-in type mask for a type ID
 */
export declare function fallbackGetBuiltinMask(typeId: number): number;
//# sourceMappingURL=fallback.d.ts.map