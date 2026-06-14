/**
 * Extended tests for errors.ts - covering WasmNotAvailableError, WasmInitializationError,
 * TypeNotFoundError, DuplicateTypeError, and additional type guards
 */

import { describe, it, expect } from 'vitest';
import {
  TypedFunctionError,
  TypeMismatchError,
  TooFewArgumentsError,
  TooManyArgumentsError,
  SignatureMismatchError,
  SignatureNotFoundError,
  WasmNotAvailableError,
  WasmInitializationError,
  TypeNotFoundError,
  DuplicateTypeError,
  isTypeMismatchError,
  isTooFewArgumentsError,
  isTooManyArgumentsError,
  isWasmNotAvailableError,
  hasErrorCode,
  getErrorCode,
  ErrorCode,
} from '../src/core/errors.js';

describe('WasmNotAvailableError', () => {
  it('should create error with default message', () => {
    const error = new WasmNotAvailableError();
    expect(error.name).toBe('WasmNotAvailableError');
    expect(error.message).toContain('WASM dispatch unavailable');
    expect(error.message).toContain('WebAssembly is not available');
    expect(error.reason).toBe('WebAssembly is not available in this environment');
  });

  it('should create error with custom reason', () => {
    const error = new WasmNotAvailableError('Custom reason');
    expect(error.reason).toBe('Custom reason');
    expect(error.message).toContain('Custom reason');
  });

  it('should be an instance of Error', () => {
    const error = new WasmNotAvailableError();
    expect(error).toBeInstanceOf(Error);
  });

  it('should have a stack trace', () => {
    const error = new WasmNotAvailableError();
    expect(error.stack).toBeDefined();
  });
});

describe('WasmInitializationError', () => {
  it('should create error with message', () => {
    const error = new WasmInitializationError('Failed to load');
    expect(error.name).toBe('WasmInitializationError');
    expect(error.message).toContain('WASM initialization failed');
    expect(error.message).toContain('Failed to load');
  });

  it('should store cause when provided', () => {
    const cause = new Error('Underlying error');
    const error = new WasmInitializationError('Failed', cause);
    expect(error.cause).toBe(cause);
  });

  it('should have undefined cause when not provided', () => {
    const error = new WasmInitializationError('Failed');
    expect(error.cause).toBeUndefined();
  });

  it('should be an instance of Error', () => {
    const error = new WasmInitializationError('Failed');
    expect(error).toBeInstanceOf(Error);
  });

  it('should have a stack trace', () => {
    const error = new WasmInitializationError('Failed');
    expect(error.stack).toBeDefined();
  });
});

describe('TypeNotFoundError', () => {
  it('should create error with type name', () => {
    const error = new TypeNotFoundError('CustomType');
    expect(error.name).toBe('TypeNotFoundError');
    expect(error.typeName).toBe('CustomType');
    expect(error.message).toContain('Unknown type "CustomType"');
  });

  it('should include suggestion when provided', () => {
    const error = new TypeNotFoundError('numbr', 'number');
    expect(error.suggestion).toBe('number');
    expect(error.message).toContain('Did you mean "number"?');
  });

  it('should have undefined suggestion when not provided', () => {
    const error = new TypeNotFoundError('CustomType');
    expect(error.suggestion).toBeUndefined();
  });

  it('should be an instance of TypeError', () => {
    const error = new TypeNotFoundError('CustomType');
    expect(error).toBeInstanceOf(TypeError);
  });

  it('should have a stack trace', () => {
    const error = new TypeNotFoundError('CustomType');
    expect(error.stack).toBeDefined();
  });
});

describe('DuplicateTypeError', () => {
  it('should create error with type name', () => {
    const error = new DuplicateTypeError('MyType');
    expect(error.name).toBe('DuplicateTypeError');
    expect(error.typeName).toBe('MyType');
    expect(error.message).toContain('Duplicate type name "MyType"');
  });

  it('should be an instance of TypeError', () => {
    const error = new DuplicateTypeError('MyType');
    expect(error).toBeInstanceOf(TypeError);
  });

  it('should have a stack trace', () => {
    const error = new DuplicateTypeError('MyType');
    expect(error.stack).toBeDefined();
  });
});

