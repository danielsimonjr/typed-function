/**
 * Fast-Path Dispatcher Tests
 *
 * Tests for the optimized fast-path dispatch system
 */

import { describe, it, expect } from 'vitest';
import {
  isFastPathEligible,
  createFastPathSlot,
  createInactiveSlot,
  createFastPathDispatcher,
  createDispatcher,
  compileSignatureTests,
} from '../src/dispatch/fast-path.js';
import type { Signature, Param, Type } from '../src/core/types.js';
import { createTypeRegistry } from '../src/core/type-registry.js';

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
function createMockParam(types: Type[], restParam = false): Param {
  return {
    types,
    name: types.map(t => t.name).join('|'),
    hasAny: types.some(t => t.isAny),
    hasConversion: false,
    restParam,
  };
}

// Helper to create a mock signature
function createMockSignature(params: Param[], fn?: (...args: unknown[]) => unknown): Signature {
  return {
    params,
    fn: fn || null,
    test: null,
    implementation: fn || null,
  };
}

describe('Fast-Path Dispatcher', () => {
  describe('isFastPathEligible', () => {
    it('should return true for signatures with 0 parameters', () => {
      const sig = createMockSignature([]);
      expect(isFastPathEligible(sig)).toBe(true);
    });

    it('should return true for signatures with 1 parameter', () => {
      const numType = createMockType('number', x => typeof x === 'number');
      const sig = createMockSignature([createMockParam([numType])]);
      expect(isFastPathEligible(sig)).toBe(true);
    });

    it('should return true for signatures with 2 parameters', () => {
      const numType = createMockType('number', x => typeof x === 'number');
      const sig = createMockSignature([
        createMockParam([numType]),
        createMockParam([numType]),
      ]);
      expect(isFastPathEligible(sig)).toBe(true);
    });

    it('should return true for signatures with 3 parameters', () => {
      const numType = createMockType('number', x => typeof x === 'number');
      const sig = createMockSignature([
        createMockParam([numType]),
        createMockParam([numType]),
        createMockParam([numType]),
      ]);
      expect(isFastPathEligible(sig)).toBe(true);
    });

    it('should return false for signatures with 4+ parameters', () => {
      const numType = createMockType('number', x => typeof x === 'number');
      const sig = createMockSignature([
        createMockParam([numType]),
        createMockParam([numType]),
        createMockParam([numType]),
        createMockParam([numType]),
      ]);
      expect(isFastPathEligible(sig)).toBe(false);
    });

    it('should return false for signatures with rest parameters', () => {
      const numType = createMockType('number', x => typeof x === 'number');
      const sig = createMockSignature([createMockParam([numType], true)]);
      expect(isFastPathEligible(sig)).toBe(false);
    });
  });

  describe('createFastPathSlot', () => {
    it('should create a slot with correct test functions', () => {
      const numType = createMockType('number', x => typeof x === 'number');
      const fn = (a: number) => a * 2;
      const sig = createMockSignature([createMockParam([numType])], fn);

      const slot = createFastPathSlot(sig);

      expect(slot.active).toBe(true);
      expect(slot.length).toBe(1);
      expect(slot.fn).toBe(fn);
      expect(slot.test0(42)).toBe(true);
      expect(slot.test0('string')).toBe(false);
      expect(slot.test1(undefined)).toBe(true); // ok() for missing param
    });

    it('should handle signatures with 0 parameters', () => {
      const fn = () => 'result';
      const sig = createMockSignature([], fn);

      const slot = createFastPathSlot(sig);

      expect(slot.length).toBe(0);
      expect(slot.test0(undefined)).toBe(true);
      expect(slot.test1(undefined)).toBe(true);
    });

    it('should handle union types in parameters', () => {
      const numType = createMockType('number', x => typeof x === 'number');
      const strType = createMockType('string', x => typeof x === 'string');
      const fn = (a: number | string) => String(a);
      const sig = createMockSignature([createMockParam([numType, strType])], fn);

      const slot = createFastPathSlot(sig);

      expect(slot.test0(42)).toBe(true);
      expect(slot.test0('hello')).toBe(true);
      expect(slot.test0(true)).toBe(false);
    });

    it('should handle any type parameters', () => {
      const anyType = createMockType('any', () => true);
      anyType.isAny = true;
      const fn = (a: unknown) => a;
      const sig = createMockSignature([createMockParam([anyType])], fn);

      const slot = createFastPathSlot(sig);

      expect(slot.test0(42)).toBe(true);
      expect(slot.test0('string')).toBe(true);
      expect(slot.test0(null)).toBe(true);
    });

    it('should work with TypeRegistry', () => {
      const registry = createTypeRegistry();

      const numType = createMockType('number', x => typeof x === 'number');
      numType.typeIndex = 0;
      const fn = (a: number) => a * 2;
      const sig = createMockSignature([createMockParam([numType])], fn);

      const slot = createFastPathSlot(sig, registry);

      expect(slot.active).toBe(true);
      expect(slot.test0(42)).toBe(true);
      expect(slot.test0('string')).toBe(false);
    });
  });

  describe('createInactiveSlot', () => {
    it('should create a slot that always fails tests', () => {
      const slot = createInactiveSlot();

      expect(slot.active).toBe(false);
      expect(slot.length).toBe(-1);
      expect(slot.test0(42)).toBe(false);
      expect(slot.test1(42)).toBe(false);
      expect(slot.fn()).toBe(undefined);
    });
  });

  describe('createFastPathDispatcher', () => {
    it('should create dispatcher with 10 slots', () => {
      const numType = createMockType('number', x => typeof x === 'number');
      const signatures = [
        createMockSignature([createMockParam([numType])], (a: number) => a),
        createMockSignature([createMockParam([numType]), createMockParam([numType])], (a: number, b: number) => a + b),
      ];

      const dispatcher = createFastPathDispatcher(signatures);

      expect(dispatcher.slots.length).toBe(10);
      expect(dispatcher.slots[0].active).toBe(true);
      expect(dispatcher.slots[1].active).toBe(true);
      expect(dispatcher.slots[2].active).toBe(false);
      expect(dispatcher.allActive).toBe(false);
      expect(dispatcher.genericStartIndex).toBe(0);
    });

    it('should set allActive true when all 10 slots are filled', () => {
      const numType = createMockType('number', x => typeof x === 'number');
      const fn = () => 'result';

      const signatures = Array(10).fill(null).map(() =>
        createMockSignature([createMockParam([numType])], fn)
      );

      const dispatcher = createFastPathDispatcher(signatures);

      expect(dispatcher.allActive).toBe(true);
      expect(dispatcher.genericStartIndex).toBe(10);
    });

    it('should handle empty signatures array', () => {
      const dispatcher = createFastPathDispatcher([]);

      expect(dispatcher.slots.length).toBe(10);
      expect(dispatcher.allActive).toBe(false);
      expect(dispatcher.genericStartIndex).toBe(0);
    });

    it('should accept signatures with 3 parameters', () => {
      const numType = createMockType('number', x => typeof x === 'number');
      const fn = () => 'result';
      const signatures = [
        createMockSignature([
          createMockParam([numType]),
          createMockParam([numType]),
          createMockParam([numType]),
        ], fn),
      ];

      const dispatcher = createFastPathDispatcher(signatures);

      expect(dispatcher.slots[0].active).toBe(true);
    });

    it('should skip signatures with 4+ parameters', () => {
      const numType = createMockType('number', x => typeof x === 'number');
      const fn = () => 'result';
      const signatures = [
        createMockSignature([
          createMockParam([numType]),
          createMockParam([numType]),
          createMockParam([numType]),
          createMockParam([numType]),
        ], fn),
      ];

      const dispatcher = createFastPathDispatcher(signatures);

      expect(dispatcher.slots[0].active).toBe(false);
    });

    it('should skip signatures without implementation', () => {
      const numType = createMockType('number', x => typeof x === 'number');
      const sig = createMockSignature([createMockParam([numType])]);
      sig.implementation = null;

      const dispatcher = createFastPathDispatcher([sig]);

      expect(dispatcher.slots[0].active).toBe(false);
    });
  });

  describe('createDispatcher', () => {
    it('should dispatch to correct signature based on argument types', () => {
      const numType = createMockType('number', x => typeof x === 'number');
      const strType = createMockType('string', x => typeof x === 'string');

      const signatures: Signature[] = [
        createMockSignature([createMockParam([numType])], (a: number) => `number:${a}`),
        createMockSignature([createMockParam([strType])], (a: string) => `string:${a}`),
      ];

      const genericDispatch = () => 'generic';
      const onMismatch = () => { throw new Error('mismatch'); };

      const dispatcher = createDispatcher('test', signatures, genericDispatch, onMismatch);

      expect(dispatcher(42)).toBe('number:42');
      expect(dispatcher('hello')).toBe('string:hello');
    });

    it('should dispatch based on argument count', () => {
      const numType = createMockType('number', x => typeof x === 'number');

      const signatures: Signature[] = [
        createMockSignature([], () => 'zero'),
        createMockSignature([createMockParam([numType])], (a: number) => `one:${a}`),
        createMockSignature([createMockParam([numType]), createMockParam([numType])], (a: number, b: number) => `two:${a},${b}`),
      ];

      const genericDispatch = () => 'generic';
      const onMismatch = () => { throw new Error('mismatch'); };

      const dispatcher = createDispatcher('test', signatures, genericDispatch, onMismatch);

      expect(dispatcher()).toBe('zero');
      expect(dispatcher(1)).toBe('one:1');
      expect(dispatcher(1, 2)).toBe('two:1,2');
    });

    it('should fall back to generic dispatch when no fast-path matches', () => {
      const numType = createMockType('number', x => typeof x === 'number');

      const signatures: Signature[] = [
        createMockSignature([createMockParam([numType])], (a: number) => `number:${a}`),
      ];

      const genericDispatch = () => 'generic fallback';
      const onMismatch = () => { throw new Error('mismatch'); };

      const dispatcher = createDispatcher('test', signatures, genericDispatch, onMismatch);

      // String doesn't match number, should fall back to generic
      expect(dispatcher('hello')).toBe('generic fallback');
    });

    it('should set function name', () => {
      const signatures: Signature[] = [];
      const genericDispatch = () => 'generic';
      const onMismatch = () => { throw new Error('mismatch'); };

      const dispatcher = createDispatcher('myFunction', signatures, genericDispatch, onMismatch);

      expect(dispatcher.name).toBe('myFunction');
    });

    it('should preserve this context', () => {
      const numType = createMockType('number', x => typeof x === 'number');

      const signatures: Signature[] = [
        createMockSignature([createMockParam([numType])], function(this: { value: number }, a: number) {
          return this.value + a;
        }),
      ];

      const genericDispatch = () => 'generic';
      const onMismatch = () => { throw new Error('mismatch'); };

      const dispatcher = createDispatcher('test', signatures, genericDispatch, onMismatch);

      const context = { value: 10 };
      expect(dispatcher.call(context, 5)).toBe(15);
    });

    it('should try all 6 slots before falling back', () => {
      const numType = createMockType('number', x => typeof x === 'number');
      const strType = createMockType('string', x => typeof x === 'string');
      const boolType = createMockType('boolean', x => typeof x === 'boolean');
      const arrType = createMockType('Array', x => Array.isArray(x));
      const dateType = createMockType('Date', x => x instanceof Date);
      const fnType = createMockType('Function', x => typeof x === 'function');

      const signatures: Signature[] = [
        createMockSignature([createMockParam([numType])], () => 'slot0'),
        createMockSignature([createMockParam([strType])], () => 'slot1'),
        createMockSignature([createMockParam([boolType])], () => 'slot2'),
        createMockSignature([createMockParam([arrType])], () => 'slot3'),
        createMockSignature([createMockParam([dateType])], () => 'slot4'),
        createMockSignature([createMockParam([fnType])], () => 'slot5'),
      ];

      const genericDispatch = () => 'generic';
      const onMismatch = () => { throw new Error('mismatch'); };

      const dispatcher = createDispatcher('test', signatures, genericDispatch, onMismatch);

      expect(dispatcher(42)).toBe('slot0');
      expect(dispatcher('hello')).toBe('slot1');
      expect(dispatcher(true)).toBe('slot2');
      expect(dispatcher([1, 2, 3])).toBe('slot3');
      expect(dispatcher(new Date())).toBe('slot4');
      expect(dispatcher(() => {})).toBe('slot5');
      expect(dispatcher(null)).toBe('generic');
    });
  });

  describe('compileSignatureTests', () => {
    it('should compile test functions for signatures', () => {
      const registry = createTypeRegistry();

      const numType = createMockType('number', x => typeof x === 'number');
      numType.typeIndex = 0;

      const signatures: Signature[] = [
        createMockSignature([createMockParam([numType])], (a: number) => a),
      ];

      expect(signatures[0].test).toBe(null);

      compileSignatureTests(signatures, registry);

      expect(signatures[0].test).not.toBe(null);
      expect(signatures[0].test!([42])).toBe(true);
      expect(signatures[0].test!(['string'])).toBe(false);
    });

    it('should not recompile already compiled tests', () => {
      const registry = createTypeRegistry();

      const existingTest = () => true;
      const signatures: Signature[] = [
        {
          params: [],
          fn: null,
          test: existingTest,
          implementation: null,
        },
      ];

      compileSignatureTests(signatures, registry);

      expect(signatures[0].test).toBe(existingTest);
    });
  });
});
