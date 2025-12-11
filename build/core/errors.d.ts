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
export declare class TypedFunctionError extends TypeError {
    /** Error data with category and details */
    readonly data: TypedErrorData;
    constructor(message: string, data: TypedErrorData);
}
/**
 * Error thrown when an argument has an unexpected type
 */
export declare class TypeMismatchError extends TypedFunctionError {
    /** The index of the mismatched argument */
    readonly index: number;
    /** The actual type(s) of the argument */
    readonly actualTypes: string[];
    /** The expected type(s) for the argument */
    readonly expectedTypes: string[];
    constructor(fnName: string, index: number, actualTypes: string[], expectedTypes: string[]);
}
/**
 * Error thrown when too few arguments are provided
 */
export declare class TooFewArgumentsError extends TypedFunctionError {
    /** The number of arguments provided */
    readonly providedCount: number;
    /** The expected type(s) for the missing argument */
    readonly expectedTypes: string[];
    constructor(fnName: string, providedCount: number, expectedTypes: string[]);
}
/**
 * Error thrown when too many arguments are provided
 */
export declare class TooManyArgumentsError extends TypedFunctionError {
    /** The number of arguments provided */
    readonly providedCount: number;
    /** The maximum number of arguments expected */
    readonly expectedCount: number;
    constructor(fnName: string, providedCount: number, expectedCount: number);
}
/**
 * Error thrown when arguments don't match any signature
 */
export declare class SignatureMismatchError extends TypedFunctionError {
    /** The actual argument types */
    readonly argumentTypes: string[];
    /** The available signatures */
    readonly signatures: Signature[];
    constructor(fnName: string, argumentTypes: string[], signatures: Signature[]);
}
/**
 * Error thrown when a signature is not found
 */
export declare class SignatureNotFoundError extends TypedFunctionError {
    /** The signature that was searched for */
    readonly signature: string;
    constructor(fnName: string, signature: string);
}
/**
 * Error thrown when WASM is not available but required
 */
export declare class WasmNotAvailableError extends Error {
    /** The reason WASM is not available */
    readonly reason: string;
    constructor(reason?: string);
}
/**
 * Error thrown when WASM initialization fails
 */
export declare class WasmInitializationError extends Error {
    /** The underlying error that caused initialization to fail */
    readonly cause: Error | undefined;
    constructor(message: string, cause?: Error);
}
/**
 * Error thrown when a type is not found in the registry
 */
export declare class TypeNotFoundError extends TypeError {
    /** The type name that was not found */
    readonly typeName: string;
    /** A suggestion for a similar type name, if any */
    readonly suggestion: string | undefined;
    constructor(typeName: string, suggestion?: string);
}
/**
 * Error thrown when a duplicate type is registered
 */
export declare class DuplicateTypeError extends TypeError {
    /** The type name that was duplicated */
    readonly typeName: string;
    constructor(typeName: string);
}
/**
 * Type guard to check if an error is a TypedFunctionError
 */
export declare function isTypedFunctionError(error: unknown): error is TypedFunctionError;
/**
 * Type guard to check if an error is a TypeMismatchError
 */
export declare function isTypeMismatchError(error: unknown): error is TypeMismatchError;
/**
 * Type guard to check if an error is a TooFewArgumentsError
 */
export declare function isTooFewArgumentsError(error: unknown): error is TooFewArgumentsError;
/**
 * Type guard to check if an error is a TooManyArgumentsError
 */
export declare function isTooManyArgumentsError(error: unknown): error is TooManyArgumentsError;
/**
 * Type guard to check if an error is a WasmNotAvailableError
 */
export declare function isWasmNotAvailableError(error: unknown): error is WasmNotAvailableError;
//# sourceMappingURL=errors.d.ts.map