describe('isTypeMismatchError type guard', () => {
  it('should return true for TypeMismatchError', () => {
    const error = new TypeMismatchError('test', 0, ['string'], ['number']);
    expect(isTypeMismatchError(error)).toBe(true);
  });

  it('should return false for other TypedFunctionErrors', () => {
    const error = new TooFewArgumentsError('test', 0, ['number']);
    expect(isTypeMismatchError(error)).toBe(false);
  });

  it('should return false for regular errors', () => {
    const error = new Error('test');
    expect(isTypeMismatchError(error)).toBe(false);
  });

  it('should return false for non-errors', () => {
    expect(isTypeMismatchError(null)).toBe(false);
    expect(isTypeMismatchError(undefined)).toBe(false);
    expect(isTypeMismatchError('string')).toBe(false);
    expect(isTypeMismatchError(123)).toBe(false);
    expect(isTypeMismatchError({})).toBe(false);
  });
});

describe('isTooFewArgumentsError type guard', () => {
  it('should return true for TooFewArgumentsError', () => {
    const error = new TooFewArgumentsError('test', 0, ['number']);
    expect(isTooFewArgumentsError(error)).toBe(true);
  });

  it('should return false for other TypedFunctionErrors', () => {
    const error = new TypeMismatchError('test', 0, ['string'], ['number']);
    expect(isTooFewArgumentsError(error)).toBe(false);
  });

  it('should return false for regular errors', () => {
    const error = new Error('test');
    expect(isTooFewArgumentsError(error)).toBe(false);
  });

  it('should return false for non-errors', () => {
    expect(isTooFewArgumentsError(null)).toBe(false);
    expect(isTooFewArgumentsError(undefined)).toBe(false);
    expect(isTooFewArgumentsError('string')).toBe(false);
  });
});

describe('isTooManyArgumentsError type guard', () => {
  it('should return true for TooManyArgumentsError', () => {
    const error = new TooManyArgumentsError('test', 3, 2);
    expect(isTooManyArgumentsError(error)).toBe(true);
  });

  it('should return false for other TypedFunctionErrors', () => {
    const error = new TypeMismatchError('test', 0, ['string'], ['number']);
    expect(isTooManyArgumentsError(error)).toBe(false);
  });

  it('should return false for regular errors', () => {
    const error = new Error('test');
    expect(isTooManyArgumentsError(error)).toBe(false);
  });

  it('should return false for non-errors', () => {
    expect(isTooManyArgumentsError(null)).toBe(false);
    expect(isTooManyArgumentsError(undefined)).toBe(false);
    expect(isTooManyArgumentsError({})).toBe(false);
  });
});

describe('isWasmNotAvailableError type guard', () => {
  it('should return true for WasmNotAvailableError', () => {
    const error = new WasmNotAvailableError();
    expect(isWasmNotAvailableError(error)).toBe(true);
  });

  it('should return true for WasmNotAvailableError with custom reason', () => {
    const error = new WasmNotAvailableError('Custom reason');
    expect(isWasmNotAvailableError(error)).toBe(true);
  });

  it('should return false for WasmInitializationError', () => {
    const error = new WasmInitializationError('Failed');
    expect(isWasmNotAvailableError(error)).toBe(false);
  });

  it('should return false for other errors', () => {
    const error = new Error('test');
    expect(isWasmNotAvailableError(error)).toBe(false);
  });

  it('should return false for TypedFunctionErrors', () => {
    const error = new TypeMismatchError('test', 0, ['string'], ['number']);
    expect(isWasmNotAvailableError(error)).toBe(false);
  });

  it('should return false for non-errors', () => {
    expect(isWasmNotAvailableError(null)).toBe(false);
    expect(isWasmNotAvailableError(undefined)).toBe(false);
    expect(isWasmNotAvailableError('string')).toBe(false);
    expect(isWasmNotAvailableError(123)).toBe(false);
  });
});

