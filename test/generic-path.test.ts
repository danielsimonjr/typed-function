/**
 * Generic-Path Dispatcher Tests
 *
 * Tests for the fallback generic dispatch system
 */

import { describe, it, expect, vi } from 'vitest';
import {
  createGenericDispatcher,
  createSimpleDispatcher,
  hasCompiledTests,
  hasImplementations,
} from '../src/dispatch/generic-path.js';
import type { Signature, Param, Type, MismatchHandler } from '../src/core/types.js';

// Helper to create a mock type
function createMockType(name: string, test: (x: unknown) => boolean): Type {
  return {
    name,
    typeIndex: 0,
    test,
    isAny: name === 'any',
    conversion: null,
    conversionIndex: -1,
  };
}

// Helper to create a mock param
function createMockParam(types: Type[]): Param {
  return {
    types,
    name: types.map(t => t.name).join('|'),
    hasAny: types.some(t => t.isAny),
    hasConversion: false,
    restParam: false,
  };
}

// Helper to create a mock signature with test function
function createMockSignature(
  params: Param[],
  fn: (...args: unknown[]) => unknown,
  test?: (args: ArrayLike<unknown>) => boolean
): Signature {
  // Create a default test function based on params
  const defaultTest = (args: ArrayLike<unknown>) => {
    if (args.length !== params.length) return false;
    for (let i = 0; i < params.length; i++) {
      const param = params[i];
      const arg = args[i];
      let matched = false;
      for (const type of param.types) {
        if (type.test(arg)) {
          matched = true;
          break;
        }
      }
      if (!matched) return false;
    }
    return true;
  };

  return {
    params,
    fn,
    test: test ?? defaultTest,
    implementation: fn,
  };
}

