/**
 * Signature Comparator Module for typed-function
 *
 * This module handles comparing and ordering signatures for dispatch priority,
 * and detecting conflicts between signatures.
 */

import type { Param, Type } from './types.js';
import { last } from '../utils/array-helpers.js';

/**
 * Test whether a set of params contains a rest param
 */
export function hasRestParam(params: Param[]): boolean {
  const param = last(params);
  return param ? param.restParam : false;
}

/**
 * Check if a type is an exact type (not a conversion)
 */
function isExactType(type: Type): boolean {
  return type.conversion === null || type.conversion === undefined;
}

/**
 * Find the lowest type index among all types in a parameter
 *
 * @param param - The parameter to check
 * @param maxTypeIndex - The maximum possible type index (from registry)
 * @returns The lowest type index
 */
export function getLowestTypeIndex(param: Param, maxTypeIndex: number): number {
  let min = maxTypeIndex + 1;

  for (const type of param.types) {
    if (type.typeIndex < min) {
      min = type.typeIndex;
    }
  }

  return min;
}

/**
 * Find the lowest conversion index among conversions in a parameter
 *
 * @param param - The parameter to check
 * @param maxConversionIndex - The maximum possible conversion index
 * @returns The lowest conversion index
 */
export function getLowestConversionIndex(param: Param, maxConversionIndex: number): number {
  let min = maxConversionIndex + 1;

  for (const type of param.types) {
    if (!isExactType(type) && type.conversionIndex >= 0 && type.conversionIndex < min) {
      min = type.conversionIndex;
    }
  }

  return min;
}

/**
 * Compare two parameters for ordering priority
 *
 * Returns:
 * - Negative if param1 should come first
 * - Positive if param2 should come first
 * - Zero if equivalent
 *
 * The absolute value indicates importance (smaller = less important difference)
 *
 * @param param1 - First parameter
 * @param param2 - Second parameter
 * @param maxTypeIndex - Maximum type index in registry
 * @param maxConversionIndex - Maximum conversion index
 * @returns A comparison value
 */
export function compareParams(
  param1: Param,
  param2: Param,
  maxTypeIndex: number,
  maxConversionIndex: number
): number {
  // 1) 'any' parameters are the least preferred
  if (param1.hasAny) {
    if (!param2.hasAny) {
      return 0.1;
    }
  } else if (param2.hasAny) {
    return -0.1;
  }

  // 2) Prefer non-rest to rest parameters
  if (param1.restParam) {
    if (!param2.restParam) {
      return 0.01;
    }
  } else if (param2.restParam) {
    return -0.01;
  }

  // 3) Prefer lower type index (types defined earlier)
  const typeDiff = getLowestTypeIndex(param1, maxTypeIndex) - getLowestTypeIndex(param2, maxTypeIndex);
  if (typeDiff < 0) {
    return -0.001;
  }
  if (typeDiff > 0) {
    return 0.001;
  }

  // 4) Prefer exact type match over conversions
  const conv1 = getLowestConversionIndex(param1, maxConversionIndex);
  const conv2 = getLowestConversionIndex(param2, maxConversionIndex);

  if (param1.hasConversion) {
    if (!param2.hasConversion) {
      return (1 + conv1) * 0.000001;
    }
  } else if (param2.hasConversion) {
    return -(1 + conv2) * 0.000001;
  }

  // 5) Prefer lower conversion index
  const convDiff = conv1 - conv2;
  if (convDiff < 0) {
    return -0.0000001;
  }
  if (convDiff > 0) {
    return 0.0000001;
  }

  // No basis for preference
  return 0;
}

/**
 * Compare two signatures for ordering priority
 *
 * Returns:
 * - Negative if signature1 should come first
 * - Positive if signature2 should come first
 * - Zero if equivalent
 *
 * @param signature1 - First signature
 * @param signature2 - Second signature
 * @param maxTypeIndex - Maximum type index in registry
 * @param maxConversionIndex - Maximum conversion index
 * @returns A comparison value
 */
