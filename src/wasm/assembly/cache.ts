/**
 * AssemblyScript Dispatch Cache for typed-function WASM dispatch
 *
 * LRU-style cache with FNV-1a hash for repeated argument patterns.
 * Significantly speeds up repeated calls with same argument types.
 */

import {
  DISPATCH_CACHE_OFFSET,
  CACHE_SLOTS,
  CACHE_ENTRY_SIZE,
  getCacheOffset,
} from './memory';

/** Sentinel value indicating no match found */
const NO_MATCH: u32 = 0xFFFFFFFF;

// === Cache Entry Layout ===
// Offset 0: hash key (u32)
// Offset 4: function index result (u32)
// Offset 8: argCount (u32)
// Offset 12: arg0Mask (u32)
// Offset 16: arg1Mask (u32)
// Offset 20: arg2Mask (u32)
// Offset 24: arg3Mask (u32)
// Offset 28: valid flag (u32, 1 = valid, 0 = invalid)

const HASH_OFFSET: u32 = 0;
const RESULT_OFFSET: u32 = 4;
const ARG_COUNT_OFFSET: u32 = 8;
const ARG0_OFFSET: u32 = 12;
const ARG1_OFFSET: u32 = 16;
const ARG2_OFFSET: u32 = 20;
const ARG3_OFFSET: u32 = 24;
const VALID_OFFSET: u32 = 28;

/** FNV-1a offset basis */
const FNV_OFFSET_BASIS: u32 = 2166136261;

/** FNV-1a prime */
const FNV_PRIME: u32 = 16777619;

/**
 * Compute FNV-1a hash for argument masks
 *
 * @param argCount - Number of arguments
 * @param arg0Mask - Type mask for argument 0
 * @param arg1Mask - Type mask for argument 1
 * @param arg2Mask - Type mask for argument 2
 * @param arg3Mask - Type mask for argument 3
 * @returns 32-bit hash value
 */
function computeHash(
  argCount: u32,
  arg0Mask: u32,
  arg1Mask: u32,
  arg2Mask: u32,
  arg3Mask: u32
): u32 {
  let hash = FNV_OFFSET_BASIS;

  // Hash argCount
  hash ^= argCount & 0xFF;
  hash = hash * FNV_PRIME;

  // Hash arg0Mask bytes
  hash ^= arg0Mask & 0xFF;
  hash = hash * FNV_PRIME;
  hash ^= (arg0Mask >> 8) & 0xFF;
  hash = hash * FNV_PRIME;
  hash ^= (arg0Mask >> 16) & 0xFF;
  hash = hash * FNV_PRIME;
  hash ^= (arg0Mask >> 24) & 0xFF;
  hash = hash * FNV_PRIME;

  // Hash arg1Mask bytes
  hash ^= arg1Mask & 0xFF;
  hash = hash * FNV_PRIME;
  hash ^= (arg1Mask >> 8) & 0xFF;
  hash = hash * FNV_PRIME;
  hash ^= (arg1Mask >> 16) & 0xFF;
  hash = hash * FNV_PRIME;
  hash ^= (arg1Mask >> 24) & 0xFF;
  hash = hash * FNV_PRIME;

  // Hash arg2Mask bytes
  hash ^= arg2Mask & 0xFF;
  hash = hash * FNV_PRIME;
  hash ^= (arg2Mask >> 8) & 0xFF;
  hash = hash * FNV_PRIME;
  hash ^= (arg2Mask >> 16) & 0xFF;
  hash = hash * FNV_PRIME;
  hash ^= (arg2Mask >> 24) & 0xFF;
  hash = hash * FNV_PRIME;

  // Hash arg3Mask bytes
  hash ^= arg3Mask & 0xFF;
  hash = hash * FNV_PRIME;
  hash ^= (arg3Mask >> 8) & 0xFF;
  hash = hash * FNV_PRIME;
  hash ^= (arg3Mask >> 16) & 0xFF;
  hash = hash * FNV_PRIME;
  hash ^= (arg3Mask >> 24) & 0xFF;
  hash = hash * FNV_PRIME;

  return hash;
}

/**
 * Get cache slot from hash (using power-of-2 modulo)
 */
function getSlot(hash: u32): u32 {
  return hash & (CACHE_SLOTS - 1);
}

