/**
 * JS-WASM Bridge for typed-function dispatch
 *
 * TypeScript bindings for the WASM dispatch module.
 * Provides type-safe access to WASM functions.
 */
import type { SignatureFunction } from '../core/types.js';
/**
 * WASM module exports interface
 */
export interface WasmExports {
    WASM_VERSION: WebAssembly.Global;
    TYPE_REGISTRY_OFFSET: WebAssembly.Global;
    SIGNATURE_TABLE_OFFSET: WebAssembly.Global;
    DISPATCH_CACHE_OFFSET: WebAssembly.Global;
    MAX_TYPES: WebAssembly.Global;
    MAX_SIGNATURES: WebAssembly.Global;
    MAX_PARAMS: WebAssembly.Global;
    CACHE_SLOTS: WebAssembly.Global;
    NO_MATCH: WebAssembly.Global;
    TYPE_NUMBER: WebAssembly.Global;
    TYPE_STRING: WebAssembly.Global;
    TYPE_BOOLEAN: WebAssembly.Global;
    TYPE_FUNCTION: WebAssembly.Global;
    TYPE_ARRAY: WebAssembly.Global;
    TYPE_DATE: WebAssembly.Global;
    TYPE_REGEXP: WebAssembly.Global;
    TYPE_OBJECT: WebAssembly.Global;
    TYPE_NULL: WebAssembly.Global;
    TYPE_UNDEFINED: WebAssembly.Global;
    TYPE_ANY: WebAssembly.Global;
    getTypeCount(): number;
    setTypeCount(count: number): void;
    getSignatureCount(): number;
    setSignatureCount(count: number): void;
    clearMemory(): void;
    registerType(typeId: number, typeMask: number): number;
    getTypeMask(index: number): number;
    getTypeId(index: number): number;
    typeMatches(valueMask: number, expectedMask: number): boolean;
    combineMasks(mask1: number, mask2: number): number;
    getBuiltinMask(typeId: number): number;
    initBuiltinTypes(): void;
    addSignature(fnIndex: number, paramCount: number): number;
    setParamMask(sigIndex: number, paramIndex: number, mask: number): void;
    getFnIndex(sigIndex: number): number;
    getParamCount(sigIndex: number): number;
    getParamMask(sigIndex: number, paramIndex: number): number;
    dispatchFind(argCount: number, arg0Mask: number, arg1Mask: number, arg2Mask: number, arg3Mask: number): number;
    dispatchFind0(): number;
    dispatchFind1(arg0Mask: number): number;
    dispatchFind2(arg0Mask: number, arg1Mask: number): number;
    dispatchFindNoCache(argCount: number, arg0Mask: number, arg1Mask: number, arg2Mask: number, arg3Mask: number): number;
    clearCache(): void;
    invalidateCache(argCount: number, arg0Mask: number, arg1Mask: number, arg2Mask: number, arg3Mask: number): void;
    getCacheStats(): number;
    memory: WebAssembly.Memory;
}
/**
 * WASM dispatch state
 */
export interface WasmDispatchState {
    /** Whether WASM is initialized */
    initialized: boolean;
    /** WASM exports */
    exports: WasmExports | null;
    /** Function table (maps index to JS function) */
    functionTable: SignatureFunction[];
    /** Error that occurred during initialization */
    initError: Error | null;
}
/** Sentinel value for no match (must match WASM) */
export declare const NO_MATCH = 4294967295;
/**
 * Initialize WASM module with given exports
 *
 * @param exports - WASM module exports
 */
export declare function initWasm(exports: WasmExports): void;
/**
 * Check if WASM is available and initialized
 */
export declare function isWasmAvailable(): boolean;
/**
 * Get WASM exports (throws if not initialized)
 */
export declare function getWasmExports(): WasmExports;
/**
 * Reset WASM state (for testing)
 */
export declare function resetWasm(): void;
/**
 * Add a signature to WASM dispatch
 *
 * @param fn - The function to dispatch to
 * @param paramMasks - Array of type masks for each parameter
 * @returns The signature index
 */
export declare function wasmAddSignature(fn: SignatureFunction, paramMasks: number[]): number;
/**
 * Find matching function for argument type masks
 *
 * @param argMasks - Array of type masks for arguments
 * @returns The matching function, or null if no match
 */
export declare function wasmDispatchFind(argMasks: number[]): SignatureFunction | null;
/**
 * Get function by index from the function table
 */
export declare function wasmGetFunction(index: number): SignatureFunction | null;
/**
 * Clear the dispatch cache
 */
export declare function wasmClearCache(): void;
/**
 * Get cache statistics
 */
export declare function wasmGetCacheStats(): number;
/**
 * Get the number of registered signatures
 */
export declare function wasmGetSignatureCount(): number;
/**
 * Get the built-in type mask for a type ID
 */
export declare function wasmGetBuiltinMask(typeId: number): number;
//# sourceMappingURL=bindings.d.ts.map