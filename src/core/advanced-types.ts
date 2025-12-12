/**
 * Advanced Types - Central Re-export Module
 *
 * This module re-exports all advanced type definitions from their
 * respective modules for convenience.
 */

import type { TypeDef } from './types.js';

// Re-export all numeric types
export {
  type Complex,
  type Fraction,
  type BigDecimal,
  isComplex,
  isFraction,
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
  NUMERIC_TYPES,
  complex,
  fraction,
  bigDecimal,
} from './numeric-types.js';

// Re-export all linear algebra types
export {
  type Vector,
  type Matrix,
  type Tensor,
  type SparseMatrix,
  type Quaternion,
  isVector,
  isMatrix,
  isTensor,
  isSparseMatrix,
  isQuaternion,
  LINEAR_ALGEBRA_TYPES,
  vector,
  matrix,
  tensor,
  quaternion,
} from './linear-algebra-types.js';

// Re-export all measurement types
export {
  type Unit,
  type Interval,
  type Uncertainty,
  type Range,
  type Polynomial,
  isUnit,
  isInterval,
  isUncertainty,
  isRange,
  isPolynomial,
  MEASUREMENT_TYPES,
  unit,
  interval,
  uncertainty,
  range,
  polynomial,
} from './measurement-types.js';

// Re-export all parallel types
export {
  type Future,
  type Stream,
  type Channel,
  type SharedArray,
  type AtomicNumber,
  isFuture,
  isStream,
  isChannel,
  isSharedArray,
  isAtomicNumber,
  PARALLEL_TYPES,
} from './parallel-types.js';

// Re-export all typed array types
export {
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
  TYPED_ARRAY_TYPES,
} from './typed-array-types.js';

// Re-export all GPU types
export {
  type GPUBufferType,
  type GPUTensor,
  isGPUBuffer,
  isGPUTensor,
  GPU_TYPES,
} from './gpu-types.js';

// Re-export all decimal types
export {
  type Decimal,
  type BigFloat,
  type Decimal32,
  type Decimal64,
  type Decimal128,
  type Money,
  type FixedDecimal,
  type Rational,
  isDecimal,
  isBigFloat,
  isDecimal32,
  isDecimal64,
  isDecimal128,
  isMoney,
  isFixedDecimal,
  isRational,
  DECIMAL_TYPES,
  bigFloat,
  decimal32,
  decimal64,
  decimal128,
  money,
  fixedDecimal,
  rational,
} from './decimal-types.js';

// Import arrays for combining
import { NUMERIC_TYPES } from './numeric-types.js';
import { LINEAR_ALGEBRA_TYPES } from './linear-algebra-types.js';
import { MEASUREMENT_TYPES } from './measurement-types.js';
import { PARALLEL_TYPES } from './parallel-types.js';
import { TYPED_ARRAY_TYPES } from './typed-array-types.js';
import { GPU_TYPES } from './gpu-types.js';
import { DECIMAL_TYPES } from './decimal-types.js';

/**
 * Alias for MEASUREMENT_TYPES for backwards compatibility
 */
export const SCIENTIFIC_TYPES: TypeDef[] = MEASUREMENT_TYPES;

/**
 * All advanced types combined
 */
export const ADVANCED_TYPES: TypeDef[] = [
  ...NUMERIC_TYPES,
  ...LINEAR_ALGEBRA_TYPES,
  ...MEASUREMENT_TYPES,
  ...PARALLEL_TYPES,
  ...TYPED_ARRAY_TYPES,
  ...GPU_TYPES,
  ...DECIMAL_TYPES,
];