/**
 * Look up a cached dispatch result
 *
 * @param argCount - Number of arguments
 * @param arg0Mask - Type mask for argument 0
 * @param arg1Mask - Type mask for argument 1
 * @param arg2Mask - Type mask for argument 2
 * @param arg3Mask - Type mask for argument 3
 * @returns Cached function index, or NO_MATCH if not found
 */
export function cacheLookup(
  argCount: u32,
  arg0Mask: u32,
  arg1Mask: u32,
  arg2Mask: u32,
  arg3Mask: u32
): u32 {
  const hash = computeHash(argCount, arg0Mask, arg1Mask, arg2Mask, arg3Mask);
  const slot = getSlot(hash);
  const offset = getCacheOffset(slot);

  // Check if slot is valid
  const valid = load<u32>(offset + VALID_OFFSET);
  if (valid !== 1) {
    return NO_MATCH;
  }

  // Check if hash matches
  const storedHash = load<u32>(offset + HASH_OFFSET);
  if (storedHash !== hash) {
    return NO_MATCH;
  }

  // Verify all arguments match (to handle hash collisions)
  if (load<u32>(offset + ARG_COUNT_OFFSET) !== argCount) {
    return NO_MATCH;
  }
  if (load<u32>(offset + ARG0_OFFSET) !== arg0Mask) {
    return NO_MATCH;
  }
  if (load<u32>(offset + ARG1_OFFSET) !== arg1Mask) {
    return NO_MATCH;
  }
  if (load<u32>(offset + ARG2_OFFSET) !== arg2Mask) {
    return NO_MATCH;
  }
  if (load<u32>(offset + ARG3_OFFSET) !== arg3Mask) {
    return NO_MATCH;
  }

  // Return cached result
  return load<u32>(offset + RESULT_OFFSET);
}

/**
 * Store a dispatch result in the cache
 *
 * @param argCount - Number of arguments
 * @param arg0Mask - Type mask for argument 0
 * @param arg1Mask - Type mask for argument 1
 * @param arg2Mask - Type mask for argument 2
 * @param arg3Mask - Type mask for argument 3
 * @param fnIndex - The function index result
 */
export function cacheStore(
  argCount: u32,
  arg0Mask: u32,
  arg1Mask: u32,
  arg2Mask: u32,
  arg3Mask: u32,
  fnIndex: u32
): void {
  const hash = computeHash(argCount, arg0Mask, arg1Mask, arg2Mask, arg3Mask);
  const slot = getSlot(hash);
  const offset = getCacheOffset(slot);

  // Store all values
  store<u32>(offset + HASH_OFFSET, hash);
  store<u32>(offset + RESULT_OFFSET, fnIndex);
  store<u32>(offset + ARG_COUNT_OFFSET, argCount);
  store<u32>(offset + ARG0_OFFSET, arg0Mask);
  store<u32>(offset + ARG1_OFFSET, arg1Mask);
  store<u32>(offset + ARG2_OFFSET, arg2Mask);
  store<u32>(offset + ARG3_OFFSET, arg3Mask);
  store<u32>(offset + VALID_OFFSET, 1);
}

/**
 * Clear the entire cache
 */
export function clearCache(): void {
  for (let i: u32 = 0; i < CACHE_SLOTS; i++) {
    const offset = getCacheOffset(i);
    store<u32>(offset + VALID_OFFSET, 0);
  }
}

/**
 * Invalidate a specific cache entry
 */
export function invalidateCache(
  argCount: u32,
  arg0Mask: u32,
  arg1Mask: u32,
  arg2Mask: u32,
  arg3Mask: u32
): void {
  const hash = computeHash(argCount, arg0Mask, arg1Mask, arg2Mask, arg3Mask);
  const slot = getSlot(hash);
  const offset = getCacheOffset(slot);
  store<u32>(offset + VALID_OFFSET, 0);
}

/**
 * Get cache statistics (for debugging)
 * Returns number of valid entries
 */
export function getCacheStats(): u32 {
  let validCount: u32 = 0;

  for (let i: u32 = 0; i < CACHE_SLOTS; i++) {
    const offset = getCacheOffset(i);
    if (load<u32>(offset + VALID_OFFSET) === 1) {
      validCount++;
    }
  }

  return validCount;
}
