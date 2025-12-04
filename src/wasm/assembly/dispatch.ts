/**
 * AssemblyScript Dispatch Loop for typed-function WASM dispatch
 *
 * Core hot-path dispatch with bit-mask matching.
 * Returns the function index for matching signature.
 */

import { getSignatureCount } from './memory';
import {
  getFnIndex,
  getParamCount,
  getParamMask,
  matchSignature0,
  matchSignature1,
  matchSignature2,
  matchSignature,
} from './signature-table';
import { cacheLookup, cacheStore } from './cache';

/** Sentinel value indicating no match found */
export const NO_MATCH: u32 = 0xFFFFFFFF;

/**
 * Find matching signature for given argument type masks
 *
 * This is the core dispatch function. It iterates through all signatures
 * and returns the function index of the first match.
 *
 * @param argCount - Number of arguments
 * @param arg0Mask - Type mask for argument 0
 * @param arg1Mask - Type mask for argument 1
 * @param arg2Mask - Type mask for argument 2
 * @param arg3Mask - Type mask for argument 3
 * @returns Function index of matching signature, or NO_MATCH
 */
export function dispatchFind(
  argCount: u32,
  arg0Mask: u32,
  arg1Mask: u32,
  arg2Mask: u32,
  arg3Mask: u32
): u32 {
  // Try cache first
  const cached = cacheLookup(argCount, arg0Mask, arg1Mask, arg2Mask, arg3Mask);
  if (cached !== NO_MATCH) {
    return cached;
  }

  const sigCount = getSignatureCount();

  // Iterate through all signatures
  for (let i: u32 = 0; i < sigCount; i++) {
    if (matchSignature(i, argCount, arg0Mask, arg1Mask, arg2Mask, arg3Mask)) {
      const fnIndex = getFnIndex(i);
      // Store in cache for future lookups
      cacheStore(argCount, arg0Mask, arg1Mask, arg2Mask, arg3Mask, fnIndex);
      return fnIndex;
    }
  }

  return NO_MATCH;
}

/**
 * Optimized dispatch for 0-argument calls
 */
export function dispatchFind0(): u32 {
  // Try cache first
  const cached = cacheLookup(0, 0, 0, 0, 0);
  if (cached !== NO_MATCH) {
    return cached;
  }

  const sigCount = getSignatureCount();

  for (let i: u32 = 0; i < sigCount; i++) {
    if (matchSignature0(i, 0)) {
      const fnIndex = getFnIndex(i);
      cacheStore(0, 0, 0, 0, 0, fnIndex);
      return fnIndex;
    }
  }

  return NO_MATCH;
}

/**
 * Optimized dispatch for 1-argument calls
 *
 * @param arg0Mask - Type mask for the single argument
 */
export function dispatchFind1(arg0Mask: u32): u32 {
  // Try cache first
  const cached = cacheLookup(1, arg0Mask, 0, 0, 0);
  if (cached !== NO_MATCH) {
    return cached;
  }

  const sigCount = getSignatureCount();

  for (let i: u32 = 0; i < sigCount; i++) {
    if (matchSignature1(i, 1, arg0Mask)) {
      const fnIndex = getFnIndex(i);
      cacheStore(1, arg0Mask, 0, 0, 0, fnIndex);
      return fnIndex;
    }
  }

  return NO_MATCH;
}

/**
 * Optimized dispatch for 2-argument calls
 *
 * @param arg0Mask - Type mask for argument 0
 * @param arg1Mask - Type mask for argument 1
 */
export function dispatchFind2(arg0Mask: u32, arg1Mask: u32): u32 {
  // Try cache first
  const cached = cacheLookup(2, arg0Mask, arg1Mask, 0, 0);
  if (cached !== NO_MATCH) {
    return cached;
  }

  const sigCount = getSignatureCount();

  for (let i: u32 = 0; i < sigCount; i++) {
    if (matchSignature2(i, 2, arg0Mask, arg1Mask)) {
      const fnIndex = getFnIndex(i);
      cacheStore(2, arg0Mask, arg1Mask, 0, 0, fnIndex);
      return fnIndex;
    }
  }

  return NO_MATCH;
}

/**
 * Dispatch without caching (for one-off calls or testing)
 */
export function dispatchFindNoCache(
  argCount: u32,
  arg0Mask: u32,
  arg1Mask: u32,
  arg2Mask: u32,
  arg3Mask: u32
): u32 {
  const sigCount = getSignatureCount();

  for (let i: u32 = 0; i < sigCount; i++) {
    if (matchSignature(i, argCount, arg0Mask, arg1Mask, arg2Mask, arg3Mask)) {
      return getFnIndex(i);
    }
  }

  return NO_MATCH;
}

/**
 * Check if any signature exists that could match given argument count
 *
 * @param argCount - Number of arguments
 * @returns true if at least one signature has matching param count
 */
export function hasSignatureForArgCount(argCount: u32): bool {
  const sigCount = getSignatureCount();

  for (let i: u32 = 0; i < sigCount; i++) {
    if (getParamCount(i) === argCount) {
      return true;
    }
  }

  return false;
}
