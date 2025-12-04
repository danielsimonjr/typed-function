/**
 * Pure-JS Fallback for typed-function dispatch
 *
 * Mirrors the WASM dispatch interface in pure JavaScript.
 * Used when WASM is not available or for type conversions.
 */

import type { SignatureFunction } from '../core/types.js';

/** Sentinel value for no match */
export const NO_MATCH = 0xffffffff;

/** Maximum parameters per signature */
const MAX_PARAMS = 8;

/** Cache slots (power of 2 for fast modulo) */
const CACHE_SLOTS = 256;

/** Type ID for any (matches all) */
export const TYPE_ANY = 0xffffffff;

/**
 * Signature entry
 */
interface FallbackSignature {
  fnIndex: number;
  paramCount: number;
  paramMasks: number[];
}

/**
 * Cache entry
 */
interface CacheEntry {
  valid: boolean;
  hash: number;
  argCount: number;
  argMasks: number[];
  result: number;
}

/**
 * Fallback dispatch state
 */
interface FallbackState {
  signatures: FallbackSignature[];
  functionTable: SignatureFunction[];
  cache: CacheEntry[];
}

/** Global fallback state */
const fallbackState: FallbackState = {
  signatures: [],
  functionTable: [],
  cache: [],
};

// Initialize cache
for (let i = 0; i < CACHE_SLOTS; i++) {
  fallbackState.cache.push({
    valid: false,
    hash: 0,
    argCount: 0,
    argMasks: [0, 0, 0, 0],
    result: 0,
  });
}

/** FNV-1a constants */
const FNV_OFFSET_BASIS = 2166136261;
const FNV_PRIME = 16777619;

/**
 * Compute FNV-1a hash for argument masks
 */
function computeHash(argCount: number, arg0: number, arg1: number, arg2: number, arg3: number): number {
  let hash = FNV_OFFSET_BASIS;

  hash ^= argCount & 0xff;
  hash = Math.imul(hash, FNV_PRIME) >>> 0;

  // Hash each byte of arg0
  for (let i = 0; i < 4; i++) {
    hash ^= (arg0 >> (i * 8)) & 0xff;
    hash = Math.imul(hash, FNV_PRIME) >>> 0;
  }

  // Hash each byte of arg1
  for (let i = 0; i < 4; i++) {
    hash ^= (arg1 >> (i * 8)) & 0xff;
    hash = Math.imul(hash, FNV_PRIME) >>> 0;
  }

  // Hash each byte of arg2
  for (let i = 0; i < 4; i++) {
    hash ^= (arg2 >> (i * 8)) & 0xff;
    hash = Math.imul(hash, FNV_PRIME) >>> 0;
  }

  // Hash each byte of arg3
  for (let i = 0; i < 4; i++) {
    hash ^= (arg3 >> (i * 8)) & 0xff;
    hash = Math.imul(hash, FNV_PRIME) >>> 0;
  }

  return hash;
}

/**
 * Get cache slot from hash
 */
function getSlot(hash: number): number {
  return hash & (CACHE_SLOTS - 1);
}

/**
 * Look up in cache
 */
function cacheLookup(argCount: number, arg0: number, arg1: number, arg2: number, arg3: number): number {
  const hash = computeHash(argCount, arg0, arg1, arg2, arg3);
  const slot = getSlot(hash);
  const entry = fallbackState.cache[slot];

  if (!entry || !entry.valid) {
    return NO_MATCH;
  }

  if (entry.hash !== hash) {
    return NO_MATCH;
  }

  if (entry.argCount !== argCount) {
    return NO_MATCH;
  }

  if (
    entry.argMasks[0] !== arg0 ||
    entry.argMasks[1] !== arg1 ||
    entry.argMasks[2] !== arg2 ||
    entry.argMasks[3] !== arg3
  ) {
    return NO_MATCH;
  }

  return entry.result;
}

/**
 * Store in cache
 */
