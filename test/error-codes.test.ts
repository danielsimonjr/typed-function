/**
 * Tests for error codes and error handling utilities
 */

import { describe, it, expect } from 'vitest';
import typed from '../src/index.js';
import {
  ErrorCode,
  TypedFunctionError,
  TypeMismatchError,
  TooFewArgumentsError,
  TooManyArgumentsError,
  SignatureMismatchError,
  SignatureNotFoundError,
  isTypedFunctionError,
  hasErrorCode,
  getErrorCode,
} from '../src/core/errors.js';

describe('ErrorCode enum', () => {
  it('should have type error codes (TF1xx)', () => {
    expect(ErrorCode.UNKNOWN_TYPE).toBe('TF101');
    expect(ErrorCode.DUPLICATE_TYPE).toBe('TF102');
    expect(ErrorCode.INVALID_TYPE_DEFINITION).toBe('TF103');
  });

  it('should have signature error codes (TF2xx)', () => {
    expect(ErrorCode.NO_SIGNATURES).toBe('TF201');
    expect(ErrorCode.CONFLICTING_SIGNATURES).toBe('TF202');
    expect(ErrorCode.INVALID_SIGNATURE).toBe('TF203');
    expect(ErrorCode.DUPLICATE_SIGNATURE).toBe('TF204');
    expect(ErrorCode.SIGNATURE_NOT_FOUND).toBe('TF205');
  });

  it('should have dispatch error codes (TF3xx)', () => {
    expect(ErrorCode.TYPE_MISMATCH).toBe('TF301');
    expect(ErrorCode.TOO_FEW_ARGUMENTS).toBe('TF302');
    expect(ErrorCode.TOO_MANY_ARGUMENTS).toBe('TF303');
    expect(ErrorCode.NO_MATCHING_SIGNATURE).toBe('TF304');
  });

  it('should have conversion error codes (TF4xx)', () => {
    expect(ErrorCode.CONVERSION_NOT_FOUND).toBe('TF401');
    expect(ErrorCode.DUPLICATE_CONVERSION).toBe('TF402');
    expect(ErrorCode.CONVERSION_FAILED).toBe('TF403');
    expect(ErrorCode.INVALID_CONVERSION).toBe('TF404');
  });

  it('should have reference error codes (TF5xx)', () => {
    expect(ErrorCode.CIRCULAR_REFERENCE).toBe('TF501');
    expect(ErrorCode.UNRESOLVED_REFERENCE).toBe('TF502');
  });

  it('should have WASM error codes (TF6xx)', () => {
    expect(ErrorCode.WASM_NOT_INITIALIZED).toBe('TF601');
    expect(ErrorCode.WASM_LOAD_FAILED).toBe('TF602');
    expect(ErrorCode.WASM_NOT_SUPPORTED).toBe('TF603');
  });

  it('should have general error codes (TF9xx)', () => {
    expect(ErrorCode.NOT_A_TYPED_FUNCTION).toBe('TF901');
    expect(ErrorCode.INTERNAL_ERROR).toBe('TF999');
  });
});

describe('TypeMismatchError', () => {
  it('should have TYPE_MISMATCH error code', () => {
    const error = new TypeMismatchError('test', 0, ['string'], ['number']);
    expect(error.code).toBe(ErrorCode.TYPE_MISMATCH);
    expect(error.name).toBe('TypeMismatchError');
  });

  it('should contain error details', () => {
    const error = new TypeMismatchError('myFunc', 1, ['string'], ['number', 'boolean']);
    expect(error.index).toBe(1);
    expect(error.actualTypes).toEqual(['string']);
    expect(error.expectedTypes).toEqual(['number', 'boolean']);
    expect(error.data.fn).toBe('myFunc');
  });
});

describe('TooFewArgumentsError', () => {
  it('should have TOO_FEW_ARGUMENTS error code', () => {
    const error = new TooFewArgumentsError('test', 0, ['number']);
    expect(error.code).toBe(ErrorCode.TOO_FEW_ARGUMENTS);
    expect(error.name).toBe('TooFewArgumentsError');
  });
});

describe('TooManyArgumentsError', () => {
  it('should have TOO_MANY_ARGUMENTS error code', () => {
    const error = new TooManyArgumentsError('test', 3, 2);
    expect(error.code).toBe(ErrorCode.TOO_MANY_ARGUMENTS);
    expect(error.name).toBe('TooManyArgumentsError');
  });
});

describe('SignatureMismatchError', () => {
  it('should have NO_MATCHING_SIGNATURE error code', () => {
    const error = new SignatureMismatchError('test', ['string'], []);
    expect(error.code).toBe(ErrorCode.NO_MATCHING_SIGNATURE);
    expect(error.name).toBe('SignatureMismatchError');
  });
});

