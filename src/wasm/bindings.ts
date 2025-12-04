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
  // Version
  WASM_VERSION: WebAssembly.Global;

  // Memory constants
  TYPE_REGISTRY_OFFSET: WebAssembly.Global;
  SIGNATURE_TABLE_OFFSET: WebAssembly.Global;
  DISPATCH_CACHE_OFFSET: WebAssembly.Global;
  MAX_TYPES: WebAssembly.Global;
  MAX_SIGNATURES: WebAssembly.Global;
  MAX_PARAMS: WebAssembly.Global;
  CACHE_SLOTS: WebAssembly.Global;
  NO_MATCH: WebAssembly.Global;

  // Type constants
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

  // Memory management
  getTypeCount(): number;
  setTypeCount(count: number): void;
  getSignatureCount(): number;
  setSignatureCount(count: number): void;
  clearMemory(): void;

  // Type registry
  registerType(typeId: number, typeMask: number): number;
  getTypeMask(index: number): number;
  getTypeId(index: number): number;
  typeMatches(valueMask: number, expectedMask: number): boolean;
  combineMasks(mask1: number, mask2: number): number;
  getBuiltinMask(typeId: number): number;
  initBuiltinTypes(): void;

  // Signature table
  addSignature(fnIndex: number, paramCount: number): number;
  setParamMask(sigIndex: number, paramIndex: number, mask: number): void;
  getFnIndex(sigIndex: number): number;
  getParamCount(sigIndex: number): number;
  getParamMask(sigIndex: number, paramIndex: number): number;

  // Dispatch
  dispatchFind(
    argCount: number,
    arg0Mask: number,
    arg1Mask: number,
    arg2Mask: number,
    arg3Mask: number
  ): number;
  dispatchFind0(): number;
  dispatchFind1(arg0Mask: number): number;
  dispatchFind2(arg0Mask: number, arg1Mask: number): number;
  dispatchFindNoCache(
    argCount: number,
    arg0Mask: number,
    arg1Mask: number,
    arg2Mask: number,
    arg3Mask: number
  ): number;

  // Cache
  clearCache(): void;
  invalidateCache(
    argCount: number,
    arg0Mask: number,
    arg1Mask: number,
    arg2Mask: number,
    arg3Mask: number
  ): void;
  getCacheStats(): number;

  // Memory
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

/** Global WASM dispatch state */
let wasmState: WasmDispatchState = {
  initialized: false,
  exports: null,
  functionTable: [],
  initError: null,
};

/** Sentinel value for no match (must match WASM) */
export const NO_MATCH = 0xffffffff;

/**
 * Initialize WASM module with given exports
 *
 * @param exports - WASM module exports
 */
export function initWasm(exports: WasmExports): void {
  wasmState.exports = exports;
  wasmState.functionTable = [];
  wasmState.initError = null;
  wasmState.initialized = true;

  // Initialize built-in types
  exports.initBuiltinTypes();
}

/**
 * Check if WASM is available and initialized
 */
export function isWasmAvailable(): boolean {
  return wasmState.initialized && wasmState.exports !== null;
}

/**
 * Get WASM exports (throws if not initialized)
 */
export function getWasmExports(): WasmExports {
  if (!wasmState.exports) {
    throw new Error('WASM not initialized');
  }
  return wasmState.exports;
}

/**
 * Reset WASM state (for testing)
 */
export function resetWasm(): void {
  if (wasmState.exports) {
    wasmState.exports.clearMemory();
    wasmState.exports.clearCache();
  }
  wasmState.functionTable = [];
}

/**
 * Add a signature to WASM dispatch
 *
 * @param fn - The function to dispatch to
 * @param paramMasks - Array of type masks for each parameter
 * @returns The signature index
 */
export function wasmAddSignature(fn: SignatureFunction, paramMasks: number[]): number {
  const exports = getWasmExports();

  // Add function to table
  const fnIndex = wasmState.functionTable.length;
  wasmState.functionTable.push(fn);

  // Add signature to WASM
  const sigIndex = exports.addSignature(fnIndex, paramMasks.length);
  if (sigIndex === NO_MATCH) {
    throw new Error('Failed to add signature to WASM');
  }

  // Set parameter masks
  for (let i = 0; i < paramMasks.length; i++) {
    const mask = paramMasks[i];
    if (mask !== undefined) {
      exports.setParamMask(sigIndex, i, mask);
    }
  }

  return sigIndex;
}

/**
 * Find matching function for argument type masks
 *
 * @param argMasks - Array of type masks for arguments
 * @returns The matching function, or null if no match
 */
export function wasmDispatchFind(argMasks: number[]): SignatureFunction | null {
  const exports = getWasmExports();

  const argCount = argMasks.length;
  const arg0 = argMasks[0] || 0;
  const arg1 = argMasks[1] || 0;
  const arg2 = argMasks[2] || 0;
  const arg3 = argMasks[3] || 0;

  let fnIndex: number;

  // Use optimized dispatch for common cases
  switch (argCount) {
    case 0:
      fnIndex = exports.dispatchFind0();
      break;
    case 1:
      fnIndex = exports.dispatchFind1(arg0);
      break;
    case 2:
      fnIndex = exports.dispatchFind2(arg0, arg1);
      break;
    default:
      fnIndex = exports.dispatchFind(argCount, arg0, arg1, arg2, arg3);
  }

  if (fnIndex === NO_MATCH) {
    return null;
  }

  return wasmState.functionTable[fnIndex] || null;
}

/**
 * Get function by index from the function table
 */
export function wasmGetFunction(index: number): SignatureFunction | null {
  return wasmState.functionTable[index] || null;
}

/**
 * Clear the dispatch cache
 */
export function wasmClearCache(): void {
  if (wasmState.exports) {
    wasmState.exports.clearCache();
  }
}

/**
 * Get cache statistics
 */
export function wasmGetCacheStats(): number {
  if (!wasmState.exports) {
    return 0;
  }
  return wasmState.exports.getCacheStats();
}

/**
 * Get the number of registered signatures
 */
export function wasmGetSignatureCount(): number {
  if (!wasmState.exports) {
    return 0;
  }
  return wasmState.exports.getSignatureCount();
}

/**
 * Get the built-in type mask for a type ID
 */
export function wasmGetBuiltinMask(typeId: number): number {
  if (!wasmState.exports) {
    return 1 << typeId;
  }
  return wasmState.exports.getBuiltinMask(typeId);
}