describe('TypedFunctionError base class', () => {
  it('should create error with default INTERNAL_ERROR code', () => {
    const error = new TypedFunctionError('Test error', { category: 'mismatch', fn: 'test' });
    expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
  });

  it('should create error with custom code', () => {
    const error = new TypedFunctionError(
      'Test error',
      { category: 'mismatch', fn: 'test' },
      ErrorCode.UNKNOWN_TYPE
    );
    expect(error.code).toBe(ErrorCode.UNKNOWN_TYPE);
  });

  it('should store data correctly', () => {
    const data = { category: 'wrongType' as const, fn: 'myFunc', index: 1 };
    const error = new TypedFunctionError('Test', data);
    expect(error.data).toEqual(data);
  });

  it('should be an instance of TypeError', () => {
    const error = new TypedFunctionError('Test', { category: 'mismatch', fn: 'test' });
    expect(error).toBeInstanceOf(TypeError);
  });
});

describe('SignatureMismatchError', () => {
  it('should store argument types and signatures', () => {
    const signatures = [{ params: [{ name: 'number' }], fn: () => {} }];
    const error = new SignatureMismatchError('test', ['string', 'boolean'], signatures as any);

    expect(error.argumentTypes).toEqual(['string', 'boolean']);
    expect(error.signatures).toBe(signatures);
    expect(error.code).toBe(ErrorCode.NO_MATCHING_SIGNATURE);
  });

  it('should handle unnamed function', () => {
    const error = new SignatureMismatchError('', ['number'], []);
    expect(error.message).toContain('unnamed');
  });
});

describe('SignatureNotFoundError', () => {
  it('should store signature string', () => {
    const error = new SignatureNotFoundError('myFunc', 'number, string');
    expect(error.signature).toBe('number, string');
    expect(error.code).toBe(ErrorCode.SIGNATURE_NOT_FOUND);
    expect(error.message).toContain('myFunc(number, string)');
  });

  it('should handle unnamed function', () => {
    const error = new SignatureNotFoundError('', 'number');
    expect(error.message).toContain('unnamed(number)');
  });
});

describe('TypeMismatchError details', () => {
  it('should handle multiple actual types', () => {
    const error = new TypeMismatchError('test', 0, ['string', 'number'], ['boolean']);
    expect(error.message).toContain('string | number');
  });

  it('should handle multiple expected types', () => {
    const error = new TypeMismatchError('test', 0, ['string'], ['number', 'boolean']);
    expect(error.message).toContain('number or boolean');
  });

  it('should handle unnamed function', () => {
    const error = new TypeMismatchError('', 0, ['string'], ['number']);
    expect(error.message).toContain('unnamed');
  });
});

describe('TooFewArgumentsError details', () => {
  it('should store provided count and expected types', () => {
    const error = new TooFewArgumentsError('test', 1, ['number', 'string']);
    expect(error.providedCount).toBe(1);
    expect(error.expectedTypes).toEqual(['number', 'string']);
    expect(error.message).toContain('number or string');
  });

  it('should handle unnamed function', () => {
    const error = new TooFewArgumentsError('', 0, ['number']);
    expect(error.message).toContain('unnamed');
  });
});

describe('TooManyArgumentsError details', () => {
  it('should store provided count and expected count', () => {
    const error = new TooManyArgumentsError('test', 5, 3);
    expect(error.providedCount).toBe(5);
    expect(error.expectedCount).toBe(3);
    expect(error.message).toContain('expected: 3');
    expect(error.message).toContain('actual: 5');
  });

  it('should handle unnamed function', () => {
    const error = new TooManyArgumentsError('', 3, 2);
    expect(error.message).toContain('unnamed');
  });
});

