/**
 * Sprint 3 Tests - Dispatcher & Fast Path
 *
 * Tests for typed function creation, dispatch, references, and public API.
 */

import { describe, it, expect } from 'vitest';
import typed, {
  create,
  isTypedFunction,
  createTypedFunction,
  isFastPathEligible,
  createFastPathDispatcher,
  createGenericDispatcher,
  isReferTo,
  isReferToSelf,
  makeReferTo,
  makeReferToSelf,
  clearResolutions,
  resolveReferences,
  checkName,
  mergeSignatures,
} from '../src/index.js';
import { createTypeRegistry, BUILTIN_TYPES } from '../src/core/type-registry.js';
import { createConversionManager } from '../src/core/conversion-manager.js';
import { parseSignature } from '../src/core/signature-parser.js';
import { compileTests } from '../src/core/signature-compiler.js';
import type { Signature, SignatureFunction, ReferTo, ReferToSelf, TypedFunction } from '../src/core/types.js';

describe('typed-function factory', () => {
  describe('create()', () => {
    it('should create a new typed instance', () => {
      const typed2 = create();
      expect(typed2).toBeDefined();
      expect(typeof typed2).toBe('function');
      expect(typeof typed2.create).toBe('function');
      expect(typeof typed2.addType).toBe('function');
    });

    it('should have isolated type registries', () => {
      const typed2 = create();
      typed2.addType({ name: 'CustomType', test: () => false });

      // Original should not have the custom type
      expect(() => typed._findType('CustomType')).toThrow();
    });
  });

  describe('typed() function', () => {
    it('should create a typed function with single signature', () => {
      const fn = typed('myFunc', {
        number: (x: number) => x * 2,
      });

      expect(typeof fn).toBe('function');
      expect(fn.name).toBe('myFunc');
      expect(fn(5)).toBe(10);
    });

    it('should create a typed function with multiple signatures', () => {
      const fn = typed('add', {
        'number,number': (a: number, b: number) => a + b,
        'string,string': (a: string, b: string) => a + b,
      });

      expect(fn(1, 2)).toBe(3);
      expect(fn('hello', ' world')).toBe('hello world');
    });

    it('should throw error for no matching signature', () => {
      const fn = typed('myFunc', {
        number: (x: number) => x,
      });

      expect(() => fn('string')).toThrow();
    });

    it('should infer name from object keys', () => {
      function namedAdd(a: number, b: number) {
        return a + b;
      }
      (namedAdd as SignatureFunction & { signature: string }).signature = 'number,number';

      const fn = typed(namedAdd as SignatureFunction & { signature: string });
      expect(fn.name).toBe('namedAdd');
    });

    it('should handle empty signature (no args)', () => {
      const fn = typed('noArgs', {
        '': () => 'called',
      });

      expect(fn()).toBe('called');
    });
  });
});

describe('Fast Path Dispatcher', () => {
  const registry = createTypeRegistry();

  function createMockSignature(paramTypes: string[][]): Signature {
    const params = paramTypes.map((types, i) => {
      const paramStr = types.join('|');
      const parsed = parseSignature(paramStr, registry);
      return parsed?.[0] || {
        types: [],
        name: paramStr,
        hasAny: false,
        hasConversion: false,
        restParam: false,
      };
    });

    return {
      params,
      fn: () => 'test',
      test: compileTests(params, registry),
      implementation: () => 'test',
    };
  }

  describe('isFastPathEligible()', () => {
    it('should return true for 0 params', () => {
      const sig = createMockSignature([]);
      expect(isFastPathEligible(sig)).toBe(true);
    });

    it('should return true for 1 param', () => {
      const sig = createMockSignature([['number']]);
      expect(isFastPathEligible(sig)).toBe(true);
    });

    it('should return true for 2 params', () => {
      const sig = createMockSignature([['number'], ['string']]);
      expect(isFastPathEligible(sig)).toBe(true);
    });

    it('should return true for 3 params', () => {
      const sig = createMockSignature([['number'], ['string'], ['boolean']]);
      expect(isFastPathEligible(sig)).toBe(true);
    });

    it('should return false for 4+ params', () => {
      const sig = createMockSignature([['number'], ['string'], ['boolean'], ['Array']]);
      expect(isFastPathEligible(sig)).toBe(false);
    });
  });

  describe('createFastPathDispatcher()', () => {
    it('should create dispatcher for empty signatures', () => {
      const fp = createFastPathDispatcher([]);
      expect(fp.slots.length).toBe(10);
      expect(fp.allActive).toBe(false);
    });

    it('should create active slots for eligible signatures', () => {
      const sig = createMockSignature([['number']]);
      const fp = createFastPathDispatcher([sig]);
      expect(fp.slots[0].active).toBe(true);
      expect(fp.slots[1].active).toBe(false);
    });
  });
});

