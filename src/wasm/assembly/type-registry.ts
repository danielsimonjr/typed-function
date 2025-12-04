/**
 * AssemblyScript Type ID Registry for typed-function WASM dispatch
 *
 * Stores type IDs and their corresponding bit masks for fast
 * type matching during dispatch.
 */

import {
  TYPE_REGISTRY_OFFSET,
  TYPE_ENTRY_SIZE,
  MAX_TYPES,
  getTypeOffset,
  getTypeCount,
  setTypeCount,
} from './memory';

// === Built-in Type IDs ===
// These match the bit positions in the JS TypeRegistry

/** Type ID for number */
export const TYPE_NUMBER: u32 = 0;

/** Type ID for string */
export const TYPE_STRING: u32 = 1;

/** Type ID for boolean */
export const TYPE_BOOLEAN: u32 = 2;

/** Type ID for Function */
export const TYPE_FUNCTION: u32 = 3;

/** Type ID for Array */
export const TYPE_ARRAY: u32 = 4;

/** Type ID for Date */
export const TYPE_DATE: u32 = 5;

/** Type ID for RegExp */
export const TYPE_REGEXP: u32 = 6;

/** Type ID for Object */
export const TYPE_OBJECT: u32 = 7;

/** Type ID for null */
export const TYPE_NULL: u32 = 8;

/** Type ID for undefined */
export const TYPE_UNDEFINED: u32 = 9;

/** Type ID for any (matches all) */
export const TYPE_ANY: u32 = 0xFFFFFFFF;

/**
 * Register a type with its bit mask
 *
 * @param typeId - The type's unique ID
 * @param typeMask - The type's bit mask (1 << typeId for single types)
 * @returns The index where the type was stored
 */
export function registerType(typeId: u32, typeMask: u32): u32 {
  const count = getTypeCount();
  if (count >= MAX_TYPES) {
    return 0xFFFFFFFF; // Error: too many types
  }

  const offset = getTypeOffset(count);

  // Store type ID at offset
  store<u32>(offset, typeId);

  // Store type mask at offset + 4
  store<u32>(offset + 4, typeMask);

  setTypeCount(count + 1);
  return count;
}

/**
 * Get the type mask for a registered type
 *
 * @param index - The type index
 * @returns The type's bit mask
 */
export function getTypeMask(index: u32): u32 {
  if (index >= getTypeCount()) {
    return 0;
  }

  const offset = getTypeOffset(index);
  return load<u32>(offset + 4);
}

/**
 * Get the type ID for a registered type
 *
 * @param index - The type index
 * @returns The type's ID
 */
export function getTypeId(index: u32): u32 {
  if (index >= getTypeCount()) {
    return 0xFFFFFFFF;
  }

  const offset = getTypeOffset(index);
  return load<u32>(offset);
}

/**
 * Check if a value's type mask matches an expected type mask
 *
 * @param valueMask - The mask representing the value's type
 * @param expectedMask - The mask representing expected types
 * @returns true if the value matches any expected type
 */
export function typeMatches(valueMask: u32, expectedMask: u32): bool {
  // ANY type matches everything
  if (expectedMask === TYPE_ANY) {
    return true;
  }

  // Check if value's type bit is set in expected mask
  return (valueMask & expectedMask) !== 0;
}

/**
 * Create a combined mask from multiple type masks
 *
 * @param masks - Array of individual type masks
 * @returns Combined mask (OR of all input masks)
 */
export function combineMasks(mask1: u32, mask2: u32): u32 {
  return mask1 | mask2;
}

/**
 * Get the bit mask for a built-in type ID
 *
 * @param typeId - The built-in type ID
 * @returns The corresponding bit mask
 */
export function getBuiltinMask(typeId: u32): u32 {
  if (typeId >= 32) {
    return 0; // Only support 32 built-in types
  }
  return 1 << typeId;
}

/**
 * Find a type by its ID
 *
 * @param typeId - The type ID to find
 * @returns The index of the type, or 0xFFFFFFFF if not found
 */
export function findTypeByIdLoop(typeId: u32): u32 {
  const count = getTypeCount();

  for (let i: u32 = 0; i < count; i++) {
    if (getTypeId(i) === typeId) {
      return i;
    }
  }

  return 0xFFFFFFFF;
}

/**
 * Initialize built-in types
 * Call this once at startup
 */
export function initBuiltinTypes(): void {
  registerType(TYPE_NUMBER, 1 << TYPE_NUMBER);
  registerType(TYPE_STRING, 1 << TYPE_STRING);
  registerType(TYPE_BOOLEAN, 1 << TYPE_BOOLEAN);
  registerType(TYPE_FUNCTION, 1 << TYPE_FUNCTION);
  registerType(TYPE_ARRAY, 1 << TYPE_ARRAY);
  registerType(TYPE_DATE, 1 << TYPE_DATE);
  registerType(TYPE_REGEXP, 1 << TYPE_REGEXP);
  registerType(TYPE_OBJECT, 1 << TYPE_OBJECT);
  registerType(TYPE_NULL, 1 << TYPE_NULL);
  registerType(TYPE_UNDEFINED, 1 << TYPE_UNDEFINED);
}
