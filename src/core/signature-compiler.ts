/**
 * Signature Compiler Module for typed-function
 *
 * This module compiles signature parameters into optimized test functions
 * and argument preprocessing functions.
 */

import type { Param, TypeTest, SignatureTest, SignatureFunction, ArgConverter } from './types.js';
import type { TypeRegistry } from './type-registry.js';
import { last, initial, slice } from '../utils/array-helpers.js';

/**
 * Test whether a set of params contains a rest param
 */
function hasRestParam(params: Param[]): boolean {
  const param = last(params);
  return param ? param.restParam : false;
}

/**
 * Create a type test for a single parameter
 *
 * Optimized for common cases (0, 1, 2 types)
 *
 * @param param - The parameter to create a test for
 * @param registry - The type registry
 * @returns A function that tests if a value matches the parameter
 */
export function compileTest(param: Param | undefined, registry: TypeRegistry): TypeTest {
  if (!param || param.types.length === 0) {
    // Empty param matches everything
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
      return function or(x: unknown): boolean {
        return test0(x) || test1(x);
      };
    }
    return () => true;
  }

  // 3+ types: use a loop
  const tests = param.types
    .map((type) => (type ? registry.findType(type.name).test : null))
    .filter((t): t is TypeTest => t !== null);

  return function or(x: unknown): boolean {
    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      if (test && test(x)) {
        return true;
      }
    }
    return false;
  };
}

/**
 * Create a test function for all parameters of a signature
 *
 * Optimized for common cases (0, 1, 2 params without rest)
 *
 * @param params - The parameters to compile tests for
 * @param registry - The type registry
 * @returns A function that tests if an argument list matches the signature
 */
export function compileTests(params: Param[], registry: TypeRegistry): SignatureTest {
  if (hasRestParam(params)) {
    // Variable arguments like '...number'
    const tests = initial(params).map((p) => compileTest(p, registry));
    const varIndex = tests.length;
    const lastParam = last(params);
    const lastTest = compileTest(lastParam, registry);

    const testRestParam = function (args: ArrayLike<unknown>): boolean {
      for (let i = varIndex; i < args.length; i++) {
        if (!lastTest(args[i])) {
          return false;
        }
      }
      return true;
    };

    return function testArgs(args: ArrayLike<unknown>): boolean {
      for (let i = 0; i < tests.length; i++) {
        const test = tests[i];
        if (test && !test(args[i])) {
          return false;
        }
      }
      return testRestParam(args) && args.length >= varIndex + 1;
    };
  }

  // No variable arguments - specialize for 0, 1, 2 params
  switch (params.length) {
    case 0:
      return function testArgs(args: ArrayLike<unknown>): boolean {
        return args.length === 0;
      };

    case 1: {
      const param0 = params[0];
      const test0 = compileTest(param0, registry);
      return function testArgs(args: ArrayLike<unknown>): boolean {
        return test0(args[0]) && args.length === 1;
      };
    }

    case 2: {
      const param0 = params[0];
      const param1 = params[1];
      const test0 = compileTest(param0, registry);
      const test1 = compileTest(param1, registry);
      return function testArgs(args: ArrayLike<unknown>): boolean {
        return test0(args[0]) && test1(args[1]) && args.length === 2;
      };
    }

    default: {
      // 3+ params
      const tests = params.map((p) => compileTest(p, registry));
      const len = tests.length;
      return function testArgs(args: ArrayLike<unknown>): boolean {
        if (args.length !== len) {
          return false;
        }
        for (let i = 0; i < len; i++) {
          const test = tests[i];
          if (test && !test(args[i])) {
            return false;
          }
        }
        return true;
      };
    }
  }
}

/**
 * Compile a conversion function for a single argument
 *
 * @param param - The parameter containing conversion info
 * @param registry - The type registry
 * @returns A function that converts an argument if needed
 */