export function compareSignatures(
  signature1: { params: Param[] },
  signature2: { params: Param[] },
  maxTypeIndex: number,
  maxConversionIndex: number
): number {
  const pars1 = signature1.params;
  const pars2 = signature2.params;
  const last1 = last(pars1);
  const last2 = last(pars2);
  const hasRest1 = hasRestParam(pars1);
  const hasRest2 = hasRestParam(pars2);

  // 1) An "any rest param" is least preferred
  if (hasRest1 && last1 && last1.hasAny) {
    if (!hasRest2 || !last2 || !last2.hasAny) {
      return 10000000;
    }
  } else if (hasRest2 && last2 && last2.hasAny) {
    return -10000000;
  }

  // 2) Minimize the number of 'any' parameters
  let any1 = 0;
  let conv1 = 0;
  for (const par of pars1) {
    if (par.hasAny) any1++;
    if (par.hasConversion) conv1++;
  }

  let any2 = 0;
  let conv2 = 0;
  for (const par of pars2) {
    if (par.hasAny) any2++;
    if (par.hasConversion) conv2++;
  }

  if (any1 !== any2) {
    return (any1 - any2) * 1000000;
  }

  // 3) A conversion rest param is less preferred
  if (hasRest1 && last1 && last1.hasConversion) {
    if (!hasRest2 || !last2 || !last2.hasConversion) {
      return 100000;
    }
  } else if (hasRest2 && last2 && last2.hasConversion) {
    return -100000;
  }

  // 4) Minimize the number of conversions
  if (conv1 !== conv2) {
    return (conv1 - conv2) * 10000;
  }

  // 5) Prefer no rest param
  if (hasRest1) {
    if (!hasRest2) {
      return 1000;
    }
  } else if (hasRest2) {
    return -1000;
  }

  // 6) Prefer shorter with rest param, longer without
  const lengthCriterion = (pars1.length - pars2.length) * (hasRest1 ? -100 : 100);
  if (lengthCriterion !== 0) {
    return lengthCriterion;
  }

  // Signatures are identical in the above metrics and same length
  // Compare parameters one by one
  const comparisons: number[] = [];
  let tc = 0;

  for (let i = 0; i < pars1.length; i++) {
    const p1 = pars1[i];
    const p2 = pars2[i];
    if (p1 && p2) {
      const thisComparison = compareParams(p1, p2, maxTypeIndex, maxConversionIndex);
      comparisons.push(thisComparison);
      tc += thisComparison;
    }
  }

  if (tc !== 0) {
    return (tc < 0 ? -10 : 10) + tc;
  }

  // Same number of preferred params, go by earliest difference
  let bonus = 9;
  const decrement = bonus / (comparisons.length + 1);

  for (const c of comparisons) {
    if (c !== 0) {
      return (c < 0 ? -bonus : bonus) + c;
    }
    bonus -= decrement;
  }

  // It's a tossup
  return 0;
}

/**
 * Get the set of type names at a specific index in a params array
 */
function getTypeSetAtIndex(params: Param[], index: number): Set<string> {
  let param: Param | undefined;

  if (index < params.length) {
    param = params[index];
  } else if (hasRestParam(params)) {
    param = last(params);
  }

  if (!param) {
    return new Set();
  }

  // Use cached typeSet if available
  if (param.typeSet) {
    return param.typeSet;
  }

  const typeSet = new Set<string>();
  for (const type of param.types) {
    typeSet.add(type.name);
  }
  param.typeSet = typeSet;
  return typeSet;
}

/**
 * Test whether two param lists represent conflicting signatures
 *
 * Signatures conflict if they could both match the same argument list.
 *
 * @param params1 - First parameter list
 * @param params2 - Second parameter list
 * @returns true if the signatures conflict
 */
export function conflicting(params1: Param[], params2: Param[]): boolean {
  const maxLen = Math.max(params1.length, params2.length);

  // Check each position for type overlap
  for (let i = 0; i < maxLen; i++) {
    const typeSet1 = getTypeSetAtIndex(params1, i);
    const typeSet2 = getTypeSetAtIndex(params2, i);

    // Check if there's any overlap between the type sets
    let overlap = false;
    for (const name of typeSet2) {
      if (typeSet1.has(name)) {
        overlap = true;
        break;
      }
    }

    if (!overlap) {
      return false; // No conflict at this position
    }
  }

  // All positions have overlapping types, check length compatibility
  const len1 = params1.length;
  const len2 = params2.length;
  const restParam1 = hasRestParam(params1);
  const restParam2 = hasRestParam(params2);

  if (restParam1) {
    return restParam2 ? len1 === len2 : len2 >= len1;
  } else {
    return restParam2 ? len1 >= len2 : len1 === len2;
  }
}

/**
 * Create a signature comparator function for sorting
 *
 * @param maxTypeIndex - Maximum type index in registry
 * @param maxConversionIndex - Maximum conversion index
 * @returns A comparator function for Array.sort
 */
export function createSignatureComparator(
  maxTypeIndex: number,
  maxConversionIndex: number
): (a: { params: Param[] }, b: { params: Param[] }) => number {
  return (a, b) => compareSignatures(a, b, maxTypeIndex, maxConversionIndex);
}