describe('Generic Dispatcher', () => {
  const registry = createTypeRegistry();
  const conversions = createConversionManager(registry);

  it('should create generic dispatcher', () => {
    const signatures: Signature[] = [];
    const onMismatch = () => { throw new Error('No match'); };

    const dispatch = createGenericDispatcher('test', signatures, 0, onMismatch);
    expect(typeof dispatch).toBe('function');
  });
});

describe('Reference Resolver', () => {
  describe('isReferTo()', () => {
    it('should detect ReferTo objects', () => {
      const ref = makeReferTo(['number'], () => () => 1);
      expect(isReferTo(ref)).toBe(true);
    });

    it('should return false for functions', () => {
      expect(isReferTo(() => 1)).toBe(false);
    });
  });

  describe('isReferToSelf()', () => {
    it('should detect ReferToSelf objects', () => {
      const ref = makeReferToSelf(() => () => 1);
      expect(isReferToSelf(ref)).toBe(true);
    });

    it('should return false for functions', () => {
      expect(isReferToSelf(() => 1)).toBe(false);
    });
  });

  describe('clearResolutions()', () => {
    it('should clear prior resolutions from reference objects', () => {
      const ref1 = makeReferTo(['number'], () => () => 1);
      const ref2 = makeReferToSelf(() => () => 2);
      const fn = (() => 3) as SignatureFunction;

      const cleared = clearResolutions([ref1, ref2, fn]);
      expect(cleared.length).toBe(3);
      expect(isReferTo(cleared[0])).toBe(true);
      expect(isReferToSelf(cleared[1])).toBe(true);
      expect(typeof cleared[2]).toBe('function');
    });
  });
});

describe('Dispatcher Utilities', () => {
  describe('checkName()', () => {
    it('should return new name when no existing name', () => {
      expect(checkName(undefined, 'test')).toBe('test');
    });

    it('should return existing name when matching', () => {
      expect(checkName('test', 'test')).toBe('test');
    });

    it('should throw when names mismatch', () => {
      expect(() => checkName('foo', 'bar')).toThrow();
    });

    it('should return empty string for undefined both', () => {
      expect(checkName(undefined, undefined)).toBe('');
    });
  });

  describe('mergeSignatures()', () => {
    it('should merge signatures into dest', () => {
      const dest: Record<string, SignatureFunction> = { number: () => 1 };
      const source: Record<string, SignatureFunction> = { string: () => 'a' };

      mergeSignatures(dest, source);
      expect('number' in dest).toBe(true);
      expect('string' in dest).toBe(true);
    });

    it('should throw on duplicate different functions', () => {
      const dest: Record<string, SignatureFunction> = { number: () => 1 };
      const source: Record<string, SignatureFunction> = { number: () => 2 };

      expect(() => mergeSignatures(dest, source)).toThrow();
    });

    it('should allow same function in both', () => {
      const fn = () => 1;
      const dest: Record<string, SignatureFunction> = { number: fn };
      const source: Record<string, SignatureFunction> = { number: fn };

      expect(() => mergeSignatures(dest, source)).not.toThrow();
    });
  });
});

