/**
 * Scientific and Advanced Computing Types for typed-function
 *
 * This module provides type definitions for scientific computing,
 * linear algebra, parallel computing, and GPU/SIMD operations.
 */

import type { TypeDef } from './types.js';

// =============================================================================
// Type Interfaces for Scientific Computing
// =============================================================================

/**
 * Complex number interface
 */
export interface Complex {
  re: number;
  im: number;
}

/**
 * Fraction (rational number) interface
 */
export interface Fraction {
  numerator: number | bigint;
  denominator: number | bigint;
}

/**
 * BigDecimal interface for arbitrary precision decimals
 */
export interface BigDecimal {
  value: bigint;
  scale: number;
}

/**
 * Vector interface for linear algebra
 */
export interface Vector {
  data: number[] | Float32Array | Float64Array;
  length: number;
}

/**
 * Matrix interface for linear algebra
 */
export interface Matrix {
  data: number[] | Float32Array | Float64Array;
  rows: number;
  cols: number;
}

/**
 * Tensor interface for N-dimensional arrays
 */
export interface Tensor {
  data: number[] | Float32Array | Float64Array;
  shape: number[];
  strides?: number[];
}

/**
 * Sparse matrix in COO (Coordinate) format
 */
export interface SparseMatrix {
  rows: number[];
  cols: number[];
  values: number[];
  shape: [number, number];
}

/**
 * Quaternion for 3D rotations
 */
export interface Quaternion {
  w: number;
  x: number;
  y: number;
  z: number;
}

/**
 * Value with physical unit
 */
export interface Unit<T = number> {
  value: T;
  unit: string;
}

/**
 * Interval for interval arithmetic
 */
export interface Interval {
  low: number;
  high: number;
}

/**
 * Value with uncertainty/error bounds
 */
export interface Uncertainty {
  value: number;
  uncertainty: number;
}

/**
 * Numeric range with step
 */
export interface Range {
  start: number;
  end: number;
  step?: number;
}

/**
 * Polynomial represented by coefficients
 */
export interface Polynomial {
  coefficients: number[];
  variable?: string;
}

/**
 * Future/Promise-like for async computation
 */
export interface Future<T = unknown> {
  then: (onFulfilled?: (value: T) => unknown) => Future;
  catch?: (onRejected?: (reason: unknown) => unknown) => Future;
}

/**
 * Stream for lazy/infinite sequences
 */
export interface Stream<T = unknown> {
  next: () => { value: T; done: boolean } | { done: true };
  [Symbol.iterator]?: () => Iterator<T>;
}

/**
 * Channel for CSP-style communication
 */
export interface Channel<T = unknown> {
  send: (value: T) => Promise<void> | void;
  receive: () => Promise<T> | T;
  close?: () => void;
}

/**
 * Shared array for parallel workers
 */
export interface SharedArray {
  buffer: SharedArrayBuffer;
  length: number;
}

/**
 * Atomic number for thread-safe operations
 */
export interface AtomicNumber {
  value: number | bigint;
  buffer: SharedArrayBuffer;
}

/**
 * GPU buffer interface
 */
export interface GPUBuffer {
  size: number;
  usage: number;
  mapState?: string;
}

/**
 * GPU tensor for GPU-accelerated computation
 */
export interface GPUTensor {
  shape: number[];
  dtype: string;
  device: string;
}

// =============================================================================
// Type Test Functions
// =============================================================================

/**
 * Test if value is a Complex number
 */
export function isComplex(x: unknown): x is Complex {
  return (
    x !== null &&
    typeof x === 'object' &&
    're' in x &&
    'im' in x &&
    typeof (x as Complex).re === 'number' &&
    typeof (x as Complex).im === 'number'
  );
}

/**
 * Test if value is a Fraction
 */
export function isFraction(x: unknown): x is Fraction {
  if (x === null || typeof x !== 'object') return false;
  const f = x as Fraction;
  return (
    'numerator' in f &&
    'denominator' in f &&
    (typeof f.numerator === 'number' || typeof f.numerator === 'bigint') &&
    (typeof f.denominator === 'number' || typeof f.denominator === 'bigint')
  );
}

