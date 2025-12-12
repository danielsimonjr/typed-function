/**
 * Tests for minimal.ts entry point
 */

import { describe, it, expect } from 'vitest';

// Import from minimal entry point
import typed, {
  isTypedFunction,
  create,
  TypeRegistry,
  createTypeRegistry,
  BUILTIN_TYPES,
  createError,
  defaultOnMismatch,
  getParamAtIndex,
  paramTypeSet,
  mergeExpectedParams,
  TypedFunctionError,
  TypeMismatchError,
  TooFewArgumentsError,
  TooManyArgumentsError,
  SignatureMismatchError,
  SignatureNotFoundError,
  TypeNotFoundError,
  DuplicateTypeError,
  isTypedFunctionError,
  isTypeMismatchError,
  isTooFewArgumentsError,
  isTooManyArgumentsError,
  parseParam,
  parseSignature,
  stringifyParams,
  hasRestParam,
  compareParams,
  compareSignatures,
  ConversionManager,
  createConversionManager,
  isReferTo,
  isReferToSelf,
  makeReferTo,
  makeReferToSelf,
  createGenericDispatcher,
  createSimpleDispatcher,
  createTypedFunction,
  checkName,
  mergeSignatures,
  last,
  initial,
  isPlainObject,
  hasOwnProperty,
  NOT_TYPED_FUNCTION,
} from '../src/minimal.js';