describe('Error inheritance and prototype chain', () => {
  it('TypeMismatchError should extend TypedFunctionError', () => {
    const error = new TypeMismatchError('test', 0, ['string'], ['number']);
    expect(error).toBeInstanceOf(TypedFunctionError);
    expect(error).toBeInstanceOf(TypeError);
    expect(error).toBeInstanceOf(Error);
  });

  it('TooFewArgumentsError should extend TypedFunctionError', () => {
    const error = new TooFewArgumentsError('test', 0, ['number']);
    expect(error).toBeInstanceOf(TypedFunctionError);
    expect(error).toBeInstanceOf(TypeError);
    expect(error).toBeInstanceOf(Error);
  });

  it('TooManyArgumentsError should extend TypedFunctionError', () => {
    const error = new TooManyArgumentsError('test', 3, 2);
    expect(error).toBeInstanceOf(TypedFunctionError);
    expect(error).toBeInstanceOf(TypeError);
    expect(error).toBeInstanceOf(Error);
  });

  it('SignatureMismatchError should extend TypedFunctionError', () => {
    const error = new SignatureMismatchError('test', ['string'], []);
    expect(error).toBeInstanceOf(TypedFunctionError);
    expect(error).toBeInstanceOf(TypeError);
    expect(error).toBeInstanceOf(Error);
  });

  it('SignatureNotFoundError should extend TypedFunctionError', () => {
    const error = new SignatureNotFoundError('test', 'number');
    expect(error).toBeInstanceOf(TypedFunctionError);
    expect(error).toBeInstanceOf(TypeError);
    expect(error).toBeInstanceOf(Error);
  });

  it('TypeNotFoundError should extend TypeError', () => {
    const error = new TypeNotFoundError('Custom');
    expect(error).toBeInstanceOf(TypeError);
    expect(error).toBeInstanceOf(Error);
  });

  it('DuplicateTypeError should extend TypeError', () => {
    const error = new DuplicateTypeError('Custom');
    expect(error).toBeInstanceOf(TypeError);
    expect(error).toBeInstanceOf(Error);
  });
});

describe('Error code utilities', () => {
  it('hasErrorCode should work with all error types', () => {
    const typeMismatch = new TypeMismatchError('test', 0, ['string'], ['number']);
    const tooFew = new TooFewArgumentsError('test', 0, ['number']);
    const tooMany = new TooManyArgumentsError('test', 3, 2);
    const sigMismatch = new SignatureMismatchError('test', ['string'], []);
    const sigNotFound = new SignatureNotFoundError('test', 'number');

    expect(hasErrorCode(typeMismatch, ErrorCode.TYPE_MISMATCH)).toBe(true);
    expect(hasErrorCode(tooFew, ErrorCode.TOO_FEW_ARGUMENTS)).toBe(true);
    expect(hasErrorCode(tooMany, ErrorCode.TOO_MANY_ARGUMENTS)).toBe(true);
    expect(hasErrorCode(sigMismatch, ErrorCode.NO_MATCHING_SIGNATURE)).toBe(true);
    expect(hasErrorCode(sigNotFound, ErrorCode.SIGNATURE_NOT_FOUND)).toBe(true);
  });

  it('getErrorCode should return correct codes', () => {
    const typeMismatch = new TypeMismatchError('test', 0, ['string'], ['number']);
    const tooFew = new TooFewArgumentsError('test', 0, ['number']);
    const tooMany = new TooManyArgumentsError('test', 3, 2);

    expect(getErrorCode(typeMismatch)).toBe(ErrorCode.TYPE_MISMATCH);
    expect(getErrorCode(tooFew)).toBe(ErrorCode.TOO_FEW_ARGUMENTS);
    expect(getErrorCode(tooMany)).toBe(ErrorCode.TOO_MANY_ARGUMENTS);
  });
});