export function compileArgConversion(param: Param, registry: TypeRegistry): ArgConverter {
  const conversions: Array<{ test: TypeTest; convert: (value: unknown) => unknown }> = [];
  let name = '';

  for (const type of param.types) {
    if (type.conversion) {
      name += type.conversion.from + '~>' + type.conversion.to + ',';
      conversions.push({
        test: registry.findType(type.conversion.from).test,
        convert: type.conversion.convert,
      });
    }
  }

  if (name) {
    name = name.slice(0, -1); // Remove trailing comma
  } else {
    name = 'pass';
  }

  // Create optimized conversion functions
  let convertor: ArgConverter;

  switch (conversions.length) {
    case 0:
      convertor = (arg: unknown) => arg;
      break;

    case 1: {
      const conv = conversions[0];
      if (conv) {
        const { test: test0, convert: conversion0 } = conv;
        convertor = function convertArg(arg: unknown): unknown {
          if (test0(arg)) {
            return conversion0(arg);
          }
          return arg;
        };
      } else {
        convertor = (arg: unknown) => arg;
      }
      break;
    }

    case 2: {
      const conv0 = conversions[0];
      const conv1 = conversions[1];
      if (conv0 && conv1) {
        const { test: test0, convert: conversion0 } = conv0;
        const { test: test1, convert: conversion1 } = conv1;
        convertor = function convertArg(arg: unknown): unknown {
          if (test0(arg)) {
            return conversion0(arg);
          }
          if (test1(arg)) {
            return conversion1(arg);
          }
          return arg;
        };
      } else {
        convertor = (arg: unknown) => arg;
      }
      break;
    }

    default:
      convertor = function convertArg(arg: unknown): unknown {
        for (let i = 0; i < conversions.length; i++) {
          const conv = conversions[i];
          if (conv && conv.test(arg)) {
            return conv.convert(arg);
          }
        }
        return arg;
      };
  }

  // Attach name for debugging
  Object.defineProperty(convertor, 'name', { value: name });

  return convertor;
}

/**
 * Compile argument preprocessing for a signature
 *
 * This handles:
 * - Converting arguments if needed
 * - Collecting rest parameters into an array
 *
 * @param params - The signature parameters
 * @param fn - The original function
 * @param registry - The type registry
 * @returns A wrapped function that preprocesses arguments
 */
export function compileArgsPreprocessing(
  params: Param[],
  fn: SignatureFunction,
  registry: TypeRegistry
): SignatureFunction {
  let fnConvert: SignatureFunction = fn;
  let name = '';

  // Check if any conversions are needed
  if (params.some((p) => p.hasConversion)) {
    const restParam = hasRestParam(params);
    const compiledConversions = params.map((p) => compileArgConversion(p, registry));
    name = compiledConversions.map((conv) => conv.name).join(';');

    fnConvert = function convertArgs(this: unknown): unknown {
      const args: unknown[] = [];
      const lastIdx = restParam ? arguments.length - 1 : arguments.length;

      for (let i = 0; i < lastIdx; i++) {
        const conv = compiledConversions[i];
        args[i] = conv ? conv(arguments[i]) : arguments[i];
      }

      if (restParam) {
        const lastConv = compiledConversions[lastIdx];
        const restArgs = arguments[lastIdx] as unknown[];
        args[lastIdx] = lastConv ? restArgs.map(lastConv) : restArgs;
      }

      return fn.apply(this, args);
    };
  }

  // Handle rest parameters
  let fnPreprocess: SignatureFunction = fnConvert;

  if (hasRestParam(params)) {
    const offset = params.length - 1;

    fnPreprocess = function preprocessRestParams(this: unknown): unknown {
      const args = slice(arguments, 0, offset);
      args.push(slice(arguments, offset));
      return fnConvert.apply(this, args);
    };
  }

  if (name) {
    Object.defineProperty(fnPreprocess, 'name', { value: name });
  }

  return fnPreprocess;
}
