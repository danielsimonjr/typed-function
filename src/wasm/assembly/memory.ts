/**
 * AssemblyScript Memory Layout for typed-function WASM dispatch
 *
 * Memory is organized in fixed regions to enable efficient dispatch.
 * All offsets are in bytes.
 */

// === Memory Region Offsets ===

/** Start of type registry region (stores type IDs and masks) */
export const TYPE_REGISTRY_OFFSET: u32 = 0;

/** Maximum number of types supported */
export const MAX_TYPES: u32 = 256;

/** Size of each type entry (4 bytes for ID, 4 bytes for mask) */
export const TYPE_ENTRY_SIZE: u32 = 8;

/** Total size of type registry region */
export const TYPE_REGISTRY_SIZE: u32 = MAX_TYPES * TYPE_ENTRY_SIZE;

/** Start of signature table region */
export const SIGNATURE_TABLE_OFFSET: u32 = TYPE_REGISTRY_OFFSET + TYPE_REGISTRY_SIZE;

/** Maximum number of signatures supported */
export const MAX_SIGNATURES: u32 = 1024;

/** Size of each signature entry:
 *  - 4 bytes: function index
 *  - 4 bytes: param count
 *  - 32 bytes: param masks (8 params * 4 bytes each)
 */
export const SIGNATURE_ENTRY_SIZE: u32 = 40;

/** Maximum parameters per signature for WASM dispatch */
export const MAX_PARAMS: u32 = 8;

/** Total size of signature table region */
export const SIGNATURE_TABLE_SIZE: u32 = MAX_SIGNATURES * SIGNATURE_ENTRY_SIZE;

/** Start of dispatch cache region */
export const DISPATCH_CACHE_OFFSET: u32 = SIGNATURE_TABLE_OFFSET + SIGNATURE_TABLE_SIZE;

/** Number of cache slots (power of 2 for fast modulo) */
export const CACHE_SLOTS: u32 = 256;

/** Size of each cache entry:
 *  - 4 bytes: hash key
 *  - 4 bytes: function index result
 *  - 32 bytes: param masks (for validation)
 */
export const CACHE_ENTRY_SIZE: u32 = 40;

/** Total size of dispatch cache region */
export const DISPATCH_CACHE_SIZE: u32 = CACHE_SLOTS * CACHE_ENTRY_SIZE;

/** Start of scratch/temp region */
export const SCRATCH_OFFSET: u32 = DISPATCH_CACHE_OFFSET + DISPATCH_CACHE_SIZE;

/** Size of scratch region for temporary computations */
export const SCRATCH_SIZE: u32 = 1024;

/** Total memory layout size */
export const TOTAL_MEMORY_SIZE: u32 = SCRATCH_OFFSET + SCRATCH_SIZE;

// === Counters ===

/** Current number of registered types */
let typeCount: u32 = 0;

/** Current number of registered signatures */
let signatureCount: u32 = 0;

// === Memory Access Helpers ===

/**
 * Get the offset for a type entry by index
 */
export function getTypeOffset(index: u32): u32 {
  return TYPE_REGISTRY_OFFSET + index * TYPE_ENTRY_SIZE;
}

/**
 * Get the offset for a signature entry by index
 */
export function getSignatureOffset(index: u32): u32 {
  return SIGNATURE_TABLE_OFFSET + index * SIGNATURE_ENTRY_SIZE;
}

/**
 * Get the offset for a cache entry by slot
 */
export function getCacheOffset(slot: u32): u32 {
  return DISPATCH_CACHE_OFFSET + slot * CACHE_ENTRY_SIZE;
}

/**
 * Get current type count
 */
export function getTypeCount(): u32 {
  return typeCount;
}

/**
 * Set type count
 */
export function setTypeCount(count: u32): void {
  typeCount = count;
}

/**
 * Get current signature count
 */
export function getSignatureCount(): u32 {
  return signatureCount;
}

/**
 * Set signature count
 */
export function setSignatureCount(count: u32): void {
  signatureCount = count;
}

/**
 * Clear all memory regions (reset state)
 */
export function clearMemory(): void {
  typeCount = 0;
  signatureCount = 0;

  // Clear type registry
  for (let i: u32 = 0; i < TYPE_REGISTRY_SIZE; i += 4) {
    store<u32>(TYPE_REGISTRY_OFFSET + i, 0);
  }

  // Clear signature table
  for (let i: u32 = 0; i < SIGNATURE_TABLE_SIZE; i += 4) {
    store<u32>(SIGNATURE_TABLE_OFFSET + i, 0);
  }

  // Clear cache
  for (let i: u32 = 0; i < DISPATCH_CACHE_SIZE; i += 4) {
    store<u32>(DISPATCH_CACHE_OFFSET + i, 0);
  }
}
