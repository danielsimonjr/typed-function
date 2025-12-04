/**
 * TypeScript type tests for typed-function
 *
 * These tests verify that TypeScript types are correctly defined and inferred.
 * They test compile-time type safety, not runtime behavior.
 */

import { describe, it, expect } from 'vitest';
import typed from '../src/index.js';
import type {
  TypedFunction,
  SignatureFunction,
  Signature,
  TypeDef,
  ConversionDef,
  Param,
  ReferTo,
  ReferToSelf,
} from '../src/core/types.js';

describe('TypeScript Types: Core Types', () => {
  describe('TypedFunction', () => {
    it('should have correct structure', () => {
      const fn: TypedFunction = typed({ number: (x: number) => x });

      // Should be callable
      expect(typeof fn).toBe('function');

      // Should have signatures property
      expect(fn.signatures).toBeDefined();
      expect(typeof fn.signatures).toBe('object');

      // Should have _typedFunctionData
      expect(fn._typedFunctionData).toBeDefined();
      expect(fn._typedFunctionData.signatures).toBeDefined();
      expect(fn._typedFunctionData.signatureMap).toBeDefined();
    });

    it('should be assignable from typed() result', () => {
      const fn1: TypedFunction = typed({ number: (x: number) => x });
      const fn2: TypedFunction = typed('named', { string: (s: string) => s });

      expect(fn1).toBeDefined();
      expect(fn2).toBeDefined();
    });
  });

  describe('SignatureFunction', () => {
    it('should accept any function', () => {
      const fn1: SignatureFunction = (x: number) => x;
      const fn2: SignatureFunction = () => {};
      const fn3: SignatureFunction = function(a: number, b: string) { return a + b.length; };

      expect(typeof fn1).toBe('function');
      expect(typeof fn2).toBe('function');
      expect(typeof fn3).toBe('function');
    });

    it('should be usable in signatures', () => {
      const numFn: SignatureFunction = (x: number) => x * 2;
      const strFn: SignatureFunction = (s: string) => s.length;

      const fn = typed({
        number: numFn,
        string: strFn,
      });

      expect(fn(5)).toBe(10);
      expect(fn('hello')).toBe(5);
    });
  });

  describe('Signature', () => {
    it('should have correct shape', () => {
      const fn = typed({ number: (x: number) => x });
      const sig = typed.findSignature(fn, 'number');

      // Verify Signature shape
      expect(Array.isArray(sig.params)).toBe(true);
      expect(sig.fn === null || typeof sig.fn === 'function').toBe(true);
      expect(sig.test === null || typeof sig.test === 'function').toBe(true);
      expect(sig.implementation === null || typeof sig.implementation === 'function').toBe(true);
    });
  });

  describe('Param', () => {
    it('should have correct shape via signature', () => {
      const fn = typed({ 'number, string': (a: number, b: string) => `${a}${b}` });
      const sig = typed.findSignature(fn, 'number, string');

      expect(sig.params.length).toBe(2);
      const param = sig.params[0] as Param;
      expect(Array.isArray(param.types)).toBe(true);
      expect(typeof param.restParam).toBe('boolean');
      expect(typeof param.hasAny).toBe('boolean');
    });
  });

  describe('TypeDef', () => {
    it('should require name and test', () => {
      const typeDef: TypeDef = {
        name: 'positive',
        test: (x: unknown) => typeof x === 'number' && x > 0,
      };

      expect(typeDef.name).toBe('positive');
      expect(typeof typeDef.test).toBe('function');
    });

    it('should be usable with addType', () => {
      const typed2 = typed.create();

      const customType: TypeDef = {
        name: 'Custom',
        test: (x: unknown) => x !== null && typeof x === 'object' && 'custom' in x,
      };

      typed2.addTypes([customType], 'Object');

      const fn = typed2({ Custom: () => 'custom' });
      expect(fn({ custom: true })).toBe('custom');
    });
  });

  describe('ConversionDef', () => {
    it('should require from, to, and convert', () => {
      const convDef: ConversionDef = {
        from: 'string',
        to: 'number',
        convert: (s: string) => parseFloat(s),
      };

      expect(convDef.from).toBe('string');
      expect(convDef.to).toBe('number');
      expect(typeof convDef.convert).toBe('function');
    });

    it('should be usable with addConversion', () => {
      const typed2 = typed.create();

      const conv: ConversionDef = {
        from: 'string',
        to: 'number',
        convert: (s: string) => parseFloat(s),
      };

      typed2.addConversion(conv);

      const fn = typed2({ number: (x: number) => x * 2 });
      expect(fn('5')).toBe(10);
    });
  });
});