/**
 * Test if value is a BigDecimal
 */
export function isBigDecimal(x: unknown): x is BigDecimal {
  if (x === null || typeof x !== 'object') return false;
  const bd = x as BigDecimal;
  return 'value' in bd && 'scale' in bd && typeof bd.value === 'bigint' && typeof bd.scale === 'number';
}

/**
 * Test if value is an Int8
 */
export function isInt8(x: unknown): x is number {
  return typeof x === 'number' && Number.isInteger(x) && x >= -128 && x <= 127;
}

/**
 * Test if value is an Int16
 */
export function isInt16(x: unknown): x is number {
  return typeof x === 'number' && Number.isInteger(x) && x >= -32768 && x <= 32767;
}

/**
 * Test if value is an Int32
 */
export function isInt32(x: unknown): x is number {
  return typeof x === 'number' && Number.isInteger(x) && x >= -2147483648 && x <= 2147483647;
}

/**
 * Test if value is an Int64 (using BigInt)
 */
export function isInt64(x: unknown): x is bigint {
  if (typeof x !== 'bigint') return false;
  const MIN = BigInt('-9223372036854775808');
  const MAX = BigInt('9223372036854775807');
  return x >= MIN && x <= MAX;
}

/**
 * Test if value is a UInt8
 */
export function isUInt8(x: unknown): x is number {
  return typeof x === 'number' && Number.isInteger(x) && x >= 0 && x <= 255;
}

/**
 * Test if value is a UInt16
 */
export function isUInt16(x: unknown): x is number {
  return typeof x === 'number' && Number.isInteger(x) && x >= 0 && x <= 65535;
}

/**
 * Test if value is a UInt32
 */
export function isUInt32(x: unknown): x is number {
  return typeof x === 'number' && Number.isInteger(x) && x >= 0 && x <= 4294967295;
}

/**
 * Test if value is a UInt64 (using BigInt)
 */
export function isUInt64(x: unknown): x is bigint {
  if (typeof x !== 'bigint') return false;
  const MAX = BigInt('18446744073709551615');
  return x >= BigInt(0) && x <= MAX;
}

/**
 * Test if value is a Float32 (any number, conceptually 32-bit)
 */
export function isFloat32(x: unknown): x is number {
  return typeof x === 'number' && !Number.isNaN(x);
}

/**
 * Test if value is a Float64 (any number)
 */
export function isFloat64(x: unknown): x is number {
  return typeof x === 'number';
}

/**
 * Test if value is a Vector
 */
export function isVector(x: unknown): x is Vector {
  if (x === null || typeof x !== 'object') return false;
  const v = x as Vector;
  return (
    'data' in v &&
    'length' in v &&
    typeof v.length === 'number' &&
    (Array.isArray(v.data) || v.data instanceof Float32Array || v.data instanceof Float64Array)
  );
}

/**
 * Test if value is a Matrix
 */
export function isMatrix(x: unknown): x is Matrix {
  if (x === null || typeof x !== 'object') return false;
  const m = x as Matrix;
  return (
    'data' in m &&
    'rows' in m &&
    'cols' in m &&
    typeof m.rows === 'number' &&
    typeof m.cols === 'number' &&
    (Array.isArray(m.data) || m.data instanceof Float32Array || m.data instanceof Float64Array)
  );
}

/**
 * Test if value is a Tensor
 */
export function isTensor(x: unknown): x is Tensor {
  if (x === null || typeof x !== 'object') return false;
  const t = x as Tensor;
  return (
    'data' in t &&
    'shape' in t &&
    Array.isArray(t.shape) &&
    (Array.isArray(t.data) || t.data instanceof Float32Array || t.data instanceof Float64Array)
  );
}

/**
 * Test if value is a SparseMatrix
 */
