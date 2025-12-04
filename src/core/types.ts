/**
 * Core TypeScript type definitions for typed-function v5.0
 *
 * This module defines all the fundamental interfaces and types used
 * throughout the typed-function library.
 */

/**
 * A type definition that describes a runtime type check
 */
export interface TypeDef {
  /** The name of the type (e.g., 'number', 'string', 'Array') */
  name: string;

  /** Function that tests whether a value belongs to this type */
  test: (x: unknown) => boolean;

  /** Whether this type matches any value (true only for 'any' type) */
  isAny?: boolean;

  /** Internal index of this type in the type registry */
  index?: number;

  /** Conversions available to this type from other types */
  conversionsTo?: ConversionDef[];
}

/**
 * A conversion definition that describes how to convert between types
 */
export interface ConversionDef {
  /** Source type name */
  from: string;

  /** Target type name */
  to: string;

  /** Function that performs the conversion */
  convert: (value: unknown) => unknown;

  /** Internal index for conversion priority */
  index?: number;
}

/**
 * Represents a single type within a parameter, potentially with conversion info
 */
export interface Type {
  /** The name of this type */
  name: string;

  /** Index of this type in the type registry */
  typeIndex: number;

  /** Function to test if a value matches this type */
  test: (x: unknown) => boolean;

  /** Whether this type is the 'any' type */
  isAny: boolean;

  /** Conversion definition if this type came from a conversion, null otherwise */
  conversion: ConversionDef | null;

  /** Index of the conversion if applicable, -1 otherwise */
  conversionIndex: number;
}

/**
 * Represents a single parameter in a signature
 */
export interface Param {
  /** Array of types that this parameter accepts */
  types: Type[];

  /** Canonical name of this parameter (e.g., 'number|string') */
  name: string;

  /** Whether any of the types is the 'any' type */
  hasAny: boolean;

  /** Whether any of the types requires conversion */
  hasConversion: boolean;

  /** Whether this is a rest parameter (...) */
  restParam: boolean;

  /** Cached set of type names for efficient lookup */
  typeSet?: Set<string>;
}

/**
 * Function signature type for implementations
 */
export type SignatureFunction = (...args: unknown[]) => unknown;

/**
 * A compiled signature with test and implementation functions
 */
export interface Signature {
  /** The parameters of this signature */
  params: Param[];

  /** The original function provided for this signature */
  fn: SignatureFunction | null;

  /** Function to test if arguments match this signature */
  test: ((args: ArrayLike<unknown>) => boolean) | null;

  /** Function to call that handles conversions and rest params */
  implementation: SignatureFunction | null;

  /** Canonical name of this signature (e.g., 'number,string') */
  name?: string;
}

/**
 * Internal data structure attached to typed functions
 */
export interface TypedFunctionData {
  /** Ordered array of all compiled signatures */
  signatures: Signature[];

  /** Map from signature name to signature for fast lookup */
  signatureMap: Map<string, Signature>;
}

/**
 * A typed function with attached metadata
 */
export interface TypedFunction {
  /** Call signature - accepts any arguments and returns unknown */
  (...args: unknown[]): unknown;

  /** Mapping from signature strings to implementation functions */
  signatures: Record<string, SignatureFunction>;

  /** Internal data for typed-function introspection */
  _typedFunctionData: TypedFunctionData;

  /** The name of this typed function */
  name: string;
}

/**
 * Reference to another signature, used for recursion and cross-references
 */
export interface ReferTo {
  referTo: {
    /** Array of signature strings to reference */
    references: string[];

    /** Callback that receives resolved functions and returns the implementation */
    callback: (...fns: SignatureFunction[]) => SignatureFunction;
  };
}

/**
 * Reference to the typed function itself (self-reference)
 */
export interface ReferToSelf {
  referToSelf: {
    /** Callback that receives the typed function and returns the implementation */
    callback: (self: TypedFunction) => SignatureFunction;
  };
}

/**
 * Options for finding signatures
 */
export interface FindSignatureOptions {
  /** If true, only return exact matches (no type coercion) */
  exact?: boolean;
}

/**
 * Options for adding conversions
 */
export interface AddConversionOptions {
  /** If true, override existing conversion with same from/to */
  override?: boolean;
}

/**
 * Error data attached to typed-function errors
 */
export interface TypedErrorData {
  /** Category of the error */
  category: 'wrongType' | 'tooFewArgs' | 'tooManyArgs' | 'mismatch';

  /** Name of the function that was called */
  fn: string;

  /** Argument index where error occurred (if applicable) */
  index?: number;

