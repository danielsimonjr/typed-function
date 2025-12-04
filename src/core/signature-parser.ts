/**
 * Signature Parser Module for typed-function
 *
 * This module handles parsing signature strings like "number, string | boolean"
 * into structured Param arrays, and expanding parameters with available type conversions.
 */

import type { Param, Type, ConversionDef } from './types.js';
import type { TypeRegistry, InternalTypeDef } from './type-registry.js';

/**
 * Parse a single parameter string like "number | boolean" or "...string"
 *
 * @param param - The raw parameter string
 * @param registry - The type registry
 * @returns A Param object
 * @throws TypeError if the type is not found
 */
export function parseParam(param: string, registry: TypeRegistry): Param {
  const trimmed = param.trim();
  const restParam = trimmed.startsWith('...');

  const typeStr = restParam
    ? (trimmed.length > 3 ? trimmed.slice(3) : 'any')
    : trimmed;

  const typeDefs: InternalTypeDef[] = typeStr.split('|').map((s) => registry.findType(s.trim()));

  let hasAny = false;
  let paramName = restParam ? '...' : '';

  const exactTypes: Type[] = typeDefs.map((type) => {
    hasAny = type.isAny || hasAny;
    paramName += type.name + '|';

    return {
      name: type.name,
      typeIndex: type.index,
      test: type.test,
      isAny: type.isAny,
      conversion: null,
      conversionIndex: -1,
    };
  });

  return {
    types: exactTypes,
    name: paramName.slice(0, -1), // Remove trailing '|'
    hasAny,
    hasConversion: false,
    restParam,
  };
}

/**
 * Parse a full signature string like "number, string | boolean"
 *
 * @param rawSignature - The raw signature string
 * @param registry - The type registry
 * @returns An array of Param objects, or null if the signature is invalid
 * @throws TypeError if the signature is not a string
 * @throws SyntaxError if a rest param is not the last parameter
 */
export function parseSignature(rawSignature: string, registry: TypeRegistry): Param[] | null {
  if (typeof rawSignature !== 'string') {
    throw new TypeError('Signatures must be strings');
  }

  const signature = rawSignature.trim();

  if (signature === '') {
    return [];
  }

  const rawParams = signature.split(',');
  const params: Param[] = [];

  for (let i = 0; i < rawParams.length; i++) {
    const rawParam = rawParams[i];
    if (rawParam === undefined) continue;

    const parsedParam = parseParam(rawParam.trim(), registry);

    if (parsedParam.restParam && i !== rawParams.length - 1) {
      throw new SyntaxError(
        `Unexpected rest parameter "${rawParam}": only allowed for the last parameter`
      );
    }

    // If invalid (no types), short-circuit
    if (parsedParam.types.length === 0) {
      return null;
    }

    params.push(parsedParam);
  }

  return params;
}

/**
 * Get available conversions to the given type names
 *
 * For each type that can be converted to one of the target types,
 * return the lowest-index conversion.
 *
 * @param typeNames - Target type names
 * @param registry - The type registry
 * @returns Array of available conversions
 */
export function availableConversions(typeNames: string[], registry: TypeRegistry): ConversionDef[] {
  if (typeNames.length === 0) {
    return [];
  }

  const types = typeNames.map((name) => registry.findType(name));

  if (typeNames.length === 1) {
    const type = types[0];
    return type ? type.conversionsTo : [];
  }

  // For multiple types, find the lowest-index conversion for each source type
  const knownTypes = new Set(typeNames);
  const convertibleTypes = new Set<string>();

  for (const type of types) {
    if (!type) continue;
    for (const match of type.conversionsTo) {
      if (!knownTypes.has(match.from)) {
        convertibleTypes.add(match.from);
      }
    }
  }

  // Get the lowest-index conversion for each convertible type
  const matches: ConversionDef[] = [];
  const nConversions = getMaxConversionIndex(types);

  for (const typeName of convertibleTypes) {
    let bestIndex = nConversions + 1;
    let bestConversion: ConversionDef | null = null;

    for (const type of types) {
      if (!type) continue;
      for (const match of type.conversionsTo) {
        if (match.from === typeName && match.index !== undefined && match.index < bestIndex) {
          bestIndex = match.index;
          bestConversion = match;
        }
      }
    }

    if (bestConversion) {
      matches.push(bestConversion);
    }
  }

  return matches;
}