describe('TypeScript Types: API Return Types', () => {
  describe('typed.create()', () => {
    it('should return TypedInstance', () => {
      const typed2 = typed.create();

      // Should have all the same methods
      expect(typeof typed2).toBe('function');
      expect(typeof typed2.create).toBe('function');
      expect(typeof typed2.addType).toBe('function');
      expect(typeof typed2.addTypes).toBe('function');
      expect(typeof typed2.addConversion).toBe('function');
      expect(typeof typed2.addConversions).toBe('function');
      expect(typeof typed2.removeConversion).toBe('function');
      expect(typeof typed2.clear).toBe('function');
      expect(typeof typed2.clearConversions).toBe('function');
      expect(typeof typed2.referTo).toBe('function');
      expect(typeof typed2.referToSelf).toBe('function');
      expect(typeof typed2.find).toBe('function');
      expect(typeof typed2.findSignature).toBe('function');
      expect(typeof typed2.resolve).toBe('function');
      expect(typeof typed2.convert).toBe('function');
      expect(typeof typed2.isTypedFunction).toBe('function');
      expect(typeof typed2.createError).toBe('function');
      expect(typeof typed2.onMismatch).toBe('function');
      expect(typeof typed2.throwMismatchError).toBe('function');
      expect(typeof typed2.createCount).toBe('number');
      expect(typeof typed2.warnAgainstDeprecatedThis).toBe('boolean');
    });
  });

  describe('typed.find()', () => {
    it('should return SignatureFunction', () => {
      const fn = typed({ number: (x: number) => x * 2 });
      const impl: SignatureFunction = typed.find(fn, 'number');

      expect(typeof impl).toBe('function');
      expect(impl(5)).toBe(10);
    });
  });

  describe('typed.findSignature()', () => {
    it('should return Signature', () => {
      const fn = typed({ number: (x: number) => x });
      const sig: Signature = typed.findSignature(fn, 'number');

      expect(sig.params).toBeDefined();
      expect(sig.fn).toBeDefined();
    });
  });

  describe('typed.resolve()', () => {
    it('should return Signature | null', () => {
      const fn = typed({ number: (x: number) => x });

      const found: Signature | null = typed.resolve(fn, [42]);
      expect(found).not.toBeNull();

      const notFound: Signature | null = typed.resolve(fn, ['string']);
      expect(notFound).toBeNull();
    });
  });

  describe('typed.referTo()', () => {
    it('should return ReferTo', () => {
      const ref: ReferTo = typed.referTo('number', (numFn) => {
        return (s: string) => numFn(parseInt(s, 10));
      });

      expect(ref).toBeDefined();
      expect(typeof ref).toBe('object');
    });
  });

  describe('typed.referToSelf()', () => {
    it('should return ReferToSelf', () => {
      const ref: ReferToSelf = typed.referToSelf((self) => {
        return (s: string) => self(parseInt(s, 10));
      });

      expect(ref).toBeDefined();
      expect(typeof ref).toBe('object');
    });
  });

  describe('typed.isTypedFunction()', () => {
    it('should be a type guard', () => {
      const fn = typed({ number: (x: number) => x });
      const regularFn = (x: number) => x;

      // typed.isTypedFunction should act as a type guard
      if (typed.isTypedFunction(fn)) {
        // Inside this block, fn is TypedFunction
        expect(fn.signatures).toBeDefined();
      }

      expect(typed.isTypedFunction(regularFn)).toBe(false);
    });
  });

  describe('typed.createError()', () => {
    it('should return TypeError', () => {
      const fn = typed({ number: (x: number) => x });
      const sig = typed.findSignature(fn, 'number');

      const err = typed.createError('test', ['bad'], [sig]);

      expect(err).toBeInstanceOf(TypeError);
    });
  });
});

describe('TypeScript Types: Function Signatures', () => {
  it('should accept various signature formats', () => {
    // Object with signature strings
    const fn1 = typed({
      number: (x: number) => x,
      string: (s: string) => s,
      'number, string': (a: number, b: string) => `${a}${b}`,
    });

    // Named function with different signature
    const fn2 = typed('myFn', {
      boolean: (b: boolean) => b,
    });

    // Merged functions (no signature conflicts)
    const fn3 = typed(fn1, fn2);

    expect(fn1).toBeDefined();
    expect(fn2).toBeDefined();
    expect(fn3).toBeDefined();
  });

  it('should accept ReferTo and ReferToSelf in signatures', () => {
    const fn = typed({
      number: (x: number) => x * 2,
      string: typed.referTo('number', (numFn) => {
        return (s: string) => numFn(parseInt(s, 10));
      }),
      boolean: typed.referToSelf((self) => {
        return (b: boolean) => self(b ? 1 : 0);
      }),
    });

    expect(fn(5)).toBe(10);
    expect(fn('5')).toBe(10);
    expect(fn(true)).toBe(2);
    expect(fn(false)).toBe(0);
  });
});

