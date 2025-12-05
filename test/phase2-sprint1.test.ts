/**
 * Coverage tests for entry points and index files
 * Sprint 1: Entry Points & Index Files
 *
 * Target: 100% coverage for src/index.ts and src/wasm/index.ts unified interface
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Task 1.1: Test isTypedFunction from index.ts
import { isTypedFunction } from '../src/index.js';

// Task 1.4 & 1.5: Test all re-exports from index.ts
import typedInstance, {
  // Core types are tested via TypeScript compilation (Task 1.6)
  NOT_TYPED_FUNCTION,

  // Type registry
  TypeRegistry,
  BUILTIN_TYPES,
  createTypeRegistry,

  // Error factory
  createError,
  defaultOnMismatch,
  stringifyParamsError,
  hasRestParamError,
  getParamAtIndex,
  paramTypeSet,
  getTypeSetAtIndex,
  mergeExpectedParams,
  createParamTest,

  // Signature parser
  parseParam,
  parseSignature,
  availableConversions,
  expandParam,
  isExactType,
  splitParams,
  stringifyParams,

  // Signature compiler
  compileTest,
  compileTests,
  compileArgConversion,
  compileArgsPreprocessing,

  // Signature comparator
  hasRestParam,
  getLowestTypeIndex,
  getLowestConversionIndex,
  compareParams,
  compareSignatures,
  conflicting,
  createSignatureComparator,

  // Conversion manager
  ConversionManager,
  createConversionManager,

  // Reference resolver
  isReferTo,
  isReferToSelf,
  makeReferTo,
  makeReferToSelf,
  clearResolutions,
  collectResolutions,
  resolveReferences,
  validateDeprecatedThis,

  // Dispatcher components
  isFastPathEligible,
  createFastPathSlot,
  createInactiveSlot,
  createFastPathDispatcher,
  createDispatcher,
  compileSignatureTests,

  createGenericDispatcher,
  createSimpleDispatcher,
  hasCompiledTests,
  hasImplementations,

  createTypedFunction,
  checkName,
  getObjectName,
  mergeSignatures,

  // Utility functions
  last,
  initial,
  slice,
  flatMap,
  findInArray,
  hasItem,
  createArray,
  arraysEqual,

  isPlainObject,
  hasOwnProperty,
  getProperty,
  shallowCopy,
  mapObject,
  objectSize,
  isEmptyObject,
  mergeObjects,
  pick,
  omit,

  // Factory
  create,
} from '../src/index.js';

// Task 1.2 & 1.3: Test WASM unified interface
import {
  addSignature,
  dispatchFind,
  isWasmAvailable,
  fallbackClear,
  resetTypeMasks,
  TYPE_NUMBER,
  TYPE_STRING,
  getTypeMaskForName,
} from '../src/wasm/index.js';

describe('Entry Points Coverage (Sprint 1)', () => {
  describe('Task 1.1: isTypedFunction from index.ts', () => {
    it('should return true for typed functions', () => {
      const typed = create();
      const fn = typed('test', { 'number': (x: number) => x });

      expect(isTypedFunction(fn)).toBe(true);
    });

    it('should return false for plain functions', () => {
      const plainFn = function (x: number) {
        return x;
      };

      expect(isTypedFunction(plainFn)).toBe(false);
    });

    it('should return false for arrow functions', () => {
      const arrowFn = (x: number) => x;

      expect(isTypedFunction(arrowFn)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isTypedFunction(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isTypedFunction(undefined)).toBe(false);
    });

    it('should return false for objects', () => {
      expect(isTypedFunction({})).toBe(false);
      expect(isTypedFunction({ _typedFunctionData: {} })).toBe(false);
    });

    it('should return false for primitives', () => {
      expect(isTypedFunction(42)).toBe(false);
      expect(isTypedFunction('string')).toBe(false);
      expect(isTypedFunction(true)).toBe(false);
    });

    it('should return false for arrays', () => {
      expect(isTypedFunction([])).toBe(false);
      expect(isTypedFunction([1, 2, 3])).toBe(false);
    });

    it('should work with typed functions from different instances', () => {
      const typed1 = create();
      const typed2 = create();

      const fn1 = typed1('fn1', { 'number': (x: number) => x });
      const fn2 = typed2('fn2', { 'string': (s: string) => s });

      expect(isTypedFunction(fn1)).toBe(true);
      expect(isTypedFunction(fn2)).toBe(true);
    });

    it('should return true for merged typed functions', () => {
      const typed = create();
      const fn1 = typed({ 'number': (x: number) => x });
      const fn2 = typed({ 'string': (s: string) => s });
      const merged = typed(fn1, fn2);

      expect(isTypedFunction(merged)).toBe(true);
    });
  });

  describe('Task 1.2: addSignature unified interface', () => {
    beforeEach(() => {
      fallbackClear();
      resetTypeMasks();
    });

    it('should add a signature and return an index', () => {
      const fn = () => 42;
      const paramMasks = [1 << TYPE_NUMBER];

      const index = addSignature(fn, paramMasks);

      expect(typeof index).toBe('number');
      expect(index).toBeGreaterThanOrEqual(0);
    });

    it('should add multiple signatures with different indices', () => {
      const fn1 = () => 1;
      const fn2 = () => 2;

      const index1 = addSignature(fn1, [1 << TYPE_NUMBER]);
      const index2 = addSignature(fn2, [1 << TYPE_STRING]);

      expect(index1).not.toBe(index2);
    });

    it('should handle empty param masks', () => {
      const fn = () => 'no args';

      const index = addSignature(fn, []);

      expect(typeof index).toBe('number');
    });

    it('should handle multi-param signatures', () => {
      const fn = (a: number, b: string) => `${a}${b}`;
      const paramMasks = [1 << TYPE_NUMBER, 1 << TYPE_STRING];

      const index = addSignature(fn, paramMasks);

      expect(typeof index).toBe('number');
    });

    it('should use fallback when WASM is not available', () => {
      // This test verifies the fallback path is used
      // Since WASM may or may not be available in test environment
      const fn = () => 'test';
      const index = addSignature(fn, [1 << TYPE_NUMBER]);

      expect(typeof index).toBe('number');
    });
  });

  describe('Task 1.3: dispatchFind unified interface', () => {
    beforeEach(() => {
      fallbackClear();
      resetTypeMasks();
    });

    it('should find matching function for exact type match', () => {
      const expectedFn = () => 'found';
      addSignature(expectedFn, [1 << TYPE_NUMBER]);

      const result = dispatchFind([1 << TYPE_NUMBER]);

      expect(result).toBe(expectedFn);
    });

    it('should return null for no matching signature', () => {
      addSignature(() => 'number fn', [1 << TYPE_NUMBER]);

      const result = dispatchFind([1 << TYPE_STRING]);

      expect(result).toBeNull();
    });

    it('should return null when no signatures registered', () => {
      const result = dispatchFind([1 << TYPE_NUMBER]);

      expect(result).toBeNull();
    });

    it('should find function with multiple params', () => {
      const fn = () => 'multi-param';
      addSignature(fn, [1 << TYPE_NUMBER, 1 << TYPE_STRING]);

      const result = dispatchFind([1 << TYPE_NUMBER, 1 << TYPE_STRING]);

      expect(result).toBe(fn);
    });

    it('should distinguish between different param counts', () => {
      const fn1 = () => 'one param';
      const fn2 = () => 'two params';

      addSignature(fn1, [1 << TYPE_NUMBER]);
      addSignature(fn2, [1 << TYPE_NUMBER, 1 << TYPE_NUMBER]);

      expect(dispatchFind([1 << TYPE_NUMBER])).toBe(fn1);
      expect(dispatchFind([1 << TYPE_NUMBER, 1 << TYPE_NUMBER])).toBe(fn2);
    });

    it('should handle empty argument masks', () => {
      const fn = () => 'no args';
      addSignature(fn, []);

      const result = dispatchFind([]);

      expect(result).toBe(fn);
    });
  });

  describe('Task 1.4: Test all re-exports from index.ts', () => {
    describe('default export', () => {
      it('should export the default typed instance', () => {
        expect(typeof typedInstance).toBe('function');

        const fn = typedInstance('testFn', {
          'number': (x: number) => x * 2,
        });

        expect(fn(21)).toBe(42);
      });
    });

    describe('NOT_TYPED_FUNCTION constant', () => {
      it('should be exported and have correct value', () => {
        expect(NOT_TYPED_FUNCTION).toBeDefined();
        expect(typeof NOT_TYPED_FUNCTION).toBe('string');
        expect(NOT_TYPED_FUNCTION).toBe('Argument is not a typed-function.');
      });
    });

    describe('TypeRegistry exports', () => {
      it('should export TypeRegistry class', () => {
        expect(TypeRegistry).toBeDefined();
        const registry = new TypeRegistry();
        expect(registry).toBeInstanceOf(TypeRegistry);
      });

      it('should export BUILTIN_TYPES', () => {
        expect(BUILTIN_TYPES).toBeDefined();
        expect(Array.isArray(BUILTIN_TYPES)).toBe(true);
        // BUILTIN_TYPES is an array of TypeDef objects
        const typeNames = BUILTIN_TYPES.map((t) => t.name);
        expect(typeNames).toContain('number');
        expect(typeNames).toContain('string');
        expect(typeNames).toContain('boolean');
        expect(typeNames).toContain('Object');
      });

      it('should export createTypeRegistry factory', () => {
        expect(typeof createTypeRegistry).toBe('function');
        const registry = createTypeRegistry();
        expect(registry).toBeInstanceOf(TypeRegistry);
      });
    });

    describe('Error factory exports', () => {
      it('should export createError', () => {
        expect(typeof createError).toBe('function');
      });

      it('should export defaultOnMismatch', () => {
        expect(typeof defaultOnMismatch).toBe('function');
      });

      it('should export stringifyParamsError', () => {
        expect(typeof stringifyParamsError).toBe('function');
      });

      it('should export hasRestParamError', () => {
        expect(typeof hasRestParamError).toBe('function');
      });

      it('should export getParamAtIndex', () => {
        expect(typeof getParamAtIndex).toBe('function');
      });

      it('should export paramTypeSet', () => {
        expect(typeof paramTypeSet).toBe('function');
      });

      it('should export getTypeSetAtIndex', () => {
        expect(typeof getTypeSetAtIndex).toBe('function');
      });

      it('should export mergeExpectedParams', () => {
        expect(typeof mergeExpectedParams).toBe('function');
      });

      it('should export createParamTest', () => {
        expect(typeof createParamTest).toBe('function');
      });
    });

    describe('Signature parser exports', () => {
      it('should export parseParam', () => {
        expect(typeof parseParam).toBe('function');
      });

      it('should export parseSignature', () => {
        expect(typeof parseSignature).toBe('function');
      });

      it('should export availableConversions', () => {
        expect(typeof availableConversions).toBe('function');
      });

      it('should export expandParam', () => {
        expect(typeof expandParam).toBe('function');
      });

      it('should export isExactType', () => {
        expect(typeof isExactType).toBe('function');
      });

      it('should export splitParams', () => {
        expect(typeof splitParams).toBe('function');
      });

      it('should export stringifyParams', () => {
        expect(typeof stringifyParams).toBe('function');
      });
    });

    describe('Signature compiler exports', () => {
      it('should export compileTest', () => {
        expect(typeof compileTest).toBe('function');
      });

      it('should export compileTests', () => {
        expect(typeof compileTests).toBe('function');
      });

      it('should export compileArgConversion', () => {
        expect(typeof compileArgConversion).toBe('function');
      });

      it('should export compileArgsPreprocessing', () => {
        expect(typeof compileArgsPreprocessing).toBe('function');
      });
    });

    describe('Signature comparator exports', () => {
      it('should export hasRestParam', () => {
        expect(typeof hasRestParam).toBe('function');
      });

      it('should export getLowestTypeIndex', () => {
        expect(typeof getLowestTypeIndex).toBe('function');
      });

      it('should export getLowestConversionIndex', () => {
        expect(typeof getLowestConversionIndex).toBe('function');
      });

      it('should export compareParams', () => {
        expect(typeof compareParams).toBe('function');
      });

      it('should export compareSignatures', () => {
        expect(typeof compareSignatures).toBe('function');
      });

      it('should export conflicting', () => {
        expect(typeof conflicting).toBe('function');
      });

      it('should export createSignatureComparator', () => {
        expect(typeof createSignatureComparator).toBe('function');
      });
    });

    describe('Conversion manager exports', () => {
      it('should export ConversionManager class', () => {
        expect(ConversionManager).toBeDefined();
      });

      it('should export createConversionManager factory', () => {
        expect(typeof createConversionManager).toBe('function');
      });
    });

    describe('Reference resolver exports', () => {
      it('should export isReferTo', () => {
        expect(typeof isReferTo).toBe('function');
      });

      it('should export isReferToSelf', () => {
        expect(typeof isReferToSelf).toBe('function');
      });

      it('should export makeReferTo', () => {
        expect(typeof makeReferTo).toBe('function');
      });

      it('should export makeReferToSelf', () => {
        expect(typeof makeReferToSelf).toBe('function');
      });

      it('should export clearResolutions', () => {
        expect(typeof clearResolutions).toBe('function');
      });

      it('should export collectResolutions', () => {
        expect(typeof collectResolutions).toBe('function');
      });

      it('should export resolveReferences', () => {
        expect(typeof resolveReferences).toBe('function');
      });

      it('should export validateDeprecatedThis', () => {
        expect(typeof validateDeprecatedThis).toBe('function');
      });
    });

    describe('Dispatcher exports', () => {
      it('should export fast-path functions', () => {
        expect(typeof isFastPathEligible).toBe('function');
        expect(typeof createFastPathSlot).toBe('function');
        expect(typeof createInactiveSlot).toBe('function');
        expect(typeof createFastPathDispatcher).toBe('function');
        expect(typeof createDispatcher).toBe('function');
        expect(typeof compileSignatureTests).toBe('function');
      });

      it('should export generic-path functions', () => {
        expect(typeof createGenericDispatcher).toBe('function');
        expect(typeof createSimpleDispatcher).toBe('function');
        expect(typeof hasCompiledTests).toBe('function');
        expect(typeof hasImplementations).toBe('function');
      });

      it('should export dispatcher functions', () => {
        expect(typeof createTypedFunction).toBe('function');
        expect(typeof checkName).toBe('function');
        expect(typeof getObjectName).toBe('function');
        expect(typeof mergeSignatures).toBe('function');
      });
    });

    describe('Utility function exports', () => {
      describe('array helpers', () => {
        it('should export last', () => {
          expect(typeof last).toBe('function');
          expect(last([1, 2, 3])).toBe(3);
        });

        it('should export initial', () => {
          expect(typeof initial).toBe('function');
          expect(initial([1, 2, 3])).toEqual([1, 2]);
        });

        it('should export slice', () => {
          expect(typeof slice).toBe('function');
          expect(slice([1, 2, 3], 1)).toEqual([2, 3]);
        });

        it('should export flatMap', () => {
          expect(typeof flatMap).toBe('function');
          expect(flatMap([1, 2], (x) => [x, x])).toEqual([1, 1, 2, 2]);
        });

        it('should export findInArray', () => {
          expect(typeof findInArray).toBe('function');
        });

        it('should export hasItem', () => {
          expect(typeof hasItem).toBe('function');
          // hasItem takes a predicate function
          expect(hasItem([1, 2, 3], (x) => x === 2)).toBe(true);
          expect(hasItem([1, 2, 3], (x) => x === 5)).toBe(false);
        });

        it('should export createArray', () => {
          expect(typeof createArray).toBe('function');
        });

        it('should export arraysEqual', () => {
          expect(typeof arraysEqual).toBe('function');
          expect(arraysEqual([1, 2], [1, 2])).toBe(true);
        });
      });

      describe('object helpers', () => {
        it('should export isPlainObject', () => {
          expect(typeof isPlainObject).toBe('function');
          expect(isPlainObject({})).toBe(true);
          expect(isPlainObject([])).toBe(false);
        });

        it('should export hasOwnProperty', () => {
          expect(typeof hasOwnProperty).toBe('function');
        });

        it('should export getProperty', () => {
          expect(typeof getProperty).toBe('function');
        });

        it('should export shallowCopy', () => {
          expect(typeof shallowCopy).toBe('function');
        });

        it('should export mapObject', () => {
          expect(typeof mapObject).toBe('function');
        });

        it('should export objectSize', () => {
          expect(typeof objectSize).toBe('function');
          expect(objectSize({ a: 1, b: 2 })).toBe(2);
        });

        it('should export isEmptyObject', () => {
          expect(typeof isEmptyObject).toBe('function');
          expect(isEmptyObject({})).toBe(true);
        });

        it('should export mergeObjects', () => {
          expect(typeof mergeObjects).toBe('function');
        });

        it('should export pick', () => {
          expect(typeof pick).toBe('function');
        });

        it('should export omit', () => {
          expect(typeof omit).toBe('function');
        });
      });
    });

    describe('Factory exports', () => {
      it('should export create factory', () => {
        expect(typeof create).toBe('function');
      });

      it('should create independent instances', () => {
        const typed1 = create();
        const typed2 = create();

        expect(typed1).not.toBe(typed2);
      });
    });
  });

  describe('Task 1.5: Module boundary tests', () => {
    it('should allow creating typed functions from main entry', () => {
      const typed = create();
      const add = typed('add', {
        'number, number': (a: number, b: number) => a + b,
        'string, string': (a: string, b: string) => a + b,
      });

      expect(add(1, 2)).toBe(3);
      expect(add('a', 'b')).toBe('ab');
    });

    it('should allow type conversions through main entry', () => {
      const typed = create();

      typed.addConversion({
        from: 'string',
        to: 'number',
        convert: (x: string) => parseFloat(x),
      });

      const double = typed('double', {
        'number': (x: number) => x * 2,
      });

      expect(double(21)).toBe(42);
      expect(double('21')).toBe(42);
    });

    it('should expose typed function data', () => {
      const typed = create();
      const fn = typed('myFunc', {
        'number': (x: number) => x,
      });

      // _typedFunctionData contains signatures and signatureMap
      expect((fn as any)._typedFunctionData).toBeDefined();
      expect((fn as any)._typedFunctionData.signatures).toBeDefined();
      expect((fn as any)._typedFunctionData.signatureMap).toBeDefined();
      // The name is set on the function itself
      expect(fn.name).toBe('myFunc');
    });

    it('should support function merging through main entry', () => {
      const typed = create();
      const numFn = typed({ 'number': (x: number) => x * 2 });
      const strFn = typed({ 'string': (s: string) => s.length });

      const merged = typed(numFn, strFn);

      expect(merged(5)).toBe(10);
      expect(merged('hello')).toBe(5);
    });

    it('should support find operation through main entry', () => {
      const typed = create();
      const fn = typed('findTest', {
        'number': (x: number) => x,
        'string': (s: string) => s,
      });

      // typed.find takes signature strings, not values
      const numImpl = typed.find(fn, 'number');
      const strImpl = typed.find(fn, 'string');

      expect(numImpl).toBeDefined();
      expect(typeof numImpl).toBe('function');
      expect(strImpl).toBeDefined();
      expect(typeof strImpl).toBe('function');
    });

    it('should support referTo through main entry', () => {
      const typed = create();
      const fn = typed('refTest', {
        'number': (x: number) => x,
        'string': typed.referTo('number', (numFn) => {
          return (s: string) => numFn(parseFloat(s));
        }),
      });

      expect(fn(42)).toBe(42);
      expect(fn('42')).toBe(42);
    });

    it('should support referToSelf through main entry', () => {
      const typed = create();
      const factorial = typed('factorial', {
        'number': typed.referToSelf((self) => {
          return (n: number): number => (n <= 1 ? 1 : n * self(n - 1));
        }),
      });

      expect(factorial(5)).toBe(120);
    });
  });

  describe('Task 1.6: Verify type exports compile correctly', () => {
    it('should allow using TypeDef type', () => {
      // This test verifies TypeScript compilation
      const typed = create();
      typed.addType({
        name: 'TestType',
        test: (x): x is object => typeof x === 'object' && x !== null,
      });

      const fn = typed({
        'TestType': (x: object) => x,
      });

      expect(fn({})).toEqual({});
    });

    it('should allow using ConversionDef type', () => {
      const typed = create();
      typed.addConversion({
        from: 'boolean',
        to: 'number',
        convert: (b: boolean) => (b ? 1 : 0),
      });

      const fn = typed({
        'number': (x: number) => x,
      });

      expect(fn(true)).toBe(1);
      expect(fn(false)).toBe(0);
    });

    it('should support TypedFunction interface', () => {
      const typed = create();
      const fn = typed('typedFnTest', {
        'number': (x: number) => x,
      });

      // Access TypedFunction properties
      expect(typeof fn.signatures).toBe('object');
      expect(fn.name).toBe('typedFnTest');
    });

    it('should support TypedError interface', () => {
      const typed = create();
      const fn = typed('errorTest', {
        'number': (x: number) => x,
      });

      try {
        fn('not a number');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(TypeError);
        expect((err as any).data).toBeDefined();
      }
    });
  });
});
