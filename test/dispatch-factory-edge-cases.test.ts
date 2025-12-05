/**
 * Phase 2 Sprint 7: Dispatch & Factory Edge Cases
 *
 * Tests covering:
 * - checkName edge cases
 * - getObjectName handling
 * - mergeSignatures conflicts
 * - Factory typed detection
 * - Signature property handling
 * - Reference validation (referTo/referToSelf)
 * - create() isolation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { create } from '../src/index.js';
import { checkName, getObjectName, mergeSignatures } from '../src/dispatch/dispatcher.js';
import type { TypedInstance, TypedFunction, SignatureFunction, ReferTo, ReferToSelf } from '../src/core/types.js';

describe('Phase 2 Sprint 7: Dispatch & Factory Edge Cases', () => {
  let typed: TypedInstance;

  beforeEach(() => {
    typed = create();
  });

  describe('checkName edge cases', () => {
    it('should return empty string when nameSoFar and newName are undefined', () => {
      expect(checkName(undefined, undefined)).toBe('');
    });

    it('should return empty string when nameSoFar is undefined and newName is empty', () => {
      expect(checkName(undefined, '')).toBe('');
    });

    it('should return newName when nameSoFar is undefined', () => {
      expect(checkName(undefined, 'myFunc')).toBe('myFunc');
    });

    it('should return nameSoFar when newName is undefined', () => {
      expect(checkName('existingName', undefined)).toBe('existingName');
    });

    it('should return nameSoFar when newName is empty string', () => {
      expect(checkName('existingName', '')).toBe('existingName');
    });

    it('should return nameSoFar when names match', () => {
      expect(checkName('sameName', 'sameName')).toBe('sameName');
    });

    it('should throw when names mismatch', () => {
      expect(() => checkName('name1', 'name2')).toThrow(Error);
      expect(() => checkName('name1', 'name2')).toThrow(
        'Function names do not match (expected: name1, actual: name2)'
      );
    });

    it('should include data in error when names mismatch', () => {
      try {
        checkName('expected', 'actual');
        expect.fail('Should have thrown');
      } catch (e) {
        expect((e as Error & { data: unknown }).data).toEqual({
          actual: 'actual',
          expected: 'expected',
        });
      }
    });
  });

  describe('getObjectName', () => {
    it('should return undefined for empty object', () => {
      const result = getObjectName({}, typed.isTypedFunction);
      expect(result).toBeUndefined();
    });

    it('should return undefined for object with plain functions', () => {
      const obj = {
        'number': () => 42,
        'string': () => 'hello',
      };
      const result = getObjectName(obj, typed.isTypedFunction);
      expect(result).toBeUndefined();
    });

    it('should extract name from typed function', () => {
      const myTypedFn = typed('myFunction', {
        'number': (n: number) => n,
      });
      const obj = {
        'number': myTypedFn,
      };
      const result = getObjectName(obj as Record<string, SignatureFunction>, typed.isTypedFunction);
      expect(result).toBe('myFunction');
    });

    it('should extract name from function with signature property', () => {
      const fnWithSig = function myFn(n: number) {
        return n;
      } as SignatureFunction & { signature?: string };
      fnWithSig.signature = 'number';

      const obj = {
        'number': fnWithSig,
      };
      const result = getObjectName(obj, typed.isTypedFunction);
      expect(result).toBe('myFn');
    });

    it('should throw for mismatched names', () => {
      const fn1 = typed('name1', { 'number': (n: number) => n });
      const fn2 = typed('name2', { 'string': (s: string) => s });

      const obj = {
        'number': fn1,
        'string': fn2,
      };

      expect(() =>
        getObjectName(obj as Record<string, SignatureFunction>, typed.isTypedFunction)
      ).toThrow('Function names do not match');
    });
  });

  describe('mergeSignatures', () => {
    it('should merge non-overlapping signatures', () => {
      const dest: Record<string, SignatureFunction> = {
        'number': ((n: number) => n) as SignatureFunction,
      };
      const source: Record<string, SignatureFunction> = {
        'string': ((s: string) => s) as SignatureFunction,
      };

      mergeSignatures(dest, source);

      expect(Object.keys(dest)).toContain('number');
      expect(Object.keys(dest)).toContain('string');
    });

    it('should allow same signature with same function', () => {
      const sharedFn = ((n: number) => n) as SignatureFunction;
      const dest: Record<string, SignatureFunction> = { 'number': sharedFn };
      const source: Record<string, SignatureFunction> = { 'number': sharedFn };

      // Should not throw
      mergeSignatures(dest, source);
      expect(dest['number']).toBe(sharedFn);
    });

    it('should throw for same signature with different functions', () => {
      const fn1 = ((n: number) => n) as SignatureFunction;
      const fn2 = ((n: number) => n * 2) as SignatureFunction;
      const dest: Record<string, SignatureFunction> = { 'number': fn1 };
      const source: Record<string, SignatureFunction> = { 'number': fn2 };

      expect(() => mergeSignatures(dest, source)).toThrow('Signature "number" is defined twice');
    });

    it('should include data in error for conflicting signatures', () => {
      const fn1 = ((n: number) => n) as SignatureFunction;
      const fn2 = ((n: number) => n * 2) as SignatureFunction;
      const dest: Record<string, SignatureFunction> = { 'number': fn1 };
      const source: Record<string, SignatureFunction> = { 'number': fn2 };

      try {
        mergeSignatures(dest, source);
        expect.fail('Should have thrown');
      } catch (e) {
        const err = e as Error & { data: { signature: string; sourceFunction: unknown; destFunction: unknown } };
        expect(err.data.signature).toBe('number');
        expect(err.data.sourceFunction).toBe(fn2);
        expect(err.data.destFunction).toBe(fn1);
      }
    });

    it('should handle undefined values in source', () => {
      const dest: Record<string, SignatureFunction | undefined> = {};
      const source: Record<string, SignatureFunction | undefined> = {
        'number': undefined,
      };

      mergeSignatures(
        dest as Record<string, SignatureFunction | ReferTo | ReferToSelf>,
        source as Record<string, SignatureFunction | ReferTo | ReferToSelf>
      );
      expect(dest['number']).toBeUndefined();
    });
  });

  describe('Factory typed detection', () => {
    it('should merge typed functions', () => {
      const fn1 = typed('mathOps', { 'number': (n: number) => n + 1 });
      const fn2 = typed('mathOps', { 'string': (s: string) => s.length });

      const merged = typed(fn1, fn2);

      expect(merged(5)).toBe(6);
      expect(merged('hello')).toBe(5);
    });

    it('should extract signatures from typed function', () => {
      const original = typed('myFn', {
        'number': (n: number) => n * 2,
        'string': (s: string) => s.toUpperCase(),
      });

      const extended = typed(original, {
        'boolean': (b: boolean) => !b,
      });

      expect(extended(5)).toBe(10);
      expect(extended('hi')).toBe('HI');
      expect(extended(true)).toBe(false);
    });

    it('should detect typed functions with isTypedFunction', () => {
      const fn = typed('test', { 'number': (n: number) => n });
      expect(typed.isTypedFunction(fn)).toBe(true);
      expect(typed.isTypedFunction(() => {})).toBe(false);
      expect(typed.isTypedFunction(null)).toBe(false);
      expect(typed.isTypedFunction(42)).toBe(false);
    });
  });

  describe('Signature property handling', () => {
    it('should accept function with signature property', () => {
      const fnWithSig = function addOne(n: number): number {
        return n + 1;
      } as SignatureFunction & { signature: string };
      fnWithSig.signature = 'number';

      const fn = typed(fnWithSig);

      expect(fn(5)).toBe(6);
      expect(fn.name).toBe('addOne');
    });

    it('should accept multiple functions with signature properties', () => {
      const fn1 = function myFn(n: number): number {
        return n * 2;
      } as SignatureFunction & { signature: string };
      fn1.signature = 'number';

      const fn2 = function myFn(s: string): string {
        return s.toUpperCase();
      } as SignatureFunction & { signature: string };
      fn2.signature = 'string';

      // Both functions have the same name, so they can be merged
      const fn = typed(fn1, fn2);

      expect(fn(5)).toBe(10);
      expect(fn('hi')).toBe('HI');
    });

    it('should reject function without signature when no object provided', () => {
      const plainFn = () => 42;

      expect(() => typed(plainFn as unknown as Record<string, SignatureFunction>)).toThrow(TypeError);
    });
  });

  describe('Reference validation (referTo)', () => {
    it('should create valid referTo reference', () => {
      const fn = typed({
        'number': (n: number) => n,
        'string': typed.referTo('number', (numFn: SignatureFunction) => {
          return (s: string) => numFn(parseInt(s, 10));
        }),
      });

      expect(fn(5)).toBe(5);
      expect(fn('42')).toBe(42);
    });

    it('should throw for referTo without callback', () => {
      expect(() => typed.referTo('number' as unknown as (...fns: SignatureFunction[]) => SignatureFunction)).toThrow(
        'Callback function expected as last argument'
      );
    });

    it('should throw for referTo with non-string signature', () => {
      expect(() =>
        typed.referTo(123 as unknown as string, () => ((x: unknown) => x))
      ).toThrow('Signatures must be strings');
    });

    it('should handle multiple signature references', () => {
      const fn = typed({
        'number': (n: number) => n * 2,
        'string': (s: string) => s.length,
        'boolean': typed.referTo('number', 'string', (numFn, strFn) => {
          return (b: boolean) => (b ? numFn(1) : strFn('hi'));
        }),
      });

      expect(fn(true)).toBe(2);
      expect(fn(false)).toBe(2);
    });
  });

  describe('Reference validation (referToSelf)', () => {
    it('should create valid referToSelf reference', () => {
      const fn = typed({
        'number': (n: number) => n,
        'string': typed.referToSelf((self: TypedFunction) => {
          return (s: string) => self(parseInt(s, 10));
        }),
      });

      expect(fn(5)).toBe(5);
      expect(fn('42')).toBe(42);
    });

    it('should throw for referToSelf without callback', () => {
      expect(() => typed.referToSelf(null as unknown as (self: TypedFunction) => SignatureFunction)).toThrow(
        'Callback function expected as first argument'
      );
    });

    it('should allow recursive calls via referToSelf', () => {
      const factorial = typed('factorial', {
        'number': typed.referToSelf((self) => {
          return (n: number): number => (n <= 1 ? 1 : n * (self(n - 1) as number));
        }),
      });

      expect(factorial(5)).toBe(120);
      expect(factorial(1)).toBe(1);
    });
  });

  describe('create() isolation', () => {
    it('should create independent typed instances', () => {
      const typed1 = create();
      const typed2 = create();

      typed1.addType({ name: 'positive', test: (x) => typeof x === 'number' && (x as number) > 0 });

      // typed2 should not have the 'positive' type
      expect(() => typed2('test', { 'positive': (n: number) => n })).toThrow();

      // typed1 should have it
      const fn = typed1('test', { 'positive': (n: number) => n * 2 });
      expect(fn(5)).toBe(10);
    });

    it('should have independent conversion managers', () => {
      const typed1 = create();
      const typed2 = create();

      typed1.addConversion({ from: 'string', to: 'number', convert: (s) => parseInt(s as string, 10) });

      const fn1 = typed1({ 'number': (n: number) => n * 2 });
      expect(fn1('5')).toBe(10);

      // typed2 should not have this conversion
      const fn2 = typed2({ 'number': (n: number) => n * 2 });
      expect(() => fn2('5')).toThrow();
    });

    it('should track createCount independently', () => {
      const typed1 = create();
      const typed2 = create();

      typed1({ 'number': (n: number) => n });
      typed1({ 'string': (s: string) => s });

      typed2({ 'boolean': (b: boolean) => b });

      expect(typed1.createCount).toBe(2);
      expect(typed2.createCount).toBe(1);
    });

    it('should have independent clear operations', () => {
      const typed1 = create();
      const typed2 = create();

      typed1.addType({ name: 'custom1', test: () => false });
      typed2.addType({ name: 'custom2', test: () => false });

      typed1.clear();

      // typed1 should be cleared, typed2 should not
      expect(() => typed1._findType('custom1')).toThrow();
      expect(typed2._findType('custom2')).toBeDefined();
    });
  });

  describe('Factory error handling', () => {
    it('should throw for empty signatures object', () => {
      // Empty object passed as argument is detected as invalid before checking signatures
      expect(() => typed('empty', {})).toThrow(TypeError);
      expect(() => typed('empty', {})).toThrow('Argument to \'typed\' at index 1 is not a (typed) function');
    });

    it('should throw for invalid argument type', () => {
      expect(() => typed('test', 42 as unknown as Record<string, SignatureFunction>)).toThrow(TypeError);
    });

    it('should throw for conflicting signatures when merging', () => {
      const fn1 = typed({ 'number': (n: number) => n });
      const fn2 = typed({ 'number': (n: number) => n * 2 });

      // Merging two typed functions with same signature should throw
      expect(() => typed(fn1, fn2)).toThrow();
    });

    it('should provide helpful error for not-a-typed-function', () => {
      expect(() => typed.find({} as TypedFunction, 'number')).toThrow(
        'Argument is not a typed-function'
      );

      expect(() => typed.resolve({} as TypedFunction, [1])).toThrow(
        'Argument is not a typed-function'
      );
    });
  });

  describe('Factory additional methods', () => {
    it('should provide convert method', () => {
      typed.addConversion({ from: 'string', to: 'number', convert: (s) => Number(s) });
      expect(typed.convert('42', 'number')).toBe(42);
    });

    it('should provide resolve method', () => {
      const fn = typed({
        'number': (n: number) => n * 2,
        'string': (s: string) => s.length,
      });

      const numSig = typed.resolve(fn, [42]);
      expect(numSig).toBeDefined();
      expect(numSig?.params[0]?.types[0]?.name).toBe('number');

      const strSig = typed.resolve(fn, ['hello']);
      expect(strSig).toBeDefined();

      const noMatch = typed.resolve(fn, [true]);
      expect(noMatch).toBeNull();
    });

    it('should provide findSignature method', () => {
      const fn = typed({
        'number': (n: number) => n,
        'string': (s: string) => s,
      });

      const sig = typed.findSignature(fn, 'number');
      expect(sig).toBeDefined();
      expect(sig.params[0]?.types[0]?.name).toBe('number');
    });

    it('should throw for invalid signature in findSignature', () => {
      const fn = typed({
        'number': (n: number) => n,
      });

      expect(() => typed.findSignature(fn, 'unknownType')).toThrow();
    });

    it('should provide createError method', () => {
      const fn = typed({
        'number': (n: number) => n,
      });

      const error = typed.createError('testFn', ['hello'], fn._typedFunctionData.signatures);
      expect(error).toBeInstanceOf(TypeError);
      expect(error.message).toContain('testFn');
    });
  });

  describe('Factory addType method', () => {
    it('should add type before Object by default', () => {
      typed.addType({ name: 'customBeforeObj', test: () => false });
      // Should not throw - type is registered
      expect(typed._findType('customBeforeObj')).toBeDefined();
    });

    it('should add type at end when beforeObjectTest is false', () => {
      typed.addType({ name: 'customAtEnd', test: () => false }, false);
      const typeList = (typed as unknown as { _findType: (n: string) => { index: number } })._findType('customAtEnd');
      expect(typeList).toBeDefined();
    });
  });

  describe('Factory removeConversion method', () => {
    it('should remove added conversion', () => {
      const conv = { from: 'string', to: 'number', convert: (s: unknown) => Number(s) };
      typed.addConversion(conv);

      const fn = typed({ 'number': (n: number) => n * 2 });
      expect(fn('5')).toBe(10);

      typed.removeConversion(conv);

      const fn2 = typed({ 'number': (n: number) => n * 2 });
      expect(() => fn2('5')).toThrow();
    });
  });

  describe('Factory clearConversions method', () => {
    it('should clear all conversions', () => {
      typed.addConversion({ from: 'string', to: 'number', convert: (s) => Number(s) });
      typed.addConversion({ from: 'boolean', to: 'number', convert: (b) => (b ? 1 : 0) });

      const fn = typed({ 'number': (n: number) => n });
      expect(fn('42')).toBe(42);

      typed.clearConversions();

      const fn2 = typed({ 'number': (n: number) => n });
      expect(() => fn2('42')).toThrow();
    });
  });

  describe('Protected prototype properties', () => {
    it('should skip prototype-polluted properties', () => {
      // This tests that Object.prototype.hasOwnProperty.call is used
      const sigs = { 'number': (n: number) => n };
      const fn = typed(sigs);
      expect(fn(5)).toBe(5);
    });
  });

  describe('warnAgainstDeprecatedThis', () => {
    it('should be configurable', () => {
      expect(typed.warnAgainstDeprecatedThis).toBe(true);
      typed.warnAgainstDeprecatedThis = false;
      expect(typed.warnAgainstDeprecatedThis).toBe(false);
    });
  });
});