describe('TypeScript Types: Configuration Options', () => {
  describe('onMismatch', () => {
    it('should accept MismatchHandler type', () => {
      const typed2 = typed.create();

      // Assign custom handler
      typed2.onMismatch = (name, args, signatures) => {
        // Handler receives correct types
        expect(typeof name).toBe('string');
        expect(args).toBeDefined();
        expect(Array.isArray(signatures)).toBe(true);
        return 'handled';
      };

      const fn = typed2({ number: (x: number) => x });
      expect(fn('bad')).toBe('handled');
    });
  });

  describe('warnAgainstDeprecatedThis', () => {
    it('should be assignable as boolean', () => {
      const typed2 = typed.create();

      typed2.warnAgainstDeprecatedThis = false;
      expect(typed2.warnAgainstDeprecatedThis).toBe(false);

      typed2.warnAgainstDeprecatedThis = true;
      expect(typed2.warnAgainstDeprecatedThis).toBe(true);
    });
  });
});

describe('TypeScript Types: Generic Type Safety', () => {
  it('should work with generic wrapper functions', () => {
    function createTypedAdder<T>(convert: (x: unknown) => T, add: (a: T, b: T) => T) {
      const typed2 = typed.create();
      return typed2({
        'any, any': (a: unknown, b: unknown) => add(convert(a), convert(b)),
      });
    }

    const numberAdder = createTypedAdder(
      (x) => Number(x),
      (a, b) => a + b
    );

    expect(numberAdder(1, 2)).toBe(3);
    expect(numberAdder('1', '2')).toBe(3);
  });

  it('should support typed function factories', () => {
    interface TypedMathOps {
      add: TypedFunction;
      subtract: TypedFunction;
      multiply: TypedFunction;
    }

    function createMathOps(): TypedMathOps {
      return {
        add: typed({
          'number, number': (a: number, b: number) => a + b,
        }),
        subtract: typed({
          'number, number': (a: number, b: number) => a - b,
        }),
        multiply: typed({
          'number, number': (a: number, b: number) => a * b,
        }),
      };
    }

    const ops = createMathOps();

    expect(ops.add(1, 2)).toBe(3);
    expect(ops.subtract(5, 3)).toBe(2);
    expect(ops.multiply(4, 5)).toBe(20);
  });
});

describe('TypeScript Types: Module Exports', () => {
  it('should export all expected types', () => {
    // These are compile-time checks - if they compile, types are exported
    const _typedFn: TypedFunction = typed({ number: (x: number) => x });
    const _sigFn: SignatureFunction = (x: number) => x;
    const _typeDef: TypeDef = { name: 'test', test: () => true };
    const _convDef: ConversionDef = { from: 'a', to: 'b', convert: (x: unknown) => x };

    expect(true).toBe(true);
  });

  it('should export typed as default with all methods', () => {
    // Verify default export has all expected properties
    const exportedMethods = [
      'create',
      'addType',
      'addTypes',
      'addConversion',
      'addConversions',
      'removeConversion',
      'clear',
      'clearConversions',
      'referTo',
      'referToSelf',
      'find',
      'findSignature',
      'resolve',
      'convert',
      'isTypedFunction',
      'createError',
      'onMismatch',
      'throwMismatchError',
    ];

    for (const method of exportedMethods) {
      expect(method in typed).toBe(true);
    }
  });
});

describe('TypeScript Types: Inference', () => {
  it('should infer signatures property type', () => {
    const fn = typed({
      number: (x: number) => x * 2,
      string: (s: string) => s.length,
    });

    // signatures should be Record<string, SignatureFunction>
    const sigs = fn.signatures;

    expect(typeof sigs).toBe('object');
    expect(typeof sigs['number']).toBe('function');
    expect(typeof sigs['string']).toBe('function');
  });

  it('should infer _typedFunctionData type', () => {
    const fn = typed({ number: (x: number) => x });

    // _typedFunctionData should have signatures and signatureMap
    const data = fn._typedFunctionData;

    expect(Array.isArray(data.signatures)).toBe(true);
    expect(data.signatureMap instanceof Map).toBe(true);
  });
});
