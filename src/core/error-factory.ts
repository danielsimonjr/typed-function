/**
 * Error Factory Module for typed-function
 *
 * This module provides functions for creating detailed error messages
 * when typed function calls fail due to type mismatches.
 */

import type { Signature, Param, TypedError, TypeTest } from './types.js';
import type { TypeRegistry } from './type-registry.js';
import { last } from '../utils/array-helpers.js';

/**
 * Test whether a set of params contains a rest param
 *
 * @param params - The parameters to check
 * @returns true if the last parameter is a rest param
 */
export function hasRestParam(params: Param[]): boolean {
  const param = last(params);
  return param ? param.restParam : false;
}

/**
 * Get the parameter at a specific index, handling rest params
 *
 * @param params - The parameters array
 * @param index - The index to retrieve
 * @returns The parameter at that index, or null if out of bounds
 */
export function getParamAtIndex(params: Param[], index: number): Param | null {
  if (index < params.length) {
    return params[index] ?? null;
  }
  return hasRestParam(params) ? (last(params) ?? null) : null;
}

/**
 * Get the set of type names in a parameter
 *
 * Caches the result on the parameter for efficiency
 *
 * @param param - The parameter
 * @returns Set of type names
 */
export function paramTypeSet(param: Param): Set<string> {
  if (!param.typeSet) {
    param.typeSet = new Set();
    for (const type of param.types) {
      param.typeSet.add(type.name);
    }
  }
  return param.typeSet;
}

/**
 * Get the type set at a specific index in a params array
 *
 * @param params - The parameters array
 * @param index - The index to retrieve
 * @returns Set of type names, or empty set if no param at index
 */
export function getTypeSetAtIndex(params: Param[], index: number): Set<string> {
  const param = getParamAtIndex(params, index);
  if (!param) {
    return new Set();
  }
  return paramTypeSet(param);
}

/**
 * Merge expected parameters from multiple signatures at a given index
 *
 * @param signatures - Array of signatures
 * @param index - The parameter index
 * @returns Array of unique type names expected at this index
 */
export function mergeExpectedParams(signatures: Signature[], index: number): string[] {
  const typeSet = new Set<string>();

  for (const signature of signatures) {
    const paramSet = getTypeSetAtIndex(signature.params, index);
    for (const name of paramSet) {
      typeSet.add(name);
    }
  }

  // If 'any' is expected, just return ['any']
  return typeSet.has('any') ? ['any'] : Array.from(typeSet);
}

/**
 * Create a test function for a parameter
 *
 * @param param - The parameter to create a test for
 * @param registry - The type registry
 * @returns A function that tests if a value matches the parameter
 */
export function createParamTest(param: Param | undefined | null, registry: TypeRegistry): TypeTest {
  if (!param || param.types.length === 0) {
    return () => true;
  }

  if (param.types.length === 1) {
    const type = param.types[0];
    if (type) {
      return registry.findType(type.name).test;
    }
    return () => true;
  }

  if (param.types.length === 2) {
    const type0 = param.types[0];
    const type1 = param.types[1];
    if (type0 && type1) {
      const test0 = registry.findType(type0.name).test;
      const test1 = registry.findType(type1.name).test;
      return (x: unknown) => test0(x) || test1(x);
    }
    return () => true;
  }

  // 3+ types
  const tests = param.types.map((type) => registry.findType(type.name).test);
  return (x: unknown) => {
    for (const test of tests) {
      if (test(x)) return true;
    }
    return false;
  };
}

/**
 * Create a detailed error for a failed typed function call
 *
 * @param name - The name of the function
 * @param args - The actual arguments passed
 * @param signatures - The available signatures
 * @param registry - The type registry
 * @returns A TypeError with detailed information
 */
export function createError(
  name: string,
  args: ArrayLike<unknown>,
  signatures: Signature[],
  registry: TypeRegistry
): TypedError {
  const _name = name || 'unnamed';

  // Test for wrong type at some index
  let matchingSignatures = [...signatures];
  let index: number;

  for (index = 0; index < args.length; index++) {
    const nextMatchingDefs: Signature[] = [];

    for (const signature of matchingSignatures) {
      const param = getParamAtIndex(signature.params, index);
      const test = createParamTest(param, registry);

      if (
        (index < signature.params.length || hasRestParam(signature.params)) &&
        test(args[index])
      ) {
        nextMatchingDefs.push(signature);
      }
    }

    if (nextMatchingDefs.length === 0) {
      // No matching signatures anymore, throw error "wrong type"
      const expected = mergeExpectedParams(matchingSignatures, index);

      if (expected.length > 0) {
        const actualTypes = registry.findTypeNames(args[index]);

        const err = new TypeError(
          `Unexpected type of argument in function ${_name} ` +
            `(expected: ${expected.join(' or ')}, ` +
            `actual: ${actualTypes.join(' | ')}, index: ${index})`
        ) as TypedError;

        err.data = {
          category: 'wrongType',
          fn: _name,
          index,
          actual: actualTypes,
          expected,
        };

        return err;
      }
    } else {
      matchingSignatures = nextMatchingDefs;
    }
  }

  // Test for too few arguments
  const lengths = matchingSignatures.map((signature) =>
    hasRestParam(signature.params) ? Infinity : signature.params.length
  );

  const minLength = Math.min(...lengths);

  if (args.length < minLength) {
    const expected = mergeExpectedParams(matchingSignatures, index);

    const err = new TypeError(
      `Too few arguments in function ${_name} ` + `(expected: ${expected.join(' or ')}, index: ${args.length})`
    ) as TypedError;

    err.data = {
      category: 'tooFewArgs',
      fn: _name,
      index: args.length,
      expected,
    };

    return err;
  }

  // Test for too many arguments
  const maxLength = Math.max(...lengths);

  if (args.length > maxLength) {
    const err = new TypeError(
      `Too many arguments in function ${_name} ` + `(expected: ${maxLength}, actual: ${args.length})`
    ) as TypedError;

    err.data = {
      category: 'tooManyArgs',
      fn: _name,
      index: args.length,
      expectedLength: maxLength,
    };

    return err;
  }

  // Generic error - arguments don't match any signature
  const argTypes: string[] = [];
  for (let i = 0; i < args.length; i++) {
    argTypes.push(registry.findTypeNames(args[i]).join('|'));
  }

  const err = new TypeError(
    `Arguments of type "${argTypes.join(', ')}" do not match any of the ` +
      `defined signatures of function ${_name}.`
  ) as TypedError;

  err.data = {
    category: 'mismatch',
    fn: _name,
    actual: argTypes,
  };

  return err;
}

/**
 * Default mismatch handler that throws an error
 *
 * @param name - The function name
 * @param args - The actual arguments
 * @param signatures - The available signatures
 * @param registry - The type registry
 * @throws TypedError
 */
export function defaultOnMismatch(
  name: string,
  args: ArrayLike<unknown>,
  signatures: Signature[],
  registry: TypeRegistry
): never {
  throw createError(name, args, signatures, registry);
}

/**
 * Stringify parameters in a normalized way
 *
 * @param params - The parameters to stringify
 * @param separator - The separator to use (default: ',')
 * @returns A string representation of the parameters
 */
export function stringifyParams(params: Param[], separator = ','): string {
  return params.map((p) => p.name).join(separator);
}
