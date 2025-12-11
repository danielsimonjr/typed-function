/**
 * Specific Error Classes for typed-function
 *
 * This module provides specific error types for better error handling
 * and type-safe error catching in TypeScript.
 */

import type { Signature, TypedErrorData } from './types.js';

/**
 * Base class for all typed-function errors
 */
export class TypedFunctionError extends TypeError {
  /** Error data with category and details */
  readonly data: TypedErrorData;

  constructor(message: string, data: TypedErrorData) {
    super(message);
    this.name = 'TypedFunctionError';
    this.data = data;

    // Maintain proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error thrown when an argument has an unexpected type
 */
export class TypeMismatchError extends TypedFunctionError {
  /** The index of the mismatched argument */
  readonly index: number;

  /** The actual type(s) of the argument */
  readonly actualTypes: string[];

  /** The expected type(s) for the argument */
  readonly expectedTypes: string[];

  constructor(
    fnName: string,
    index: number,
    actualTypes: string[],
    expectedTypes: string[]
  ) {
    const message =
      `Unexpected type of argument in function ${fnName || 'unnamed'} ` +
      `(expected: ${expectedTypes.join(' or ')}, ` +
      `actual: ${actualTypes.join(' | ')}, index: ${index})`;

    super(message, {
      category: 'wrongType',
      fn: fnName,
      index,
      actual: actualTypes,
      expected: expectedTypes,
    });

    this.name = 'TypeMismatchError';
    this.index = index;
    this.actualTypes = actualTypes;
    this.expectedTypes = expectedTypes;
  }
}

/**
 * Error thrown when too few arguments are provided
 */
export class TooFewArgumentsError extends TypedFunctionError {
  /** The number of arguments provided */
  readonly providedCount: number;

  /** The expected type(s) for the missing argument */
  readonly expectedTypes: string[];

  constructor(fnName: string, providedCount: number, expectedTypes: string[]) {
    const message =
      `Too few arguments in function ${fnName || 'unnamed'} ` +
      `(expected: ${expectedTypes.join(' or ')}, index: ${providedCount})`;

    super(message, {
      category: 'tooFewArgs',
      fn: fnName,
      index: providedCount,
      expected: expectedTypes,
    });

    this.name = 'TooFewArgumentsError';
    this.providedCount = providedCount;
    this.expectedTypes = expectedTypes;
  }
}

/**
 * Error thrown when too many arguments are provided
 */
export class TooManyArgumentsError extends TypedFunctionError {
  /** The number of arguments provided */
  readonly providedCount: number;

  /** The maximum number of arguments expected */
  readonly expectedCount: number;

  constructor(fnName: string, providedCount: number, expectedCount: number) {
    const message =
      `Too many arguments in function ${fnName || 'unnamed'} ` +
      `(expected: ${expectedCount}, actual: ${providedCount})`;

    super(message, {
      category: 'tooManyArgs',
      fn: fnName,
      index: providedCount,
      expectedLength: expectedCount,
    });

    this.name = 'TooManyArgumentsError';
    this.providedCount = providedCount;
    this.expectedCount = expectedCount;
  }
}

/**
 * Error thrown when arguments don't match any signature
 */
export class SignatureMismatchError extends TypedFunctionError {
  /** The actual argument types */
  readonly argumentTypes: string[];

  /** The available signatures */
  readonly signatures: Signature[];

  constructor(fnName: string, argumentTypes: string[], signatures: Signature[]) {
    const message =
      `Arguments of type "${argumentTypes.join(', ')}" do not match any of the ` +
      `defined signatures of function ${fnName || 'unnamed'}.`;

    super(message, {
      category: 'mismatch',
      fn: fnName,
      actual: argumentTypes,
    });

    this.name = 'SignatureMismatchError';
    this.argumentTypes = argumentTypes;
    this.signatures = signatures;
  }
}

/**
 * Error thrown when a signature is not found
 */
export class SignatureNotFoundError extends TypedFunctionError {
  /** The signature that was searched for */
  readonly signature: string;

  constructor(fnName: string, signature: string) {
    const message = `Signature not found (signature: ${fnName || 'unnamed'}(${signature}))`;

    super(message, {
      category: 'mismatch',
      fn: fnName,
    });

    this.name = 'SignatureNotFoundError';
    this.signature = signature;
  }
}

/**
 * Error thrown when WASM is not available but required
 */
export class WasmNotAvailableError extends Error {
  /** The reason WASM is not available */
  readonly reason: string;

  constructor(reason = 'WebAssembly is not available in this environment') {
    super(`WASM dispatch unavailable: ${reason}`);
    this.name = 'WasmNotAvailableError';
    this.reason = reason;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error thrown when WASM initialization fails
 */
export class WasmInitializationError extends Error {
  /** The underlying error that caused initialization to fail */
  readonly cause: Error | undefined;

  constructor(message: string, cause?: Error) {
    super(`WASM initialization failed: ${message}`);
    this.name = 'WasmInitializationError';
    this.cause = cause ?? undefined;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error thrown when a type is not found in the registry
 */
export class TypeNotFoundError extends TypeError {
  /** The type name that was not found */
  readonly typeName: string;

  /** A suggestion for a similar type name, if any */
  readonly suggestion: string | undefined;

  constructor(typeName: string, suggestion?: string) {
    let message = `Unknown type "${typeName}"`;
    if (suggestion) {
      message += `. Did you mean "${suggestion}"?`;
    }

    super(message);
    this.name = 'TypeNotFoundError';
    this.typeName = typeName;
    this.suggestion = suggestion ?? undefined;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error thrown when a duplicate type is registered
 */
export class DuplicateTypeError extends TypeError {
  /** The type name that was duplicated */
  readonly typeName: string;

  constructor(typeName: string) {
    super(`Duplicate type name "${typeName}"`);
    this.name = 'DuplicateTypeError';
    this.typeName = typeName;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Type guard to check if an error is a TypedFunctionError
 */
export function isTypedFunctionError(error: unknown): error is TypedFunctionError {
  return error instanceof TypedFunctionError;
}

/**
 * Type guard to check if an error is a TypeMismatchError
 */
export function isTypeMismatchError(error: unknown): error is TypeMismatchError {
  return error instanceof TypeMismatchError;
}

/**
 * Type guard to check if an error is a TooFewArgumentsError
 */
export function isTooFewArgumentsError(error: unknown): error is TooFewArgumentsError {
  return error instanceof TooFewArgumentsError;
}

/**
 * Type guard to check if an error is a TooManyArgumentsError
 */
export function isTooManyArgumentsError(error: unknown): error is TooManyArgumentsError {
  return error instanceof TooManyArgumentsError;
}

/**
 * Type guard to check if an error is a WasmNotAvailableError
 */
export function isWasmNotAvailableError(error: unknown): error is WasmNotAvailableError {
  return error instanceof WasmNotAvailableError;
}
