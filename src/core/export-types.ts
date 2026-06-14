/**
 * Export Types - Central Re-export Module
 *
 * This module re-exports all type definitions from their
 * respective modules for convenience.
 */

import type { TypeDef } from './types.js';

// Import arrays for combining
import { COMPLEX_TYPES } from './complex-types.js';
import { FRACTION_TYPES } from './fraction-types.js';
import { BIGDOUBLE_TYPES } from './bigdouble-types.js';
import { NUMERIC_TYPES } from './numeric-types.js';
import { VECTOR_TYPES } from './vector-types.js';
import { MATRIX_TYPES } from './matrix-types.js';
import { TENSOR_TYPES } from './tensor-types.js';
import { SPARSE_MATRIX_TYPES } from './sparse-matrix-types.js';
import { QUATERNION_TYPES } from './quaternion-types.js';
import { UNIT_TYPES } from './unit-types.js';
import { INTERVAL_TYPES } from './interval-types.js';
import { UNCERTAINTY_TYPES } from './uncertainty-types.js';
import { RANGE_TYPES } from './range-types.js';
import { POLYNOMIAL_TYPES } from './polynomial-types.js';
import { PARALLEL_TYPES } from './parallel-types.js';
import { ARRAY_TYPES } from './array-types.js';
import { GPU_TYPES } from './gpu-types.js';
import { DECIMAL_TYPES } from './decimal-types.js';

// Re-export complex types
export {
  type Complex,
  isComplex,
  COMPLEX_TYPES,
  complex,
} from './complex-types.js';

// Re-export fraction types
export {
  type Fraction,
  isFraction,
  FRACTION_TYPES,
  fraction,
} from './fraction-types.js';

// Re-export bigdouble types
export {
  type BigDouble,
  type BigDecimal,
  isBigDouble,
  isBigDecimal,
  BIGDOUBLE_TYPES,
  bigDouble,
  bigDecimal,
} from './bigdouble-types.js';

// Re-export all numeric types (integers and floats)
export {
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
} from './numeric-types.js';

// Re-export vector types
export {
  type Vector,
  isVector,
  VECTOR_TYPES,
  vector,
} from './vector-types.js';

// Re-export matrix types
export {
  type Matrix,
  isMatrix,
  MATRIX_TYPES,
  matrix,
} from './matrix-types.js';

// Re-export tensor types
export {
  type Tensor,
  isTensor,
  TENSOR_TYPES,
  tensor,
} from './tensor-types.js';

// Re-export sparse matrix types
export {
  type SparseMatrix,
  isSparseMatrix,
  SPARSE_MATRIX_TYPES,
} from './sparse-matrix-types.js';

// Re-export quaternion types
export {
  type Quaternion,
  isQuaternion,
  QUATERNION_TYPES,
  quaternion,
} from './quaternion-types.js';

// Re-export unit types
export {
  type Unit,
  isUnit,
  UNIT_TYPES,
  unit,
} from './unit-types.js';

// Re-export interval types
export {
  type Interval,
  isInterval,
  INTERVAL_TYPES,
  interval,
} from './interval-types.js';

// Re-export uncertainty types
export {
  type Uncertainty,
  isUncertainty,
  UNCERTAINTY_TYPES,
  uncertainty,
} from './uncertainty-types.js';

// Re-export range types
export {
  type Range,
  isRange,
  RANGE_TYPES,
  range,
} from './range-types.js';

// Re-export polynomial types
export {
  type Polynomial,
  isPolynomial,
  POLYNOMIAL_TYPES,
  polynomial,
} from './polynomial-types.js';

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

// Re-export all array types
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
  ARRAY_TYPES,
} from './array-types.js';

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

/**
 * Combined linear algebra types for backwards compatibility
 */
export const LINEAR_ALGEBRA_TYPES: TypeDef[] = [
  ...VECTOR_TYPES,
  ...MATRIX_TYPES,
  ...TENSOR_TYPES,
  ...SPARSE_MATRIX_TYPES,
  ...QUATERNION_TYPES,
];

/**
 * Combined measurement types for backwards compatibility
 */
export const MEASUREMENT_TYPES: TypeDef[] = [
  ...UNIT_TYPES,
  ...INTERVAL_TYPES,
  ...UNCERTAINTY_TYPES,
  ...RANGE_TYPES,
  ...POLYNOMIAL_TYPES,
];

/**
 * Alias for MEASUREMENT_TYPES for backwards compatibility
 */
export const SCIENTIFIC_TYPES: TypeDef[] = MEASUREMENT_TYPES;

/**
 * Alias for ARRAY_TYPES for backwards compatibility
 */
export const TYPED_ARRAY_TYPES: TypeDef[] = ARRAY_TYPES;

/**
 * All advanced types combined
 */
export const ADVANCED_TYPES: TypeDef[] = [
  ...COMPLEX_TYPES,
  ...FRACTION_TYPES,
  ...BIGDOUBLE_TYPES,
  ...NUMERIC_TYPES,
  ...LINEAR_ALGEBRA_TYPES,
  ...MEASUREMENT_TYPES,
  ...PARALLEL_TYPES,
  ...ARRAY_TYPES,
  ...GPU_TYPES,
  ...DECIMAL_TYPES,
];
