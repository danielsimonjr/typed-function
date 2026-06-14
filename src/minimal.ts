/**
 * typed-function Minimal Entry Point
 *
 * This is a lightweight entry point (~5KB) that provides core functionality
 * without WASM dispatch. Use this for smaller bundle sizes when WASM
 * acceleration is not needed.
 *
 * @example
 * ```ts
 * import typed from 'typed-function/minimal';
 *
 * const add = typed('add', {
 *   'number, number': (a, b) => a + b,
 *   'string, string': (a, b) => a + b,
 * });
 * ```
 */

// Re-export core types
// Import the default typed instance
import typedInstance from './factory.js';

export type {
  TypeDef,
  ConversionDef,
  Type,
  Param,
  Signature,
  SignatureFunction,
  TypedFunction,
  TypedFunctionData,
  ReferTo,
  ReferToSelf,
  FindSignatureOptions,
  AddConversionOptions,
  TypedError,
  TypedErrorData,
  TypeTest,
  SignatureTest,
  ArgConverter,
  MismatchHandler,
  TypedInstance,
} from './core/types.js';

export { NOT_TYPED_FUNCTION } from './core/types.js';

// Re-export type registry
export { TypeRegistry, BUILTIN_TYPES, createTypeRegistry } from './core/type-registry.js';
export type { InternalTypeDef } from './core/type-registry.js';

// Re-export error factory
export {
  createError,
  defaultOnMismatch,
  getParamAtIndex,
  paramTypeSet,
  mergeExpectedParams,
} from './core/error-factory.js';

// Re-export error classes
export {
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
} from './core/errors.js';

// Re-export signature parser
export {
  parseParam,
  parseSignature,
  stringifyParams,
} from './core/signature-parser.js';

// Re-export signature comparator
export {
  hasRestParam,
  compareParams,
  compareSignatures,
} from './core/signature-comparator.js';

// Re-export conversion manager
export { ConversionManager, createConversionManager } from './core/conversion-manager.js';

// Re-export reference resolver
export {
  isReferTo,
  isReferToSelf,
  makeReferTo,
  makeReferToSelf,
} from './core/reference-resolver.js';

// Re-export dispatcher components (without WASM)
export {
  createGenericDispatcher,
  createSimpleDispatcher,
} from './dispatch/generic-path.js';

export {
  createTypedFunction,
  checkName,
  mergeSignatures,
} from './dispatch/dispatcher.js';

// Re-export factory - this creates instances without WASM
export { create } from './factory.js';

// Re-export utility functions (minimal set)
export { last, initial } from './utils/array-helpers.js';
export { isPlainObject, hasOwnProperty } from './utils/object-helpers.js';

// Re-export scientific and advanced computing types
export {
  // Type definitions
  COMPLEX_TYPES,
  FRACTION_TYPES,
  BIGDOUBLE_TYPES,
  NUMERIC_TYPES,
  LINEAR_ALGEBRA_TYPES,
  SCIENTIFIC_TYPES,
  MEASUREMENT_TYPES,
  PARALLEL_TYPES,
  ARRAY_TYPES,
  TYPED_ARRAY_TYPES,
  GPU_TYPES,
  DECIMAL_TYPES,
  ADVANCED_TYPES,
  // Type test functions
  isComplex,
  isFraction,
  isBigDouble,
  isBigDecimal,
  isInt8,
  isInt16,
  isInt32,
  isInt64,
  isUInt8,
  isUInt16,
  isUInt32,
  isUInt64,
  isFloat32,
  isFloat64,
  isVector,
  isMatrix,
  isTensor,
  isSparseMatrix,
  isQuaternion,
  isUnit,
  isInterval,
  isUncertainty,
  isRange,
  isPolynomial,
  isFuture,
  isStream,
  isChannel,
  isSharedArray,
  isAtomicNumber,
  isTypedArray,
  isFloat32Array,
  isFloat64Array,
  isInt8Array,
  isInt16Array,
  isInt32Array,
  isUint8Array,
  isUint16Array,
  isUint32Array,
  isBigInt64Array,
  isBigUint64Array,
  isGPUBuffer,
  isGPUTensor,
  // Decimal type test functions
  isDecimal,
  isBigFloat,
  isDecimal32,
  isDecimal64,
  isDecimal128,
  isMoney,
  isFixedDecimal,
  isRational,
  // Factory functions
  complex,
  fraction,
  bigDouble,
  bigDecimal,
  vector,
  matrix,
  tensor,
  quaternion,
  unit,
  interval,
  uncertainty,
  range,
  polynomial,
  // Decimal factory functions
  bigFloat,
  decimal32,
  decimal64,
  decimal128,
  money,
  fixedDecimal,
  rational,
} from './core/export-types.js';

export type {
  Complex,
  Fraction,
  BigDouble,
  BigDecimal,
  Vector,
  Matrix,
  Tensor,
  SparseMatrix,
  Quaternion,
  Unit,
  Interval,
  Uncertainty,
  Range,
  Polynomial,
  Future,
  Stream,
  Channel,
  SharedArray,
  AtomicNumber,
  GPUBufferType,
  GPUTensor,
  // Decimal types
  Decimal,
  BigFloat,
  Decimal32,
  Decimal64,
  Decimal128,
  Money,
  FixedDecimal,
  Rational,
} from './core/export-types.js';

/**
 * Check if an entity is a typed function created by any instance
 */
export function isTypedFunction(entity: unknown): boolean {
  return entity !== null && typeof entity === 'function' && '_typedFunctionData' in entity;
}

// Default export: the default typed instance
export default typedInstance;