  /** Actual type names of the argument(s) */
  actual?: string[];

  /** Expected type names */
  expected?: string[];

  /** Expected number of arguments (for tooManyArgs) */
  expectedLength?: number;
}

/**
 * Extended TypeError with additional data
 */
export interface TypedError extends TypeError {
  data: TypedErrorData;
}

/**
 * Function type for testing a single argument
 */
export type TypeTest = (x: unknown) => boolean;

/**
 * Function type for testing all arguments of a signature
 */
export type SignatureTest = (args: ArrayLike<unknown>) => boolean;

/**
 * Function type for converting a single argument
 */
export type ArgConverter = (arg: unknown) => unknown;

/**
 * Handler function called when no signature matches
 */
export type MismatchHandler = (
  name: string,
  args: ArrayLike<unknown>,
  signatures: Signature[]
) => never;

/**
 * Dispatcher function type
 */
export type TypedDispatcher = (this: unknown, ...args: unknown[]) => unknown;

/**
 * Generic dispatcher function type (used for fallback)
 */
export type GenericDispatcher = (this: unknown, ...args: unknown[]) => unknown;

/**
 * Context object holding shared state for a typed-function instance
 */
export interface TypedContext {
  /** The type registry for this instance */
  typeMap: Map<string, TypeDef>;

  /** Ordered list of type names */
  typeList: string[];

  /** Number of conversions registered */
  nConversions: number;

  /** Handler for argument mismatches */
  onMismatch: MismatchHandler;

  /** Counter for created typed functions */
  createCount: number;

  /** Whether to warn about deprecated this usage */
  warnAgainstDeprecatedThis: boolean;
}

/**
 * The main typed function factory interface
 */
export interface TypedInstance {
  /** Create a typed function with optional name and signature definitions */
  (name: string, signatures: Record<string, SignatureFunction | ReferTo | ReferToSelf>): TypedFunction;
  (signatures: Record<string, SignatureFunction | ReferTo | ReferToSelf>): TypedFunction;
  (...args: Array<string | Record<string, SignatureFunction | ReferTo | ReferToSelf> | TypedFunction | (SignatureFunction & { signature: string })>): TypedFunction;

  /** Create a new isolated typed instance */
  create: () => TypedInstance;

  /** Add a single type to the registry */
  addType: (type: TypeDef, beforeObjectTest?: boolean) => void;

  /** Add multiple types to the registry */
  addTypes: (types: TypeDef[], before?: string | boolean) => void;

  /** Add a type conversion */
  addConversion: (conversion: ConversionDef, options?: AddConversionOptions) => void;

  /** Add multiple type conversions */
  addConversions: (conversions: ConversionDef[], options?: AddConversionOptions) => void;

  /** Remove a type conversion */
  removeConversion: (conversion: ConversionDef) => void;

  /** Clear all types and conversions */
  clear: () => void;

  /** Clear all conversions (keep types) */
  clearConversions: () => void;

  /** Find the implementation function for a signature */
  find: (fn: TypedFunction, signature: string | string[], options?: FindSignatureOptions) => SignatureFunction;

  /** Find the full signature object for a signature */
  findSignature: (fn: TypedFunction, signature: string | string[], options?: FindSignatureOptions) => Signature;

  /** Resolve which signature would be called for given arguments */
  resolve: (fn: TypedFunction, args: ArrayLike<unknown>) => Signature | null;

  /** Convert a value to a specified type */
  convert: (value: unknown, typeName: string) => unknown;

  /** Check if a value is a typed function */
  isTypedFunction: (entity: unknown) => entity is TypedFunction;

  /** Create a reference to other signatures */
  referTo: (...args: [...string[], (...fns: SignatureFunction[]) => SignatureFunction]) => ReferTo;

  /** Create a self-reference */
  referToSelf: (callback: (self: TypedFunction) => SignatureFunction) => ReferToSelf;

  /** Create an error for mismatched arguments */
  createError: (name: string, args: ArrayLike<unknown>, signatures: Signature[]) => TypedError;

  /** Handler called when no signature matches */
  onMismatch: MismatchHandler;

  /** Throw an error on mismatch (same as onMismatch default) */
  throwMismatchError: MismatchHandler;

  /** Counter for created typed functions */
  createCount: number;

  /** Whether to warn about deprecated this usage */
  warnAgainstDeprecatedThis: boolean;

  /** Internal: find a type by name (for testing) */
  _findType: (name: string) => TypeDef;
}

/**
 * Constant error message for non-typed-function arguments
 */
export const NOT_TYPED_FUNCTION = 'Argument is not a typed-function.';
