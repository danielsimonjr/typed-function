/**
 * AssemblyScript Signature Table for typed-function WASM dispatch
 *
 * Stores signature metadata for fast matching during dispatch.
 * Each signature entry contains:
 * - Function index (to return to JS)
 * - Parameter count
 * - Parameter type masks (up to 8 params)
 */

import {
  SIGNATURE_TABLE_OFFSET,
  SIGNATURE_ENTRY_SIZE,
  MAX_SIGNATURES,
  MAX_PARAMS,
  getSignatureOffset,
  getSignatureCount,
  setSignatureCount,
} from './memory';

// === Signature Entry Layout ===
// Offset 0: function index (u32)
// Offset 4: param count (u32)
// Offset 8-39: param masks (8 * u32)

/** Offset of function index within signature entry */
const FN_INDEX_OFFSET: u32 = 0;

/** Offset of param count within signature entry */
const PARAM_COUNT_OFFSET: u32 = 4;

/** Offset of first param mask within signature entry */
const PARAM_MASKS_OFFSET: u32 = 8;

/**
 * Add a new signature to the table
 *
 * @param fnIndex - Index of the function in the JS function table
 * @param paramCount - Number of parameters
 * @param paramMasks - Array of type masks for each parameter (as a pointer)
 * @returns The signature index, or 0xFFFFFFFF on error
 */
export function addSignature(fnIndex: u32, paramCount: u32): u32 {
  const count = getSignatureCount();
  if (count >= MAX_SIGNATURES) {
    return 0xFFFFFFFF; // Error: too many signatures
  }

  if (paramCount > MAX_PARAMS) {
    return 0xFFFFFFFF; // Error: too many params
  }

  const offset = getSignatureOffset(count);

  // Store function index
  store<u32>(offset + FN_INDEX_OFFSET, fnIndex);

  // Store param count
  store<u32>(offset + PARAM_COUNT_OFFSET, paramCount);

  // Initialize param masks to 0 (will be set separately)
  for (let i: u32 = 0; i < MAX_PARAMS; i++) {
    store<u32>(offset + PARAM_MASKS_OFFSET + i * 4, 0);
  }

  setSignatureCount(count + 1);
  return count;
}

/**
 * Set a parameter mask for a signature
 *
 * @param sigIndex - The signature index
 * @param paramIndex - The parameter index (0-7)
 * @param mask - The type mask for this parameter
 */
export function setParamMask(sigIndex: u32, paramIndex: u32, mask: u32): void {
  if (sigIndex >= getSignatureCount() || paramIndex >= MAX_PARAMS) {
    return;
  }

  const offset = getSignatureOffset(sigIndex);
  store<u32>(offset + PARAM_MASKS_OFFSET + paramIndex * 4, mask);
}

/**
 * Get the function index for a signature
 *
 * @param sigIndex - The signature index
 * @returns The function index
 */
export function getFnIndex(sigIndex: u32): u32 {
  if (sigIndex >= getSignatureCount()) {
    return 0xFFFFFFFF;
  }

  const offset = getSignatureOffset(sigIndex);
  return load<u32>(offset + FN_INDEX_OFFSET);
}

/**
 * Get the parameter count for a signature
 *
 * @param sigIndex - The signature index
 * @returns The number of parameters
 */
export function getParamCount(sigIndex: u32): u32 {
  if (sigIndex >= getSignatureCount()) {
    return 0;
  }

  const offset = getSignatureOffset(sigIndex);
  return load<u32>(offset + PARAM_COUNT_OFFSET);
}

/**
 * Get a parameter mask for a signature
 *
 * @param sigIndex - The signature index
 * @param paramIndex - The parameter index
 * @returns The type mask for this parameter
 */
export function getParamMask(sigIndex: u32, paramIndex: u32): u32 {
  if (sigIndex >= getSignatureCount() || paramIndex >= MAX_PARAMS) {
    return 0;
  }

  const offset = getSignatureOffset(sigIndex);
  return load<u32>(offset + PARAM_MASKS_OFFSET + paramIndex * 4);
}

/**
 * Check if argument masks match a signature
 *
 * @param sigIndex - The signature index
 * @param argCount - Number of arguments provided
 * @param arg0Mask - Type mask for argument 0
 * @param arg1Mask - Type mask for argument 1
 * @param arg2Mask - Type mask for argument 2 (optional)
 * @param arg3Mask - Type mask for argument 3 (optional)
 * @returns true if all arguments match
 */
export function matchSignature(
  sigIndex: u32,
  argCount: u32,
  arg0Mask: u32,
  arg1Mask: u32,
  arg2Mask: u32,
  arg3Mask: u32
): bool {
  const paramCount = getParamCount(sigIndex);

  // Argument count must match (exact match for now, rest params handled in JS)
  if (argCount !== paramCount) {
    return false;
  }

  const offset = getSignatureOffset(sigIndex);

  // Check each argument against the corresponding parameter mask
  if (paramCount >= 1) {
    const mask0 = load<u32>(offset + PARAM_MASKS_OFFSET);
    if (mask0 !== 0xFFFFFFFF && (arg0Mask & mask0) === 0) {
      return false;
    }
  }

  if (paramCount >= 2) {
    const mask1 = load<u32>(offset + PARAM_MASKS_OFFSET + 4);
    if (mask1 !== 0xFFFFFFFF && (arg1Mask & mask1) === 0) {
      return false;
    }
  }

  if (paramCount >= 3) {
    const mask2 = load<u32>(offset + PARAM_MASKS_OFFSET + 8);
    if (mask2 !== 0xFFFFFFFF && (arg2Mask & mask2) === 0) {
      return false;
    }
  }

  if (paramCount >= 4) {
    const mask3 = load<u32>(offset + PARAM_MASKS_OFFSET + 12);
    if (mask3 !== 0xFFFFFFFF && (arg3Mask & mask3) === 0) {
      return false;
    }
  }

  return true;
}

/**
 * Optimized match for 0-parameter signatures
 */
export function matchSignature0(sigIndex: u32, argCount: u32): bool {
  return argCount === 0 && getParamCount(sigIndex) === 0;
}

/**
 * Optimized match for 1-parameter signatures
 */
export function matchSignature1(sigIndex: u32, argCount: u32, arg0Mask: u32): bool {
  if (argCount !== 1 || getParamCount(sigIndex) !== 1) {
    return false;
  }

  const offset = getSignatureOffset(sigIndex);
  const mask0 = load<u32>(offset + PARAM_MASKS_OFFSET);

  return mask0 === 0xFFFFFFFF || (arg0Mask & mask0) !== 0;
}

/**
 * Optimized match for 2-parameter signatures
 */
export function matchSignature2(
  sigIndex: u32,
  argCount: u32,
  arg0Mask: u32,
  arg1Mask: u32
): bool {
  if (argCount !== 2 || getParamCount(sigIndex) !== 2) {
    return false;
  }

  const offset = getSignatureOffset(sigIndex);
  const mask0 = load<u32>(offset + PARAM_MASKS_OFFSET);
  const mask1 = load<u32>(offset + PARAM_MASKS_OFFSET + 4);

  if (mask0 !== 0xFFFFFFFF && (arg0Mask & mask0) === 0) {
    return false;
  }

  if (mask1 !== 0xFFFFFFFF && (arg1Mask & mask1) === 0) {
    return false;
  }

  return true;
}
