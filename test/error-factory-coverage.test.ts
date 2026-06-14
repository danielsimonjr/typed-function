/**
 * Coverage tests for Error Factory
 * Sprint 3: Error Factory Complete Coverage
 *
 * Target: 100% coverage for src/core/error-factory.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createError,
  defaultOnMismatch,
  createParamTest,
  hasRestParam,
  getParamAtIndex,
  paramTypeSet,
  getTypeSetAtIndex,
  mergeExpectedParams,
  stringifyParams,
} from '../src/core/error-factory.js';
import { createTypeRegistry, TypeRegistry } from '../src/core/type-registry.js';
import type { Param, Signature } from '../src/core/types.js';
import { create } from '../src/index.js';

describe('Error Factory Coverage (Sprint 3)', () => {
  let registry: TypeRegistry;

  beforeEach(() => {
    registry = createTypeRegistry();
  });

  describe('Task 3.1: createParamTest edge cases (line 119)', () => {
    it('should return () => true for undefined param', () => {
      const test = createParamTest(undefined, registry);

      expect(test(42)).toBe(true);
      expect(test('string')).toBe(true);
      expect(test(null)).toBe(true);
    });

    it('should return () => true for null param', () => {
      const test = createParamTest(null, registry);

      expect(test(42)).toBe(true);
      expect(test('string')).toBe(true);
    });

    it('should return () => true for param with empty types array', () => {
      const param: Param = {
        name: 'empty',
        types: [],
        hasAny: false,
        restParam: false,
        hasConversion: false,
      };

      const test = createParamTest(param, registry);

      expect(test(42)).toBe(true);
      expect(test('anything')).toBe(true);
    });

    it('should return () => true when single type is undefined', () => {
      const param: Param = {
        name: 'single',
        types: [undefined as any],
        hasAny: false,
        restParam: false,
        hasConversion: false,
      };

      const test = createParamTest(param, registry);
      expect(test(42)).toBe(true);
    });

    it('should handle single type param correctly', () => {
      const param: Param = {
        name: 'x',
        types: [{ name: 'number', conversion: null, test: undefined }],
        hasAny: false,
        restParam: false,
        hasConversion: false,
      };

      const test = createParamTest(param, registry);

      expect(test(42)).toBe(true);
      expect(test('string')).toBe(false);
    });

    it('should return () => true for 2-type param with undefined type0', () => {
      const param: Param = {
        name: 'test',
        types: [
          undefined as any,
          { name: 'string', conversion: null, test: undefined },
        ],
        hasAny: false,
        restParam: false,
        hasConversion: false,
      };

      const test = createParamTest(param, registry);
      expect(test('anything')).toBe(true);
    });

    it('should return () => true for 2-type param with undefined type1', () => {
      const param: Param = {
        name: 'test',
        types: [
          { name: 'number', conversion: null, test: undefined },
          undefined as any,
        ],
        hasAny: false,
        restParam: false,
        hasConversion: false,
      };

      const test = createParamTest(param, registry);
      expect(test('anything')).toBe(true);
    });

    it('should handle 2-type param correctly when both defined', () => {
      const param: Param = {
        name: 'x',
        types: [
          { name: 'number', conversion: null, test: undefined },
          { name: 'string', conversion: null, test: undefined },
        ],
        hasAny: false,
        restParam: false,
        hasConversion: false,
      };

      const test = createParamTest(param, registry);

      expect(test(42)).toBe(true);
      expect(test('hello')).toBe(true);
      expect(test(true)).toBe(false);
    });
  });

  describe('Task 3.2: 3+ type param all-false path (line 128)', () => {
    it('should return false when value matches none of 3+ types', () => {
      const param: Param = {
        name: 'x',
        types: [
          { name: 'number', conversion: null, test: undefined },
          { name: 'string', conversion: null, test: undefined },
          { name: 'boolean', conversion: null, test: undefined },
        ],
        hasAny: false,
        restParam: false,
        hasConversion: false,
      };

      const test = createParamTest(param, registry);

      // Test with a value that doesn't match any of the types
      expect(test([])).toBe(false); // Array doesn't match number, string, or boolean
      expect(test({})).toBe(false); // Object doesn't match
      expect(test(null)).toBe(false); // null doesn't match
    });

    it('should return true when value matches one of 3+ types', () => {
      const param: Param = {
        name: 'x',
        types: [
          { name: 'number', conversion: null, test: undefined },
          { name: 'string', conversion: null, test: undefined },
          { name: 'boolean', conversion: null, test: undefined },
        ],
        hasAny: false,
        restParam: false,
        hasConversion: false,
      };

      const test = createParamTest(param, registry);

      expect(test(42)).toBe(true);
      expect(test('hello')).toBe(true);
      expect(test(true)).toBe(true);
    });

    it('should iterate through all tests when needed', () => {
      const param: Param = {
        name: 'x',
        types: [
          { name: 'number', conversion: null, test: undefined },
          { name: 'string', conversion: null, test: undefined },
          { name: 'boolean', conversion: null, test: undefined },
          { name: 'Array', conversion: null, test: undefined },
        ],
        hasAny: false,
        restParam: false,
        hasConversion: false,
      };

      const test = createParamTest(param, registry);

      // Array matches the 4th type
      expect(test([1, 2, 3])).toBe(true);
      // Date doesn't match any
      expect(test(new Date())).toBe(false);
    });
  });

  describe('Task 3.3: Generic mismatch error (lines 239-256)', () => {
    it('should create mismatch error when no type error found', () => {
      // Create a scenario where arguments pass initial checks but mismatch
      const typed = create();
      const fn = typed('test', {
        'number, number': (a: number, b: number) => a + b,
        'string, string': (a: string, b: string) => a + b,
      });

      try {
        // This won't match - number, string combination
        fn(42, 'hello');
        expect.fail('Should have thrown');
      } catch (err: any) {
        // The error may be wrongType or mismatch depending on logic
        expect(err).toBeInstanceOf(TypeError);
        expect(err.data).toBeDefined();
      }
    });

    it('should include argTypes in mismatch error', () => {
      // Create a signature that matches by param count but we pass wrong types
      // We need a signature for mismatch to occur (empty sigs = tooFewArgs)
      const param1: Param = {
        name: 'x',
        types: [{ name: 'number', conversion: null, test: undefined }],
        hasAny: false,
        restParam: false,
        hasConversion: false,
      };
      const param2: Param = {
        name: 'y',
        types: [{ name: 'number', conversion: null, test: undefined }],
        hasAny: false,
        restParam: false,
        hasConversion: false,
      };
      const param3: Param = {
        name: 'z',
        types: [{ name: 'number', conversion: null, test: undefined }],
        hasAny: false,
        restParam: false,
        hasConversion: false,
      };

      const signature: Signature = {
        params: [param1, param2, param3],
        fn: () => 0,
        test: undefined,
        implementation: () => 0,
      };

      // Pass correct types so no wrongType at any index
      const args = [42, 100, 200];
      const err = createError('testFn', args, [signature], registry);

      // Since all types match and count matches, it should be mismatch
      expect(err.data.category).toBe('mismatch');
      expect(err.data.actual).toBeDefined();
      expect(Array.isArray(err.data.actual)).toBe(true);
    });

    it('should create mismatch when args match but no implementation runs', () => {
      // This happens when all type checks pass but logic falls through
      const param: Param = {
        name: 'x',
        types: [{ name: 'any', conversion: null, test: undefined }],
        hasAny: true,
        restParam: false,
        hasConversion: false,
      };

      const signature: Signature = {
        params: [param],
        fn: () => 0,
        test: undefined,
        implementation: () => 0,
      };

      // With 'any' type, any value matches, so it falls through to mismatch
      const err = createError('testFn', [42], [signature], registry);
      expect(err.data.category).toBe('mismatch');
      expect(err.message).toContain('testFn');
    });
  });

  describe('Task 3.4: defaultOnMismatch function (lines 267-273)', () => {
    it('should throw TypedError when called', () => {
      const signatures: Signature[] = [];

      expect(() => {
        defaultOnMismatch('testFn', [42], signatures, registry);
      }).toThrow(TypeError);
    });

    it('should include function name in thrown error', () => {
      try {
        defaultOnMismatch('myFunction', ['arg1'], [], registry);
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.message).toContain('myFunction');
      }
    });

    it('should pass error data through', () => {
      try {
        defaultOnMismatch('fn', [1, 2, 3], [], registry);
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.data).toBeDefined();
        expect(err.data.fn).toBe('fn');
      }
    });

    it('should return never type (always throws)', () => {
      let caught = false;
      try {
        defaultOnMismatch('test', [], [], registry);
      } catch {
        caught = true;
      }
      expect(caught).toBe(true);
    });
  });

  describe('Task 3.5: Error data structure (lines 248-253)', () => {
    it('should have correct mismatch error data fields', () => {
      // Create signature that matches argument count
      const param1: Param = {
        name: 'x',
        types: [{ name: 'any', conversion: null, test: undefined }],
        hasAny: true,
        restParam: false,
        hasConversion: false,
      };
      const param2: Param = {
        name: 'y',
        types: [{ name: 'any', conversion: null, test: undefined }],
        hasAny: true,
        restParam: false,
        hasConversion: false,
      };

      const signature: Signature = {
        params: [param1, param2],
        fn: () => 0,
        test: undefined,
        implementation: () => 0,
      };

      const err = createError('myFunc', [42, 'test'], [signature], registry);

      expect(err.data.category).toBe('mismatch');
      expect(err.data.fn).toBe('myFunc');
      expect(err.data.actual).toBeDefined();
    });

    it('should have correct wrongType error data fields', () => {
      const param: Param = {
        name: 'x',
        types: [{ name: 'number', conversion: null, test: undefined }],
        hasAny: false,
        restParam: false,
        hasConversion: false,
      };

      const signature: Signature = {
        params: [param],
        fn: () => 0,
        test: undefined,
        implementation: () => 0,
      };

      const err = createError('fn', ['not a number'], [signature], registry);

      expect(err.data.category).toBe('wrongType');
      expect(err.data.fn).toBe('fn');
      expect(err.data.index).toBe(0);
      expect(err.data.expected).toContain('number');
      expect(err.data.actual).toBeDefined();
    });

    it('should have correct tooFewArgs error data fields', () => {
      const param1: Param = {
        name: 'x',
        types: [{ name: 'number', conversion: null, test: undefined }],
        hasAny: false,
        restParam: false,
        hasConversion: false,
      };

      const param2: Param = {
        name: 'y',
        types: [{ name: 'number', conversion: null, test: undefined }],
        hasAny: false,
        restParam: false,
        hasConversion: false,
      };

      const signature: Signature = {
        params: [param1, param2],
        fn: () => 0,
        test: undefined,
        implementation: () => 0,
      };

      const err = createError('fn', [42], [signature], registry);

      expect(err.data.category).toBe('tooFewArgs');
      expect(err.data.fn).toBe('fn');
      expect(err.data.index).toBe(1);
      expect(err.data.expected).toBeDefined();
    });

    it('should have correct tooManyArgs error data fields', () => {
      const param: Param = {
        name: 'x',
        types: [{ name: 'number', conversion: null, test: undefined }],
        hasAny: false,
        restParam: false,
        hasConversion: false,
      };

      const signature: Signature = {
        params: [param],
        fn: () => 0,
        test: undefined,
        implementation: () => 0,
      };

      const err = createError('fn', [42, 'extra', true], [signature], registry);

      expect(err.data.category).toBe('tooManyArgs');
      expect(err.data.fn).toBe('fn');
      expect(err.data.expectedLength).toBe(1);
    });
  });

  describe('Task 3.6: argTypes generation (lines 239-241)', () => {
    // Helper to create any-type signature with given param count
    function createAnySignature(paramCount: number): Signature {
      const params: Param[] = [];
      for (let i = 0; i < paramCount; i++) {
        params.push({
          name: `arg${i}`,
          types: [{ name: 'any', conversion: null, test: undefined }],
          hasAny: true,
          restParam: false,
          hasConversion: false,
        });
      }
      return {
        params,
        fn: () => 0,
        test: undefined,
        implementation: () => 0,
      };
    }

    it('should generate correct argTypes for multiple arguments', () => {
      const err = createError('fn', [42, 'hello', true], [createAnySignature(3)], registry);

      expect(err.data.category).toBe('mismatch');
      expect(err.data.actual).toBeDefined();
      expect(err.data.actual!.length).toBe(3);
      expect(err.data.actual![0]).toContain('number');
      expect(err.data.actual![1]).toContain('string');
      expect(err.data.actual![2]).toContain('boolean');
    });

    it('should handle complex types in argTypes', () => {
      const err = createError('fn', [[1, 2, 3], new Date(), /regex/], [createAnySignature(3)], registry);

      expect(err.data.category).toBe('mismatch');
      expect(err.data.actual).toBeDefined();
      expect(err.data.actual!.length).toBe(3);
    });

    it('should generate argTypes for single argument', () => {
      const err = createError('fn', [42], [createAnySignature(1)], registry);

      expect(err.data.category).toBe('mismatch');
      expect(err.data.actual).toBeDefined();
      expect(err.data.actual!.length).toBe(1);
    });

    it('should include type info in error message', () => {
      const err = createError('fn', ['test'], [createAnySignature(1)], registry);

      expect(err.data.category).toBe('mismatch');
      expect(err.message).toContain('string');
      expect(err.message).toContain('fn');
    });
  });

  describe('Task 3.7: Empty signature matching (line 150)', () => {
    it('should handle empty signatures array with tooFewArgs', () => {
      // With empty signatures, Math.min(...[]) = Infinity
      // So args.length < Infinity is always true = tooFewArgs
      const err = createError('fn', [42], [], registry);

      expect(err).toBeInstanceOf(TypeError);
      expect(err.data.category).toBe('tooFewArgs');
      expect(err.data.fn).toBe('fn');
    });

    it('should produce tooFewArgs for empty signatures with no args', () => {
      const err = createError('fn', [], [], registry);

      expect(err).toBeInstanceOf(TypeError);
      expect(err.data.category).toBe('tooFewArgs');
    });

    it('should handle empty signatures with many args as tooFewArgs', () => {
      const err = createError('fn', [1, 2, 3, 4, 5], [], registry);

      expect(err).toBeInstanceOf(TypeError);
      // Still tooFewArgs because Math.min(...[]) = Infinity
      expect(err.data.category).toBe('tooFewArgs');
    });

    it('should initialize matchingSignatures copy (line 150)', () => {
      // Test that line 150 [...signatures] copy is made
      const param: Param = {
        name: 'x',
        types: [{ name: 'number', conversion: null, test: undefined }],
        hasAny: false,
        restParam: false,
        hasConversion: false,
      };

      const signature: Signature = {
        params: [param],
        fn: () => 0,
        test: undefined,
        implementation: () => 0,
      };

      const signatures = [signature];
      const err = createError('fn', ['wrong type'], signatures, registry);

      // Original array should be unchanged
      expect(signatures.length).toBe(1);
      expect(err.data.category).toBe('wrongType');
    });
  });

  describe('Task 3.8: Index iteration edge - args.length === 0 (line 153)', () => {
    it('should handle zero arguments with signature expecting args', () => {
      const param: Param = {
        name: 'x',
        types: [{ name: 'number', conversion: null, test: undefined }],
        hasAny: false,
        restParam: false,
        hasConversion: false,
      };

      const signature: Signature = {
        params: [param],
        fn: () => 0,
        test: undefined,
        implementation: () => 0,
      };

      const err = createError('fn', [], [signature], registry);

      // Should be tooFewArgs since we need at least one arg
      expect(err.data.category).toBe('tooFewArgs');
    });

    it('should skip loop body when args.length is 0 (line 153)', () => {
      // With empty args array, the for loop at line 153 doesn't execute body
      // But empty signatures still produces tooFewArgs (Math.min() = Infinity)
      const err = createError('noArgs', [], [], registry);

      expect(err).toBeInstanceOf(TypeError);
      expect(err.data.category).toBe('tooFewArgs');
    });

    it('should work correctly with zero-param signature and zero args', () => {
      const signature: Signature = {
        params: [],
        fn: () => 'ok',
        test: undefined,
        implementation: () => 'ok',
      };

      // Zero args matches zero-param signature count
      // minLength = 0, so args.length (0) is not < minLength
      // maxLength = 0, so args.length (0) is not > maxLength
      // Falls through to mismatch
      const err = createError('fn', [], [signature], registry);
      expect(err.data.category).toBe('mismatch');
    });

    it('should iterate through args when present (line 153)', () => {
      const param: Param = {
        name: 'x',
        types: [{ name: 'string', conversion: null, test: undefined }],
        hasAny: false,
        restParam: false,
        hasConversion: false,
      };

      const signature: Signature = {
        params: [param],
        fn: () => 0,
        test: undefined,
        implementation: () => 0,
      };

      // With one arg, loop executes once
      const err = createError('fn', [42], [signature], registry);
      expect(err.data.category).toBe('wrongType');
      expect(err.data.index).toBe(0);
    });
  });

  describe('Additional helper function tests', () => {
    it('hasRestParam should return false for empty params', () => {
      expect(hasRestParam([])).toBe(false);
    });

    it('hasRestParam should detect rest param', () => {
      const params: Param[] = [
        {
          name: '...args',
          types: [{ name: 'number', conversion: null, test: undefined }],
          hasAny: false,
          restParam: true,
          hasConversion: false,
        },
      ];

      expect(hasRestParam(params)).toBe(true);
    });

    it('getParamAtIndex should return null for out of bounds', () => {
      const params: Param[] = [];
      expect(getParamAtIndex(params, 0)).toBeNull();
      expect(getParamAtIndex(params, 5)).toBeNull();
    });

    it('getParamAtIndex should return rest param for higher indices', () => {
      const restParam: Param = {
        name: '...args',
        types: [{ name: 'any', conversion: null, test: undefined }],
        hasAny: true,
        restParam: true,
        hasConversion: false,
      };

      const params: Param[] = [restParam];

      expect(getParamAtIndex(params, 0)).toBe(restParam);
      expect(getParamAtIndex(params, 5)).toBe(restParam);
      expect(getParamAtIndex(params, 100)).toBe(restParam);
    });

    it('paramTypeSet should cache result', () => {
      const param: Param = {
        name: 'x',
        types: [
          { name: 'number', conversion: null, test: undefined },
          { name: 'string', conversion: null, test: undefined },
        ],
        hasAny: false,
        restParam: false,
        hasConversion: false,
      };

      const set1 = paramTypeSet(param);
      const set2 = paramTypeSet(param);

      expect(set1).toBe(set2); // Same reference
      expect(set1.has('number')).toBe(true);
      expect(set1.has('string')).toBe(true);
    });

    it('getTypeSetAtIndex should return empty set for no param', () => {
      const set = getTypeSetAtIndex([], 0);
      expect(set.size).toBe(0);
    });

    it('mergeExpectedParams should return ["any"] if any is present', () => {
      const param: Param = {
        name: 'x',
        types: [{ name: 'any', conversion: null, test: undefined }],
        hasAny: true,
        restParam: false,
        hasConversion: false,
      };

      const signature: Signature = {
        params: [param],
        fn: () => 0,
        test: undefined,
        implementation: () => 0,
      };

      const result = mergeExpectedParams([signature], 0);
      expect(result).toEqual(['any']);
    });

    it('mergeExpectedParams should merge multiple signatures', () => {
      const param1: Param = {
        name: 'x',
        types: [{ name: 'number', conversion: null, test: undefined }],
        hasAny: false,
        restParam: false,
        hasConversion: false,
      };

      const param2: Param = {
        name: 'x',
        types: [{ name: 'string', conversion: null, test: undefined }],
        hasAny: false,
        restParam: false,
        hasConversion: false,
      };

      const sig1: Signature = {
        params: [param1],
        fn: () => 0,
        test: undefined,
        implementation: () => 0,
      };

      const sig2: Signature = {
        params: [param2],
        fn: () => 0,
        test: undefined,
        implementation: () => 0,
      };

      const result = mergeExpectedParams([sig1, sig2], 0);
      expect(result).toContain('number');
      expect(result).toContain('string');
    });

    it('stringifyParams should format params correctly', () => {
      const params: Param[] = [
        {
          name: 'number',
          types: [{ name: 'number', conversion: null, test: undefined }],
          hasAny: false,
          restParam: false,
          hasConversion: false,
        },
        {
          name: 'string',
          types: [{ name: 'string', conversion: null, test: undefined }],
          hasAny: false,
          restParam: false,
          hasConversion: false,
        },
      ];

      expect(stringifyParams(params)).toBe('number,string');
      expect(stringifyParams(params, ', ')).toBe('number, string');
    });
  });

  describe('Integration with typed functions', () => {
    it('should produce correct errors from typed function calls', () => {
      const typed = create();
      const fn = typed('add', {
        'number, number': (a: number, b: number) => a + b,
      });

      try {
        fn('not', 'numbers');
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err).toBeInstanceOf(TypeError);
        expect(err.data).toBeDefined();
        expect(err.data.fn).toBe('add');
      }
    });

    it('should handle tooFewArgs correctly', () => {
      const typed = create();
      const fn = typed('add', {
        'number, number': (a: number, b: number) => a + b,
      });

      try {
        fn(42);
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.data.category).toBe('tooFewArgs');
      }
    });

    it('should handle tooManyArgs correctly', () => {
      const typed = create();
      const fn = typed('single', {
        number: (x: number) => x,
      });

      try {
        fn(1, 2, 3);
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.data.category).toBe('tooManyArgs');
      }
    });
  });
});