describe('Generic-Path Dispatcher', () => {
  describe('createGenericDispatcher', () => {
    it('should dispatch to matching signature', () => {
      const numType = createMockType('number', x => typeof x === 'number');
      const strType = createMockType('string', x => typeof x === 'string');

      const signatures: Signature[] = [
        createMockSignature([createMockParam([numType])], (a: number) => `number:${a}`),
        createMockSignature([createMockParam([strType])], (a: string) => `string:${a}`),
      ];

      const onMismatch: MismatchHandler = () => { throw new Error('mismatch'); };
      const dispatcher = createGenericDispatcher('test', signatures, 0, onMismatch);

      // Create mock arguments object
      const numArgs = { 0: 42, length: 1 } as unknown as IArguments;
      const strArgs = { 0: 'hello', length: 1 } as unknown as IArguments;

      expect(dispatcher(numArgs, null)).toBe('number:42');
      expect(dispatcher(strArgs, null)).toBe('string:hello');
    });

    it('should start from specified index', () => {
      const numType = createMockType('number', x => typeof x === 'number');

      const signatures: Signature[] = [
        createMockSignature([createMockParam([numType])], () => 'first'),
        createMockSignature([createMockParam([numType])], () => 'second'),
        createMockSignature([createMockParam([numType])], () => 'third'),
      ];

      const onMismatch: MismatchHandler = () => { throw new Error('mismatch'); };

      // Start from index 1, should skip the first signature
      const dispatcher = createGenericDispatcher('test', signatures, 1, onMismatch);
      const args = { 0: 42, length: 1 } as unknown as IArguments;

      expect(dispatcher(args, null)).toBe('second');
    });

    it('should call onMismatch when no signature matches', () => {
      const numType = createMockType('number', x => typeof x === 'number');

      const signatures: Signature[] = [
        createMockSignature([createMockParam([numType])], (a: number) => `number:${a}`),
      ];

      const onMismatch = vi.fn(() => 'mismatch result');
      const dispatcher = createGenericDispatcher('test', signatures, 0, onMismatch);

      // Pass a string instead of a number
      const args = { 0: 'hello', length: 1 } as unknown as IArguments;
      const result = dispatcher(args, null);

      expect(onMismatch).toHaveBeenCalledOnce();
      expect(result).toBe('mismatch result');
    });

    it('should preserve this context', () => {
      const numType = createMockType('number', x => typeof x === 'number');

      const signatures: Signature[] = [
        createMockSignature(
          [createMockParam([numType])],
          function(this: { value: number }, a: number) {
            return this.value + a;
          }
        ),
      ];

      const onMismatch: MismatchHandler = () => { throw new Error('mismatch'); };
      const dispatcher = createGenericDispatcher('test', signatures, 0, onMismatch);

      const context = { value: 10 };
      const args = { 0: 5, length: 1 } as unknown as IArguments;

      expect(dispatcher(args, context)).toBe(15);
    });

    it('should skip signatures without test function', () => {
      const numType = createMockType('number', x => typeof x === 'number');

      const signatures: Signature[] = [
        {
          params: [createMockParam([numType])],
          fn: () => 'first',
          test: null, // No test function
          implementation: () => 'first',
        },
        createMockSignature([createMockParam([numType])], () => 'second'),
      ];

      const onMismatch: MismatchHandler = () => { throw new Error('mismatch'); };
      const dispatcher = createGenericDispatcher('test', signatures, 0, onMismatch);
      const args = { 0: 42, length: 1 } as unknown as IArguments;

      // Should skip first signature (no test) and use second
      expect(dispatcher(args, null)).toBe('second');
    });

    it('should skip signatures without implementation', () => {
      const numType = createMockType('number', x => typeof x === 'number');

      const signatures: Signature[] = [
        {
          params: [createMockParam([numType])],
          fn: () => 'first',
          test: () => true,
          implementation: null, // No implementation
        },
        createMockSignature([createMockParam([numType])], () => 'second'),
      ];

      const onMismatch: MismatchHandler = () => { throw new Error('mismatch'); };
      const dispatcher = createGenericDispatcher('test', signatures, 0, onMismatch);
      const args = { 0: 42, length: 1 } as unknown as IArguments;

      // Should skip first signature (no implementation) and use second
      expect(dispatcher(args, null)).toBe('second');
    });
  });

  describe('createSimpleDispatcher', () => {
    it('should dispatch to matching signature', () => {
      const numType = createMockType('number', x => typeof x === 'number');
      const strType = createMockType('string', x => typeof x === 'string');

      const signatures: Signature[] = [
        createMockSignature([createMockParam([numType])], (a: number) => `number:${a}`),
        createMockSignature([createMockParam([strType])], (a: string) => `string:${a}`),
      ];

      const onMismatch: MismatchHandler = () => { throw new Error('mismatch'); };
      const dispatcher = createSimpleDispatcher('test', signatures, onMismatch);

      expect(dispatcher(42)).toBe('number:42');
      expect(dispatcher('hello')).toBe('string:hello');
    });

    it('should call onMismatch when no signature matches', () => {
      const numType = createMockType('number', x => typeof x === 'number');

      const signatures: Signature[] = [
        createMockSignature([createMockParam([numType])], (a: number) => `number:${a}`),
      ];

      const onMismatch = vi.fn(() => 'mismatch result');
      const dispatcher = createSimpleDispatcher('test', signatures, onMismatch);

      const result = dispatcher('hello');

      expect(onMismatch).toHaveBeenCalledOnce();
      expect(result).toBe('mismatch result');
    });

    it('should set function name', () => {
      const signatures: Signature[] = [];
      const onMismatch: MismatchHandler = () => { throw new Error('mismatch'); };
      const dispatcher = createSimpleDispatcher('myFunction', signatures, onMismatch);

      expect(dispatcher.name).toBe('myFunction');
    });

    it('should preserve this context', () => {
      const numType = createMockType('number', x => typeof x === 'number');

      const signatures: Signature[] = [
        createMockSignature(
          [createMockParam([numType])],
          function(this: { value: number }, a: number) {
            return this.value + a;
          }
        ),
      ];

      const onMismatch: MismatchHandler = () => { throw new Error('mismatch'); };
      const dispatcher = createSimpleDispatcher('test', signatures, onMismatch);

      const context = { value: 10 };
      expect(dispatcher.call(context, 5)).toBe(15);
    });

    it('should handle empty signatures array', () => {
      const onMismatch = vi.fn(() => 'no signatures');
      const dispatcher = createSimpleDispatcher('test', [], onMismatch);

      const result = dispatcher(42);

      expect(onMismatch).toHaveBeenCalledOnce();
      expect(result).toBe('no signatures');
    });
  });

  describe('hasCompiledTests', () => {
    it('should return true when all signatures have test functions', () => {
      const signatures: Signature[] = [
        { params: [], fn: null, test: () => true, implementation: null },
        { params: [], fn: null, test: () => false, implementation: null },
      ];

      expect(hasCompiledTests(signatures)).toBe(true);
    });

    it('should return false when some signatures lack test functions', () => {
      const signatures: Signature[] = [
        { params: [], fn: null, test: () => true, implementation: null },
        { params: [], fn: null, test: null, implementation: null },
      ];

      expect(hasCompiledTests(signatures)).toBe(false);
    });

    it('should return true for empty array', () => {
      expect(hasCompiledTests([])).toBe(true);
    });
  });

  describe('hasImplementations', () => {
    it('should return true when all signatures have implementations', () => {
      const signatures: Signature[] = [
        { params: [], fn: () => 'a', test: null, implementation: () => 'a' },
        { params: [], fn: () => 'b', test: null, implementation: () => 'b' },
      ];

      expect(hasImplementations(signatures)).toBe(true);
    });

    it('should return false when some signatures lack implementations', () => {
      const signatures: Signature[] = [
        { params: [], fn: () => 'a', test: null, implementation: () => 'a' },
        { params: [], fn: null, test: null, implementation: null },
      ];

      expect(hasImplementations(signatures)).toBe(false);
    });

    it('should return true for empty array', () => {
      expect(hasImplementations([])).toBe(true);
    });
  });
});