export function isSparseMatrix(x: unknown): x is SparseMatrix {
  if (x === null || typeof x !== 'object') return false;
  const s = x as SparseMatrix;
  return (
    'rows' in s &&
    'cols' in s &&
    'values' in s &&
    'shape' in s &&
    Array.isArray(s.rows) &&
    Array.isArray(s.cols) &&
    Array.isArray(s.values) &&
    Array.isArray(s.shape) &&
    s.shape.length === 2
  );
}

/**
 * Test if value is a Quaternion
 */
export function isQuaternion(x: unknown): x is Quaternion {
  if (x === null || typeof x !== 'object') return false;
  const q = x as Quaternion;
  return (
    'w' in q &&
    'x' in q &&
    'y' in q &&
    'z' in q &&
    typeof q.w === 'number' &&
    typeof q.x === 'number' &&
    typeof q.y === 'number' &&
    typeof q.z === 'number'
  );
}

/**
 * Test if value is a Unit
 */
export function isUnit(x: unknown): x is Unit {
  if (x === null || typeof x !== 'object') return false;
  const u = x as Unit;
  return 'value' in u && 'unit' in u && typeof u.unit === 'string';
}

/**
 * Test if value is an Interval
 */
export function isInterval(x: unknown): x is Interval {
  if (x === null || typeof x !== 'object') return false;
  const i = x as Interval;
  return 'low' in i && 'high' in i && typeof i.low === 'number' && typeof i.high === 'number';
}

/**
 * Test if value is an Uncertainty
 */
export function isUncertainty(x: unknown): x is Uncertainty {
  if (x === null || typeof x !== 'object') return false;
  const u = x as Uncertainty;
  return (
    'value' in u && 'uncertainty' in u && typeof u.value === 'number' && typeof u.uncertainty === 'number'
  );
}

/**
 * Test if value is a Range
 */
export function isRange(x: unknown): x is Range {
  if (x === null || typeof x !== 'object') return false;
  const r = x as Range;
  return 'start' in r && 'end' in r && typeof r.start === 'number' && typeof r.end === 'number';
}

/**
 * Test if value is a Polynomial
 */
export function isPolynomial(x: unknown): x is Polynomial {
  if (x === null || typeof x !== 'object') return false;
  const p = x as Polynomial;
  return 'coefficients' in p && Array.isArray(p.coefficients);
}

/**
 * Test if value is a Future/Promise-like
 */
export function isFuture(x: unknown): x is Future {
  return x !== null && typeof x === 'object' && 'then' in x && typeof (x as Future).then === 'function';
}

/**
 * Test if value is a Stream
 */
export function isStream(x: unknown): x is Stream {
  return x !== null && typeof x === 'object' && 'next' in x && typeof (x as Stream).next === 'function';
}

/**
 * Test if value is a Channel
 */
export function isChannel(x: unknown): x is Channel {
  if (x === null || typeof x !== 'object') return false;
  const c = x as Channel;
  return 'send' in c && 'receive' in c && typeof c.send === 'function' && typeof c.receive === 'function';
}

/**
 * Test if value is a SharedArray
 */
export function isSharedArray(x: unknown): x is SharedArray {
  if (x === null || typeof x !== 'object') return false;
  const s = x as SharedArray;
  return (
    'buffer' in s &&
    'length' in s &&
    typeof s.length === 'number' &&
    typeof SharedArrayBuffer !== 'undefined' &&
    s.buffer instanceof SharedArrayBuffer
  );
}

/**
 * Test if value is an AtomicNumber
 */
export function isAtomicNumber(x: unknown): x is AtomicNumber {
  if (x === null || typeof x !== 'object') return false;
  const a = x as AtomicNumber;
  return (
    'value' in a &&
    'buffer' in a &&
    (typeof a.value === 'number' || typeof a.value === 'bigint') &&
    typeof SharedArrayBuffer !== 'undefined' &&
    a.buffer instanceof SharedArrayBuffer
  );
}

/**
 * Test if value is a TypedArray (any variant)
 */
