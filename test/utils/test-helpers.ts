/**
 * Test Helper Utilities for typed-function tests
 */

import { expect } from 'vitest';
import type { TypedFunction, Signature } from '../../src/core/types.js';

/**
 * Assert that a signature matches expected parameters
 */
export function assertSignatureMatch(
  signature: Signature,
  expectedParams: Array<{ name?: string; types?: string[]; restParam?: boolean }>
): void {
  expect(signature.params.length).toBe(expectedParams.length);

  for (let i = 0; i < expectedParams.length; i++) {
    const param = signature.params[i];
    const expected = expectedParams[i];

    if (param === undefined || expected === undefined) {
      throw new Error(`Missing param at index ${i}`);
    }

    if (expected.name !== undefined) {
      expect(param.name).toBe(expected.name);
    }

    if (expected.types !== undefined) {
      const actualTypes = param.types.map((t) => t.name);
      expect(actualTypes).toEqual(expected.types);
    }

    if (expected.restParam !== undefined) {
      expect(param.restParam).toBe(expected.restParam);
    }
  }
}

/**
 * Assert that a value is a typed function
 */
export function assertIsTypedFunction(value: unknown): asserts value is TypedFunction {
  expect(value).toBeDefined();
  expect(typeof value).toBe('function');
  expect(value).toHaveProperty('signatures');
  expect(value).toHaveProperty('_typedFunctionData');
}

/**
 * Assert that calling a typed function with given args throws with expected error
 */
export function assertThrowsTypedError(
  fn: TypedFunction,
  args: unknown[],
  expectedCategory: 'wrongType' | 'tooFewArgs' | 'tooManyArgs' | 'mismatch'
): void {
  try {
    fn(...args);
    expect.fail('Expected function to throw');
  } catch (error) {
    expect(error).toBeInstanceOf(TypeError);
    expect((error as Error & { data?: { category: string } }).data?.category).toBe(expectedCategory);
  }
}

/**
 * Create a simple type definition for testing
 */
export function createTestType(name: string, test: (x: unknown) => boolean) {
  return { name, test };
}

/**
 * Deep equality check for arrays
 */
export function strictEqualArray<T>(actual: T[], expected: T[]): void {
  expect(actual.length).toBe(expected.length);
  for (let i = 0; i < expected.length; i++) {
    expect(actual[i]).toStrictEqual(expected[i]);
  }
}

/**
 * Helper to count function calls
 */
export function createCallCounter() {
  let count = 0;
  const fn = () => {
    count++;
    return count;
  };
  fn.getCount = () => count;
  fn.reset = () => {
    count = 0;
  };
  return fn;
}

/**
 * Wait for a specified number of milliseconds
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