describe('Public API', () => {
  describe('isTypedFunction()', () => {
    it('should return true for typed functions', () => {
      const fn = typed({ number: (x: number) => x });
      expect(typed.isTypedFunction(fn)).toBe(true);
    });

    it('should return false for regular functions', () => {
      expect(typed.isTypedFunction(() => 1)).toBe(false);
    });

    it('should return false for non-functions', () => {
      expect(typed.isTypedFunction(42)).toBe(false);
      expect(typed.isTypedFunction(null)).toBe(false);
    });
  });

  describe('typed.find()', () => {
    it('should find implementation for signature', () => {
      const fn = typed({
        number: (x: number) => x * 2,
        string: (s: string) => s.toUpperCase(),
      });

      const numImpl = typed.find(fn, 'number');
      expect(numImpl(5)).toBe(10);
    });

    it('should throw for non-existent signature', () => {
      const fn = typed({ number: (x: number) => x });
      expect(() => typed.find(fn, 'string')).toThrow();
    });
  });

  describe('typed.findSignature()', () => {
    it('should find signature object', () => {
      const fn = typed({ number: (x: number) => x });
      const sig = typed.findSignature(fn, 'number');

      expect(sig).toBeDefined();
      expect(sig.params.length).toBe(1);
    });
  });

  describe('typed.resolve()', () => {
    it('should resolve matching signature for args', () => {
      const fn = typed({
        number: (x: number) => x,
        string: (s: string) => s,
      });

      const numSig = typed.resolve(fn, [42]);
      expect(numSig).not.toBeNull();

      const strSig = typed.resolve(fn, ['hello']);
      expect(strSig).not.toBeNull();
    });

    it('should return null for no match', () => {
      const fn = typed({ number: (x: number) => x });
      expect(typed.resolve(fn, [[]])).toBeNull();
    });
  });

  describe('typed.convert()', () => {
    it('should return value if already correct type', () => {
      expect(typed.convert(42, 'number')).toBe(42);
    });

    it('should convert using registered conversion', () => {
      const typed2 = create();
      typed2.addConversion({
        from: 'string',
        to: 'number',
        convert: (x: unknown) => Number(x),
      });

      expect(typed2.convert('42', 'number')).toBe(42);
    });
  });

  describe('typed.referTo()', () => {
    it('should create referTo reference', () => {
      const ref = typed.referTo('number', (numFn: SignatureFunction) => {
        return (x: unknown) => numFn(x);
      });

      expect(isReferTo(ref)).toBe(true);
    });
  });

  describe('typed.referToSelf()', () => {
    it('should create referToSelf reference', () => {
      const ref = typed.referToSelf((self: TypedFunction) => {
        return () => self;
      });

      expect(isReferToSelf(ref)).toBe(true);
    });
  });

  describe('typed.addConversion()', () => {
    it('should add conversion and use it', () => {
      const typed2 = create();
      typed2.addConversion({
        from: 'boolean',
        to: 'number',
        convert: (x: unknown) => (x ? 1 : 0),
      });

      const fn = typed2({
        number: (x: number) => x * 10,
      });

      expect(fn(true)).toBe(10);
      expect(fn(false)).toBe(0);
    });
  });

  describe('typed.addType()', () => {
    it('should add custom type', () => {
      const typed2 = create();
      typed2.addType({
        name: 'positive',
        test: (x: unknown) => typeof x === 'number' && x > 0,
      });

      // Create function with only positive type to ensure it works
      const fn = typed2({
        positive: (x: number) => `positive: ${x}`,
      });

      expect(fn(5)).toBe('positive: 5');
      expect(() => fn(-5)).toThrow(); // negative numbers don't match 'positive'
    });

    it('should allow custom types alongside built-in types', () => {
      const typed2 = create();
      typed2.addType({
        name: 'even',
        test: (x: unknown) => typeof x === 'number' && x % 2 === 0,
      });

      const fn = typed2({
        even: (x: number) => `even: ${x}`,
        string: (s: string) => `string: ${s}`,
      });

      expect(fn(4)).toBe('even: 4');
      expect(fn('hello')).toBe('string: hello');
    });
  });
});

describe('Module Exports', () => {
  it('should export all Sprint 3 functions', () => {
    // Factory
    expect(typeof create).toBe('function');
    expect(typeof typed).toBe('function');

    // Fast path
    expect(typeof isFastPathEligible).toBe('function');
    expect(typeof createFastPathDispatcher).toBe('function');

    // Generic path
    expect(typeof createGenericDispatcher).toBe('function');

    // Reference resolver
    expect(typeof isReferTo).toBe('function');
    expect(typeof isReferToSelf).toBe('function');
    expect(typeof makeReferTo).toBe('function');
    expect(typeof makeReferToSelf).toBe('function');
    expect(typeof clearResolutions).toBe('function');

    // Dispatcher
    expect(typeof createTypedFunction).toBe('function');
    expect(typeof checkName).toBe('function');
    expect(typeof mergeSignatures).toBe('function');

    // Public API on typed instance
    expect(typeof typed.create).toBe('function');
    expect(typeof typed.isTypedFunction).toBe('function');
    expect(typeof typed.find).toBe('function');
    expect(typeof typed.findSignature).toBe('function');
    expect(typeof typed.resolve).toBe('function');
    expect(typeof typed.convert).toBe('function');
    expect(typeof typed.referTo).toBe('function');
    expect(typeof typed.referToSelf).toBe('function');
    expect(typeof typed.addType).toBe('function');
    expect(typeof typed.addTypes).toBe('function');
    expect(typeof typed.addConversion).toBe('function');
    expect(typeof typed.addConversions).toBe('function');
    expect(typeof typed.clear).toBe('function');
  });
});