export function isTypedArray(
  x: unknown
): x is
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array
  | BigInt64Array
  | BigUint64Array {
  return (
    x instanceof Int8Array ||
    x instanceof Uint8Array ||
    x instanceof Int16Array ||
    x instanceof Uint16Array ||
    x instanceof Int32Array ||
    x instanceof Uint32Array ||
    x instanceof Float32Array ||
    x instanceof Float64Array ||
    x instanceof BigInt64Array ||
    x instanceof BigUint64Array
  );
}

/**
 * Test if value is a Float32Array
 */
export function isFloat32Array(x: unknown): x is Float32Array {
  return x instanceof Float32Array;
}

/**
 * Test if value is a Float64Array
 */
export function isFloat64Array(x: unknown): x is Float64Array {
  return x instanceof Float64Array;
}

/**
 * Test if value is an Int8Array
 */
export function isInt8Array(x: unknown): x is Int8Array {
  return x instanceof Int8Array;
}

/**
 * Test if value is an Int16Array
 */
export function isInt16Array(x: unknown): x is Int16Array {
  return x instanceof Int16Array;
}

/**
 * Test if value is an Int32Array
 */
export function isInt32Array(x: unknown): x is Int32Array {
  return x instanceof Int32Array;
}

/**
 * Test if value is a Uint8Array
 */
export function isUint8Array(x: unknown): x is Uint8Array {
  return x instanceof Uint8Array;
}

/**
 * Test if value is a Uint16Array
 */
export function isUint16Array(x: unknown): x is Uint16Array {
  return x instanceof Uint16Array;
}

/**
 * Test if value is a Uint32Array
 */
export function isUint32Array(x: unknown): x is Uint32Array {
  return x instanceof Uint32Array;
}

/**
 * Test if value is a BigInt64Array
 */
export function isBigInt64Array(x: unknown): x is BigInt64Array {
  return x instanceof BigInt64Array;
}

/**
 * Test if value is a BigUint64Array
 */
export function isBigUint64Array(x: unknown): x is BigUint64Array {
  return x instanceof BigUint64Array;
}

/**
 * Test if value is a GPUBuffer (WebGPU)
 */
export function isGPUBuffer(x: unknown): x is GPUBuffer {
  if (x === null || typeof x !== 'object') return false;
  const b = x as GPUBuffer;
  return 'size' in b && 'usage' in b && typeof b.size === 'number' && typeof b.usage === 'number';
}

/**
 * Test if value is a GPUTensor
 */
export function isGPUTensor(x: unknown): x is GPUTensor {
  if (x === null || typeof x !== 'object') return false;
  const t = x as GPUTensor;
  return (
    'shape' in t &&
    'dtype' in t &&
    'device' in t &&
    Array.isArray(t.shape) &&
    typeof t.dtype === 'string' &&
    typeof t.device === 'string'
  );
}

// =============================================================================
// Type Definitions for Registration
// =============================================================================

/**
 * Numeric types for scientific computing
 */
export const NUMERIC_TYPES: TypeDef[] = [
  { name: 'Complex', test: isComplex },
  { name: 'Fraction', test: isFraction },
  { name: 'BigDecimal', test: isBigDecimal },
  { name: 'Int8', test: isInt8 },
  { name: 'Int16', test: isInt16 },
  { name: 'Int32', test: isInt32 },
  { name: 'Int64', test: isInt64 },
  { name: 'UInt8', test: isUInt8 },
  { name: 'UInt16', test: isUInt16 },
  { name: 'UInt32', test: isUInt32 },
  { name: 'UInt64', test: isUInt64 },
  { name: 'Float32', test: isFloat32 },
  { name: 'Float64', test: isFloat64 },
];

/**
 * Linear algebra types
 */
export const LINEAR_ALGEBRA_TYPES: TypeDef[] = [
  { name: 'Vector', test: isVector },
  { name: 'Matrix', test: isMatrix },
  { name: 'Tensor', test: isTensor },
  { name: 'SparseMatrix', test: isSparseMatrix },
  { name: 'Quaternion', test: isQuaternion },
];