/**
 * Get the maximum conversion index from a list of types
 */
function getMaxConversionIndex(types: InternalTypeDef[]): number {
  let max = 0;
  for (const type of types) {
    for (const conv of type.conversionsTo) {
      if (conv.index !== undefined && conv.index > max) {
        max = conv.index;
      }
    }
  }
  return max;
}

/**
 * Expand a parameter with available type conversions
 *
 * @param param - The parameter to expand
 * @param registry - The type registry
 * @returns A new Param with conversion types added
 */
export function expandParam(param: Param, registry: TypeRegistry): Param {
  const typeNames = param.types.map((t) => t.name);
  const matchingConversions = availableConversions(typeNames, registry);

  let hasAny = param.hasAny;
  let newName = param.name;

  const convertibleTypes: Type[] = matchingConversions.map((conversion) => {
    const type = registry.findType(conversion.from);
    hasAny = type.isAny || hasAny;
    newName += '|' + conversion.from;

    return {
      name: conversion.from,
      typeIndex: type.index,
      test: type.test,
      isAny: type.isAny,
      conversion,
      conversionIndex: conversion.index ?? -1,
    };
  });

  return {
    types: [...param.types, ...convertibleTypes],
    name: newName,
    hasAny,
    hasConversion: convertibleTypes.length > 0,
    restParam: param.restParam,
  };
}

/**
 * Check if a type is an exact type (not a conversion)
 */
export function isExactType(type: Type): boolean {
  return type.conversion === null || type.conversion === undefined;
}

/**
 * Split params with union types into separate param combinations
 *
 * For example:
 *   splitParams([{types: ['Array', 'Object']}, {types: ['string', 'RegExp']}])
 * returns:
 *   [
 *     [{types: ['Array']}, {types: ['string']}],
 *     [{types: ['Array']}, {types: ['RegExp']}],
 *     [{types: ['Object']}, {types: ['string']}],
 *     [{types: ['Object']}, {types: ['RegExp']}]
 *   ]
 *
 * @param params - The parameters to split
 * @returns An array of parameter arrays
 */
export function splitParams(params: Param[]): Param[][] {
  function recurse(index: number, paramsSoFar: Param[]): Param[][] {
    if (index >= params.length) {
      return [paramsSoFar];
    }

    const param = params[index];
    if (!param) {
      return [paramsSoFar];
    }

    let resultingParams: Param[];

    if (param.restParam) {
      // Split rest params into two: exact types only, and exact types + conversions
      const exactTypes = param.types.filter(isExactType);

      resultingParams = [];

      if (exactTypes.length < param.types.length) {
        // Add a version with only exact types
        resultingParams.push({
          types: exactTypes,
          name: '...' + exactTypes.map((t) => t.name).join('|'),
          hasAny: exactTypes.some((t) => t.isAny),
          hasConversion: false,
          restParam: true,
        });
      }

      // Always include the full param
      resultingParams.push(param);
    } else {
      // Split each type into a separate param
      resultingParams = param.types.map((type) => ({
        types: [type],
        name: type.name,
        hasAny: type.isAny,
        hasConversion: type.conversion !== null && type.conversion !== undefined,
        restParam: false,
      }));
    }

    // Recurse over each resulting param
    const results: Param[][] = [];
    for (const nextParam of resultingParams) {
      const subResults = recurse(index + 1, [...paramsSoFar, nextParam]);
      results.push(...subResults);
    }

    return results;
  }

  return recurse(0, []);
}

/**
 * Stringify parameters to a canonical form
 *
 * @param params - The parameters to stringify
 * @param separator - The separator (default: ',')
 * @returns A string representation
 */
export function stringifyParams(params: Param[], separator = ','): string {
  return params.map((p) => p.name).join(separator);
}
