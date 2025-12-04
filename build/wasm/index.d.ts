/**
 * WASM Module Exports for typed-function
 *
 * This file provides the unified interface for WASM-accelerated dispatch.
 * It automatically falls back to pure JS when WASM is not available.
 */
export type { WasmExports, WasmDispatchState } from './bindings.js';
export { initWasm, isWasmAvailable, getWasmExports, resetWasm, wasmAddSignature, wasmDispatchFind, wasmGetFunction, wasmClearCache, wasmGetCacheStats, wasmGetSignatureCount, wasmGetBuiltinMask, NO_MATCH, } from './bindings.js';
export { loadWasm, loadWasmSync, ensureWasm, checkWasmAvailable, getLoadError, resetLoadState, loadWasmFromBase64, preloadWasm, } from './loader.js';
export { fallbackAddSignature, fallbackDispatchFind, fallbackGetFunction, fallbackClear, fallbackClearCache, fallbackGetSignatureCount, fallbackGetCacheStats, fallbackGetBuiltinMask, TYPE_ANY, } from './fallback.js';
export { TYPE_NUMBER, TYPE_STRING, TYPE_BOOLEAN, TYPE_FUNCTION, TYPE_ARRAY, TYPE_DATE, TYPE_REGEXP, TYPE_OBJECT, TYPE_NULL, TYPE_UNDEFINED, TYPE_ANY_MASK, getTypeBit, getTypeMaskForName, getTypeMaskForValue, getParamMask, getArgMasks, typeMatches, resetTypeMasks, registerCustomType, maskToTypeNames, } from './type-masks.js';
import type { SignatureFunction } from '../core/types.js';
/**
 * Add a signature to dispatch (auto-selects WASM or fallback)
 *
 * @param fn - The function to dispatch to
 * @param paramMasks - Array of type masks for each parameter
 * @returns The signature index
 */
export declare function addSignature(fn: SignatureFunction, paramMasks: number[]): number;
/**
 * Find matching function for argument type masks (auto-selects WASM or fallback)
 *
 * @param argMasks - Array of type masks for arguments
 * @returns The matching function, or null if no match
 */
export declare function dispatchFind(argMasks: number[]): SignatureFunction | null;
//# sourceMappingURL=index.d.ts.map