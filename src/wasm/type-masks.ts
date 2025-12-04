/**
 * Type Mask Assignment for typed-function dispatch
 *
 * Maps JavaScript type checks to bit masks for WASM dispatch.
 */

// === Built-in Type IDs (must match WASM) ===

/** Type ID for number */
export const TYPE_NUMBER = 0;

/** Type ID for string */
export const TYPE_STRING = 1;

/** Type ID for boolean */
export const TYPE_BOOLEAN = 2;

/** Type ID for Function */
export const TYPE_FUNCTION = 3;

/** Type ID for Array */
export const TYPE_ARRAY = 4;

/** Type ID for Date */
export const TYPE_DATE = 5;

/** Type ID for RegExp */
export const TYPE_REGEXP = 6;

/** Type ID for Object */
export const TYPE_OBJECT = 7;

/** Type ID for null */
export const TYPE_NULL = 8;

/** Type ID for undefined */
export const TYPE_UNDEFINED = 9;

/** Mask for any type (matches all) */
export const TYPE_ANY_MASK = 0xffffffff;

/** Next available custom type ID */
let nextCustomTypeId = 10;

/** Map from type name to bit */
const typeNameToBit: Map<string, number> = new Map([
  ['number', TYPE_NUMBER],
  ['string', TYPE_STRING],
  ['boolean', TYPE_BOOLEAN],
  ['Function', TYPE_FUNCTION],
  ['Array', TYPE_ARRAY],
  ['Date', TYPE_DATE],
  ['RegExp', TYPE_REGEXP],
  ['Object', TYPE_OBJECT],
  ['null', TYPE_NULL],
  ['undefined', TYPE_UNDEFINED],
  ['any', -1], // Special marker for any
]);

/**
 * Get the type bit for a type name
 *
 * @param typeName - The type name
 * @returns The type bit position
 */
export function getTypeBit(typeName: string): number {
  const existing = typeNameToBit.get(typeName);
  if (existing !== undefined) {
    return existing;
  }

  // Assign new bit for custom type
  const bit = nextCustomTypeId++;
  typeNameToBit.set(typeName, bit);
  return bit;
}

/**
 * Get the type mask for a type name
 *
 * @param typeName - The type name
 * @returns The type mask (1 << bit for single types, or ANY_MASK for 'any')
 */
export function getTypeMaskForName(typeName: string): number {
  const bit = getTypeBit(typeName);
  if (bit === -1) {
    return TYPE_ANY_MASK;
  }
  return 1 << bit;
}

/**
 * Get the type mask for a runtime value
 *
 * @param value - The value to check
 * @returns The type mask representing the value's type
 */
export function getTypeMaskForValue(value: unknown): number {
  if (value === null) {
    return 1 << TYPE_NULL;
  }

  if (value === undefined) {
    return 1 << TYPE_UNDEFINED;
  }

  switch (typeof value) {
    case 'number':
      return 1 << TYPE_NUMBER;
    case 'string':
      return 1 << TYPE_STRING;
    case 'boolean':
      return 1 << TYPE_BOOLEAN;
    case 'function':
      return 1 << TYPE_FUNCTION;
    case 'object':
      if (Array.isArray(value)) {
        return 1 << TYPE_ARRAY;
      }
      if (value instanceof Date) {
        return 1 << TYPE_DATE;
      }
      if (value instanceof RegExp) {
        return 1 << TYPE_REGEXP;
      }
      // Plain object
      return 1 << TYPE_OBJECT;
    default:
      // Unknown type - matches Object
      return 1 << TYPE_OBJECT;
  }
}

/**
 * Get combined mask for a parameter's types
 *
 * @param typeNames - Array of type names that the parameter accepts
 * @returns Combined mask (OR of all type masks)
 */
export function getParamMask(typeNames: string[]): number {
  if (typeNames.length === 0) {
    return TYPE_ANY_MASK;
  }

  let mask = 0;
  for (const name of typeNames) {
    const typeMask = getTypeMaskForName(name);
    if (typeMask === TYPE_ANY_MASK) {
      return TYPE_ANY_MASK;
    }
    mask |= typeMask;
  }

  return mask;
}

/**
 * Get array of type masks for all arguments
 *
 * @param args - The arguments
 * @returns Array of type masks
 */
export function getArgMasks(args: ArrayLike<unknown>): number[] {
  const masks: number[] = [];
  for (let i = 0; i < args.length; i++) {
    masks.push(getTypeMaskForValue(args[i]));
  }
  return masks;
}

/**
 * Check if a value's mask matches an expected parameter mask
 *
 * @param valueMask - The value's type mask
 * @param paramMask - The expected parameter mask
 * @returns true if matches
 */
export function typeMatches(valueMask: number, paramMask: number): boolean {
  if (paramMask === TYPE_ANY_MASK) {
    return true;
  }
  return (valueMask & paramMask) !== 0;
}

/**
 * Reset custom type assignments (for testing)
 */
export function resetTypeMasks(): void {
  // Remove custom types, keep built-ins
  const builtIns = [
    'number',
    'string',
    'boolean',
    'Function',
    'Array',
    'Date',
    'RegExp',
    'Object',
    'null',
    'undefined',
    'any',
  ];

  const toRemove: string[] = [];
  for (const key of typeNameToBit.keys()) {
    if (!builtIns.includes(key)) {
      toRemove.push(key);
    }
  }

  for (const key of toRemove) {
    typeNameToBit.delete(key);
  }

  nextCustomTypeId = 10;
}

/**
 * Register a custom type with its test function
 *
 * @param typeName - The type name
 * @returns The assigned type bit
 */
export function registerCustomType(typeName: string): number {
  return getTypeBit(typeName);
}

/**
 * Get human-readable type name from mask
 * (for debugging and error messages)
 *
 * @param mask - The type mask
 * @returns Type name(s) as string
 */
export function maskToTypeNames(mask: number): string[] {
  if (mask === TYPE_ANY_MASK) {
    return ['any'];
  }

  const names: string[] = [];
  for (const [name, bit] of typeNameToBit) {
    if (bit >= 0 && (mask & (1 << bit)) !== 0) {
      names.push(name);
    }
  }

  return names.length > 0 ? names : ['unknown'];
}