describe('minimal entry point', () => {
  describe('default export', () => {
    it('should export a typed function factory', () => {
      expect(typed).toBeDefined();
      expect(typeof typed).toBe('function');
    });

    it('should create typed functions', () => {
      const add = typed('add', {
        'number, number': (a: number, b: number) => a + b,
      });

      expect(add(2, 3)).toBe(5);
    });

    it('should work without function name', () => {
      const double = typed({
        'number': (n: number) => n * 2,
      });

      expect(double(5)).toBe(10);
    });
  });

  describe('isTypedFunction', () => {
    it('should return true for typed functions', () => {
      const fn = typed('test', { 'number': (n: number) => n });
      expect(isTypedFunction(fn)).toBe(true);
    });

    it('should return false for regular functions', () => {
      const fn = (n: number) => n;
      expect(isTypedFunction(fn)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isTypedFunction(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isTypedFunction(undefined)).toBe(false);
    });

    it('should return false for non-functions', () => {
      expect(isTypedFunction({})).toBe(false);
      expect(isTypedFunction('string')).toBe(false);
      expect(isTypedFunction(123)).toBe(false);
    });
  });

  describe('create factory', () => {
    it('should create new typed instances', () => {
      const myTyped = create();
      expect(myTyped).toBeDefined();
      expect(typeof myTyped).toBe('function');
    });

    it('should create independent typed instances', () => {
      const typed1 = create();
      const typed2 = create();

      // Add custom type to typed1
      typed1.addType({ name: 'CustomType1', test: (x: unknown) => x === 'custom1' });

      // typed2 should not have the custom type
      expect(() => typed2('test', { 'CustomType1': () => {} })).toThrow();
    });
  });

  describe('TypeRegistry exports', () => {
    it('should export TypeRegistry class', () => {
      expect(TypeRegistry).toBeDefined();
    });

    it('should export createTypeRegistry function', () => {
      expect(createTypeRegistry).toBeDefined();
      const registry = createTypeRegistry();
      expect(registry).toBeInstanceOf(TypeRegistry);
    });

    it('should export BUILTIN_TYPES', () => {
      expect(BUILTIN_TYPES).toBeDefined();
      expect(Array.isArray(BUILTIN_TYPES)).toBe(true);
      // BUILTIN_TYPES is an array of TypeDef objects with { name, test }
      const typeNames = BUILTIN_TYPES.map((t) => t.name);
      expect(typeNames).toContain('number');
      expect(typeNames).toContain('string');
      expect(typeNames).toContain('boolean');
    });
  });

  describe('error factory exports', () => {
    it('should export createError', () => {
      expect(createError).toBeDefined();
      expect(typeof createError).toBe('function');
    });

    it('should export defaultOnMismatch', () => {
      expect(defaultOnMismatch).toBeDefined();
      expect(typeof defaultOnMismatch).toBe('function');
    });

    it('should export getParamAtIndex', () => {
      expect(getParamAtIndex).toBeDefined();
      expect(typeof getParamAtIndex).toBe('function');
    });

    it('should export paramTypeSet', () => {
      expect(paramTypeSet).toBeDefined();
      expect(typeof paramTypeSet).toBe('function');
    });

    it('should export mergeExpectedParams', () => {
      expect(mergeExpectedParams).toBeDefined();
      expect(typeof mergeExpectedParams).toBe('function');
    });
  });

  describe('error class exports', () => {
    it('should export TypedFunctionError', () => {
      expect(TypedFunctionError).toBeDefined();
    });

    it('should export TypeMismatchError', () => {
      expect(TypeMismatchError).toBeDefined();
      const error = new TypeMismatchError('test', 0, ['string'], ['number']);
      expect(error).toBeInstanceOf(TypedFunctionError);
    });

    it('should export TooFewArgumentsError', () => {
      expect(TooFewArgumentsError).toBeDefined();
      const error = new TooFewArgumentsError('test', 0, ['number']);
      expect(error).toBeInstanceOf(TypedFunctionError);
    });

    it('should export TooManyArgumentsError', () => {
      expect(TooManyArgumentsError).toBeDefined();
      const error = new TooManyArgumentsError('test', 3, 2);
      expect(error).toBeInstanceOf(TypedFunctionError);
    });

    it('should export SignatureMismatchError', () => {
      expect(SignatureMismatchError).toBeDefined();
    });

    it('should export SignatureNotFoundError', () => {
      expect(SignatureNotFoundError).toBeDefined();
    });

    it('should export TypeNotFoundError', () => {
      expect(TypeNotFoundError).toBeDefined();
    });

    it('should export DuplicateTypeError', () => {
      expect(DuplicateTypeError).toBeDefined();
    });
  });

  describe('type guard exports', () => {
    it('should export isTypedFunctionError', () => {
      expect(isTypedFunctionError).toBeDefined();
      const error = new TypeMismatchError('test', 0, ['string'], ['number']);
      expect(isTypedFunctionError(error)).toBe(true);
    });

    it('should export isTypeMismatchError', () => {
      expect(isTypeMismatchError).toBeDefined();
      const error = new TypeMismatchError('test', 0, ['string'], ['number']);
      expect(isTypeMismatchError(error)).toBe(true);
    });

    it('should export isTooFewArgumentsError', () => {
      expect(isTooFewArgumentsError).toBeDefined();
      const error = new TooFewArgumentsError('test', 0, ['number']);
      expect(isTooFewArgumentsError(error)).toBe(true);
    });

    it('should export isTooManyArgumentsError', () => {
      expect(isTooManyArgumentsError).toBeDefined();
      const error = new TooManyArgumentsError('test', 3, 2);
      expect(isTooManyArgumentsError(error)).toBe(true);
    });
  });

  describe('signature parser exports', () => {
    it('should export parseParam', () => {
      expect(parseParam).toBeDefined();
      expect(typeof parseParam).toBe('function');
    });

    it('should export parseSignature', () => {
      expect(parseSignature).toBeDefined();
      expect(typeof parseSignature).toBe('function');
    });

    it('should export stringifyParams', () => {
      expect(stringifyParams).toBeDefined();
      expect(typeof stringifyParams).toBe('function');
    });
  });

  describe('signature comparator exports', () => {
    it('should export hasRestParam', () => {
      expect(hasRestParam).toBeDefined();
      expect(typeof hasRestParam).toBe('function');
    });

    it('should export compareParams', () => {
      expect(compareParams).toBeDefined();
      expect(typeof compareParams).toBe('function');
    });

    it('should export compareSignatures', () => {
      expect(compareSignatures).toBeDefined();
      expect(typeof compareSignatures).toBe('function');
    });
  });

  describe('conversion manager exports', () => {
    it('should export ConversionManager', () => {
      expect(ConversionManager).toBeDefined();
    });

    it('should export createConversionManager', () => {
      expect(createConversionManager).toBeDefined();
      const manager = createConversionManager();
      expect(manager).toBeInstanceOf(ConversionManager);
    });
  });

  describe('reference resolver exports', () => {
    it('should export isReferTo', () => {
      expect(isReferTo).toBeDefined();
      expect(typeof isReferTo).toBe('function');
    });

    it('should export isReferToSelf', () => {
      expect(isReferToSelf).toBeDefined();
      expect(typeof isReferToSelf).toBe('function');
    });

    it('should export makeReferTo', () => {
      expect(makeReferTo).toBeDefined();
      expect(typeof makeReferTo).toBe('function');
    });

    it('should export makeReferToSelf', () => {
      expect(makeReferToSelf).toBeDefined();
      expect(typeof makeReferToSelf).toBe('function');
    });
  });

  describe('dispatcher exports', () => {
    it('should export createGenericDispatcher', () => {
      expect(createGenericDispatcher).toBeDefined();
      expect(typeof createGenericDispatcher).toBe('function');
    });

    it('should export createSimpleDispatcher', () => {
      expect(createSimpleDispatcher).toBeDefined();
      expect(typeof createSimpleDispatcher).toBe('function');
    });

    it('should export createTypedFunction', () => {
      expect(createTypedFunction).toBeDefined();
      expect(typeof createTypedFunction).toBe('function');
    });

    it('should export checkName', () => {
      expect(checkName).toBeDefined();
      expect(typeof checkName).toBe('function');
    });

    it('should export mergeSignatures', () => {
      expect(mergeSignatures).toBeDefined();
      expect(typeof mergeSignatures).toBe('function');
    });
  });

  describe('utility exports', () => {
    it('should export last', () => {
      expect(last).toBeDefined();
      expect(last([1, 2, 3])).toBe(3);
    });

    it('should export initial', () => {
      expect(initial).toBeDefined();
      expect(initial([1, 2, 3])).toEqual([1, 2]);
    });

    it('should export isPlainObject', () => {
      expect(isPlainObject).toBeDefined();
      expect(isPlainObject({})).toBe(true);
      expect(isPlainObject([])).toBe(false);
    });

    it('should export hasOwnProperty', () => {
      expect(hasOwnProperty).toBeDefined();
      expect(hasOwnProperty({ a: 1 }, 'a')).toBe(true);
      expect(hasOwnProperty({ a: 1 }, 'b')).toBe(false);
    });
  });

  describe('constants exports', () => {
    it('should export NOT_TYPED_FUNCTION', () => {
      expect(NOT_TYPED_FUNCTION).toBeDefined();
    });
  });

  describe('minimal typed function usage', () => {
    it('should support multiple signatures', () => {
      const fn = typed('fn', {
        'number': (n: number) => `number: ${n}`,
        'string': (s: string) => `string: ${s}`,
        'number, number': (a: number, b: number) => `sum: ${a + b}`,
      });

      expect(fn(42)).toBe('number: 42');
      expect(fn('hello')).toBe('string: hello');
      expect(fn(2, 3)).toBe('sum: 5');
    });

    it('should support type conversions', () => {
      const myTyped = create();
      myTyped.addConversion({
        from: 'string',
        to: 'number',
        convert: (s: string) => parseFloat(s),
      });

      const double = myTyped('double', {
        'number': (n: number) => n * 2,
      });

      expect(double(5)).toBe(10);
      expect(double('3.5')).toBe(7);
    });

    it('should throw on type mismatch', () => {
      const fn = typed('fn', {
        'number': (n: number) => n,
      });

      expect(() => fn('string')).toThrow();
    });
  });
});
