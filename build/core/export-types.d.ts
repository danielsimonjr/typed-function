/**
 * Export Types - Central Re-export Module
 *
 * This module re-exports all type definitions from their
 * respective modules for convenience.
 */
import type { TypeDef } from './types.js';
export { type Complex, isComplex, COMPLEX_TYPES, complex, } from './complex-types.js';
export { type Fraction, isFraction, FRACTION_TYPES, fraction, } from './fraction-types.js';
export { type BigDouble, type BigDecimal, isBigDouble, isBigDecimal, BIGDOUBLE_TYPES, bigDouble, bigDecimal, } from './bigdouble-types.js';
export { isInt8, isInt16, isInt32, isInt64, isUInt8, isUInt16, isUInt32, isUInt64, isFloat32, isFloat64, NUMERIC_TYPES, } from './numeric-types.js';
export { type Vector, isVector, VECTOR_TYPES, vector, } from './vector-types.js';
export { type Matrix, isMatrix, MATRIX_TYPES, matrix, } from './matrix-types.js';
export { type Tensor, isTensor, TENSOR_TYPES, tensor, } from './tensor-types.js';
export { type SparseMatrix, isSparseMatrix, SPARSE_MATRIX_TYPES, } from './sparse-matrix-types.js';
export { type Quaternion, isQuaternion, QUATERNION_TYPES, quaternion, } from './quaternion-types.js';
export { type Unit, isUnit, UNIT_TYPES, unit, } from './unit-types.js';
export { type Interval, isInterval, INTERVAL_TYPES, interval, } from './interval-types.js';
export { type Uncertainty, isUncertainty, UNCERTAINTY_TYPES, uncertainty, } from './uncertainty-types.js';
export { type Range, isRange, RANGE_TYPES, range, } from './range-types.js';
export { type Polynomial, isPolynomial, POLYNOMIAL_TYPES, polynomial, } from './polynomial-types.js';
export { type Future, type Stream, type Channel, type SharedArray, type AtomicNumber, isFuture, isStream, isChannel, isSharedArray, isAtomicNumber, PARALLEL_TYPES, } from './parallel-types.js';
export { isTypedArray, isFloat32Array, isFloat64Array, isInt8Array, isInt16Array, isInt32Array, isUint8Array, isUint16Array, isUint32Array, isBigInt64Array, isBigUint64Array, ARRAY_TYPES, } from './array-types.js';
export { type GPUBufferType, type GPUTensor, isGPUBuffer, isGPUTensor, GPU_TYPES, } from './gpu-types.js';
export { type Decimal, type BigFloat, type Decimal32, type Decimal64, type Decimal128, type Money, type FixedDecimal, type Rational, isDecimal, isBigFloat, isDecimal32, isDecimal64, isDecimal128, isMoney, isFixedDecimal, isRational, DECIMAL_TYPES, bigFloat, decimal32, decimal64, decimal128, money, fixedDecimal, rational, } from './decimal-types.js';
/**
 * Combined linear algebra types for backwards compatibility
 */
export declare const LINEAR_ALGEBRA_TYPES: TypeDef[];
/**
 * Combined measurement types for backwards compatibility
 */
export declare const MEASUREMENT_TYPES: TypeDef[];
/**
 * Alias for MEASUREMENT_TYPES for backwards compatibility
 */
export declare const SCIENTIFIC_TYPES: TypeDef[];
/**
 * Alias for ARRAY_TYPES for backwards compatibility
 */
export declare const TYPED_ARRAY_TYPES: TypeDef[];
/**
 * All advanced types combined
 */
export declare const ADVANCED_TYPES: TypeDef[];
//# sourceMappingURL=export-types.d.ts.map