describe('SignatureNotFoundError', () => {
  it('should have SIGNATURE_NOT_FOUND error code', () => {
    const error = new SignatureNotFoundError('test', 'number, string');
    expect(error.code).toBe(ErrorCode.SIGNATURE_NOT_FOUND);
    expect(error.name).toBe('SignatureNotFoundError');
  });
});

describe('isTypedFunctionError', () => {
  it('should return true for TypedFunctionError instances', () => {
    const error = new TypeMismatchError('test', 0, ['string'], ['number']);
    expect(isTypedFunctionError(error)).toBe(true);
  });

  it('should return false for regular errors', () => {
    const error = new Error('test');
    expect(isTypedFunctionError(error)).toBe(false);
  });

  it('should return false for non-errors', () => {
    expect(isTypedFunctionError('string')).toBe(false);
    expect(isTypedFunctionError(null)).toBe(false);
    expect(isTypedFunctionError(undefined)).toBe(false);
  });
});

describe('hasErrorCode', () => {
  it('should return true when error has matching code', () => {
    const error = new TypeMismatchError('test', 0, ['string'], ['number']);
    expect(hasErrorCode(error, ErrorCode.TYPE_MISMATCH)).toBe(true);
  });

  it('should return false when error has different code', () => {
    const error = new TypeMismatchError('test', 0, ['string'], ['number']);
    expect(hasErrorCode(error, ErrorCode.TOO_FEW_ARGUMENTS)).toBe(false);
  });

  it('should return false for non-TypedFunctionError', () => {
    const error = new Error('test');
    expect(hasErrorCode(error, ErrorCode.TYPE_MISMATCH)).toBe(false);
  });
});

describe('getErrorCode', () => {
  it('should return error code from TypedFunctionError', () => {
    const error = new TypeMismatchError('test', 0, ['string'], ['number']);
    expect(getErrorCode(error)).toBe(ErrorCode.TYPE_MISMATCH);
  });

  it('should return undefined for non-TypedFunctionError', () => {
    const error = new Error('test');
    expect(getErrorCode(error)).toBeUndefined();
  });

  it('should return undefined for non-errors', () => {
    expect(getErrorCode('string')).toBeUndefined();
    expect(getErrorCode(null)).toBeUndefined();
  });
});

describe('Error codes in error class construction', () => {
  it('should create TypeMismatchError with correct code', () => {
    const error = new TypeMismatchError('test', 0, ['string'], ['number']);
    expect(error.code).toBe(ErrorCode.TYPE_MISMATCH);
    expect(error instanceof TypeError).toBe(true);
    expect(error.message).toContain('Unexpected type');
  });

  it('should create TooFewArgumentsError with correct code', () => {
    const error = new TooFewArgumentsError('test', 1, ['number']);
    expect(error.code).toBe(ErrorCode.TOO_FEW_ARGUMENTS);
    expect(error instanceof TypeError).toBe(true);
    expect(error.message).toContain('Too few arguments');
  });

  it('should create TooManyArgumentsError with correct code', () => {
    const error = new TooManyArgumentsError('test', 3, 2);
    expect(error.code).toBe(ErrorCode.TOO_MANY_ARGUMENTS);
    expect(error instanceof TypeError).toBe(true);
    expect(error.message).toContain('Too many arguments');
  });
});

describe('Error handling patterns with error classes', () => {
  it('should allow programmatic error handling by code', () => {
    const handleError = (e: unknown): string => {
      if (hasErrorCode(e, ErrorCode.TYPE_MISMATCH)) {
        return 'type-mismatch';
      }
      if (hasErrorCode(e, ErrorCode.TOO_FEW_ARGUMENTS)) {
        return 'too-few-args';
      }
      if (hasErrorCode(e, ErrorCode.TOO_MANY_ARGUMENTS)) {
        return 'too-many-args';
      }
      return 'unknown';
    };

    // Test with TypeMismatchError
    const typeMismatch = new TypeMismatchError('test', 0, ['string'], ['number']);
    expect(handleError(typeMismatch)).toBe('type-mismatch');

    // Test with TooFewArgumentsError
    const tooFew = new TooFewArgumentsError('test', 1, ['number']);
    expect(handleError(tooFew)).toBe('too-few-args');

    // Test with TooManyArgumentsError
    const tooMany = new TooManyArgumentsError('test', 3, 2);
    expect(handleError(tooMany)).toBe('too-many-args');

    // Test with regular Error
    const regular = new Error('test');
    expect(handleError(regular)).toBe('unknown');
  });
});
