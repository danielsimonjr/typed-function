/**
 * Phase 2 Sprint 9: Branch Coverage Completion Tests
 *
 * Tests covering:
 * - Fast-path dispatch branches
 * - Generic-path dispatch branches
 * - Reference resolver edge cases
 * - Conversion manager branches
 * - Signature parser branches
 * - Type registry branches
 * - Factory branches
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { create } from '../src/index.js';
import type { TypedInstance, Signature, Param, SignatureFunction } from '../src/core/types.js';
import {
  isFastPathEligible,
  createFastPathSlot,
  createInactiveSlot,
  createFastPathDispatcher,
  createDispatcher,
  compileSignatureTests,
} from '../src/dispatch/fast-path.js';
import {
  createGenericDispatcher,
  createSimpleDispatcher,
  hasCompiledTests,
  hasImplementations,
} from '../src/dispatch/generic-path.js';
import {
  isReferTo,
  isReferToSelf,
  makeReferTo,
  makeReferToSelf,
  clearResolutions,
  collectResolutions,
  resolveReferences,
  validateDeprecatedThis,
} from '../src/core/reference-resolver.js';
import { createTypeRegistry } from '../src/core/type-registry.js';
import { createConversionManager } from '../src/core/conversion-manager.js';
import { parseSignature } from '../src/core/signature-parser.js';

describe('Phase 2 Sprint 9: Branch Coverage Completion', () => {
  let typed: TypedInstance;

  beforeEach(() => {
    typed = create();
  });

  describe('Fast-Path Dispatcher', () => {
    describe('isFastPathEligible', () => {
      it('should return true for 0-param signature', () => {
        const sig: Signature = {
          params: [],
          fn: null,
          test: null,
          implementation: () => 42,
        };
        expect(isFastPathEligible(sig)).toBe(true);
      });

      it('should return true for 1-param signature', () => {
        const sig: Signature = {
          params: [{
            types: [{ name: 'number', typeIndex: 0, test: (x) => typeof x === 'number', isAny: false, conversion: null, conversionIndex: -1 }],
            name: 'number',
            hasAny: false,
            hasConversion: false,
            restParam: false,
          }],
          fn: null,
          test: null,
          implementation: (n: number) => n,
        };
        expect(isFastPathEligible(sig)).toBe(true);
      });

      it('should return true for 2-param signature', () => {
        const sig: Signature = {
          params: [
            { types: [], name: 'number', hasAny: false, hasConversion: false, restParam: false },
            { types: [], name: 'string', hasAny: false, hasConversion: false, restParam: false },
          ],
          fn: null,
          test: null,
          implementation: () => 42,
        };
        expect(isFastPathEligible(sig)).toBe(true);
      });

      it('should return false for 3+ param signature', () => {
        const sig: Signature = {
          params: [
            { types: [], name: 'a', hasAny: false, hasConversion: false, restParam: false },
            { types: [], name: 'b', hasAny: false, hasConversion: false, restParam: false },
            { types: [], name: 'c', hasAny: false, hasConversion: false, restParam: false },
          ],
          fn: null,
          test: null,
          implementation: () => 42,
        };
        expect(isFastPathEligible(sig)).toBe(false);
      });

      it('should return false for rest param signature', () => {
        const sig: Signature = {
          params: [{ types: [], name: '...nums', hasAny: false, hasConversion: false, restParam: true }],
          fn: null,
          test: null,
          implementation: () => 42,
        };
        expect(isFastPathEligible(sig)).toBe(false);
      });
    });

    describe('createFastPathSlot', () => {
      it('should create slot for 0-param signature', () => {
        const sig: Signature = {
          params: [],
          fn: null,
          test: null,
          implementation: () => 42,
        };
        const slot = createFastPathSlot(sig);
        expect(slot.active).toBe(true);
        expect(slot.length).toBe(0);
        expect(slot.test0(undefined)).toBe(true);
        expect(slot.test1(undefined)).toBe(true);
      });

      it('should create slot with hasAny param', () => {
        const sig: Signature = {
          params: [{
            types: [{ name: 'any', typeIndex: 0, test: () => true, isAny: true, conversion: null, conversionIndex: -1 }],
            name: 'any',
            hasAny: true,
            hasConversion: false,
            restParam: false,
          }],
          fn: null,
          test: null,
          implementation: (x: unknown) => x,
        };
        const slot = createFastPathSlot(sig);
        expect(slot.test0('anything')).toBe(true);
        expect(slot.test0(42)).toBe(true);
      });

      it('should create slot with single type param', () => {
        const sig: Signature = {
          params: [{
            types: [{ name: 'number', typeIndex: 0, test: (x) => typeof x === 'number', isAny: false, conversion: null, conversionIndex: -1 }],
            name: 'number',
            hasAny: false,
            hasConversion: false,
            restParam: false,
          }],
          fn: null,
          test: null,
          implementation: (n: number) => n,
        };
        const slot = createFastPathSlot(sig);
        expect(slot.test0(42)).toBe(true);
        expect(slot.test0('hello')).toBe(false);
      });

      it('should create slot with union type param', () => {
        const sig: Signature = {
          params: [{
            types: [
              { name: 'number', typeIndex: 0, test: (x) => typeof x === 'number', isAny: false, conversion: null, conversionIndex: -1 },
              { name: 'string', typeIndex: 1, test: (x) => typeof x === 'string', isAny: false, conversion: null, conversionIndex: -1 },
            ],
            name: 'number|string',
            hasAny: false,
            hasConversion: false,
            restParam: false,
          }],
          fn: null,
          test: null,
          implementation: (x: number | string) => x,
        };
        const slot = createFastPathSlot(sig);
        expect(slot.test0(42)).toBe(true);
        expect(slot.test0('hi')).toBe(true);
        expect(slot.test0(true)).toBe(false);
      });

      it('should create slot with registry', () => {
        const registry = createTypeRegistry();
        const sig: Signature = {
          params: [{
            types: [{ name: 'number', typeIndex: 0, test: (x) => typeof x === 'number', isAny: false, conversion: null, conversionIndex: -1 }],
            name: 'number',
            hasAny: false,
            hasConversion: false,
            restParam: false,
          }],
          fn: null,
          test: null,
          implementation: (n: number) => n,
        };
        const slot = createFastPathSlot(sig, registry);
        expect(slot.active).toBe(true);
      });
    });

    describe('createInactiveSlot', () => {
      it('should create inactive slot', () => {
        const slot = createInactiveSlot();
        expect(slot.active).toBe(false);
        expect(slot.length).toBe(-1);
        expect(slot.test0(42)).toBe(false);
        expect(slot.test1(42)).toBe(false);
      });
    });

    describe('createFastPathDispatcher', () => {
      it('should create dispatcher with active slots', () => {
        const sigs: Signature[] = [];
        for (let i = 0; i < 6; i++) {
          sigs.push({
            params: [{ types: [{ name: 'number', typeIndex: 0, test: () => true, isAny: false, conversion: null, conversionIndex: -1 }], name: 'n', hasAny: false, hasConversion: false, restParam: false }],
            fn: null,
            test: null,
            implementation: () => i,
          });
        }
        const fp = createFastPathDispatcher(sigs);
        expect(fp.slots.length).toBe(6);
        expect(fp.allActive).toBe(true);
        expect(fp.genericStartIndex).toBe(6);
      });

      it('should handle less than 6 signatures', () => {
        const sigs: Signature[] = [{
          params: [],
          fn: null,
          test: null,
          implementation: () => 42,
        }];
        const fp = createFastPathDispatcher(sigs);
        expect(fp.slots.length).toBe(6);
        expect(fp.allActive).toBe(false);
        expect(fp.genericStartIndex).toBe(0);
      });

      it('should mark non-eligible signature slots as inactive', () => {
        const sigs: Signature[] = [{
          // 3 params - not eligible
          params: [
            { types: [], name: 'a', hasAny: false, hasConversion: false, restParam: false },
            { types: [], name: 'b', hasAny: false, hasConversion: false, restParam: false },
            { types: [], name: 'c', hasAny: false, hasConversion: false, restParam: false },
          ],
          fn: null,
          test: null,
          implementation: () => 42,
        }];
        const fp = createFastPathDispatcher(sigs);
        expect(fp.slots[0]?.active).toBe(false);
      });

      it('should mark signature without implementation as inactive', () => {
        const sigs: Signature[] = [{
          params: [],
          fn: null,
          test: null,
          implementation: null,
        }];
        const fp = createFastPathDispatcher(sigs);
        expect(fp.slots[0]?.active).toBe(false);
      });
    });

    describe('createDispatcher', () => {
      it('should create dispatcher function', () => {
        const sigs: Signature[] = [{
          params: [],
          fn: null,
          test: null,
          implementation: () => 42,
        }];
        const genericDispatch = (args: IArguments) => 'generic';
        const onMismatch = () => { throw new Error('mismatch'); };

        const dispatcher = createDispatcher('test', sigs, genericDispatch, onMismatch);
        expect(typeof dispatcher).toBe('function');
        expect(dispatcher.name).toBe('test');
      });

      it('should fall back to generic dispatch', () => {
        const sigs: Signature[] = [{
          params: [{ types: [{ name: 'number', typeIndex: 0, test: (x) => typeof x === 'number', isAny: false, conversion: null, conversionIndex: -1 }], name: 'n', hasAny: false, hasConversion: false, restParam: false }],
          fn: null,
          test: null,
          implementation: () => 'matched',
        }];
        const genericDispatch = () => 'fallback';
        const onMismatch = () => { throw new Error('mismatch'); };

        const dispatcher = createDispatcher('test', sigs, genericDispatch, onMismatch);
        // Call with wrong type to trigger fallback
        expect(dispatcher('not a number')).toBe('fallback');
      });
    });

    describe('compileSignatureTests', () => {
      it('should compile tests for signatures', () => {
        const registry = createTypeRegistry();
        const sigs: Signature[] = [{
          params: [{ types: [{ name: 'number', typeIndex: 0, test: (x) => typeof x === 'number', isAny: false, conversion: null, conversionIndex: -1 }], name: 'n', hasAny: false, hasConversion: false, restParam: false }],
          fn: null,
          test: null,
          implementation: (n: number) => n,
        }];

        compileSignatureTests(sigs, registry);
        expect(typeof sigs[0]?.test).toBe('function');
      });

      it('should not recompile existing tests', () => {
        const registry = createTypeRegistry();
        const existingTest = () => true;
        const sigs: Signature[] = [{
          params: [],
          fn: null,
          test: existingTest,
          implementation: () => 42,
        }];

        compileSignatureTests(sigs, registry);
        expect(sigs[0]?.test).toBe(existingTest);
      });
    });
  });

  describe('Generic-Path Dispatcher', () => {
    describe('createGenericDispatcher', () => {
      it('should create generic dispatcher', () => {
        const sigs: Signature[] = [{
          params: [],
          fn: null,
          test: () => true,
          implementation: () => 42,
        }];
        const onMismatch = () => { throw new Error('mismatch'); };

        const dispatcher = createGenericDispatcher('test', sigs, 0, onMismatch);
        const result = dispatcher({ length: 0 } as IArguments, null);
        expect(result).toBe(42);
      });

      it('should call onMismatch when no signature matches', () => {
        const sigs: Signature[] = [{
          params: [],
          fn: null,
          test: () => false,
          implementation: () => 42,
        }];
        let mismatchCalled = false;
        const onMismatch = () => { mismatchCalled = true; return 'nomatch'; };

        const dispatcher = createGenericDispatcher('test', sigs, 0, onMismatch);
        const result = dispatcher({ length: 0 } as IArguments, null);
        expect(mismatchCalled).toBe(true);
        expect(result).toBe('nomatch');
      });

      it('should skip signatures without test or implementation', () => {
        const sigs: Signature[] = [
          { params: [], fn: null, test: null, implementation: () => 'no test' },
          { params: [], fn: null, test: () => true, implementation: null },
          { params: [], fn: null, test: () => true, implementation: () => 'valid' },
        ];
        const onMismatch = () => { throw new Error('mismatch'); };

        const dispatcher = createGenericDispatcher('test', sigs, 0, onMismatch);
        const result = dispatcher({ length: 0 } as IArguments, null);
        expect(result).toBe('valid');
      });
    });

    describe('createSimpleDispatcher', () => {
      it('should create simple dispatcher', () => {
        const sigs: Signature[] = [{
          params: [],
          fn: null,
          test: () => true,
          implementation: () => 42,
        }];
        const onMismatch = () => { throw new Error('mismatch'); };

        const dispatcher = createSimpleDispatcher('test', sigs, onMismatch);
        expect(dispatcher.name).toBe('test');
        expect(dispatcher()).toBe(42);
      });

      it('should iterate through all signatures', () => {
        const sigs: Signature[] = [
          { params: [], fn: null, test: () => false, implementation: () => 'first' },
          { params: [], fn: null, test: () => true, implementation: () => 'second' },
        ];
        const onMismatch = () => 'nomatch';

        const dispatcher = createSimpleDispatcher('test', sigs, onMismatch);
        expect(dispatcher()).toBe('second');
      });
    });

    describe('hasCompiledTests', () => {
      it('should return true when all have tests', () => {
        const sigs: Signature[] = [
          { params: [], fn: null, test: () => true, implementation: null },
          { params: [], fn: null, test: () => false, implementation: null },
        ];
        expect(hasCompiledTests(sigs)).toBe(true);
      });

      it('should return false when some lack tests', () => {
        const sigs: Signature[] = [
          { params: [], fn: null, test: () => true, implementation: null },
          { params: [], fn: null, test: null, implementation: null },
        ];
        expect(hasCompiledTests(sigs)).toBe(false);
      });
    });

    describe('hasImplementations', () => {
      it('should return true when all have implementations', () => {
        const sigs: Signature[] = [
          { params: [], fn: null, test: null, implementation: () => 1 },
          { params: [], fn: null, test: null, implementation: () => 2 },
        ];
        expect(hasImplementations(sigs)).toBe(true);
      });

      it('should return false when some lack implementations', () => {
        const sigs: Signature[] = [
          { params: [], fn: null, test: null, implementation: () => 1 },
          { params: [], fn: null, test: null, implementation: null },
        ];
        expect(hasImplementations(sigs)).toBe(false);
      });
    });
  });

  describe('Reference Resolver', () => {
    describe('isReferTo', () => {
      it('should return true for valid referTo', () => {
        const ref = makeReferTo(['number'], () => (x: number) => x);
        expect(isReferTo(ref)).toBe(true);
      });

      it('should return false for null', () => {
        expect(isReferTo(null)).toBe(false);
      });

      it('should return false for function', () => {
        expect(isReferTo(() => {})).toBe(false);
      });

      it('should return false for object without referTo', () => {
        expect(isReferTo({})).toBe(false);
      });

      it('should return false for invalid referTo structure', () => {
        expect(isReferTo({ referTo: 'invalid' })).toBe(false);
        expect(isReferTo({ referTo: { references: 'not array' } })).toBe(false);
      });
    });

    describe('isReferToSelf', () => {
      it('should return true for valid referToSelf', () => {
        const ref = makeReferToSelf(() => (x: unknown) => x);
        expect(isReferToSelf(ref)).toBe(true);
      });

      it('should return false for null', () => {
        expect(isReferToSelf(null)).toBe(false);
      });

      it('should return false for object without referToSelf', () => {
        expect(isReferToSelf({})).toBe(false);
      });

      it('should return false for invalid referToSelf structure', () => {
        expect(isReferToSelf({ referToSelf: 'invalid' })).toBe(false);
        expect(isReferToSelf({ referToSelf: { callback: 'not function' } })).toBe(false);
      });
    });

    describe('clearResolutions', () => {
      it('should return copy with cleared referTo', () => {
        const ref = makeReferTo(['number'], () => (x: number) => x);
        const result = clearResolutions([ref]);
        expect(isReferTo(result[0])).toBe(true);
        expect(result[0]).not.toBe(ref);
      });

      it('should return copy with cleared referToSelf', () => {
        const ref = makeReferToSelf(() => (x: unknown) => x);
        const result = clearResolutions([ref]);
        expect(isReferToSelf(result[0])).toBe(true);
        expect(result[0]).not.toBe(ref);
      });

      it('should pass through plain functions', () => {
        const fn = (x: number) => x;
        const result = clearResolutions([fn]);
        expect(result[0]).toBe(fn);
      });
    });

    describe('collectResolutions', () => {
      it('should collect resolved references', () => {
        const fn = (x: number) => x;
        const result = collectResolutions(['number'], [fn], { 'number': 0 });
        expect(result).toEqual([fn]);
      });

      it('should throw for missing reference', () => {
        expect(() =>
          collectResolutions(['missing'], [], {})
        ).toThrow('No definition for referenced signature "missing"');
      });

      it('should return null for unresolved reference', () => {
        const ref = makeReferTo(['number'], () => (x: number) => x);
        const result = collectResolutions(['number'], [ref], { 'number': 0 });
        expect(result).toBeNull();
      });
    });

    describe('resolveReferences', () => {
      it('should resolve referToSelf', () => {
        const self = typed({ 'number': (n: number) => n });
        const ref = makeReferToSelf(() => (n: number) => n * 2);
        const result = resolveReferences([ref], {}, self);
        expect(typeof result[0]).toBe('function');
      });

      it('should resolve referTo', () => {
        const self = typed({ 'number': (n: number) => n });
        const fn = (n: number) => n;
        const ref = makeReferTo(['number'], (numFn: SignatureFunction) => (n: number) => numFn(n) * 2);
        const result = resolveReferences([fn, ref], { 'number': 0 }, self);
        expect(typeof result[1]).toBe('function');
      });

      it('should throw for circular reference', () => {
        const self = typed({ 'number': (n: number) => n });
        const ref1 = makeReferTo(['string'], () => (n: number) => n);
        const ref2 = makeReferTo(['number'], () => (s: string) => s);
        expect(() =>
          resolveReferences([ref1, ref2], { 'number': 0, 'string': 1 }, self)
        ).toThrow('Circular reference detected');
      });

      it('should preserve plain functions', () => {
        const self = typed({ 'number': (n: number) => n });
        const fn = (n: number) => n;
        const result = resolveReferences([fn], {}, self);
        expect(result[0]).toBe(fn);
      });
    });

    describe('validateDeprecatedThis', () => {
      it('should not throw for regular functions', () => {
        expect(() =>
          validateDeprecatedThis({ 'number': (n: number) => n })
        ).not.toThrow();
      });

      it('should throw for function using this()', () => {
        const fnWithThis = function(this: unknown, n: number) {
          return (this as Function)(n);
        };
        expect(() =>
          validateDeprecatedThis({ 'number': fnWithThis })
        ).toThrow('Using `this` to self-reference');
      });

      it('should throw for function using this.signatures', () => {
        const fnWithSigs = function(this: { signatures: unknown }) {
          return this.signatures;
        };
        expect(() =>
          validateDeprecatedThis({ 'number': fnWithSigs })
        ).toThrow('Using `this` to self-reference');
      });

      it('should skip undefined functions', () => {
        const sigs = { 'number': undefined } as unknown as Record<string, SignatureFunction>;
        expect(() => validateDeprecatedThis(sigs)).not.toThrow();
      });
    });
  });

  describe('Conversion Manager Branch Coverage', () => {
    it('should handle conversion with no matching types', () => {
      typed.addConversion({ from: 'string', to: 'number', convert: (s) => Number(s) });
      const result = typed.convert('42', 'number');
      expect(result).toBe(42);
    });

    it('should throw for conversion to unknown type', () => {
      expect(() => typed.convert('42', 'unknownType')).toThrow();
    });

    it('should handle value already of target type', () => {
      typed.addConversion({ from: 'string', to: 'number', convert: (s) => Number(s) });
      const result = typed.convert(42, 'number');
      expect(result).toBe(42);
    });
  });

  describe('Signature Parser Branch Coverage', () => {
    it('should handle complex union types', () => {
      const registry = createTypeRegistry();
      const params = parseSignature('number | string | boolean', registry);
      expect(params?.length).toBe(1);
      expect(params?.[0]?.types.length).toBe(3);
    });

    it('should handle multiple params with unions', () => {
      const registry = createTypeRegistry();
      const params = parseSignature('number | string, boolean | Array', registry);
      expect(params?.length).toBe(2);
    });
  });

  describe('Type Registry Branch Coverage', () => {
    it('should handle type test returning false', () => {
      // Add type before Object to give it higher priority
      typed.addType({ name: 'positive', test: (x) => typeof x === 'number' && (x as number) > 0 }, false);
      const fn = typed({
        'positive': (n: number) => n * 2,
        'number': (n: number) => n,
      });
      // Note: 'number' is a builtin type that comes before 'positive',
      // so 5 matches 'number' first, unless we order signatures carefully
      // In typed-function, signatures are sorted by specificity - exact matches first
      expect(fn(-5)).toBe(-5); // Only 'number' matches
    });
  });

  describe('Factory Branch Coverage', () => {
    it('should handle typed function with exact option', () => {
      const fn = typed({
        'number': (n: number) => n,
        'number, number': (a: number, b: number) => a + b,
      });

      const sig = typed.findSignature(fn, 'number', { exact: true });
      expect(sig).toBeDefined();
    });

    it('should handle addConversions with options', () => {
      typed.addConversions([
        { from: 'string', to: 'number', convert: (s) => Number(s) },
        { from: 'boolean', to: 'number', convert: (b) => (b ? 1 : 0) },
      ], { override: true });

      const fn = typed({ 'number': (n: number) => n * 2 });
      expect(fn('5')).toBe(10);
      expect(fn(true)).toBe(2);
    });

    it('should handle signature not found in findSignature', () => {
      const fn = typed({
        'number': (n: number) => n,
      });

      expect(() => typed.findSignature(fn, 'unknownType')).toThrow();
    });

    it('should handle exact signature matching', () => {
      const fn = typed({
        'number': (n: number) => n,
        'any': (x: unknown) => x,
      });

      const sig = typed.findSignature(fn, 'number', { exact: true });
      expect(sig).toBeDefined();
    });
  });

  describe('Integration Branch Coverage', () => {
    it('should handle all 6 fast-path slots', () => {
      const fn = typed({
        'number': (n: number) => 1,
        'string': (s: string) => 2,
        'boolean': (b: boolean) => 3,
        'Array': (a: unknown[]) => 4,
        'Date': (d: Date) => 5,
        'RegExp': (r: RegExp) => 6,
      });

      expect(fn(1)).toBe(1);
      expect(fn('a')).toBe(2);
      expect(fn(true)).toBe(3);
      expect(fn([])).toBe(4);
      expect(fn(new Date())).toBe(5);
      expect(fn(/test/)).toBe(6);
    });

    it('should fall back to generic path for 7+ signatures', () => {
      const fn = typed({
        'number': (n: number) => 1,
        'string': (s: string) => 2,
        'boolean': (b: boolean) => 3,
        'Array': (a: unknown[]) => 4,
        'Date': (d: Date) => 5,
        'RegExp': (r: RegExp) => 6,
        'Object': (o: object) => 7,
      });

      expect(fn({})).toBe(7);
    });

    it('should handle conversions in typed functions', () => {
      typed.addConversion({ from: 'string', to: 'number', convert: (s) => Number(s) });
      const fn = typed({
        'number': (n: number) => n * 2,
      });
      expect(fn('5')).toBe(10);
    });
  });
});