function cacheStore(
  argCount: number,
  arg0: number,
  arg1: number,
  arg2: number,
  arg3: number,
  result: number
): void {
  const hash = computeHash(argCount, arg0, arg1, arg2, arg3);
  const slot = getSlot(hash);
  const entry = fallbackState.cache[slot];

  if (entry) {
    entry.valid = true;
    entry.hash = hash;
    entry.argCount = argCount;
    entry.argMasks[0] = arg0;
    entry.argMasks[1] = arg1;
    entry.argMasks[2] = arg2;
    entry.argMasks[3] = arg3;
    entry.result = result;
  }
}

/**
 * Check if argument masks match a signature
 */
function matchSignature(
  sig: FallbackSignature,
  argCount: number,
  argMasks: number[]
): boolean {
  if (argCount !== sig.paramCount) {
    return false;
  }

  for (let i = 0; i < sig.paramCount; i++) {
    const paramMask = sig.paramMasks[i] ?? 0;
    const argMask = argMasks[i] ?? 0;

    // ANY type matches everything
    if (paramMask === TYPE_ANY) {
      continue;
    }

    // Check if argument type bit is set in parameter mask
    if ((argMask & paramMask) === 0) {
      return false;
    }
  }

  return true;
}

/**
 * Add a signature to the fallback dispatch
 *
 * @param fn - The function to dispatch to
 * @param paramMasks - Array of type masks for each parameter
 * @returns The signature index
 */
export function fallbackAddSignature(fn: SignatureFunction, paramMasks: number[]): number {
  if (paramMasks.length > MAX_PARAMS) {
    return NO_MATCH;
  }

  const fnIndex = fallbackState.functionTable.length;
  fallbackState.functionTable.push(fn);

  const sigIndex = fallbackState.signatures.length;
  fallbackState.signatures.push({
    fnIndex,
    paramCount: paramMasks.length,
    paramMasks: [...paramMasks],
  });

  return sigIndex;
}

/**
 * Find matching function for argument type masks
 *
 * @param argMasks - Array of type masks for arguments
 * @returns The matching function, or null if no match
 */
export function fallbackDispatchFind(argMasks: number[]): SignatureFunction | null {
  const argCount = argMasks.length;
  const arg0 = argMasks[0] || 0;
  const arg1 = argMasks[1] || 0;
  const arg2 = argMasks[2] || 0;
  const arg3 = argMasks[3] || 0;

  // Try cache first
  const cached = cacheLookup(argCount, arg0, arg1, arg2, arg3);
  if (cached !== NO_MATCH) {
    return fallbackState.functionTable[cached] || null;
  }

  // Linear search through signatures
  for (const sig of fallbackState.signatures) {
    if (matchSignature(sig, argCount, argMasks)) {
      cacheStore(argCount, arg0, arg1, arg2, arg3, sig.fnIndex);
      return fallbackState.functionTable[sig.fnIndex] || null;
    }
  }

  return null;
}

/**
 * Get function by index
 */
export function fallbackGetFunction(index: number): SignatureFunction | null {
  return fallbackState.functionTable[index] || null;
}

/**
 * Clear all signatures and reset state
 */
export function fallbackClear(): void {
  fallbackState.signatures = [];
  fallbackState.functionTable = [];
  fallbackClearCache();
}

/**
 * Clear the dispatch cache
 */
export function fallbackClearCache(): void {
  for (const entry of fallbackState.cache) {
    entry.valid = false;
  }
}

/**
 * Get the number of registered signatures
 */
export function fallbackGetSignatureCount(): number {
  return fallbackState.signatures.length;
}

/**
 * Get cache statistics
 */
export function fallbackGetCacheStats(): number {
  let count = 0;
  for (const entry of fallbackState.cache) {
    if (entry.valid) {
      count++;
    }
  }
  return count;
}

/**
 * Get the built-in type mask for a type ID
 */
export function fallbackGetBuiltinMask(typeId: number): number {
  if (typeId >= 32) {
    return 0;
  }
  return 1 << typeId;
}