/**
 * Scientific measurement types
 */
export const SCIENTIFIC_TYPES: TypeDef[] = [
  { name: 'Unit', test: isUnit },
  { name: 'Interval', test: isInterval },
  { name: 'Uncertainty', test: isUncertainty },
  { name: 'Range', test: isRange },
  { name: 'Polynomial', test: isPolynomial },
];

/**
 * Parallel/concurrent computing types
 */
export const PARALLEL_TYPES: TypeDef[] = [
  { name: 'Future', test: isFuture },
  { name: 'Stream', test: isStream },
  { name: 'Channel', test: isChannel },
  { name: 'SharedArray', test: isSharedArray },
  { name: 'AtomicNumber', test: isAtomicNumber },
];

/**
 * TypedArray types
 */
export const TYPED_ARRAY_TYPES: TypeDef[] = [
  { name: 'TypedArray', test: isTypedArray },
  { name: 'Int8Array', test: isInt8Array },
  { name: 'Int16Array', test: isInt16Array },
  { name: 'Int32Array', test: isInt32Array },
  { name: 'Uint8Array', test: isUint8Array },
  { name: 'Uint16Array', test: isUint16Array },
  { name: 'Uint32Array', test: isUint32Array },
  { name: 'Float32Array', test: isFloat32Array },
  { name: 'Float64Array', test: isFloat64Array },
  { name: 'BigInt64Array', test: isBigInt64Array },
  { name: 'BigUint64Array', test: isBigUint64Array },
];

/**
 * GPU/SIMD types
 */
export const GPU_TYPES: TypeDef[] = [
  { name: 'GPUBuffer', test: isGPUBuffer },
  { name: 'GPUTensor', test: isGPUTensor },
];

/**
 * All advanced types combined
 */
export const ADVANCED_TYPES: TypeDef[] = [
  ...NUMERIC_TYPES,
  ...LINEAR_ALGEBRA_TYPES,
  ...SCIENTIFIC_TYPES,
  ...PARALLEL_TYPES,
  ...TYPED_ARRAY_TYPES,
  ...GPU_TYPES,
];

// =============================================================================
// Helper Functions for Creating Values
// =============================================================================

/**
 * Create a Complex number
 */
export function complex(re: number, im: number = 0): Complex {
  return { re, im };
}

/**
 * Create a Fraction
 */
export function fraction(numerator: number | bigint, denominator: number | bigint = 1): Fraction {
  return { numerator, denominator };
}

/**
 * Create a BigDecimal
 */
export function bigDecimal(value: bigint, scale: number = 0): BigDecimal {
  return { value, scale };
}

/**
 * Create a Vector
 */
export function vector(data: number[] | Float32Array | Float64Array): Vector {
  return { data, length: data.length };
}

/**
 * Create a Matrix
 */
export function matrix(data: number[] | Float32Array | Float64Array, rows: number, cols: number): Matrix {
  return { data, rows, cols };
}

/**
 * Create a Tensor
 */
export function tensor(data: number[] | Float32Array | Float64Array, shape: number[]): Tensor {
  return { data, shape };
}

/**
 * Create a Quaternion
 */
export function quaternion(w: number, x: number, y: number, z: number): Quaternion {
  return { w, x, y, z };
}

/**
 * Create a Unit value
 */
export function unit<T = number>(value: T, unitStr: string): Unit<T> {
  return { value, unit: unitStr };
}

/**
 * Create an Interval
 */
export function interval(low: number, high: number): Interval {
  return { low, high };
}

/**
 * Create an Uncertainty value
 */
export function uncertainty(value: number, error: number): Uncertainty {
  return { value, uncertainty: error };
}

/**
 * Create a Range
 */
export function range(start: number, end: number, step?: number): Range {
  if (step !== undefined) {
    return { start, end, step };
  }
  return { start, end };
}

/**
 * Create a Polynomial from coefficients
 */
export function polynomial(coefficients: number[], variable: string = 'x'): Polynomial {
  return { coefficients, variable };
}
