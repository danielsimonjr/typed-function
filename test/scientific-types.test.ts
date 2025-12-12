/**
 * Tests for scientific and advanced computing types
 */

import { describe, it, expect, beforeEach } from 'vitest';
import typed, { create } from '../src/index.js';
import {
  // Type definitions
  NUMERIC_TYPES,
  LINEAR_ALGEBRA_TYPES,
  SCIENTIFIC_TYPES,
  PARALLEL_TYPES,
  TYPED_ARRAY_TYPES,
  GPU_TYPES,
  DECIMAL_TYPES,
  ADVANCED_TYPES,
  // Type test functions
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
  // Factory functions
  complex,
  fraction,
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
  // Types
  type Complex,
  type Fraction,
  type BigDecimal,
  type Vector,
  type Matrix,
  type Tensor,
  type SparseMatrix,
  type Quaternion,
  type Unit,
  type Interval,
  type Uncertainty,
  type Range,
  type Polynomial,
  type Future,
  type Stream,
  type Channel,
  type SharedArray,
  type AtomicNumber,
  type GPUBufferType,
  type GPUTensor,
} from '../src/index.js';

describe('Scientific Types - Type Definitions', () => {
  it('should export NUMERIC_TYPES array', () => {
    expect(NUMERIC_TYPES).toBeDefined();
    expect(Array.isArray(NUMERIC_TYPES)).toBe(true);
    expect(NUMERIC_TYPES.length).toBeGreaterThan(0);

    const names = NUMERIC_TYPES.map((t) => t.name);
    expect(names).toContain('Complex');
    expect(names).toContain('Fraction');
    expect(names).toContain('BigDecimal');
    expect(names).toContain('Int8');
    expect(names).toContain('Int16');
    expect(names).toContain('Int32');
    expect(names).toContain('Int64');
    expect(names).toContain('UInt8');
    expect(names).toContain('UInt16');
    expect(names).toContain('UInt32');
    expect(names).toContain('UInt64');
    expect(names).toContain('Float32');
    expect(names).toContain('Float64');
  });

  it('should export LINEAR_ALGEBRA_TYPES array', () => {
    expect(LINEAR_ALGEBRA_TYPES).toBeDefined();
    expect(Array.isArray(LINEAR_ALGEBRA_TYPES)).toBe(true);

    const names = LINEAR_ALGEBRA_TYPES.map((t) => t.name);
    expect(names).toContain('Vector');
    expect(names).toContain('Matrix');
    expect(names).toContain('Tensor');
    expect(names).toContain('SparseMatrix');
    expect(names).toContain('Quaternion');
  });

  it('should export SCIENTIFIC_TYPES array', () => {
    expect(SCIENTIFIC_TYPES).toBeDefined();
    expect(Array.isArray(SCIENTIFIC_TYPES)).toBe(true);

    const names = SCIENTIFIC_TYPES.map((t) => t.name);
    expect(names).toContain('Unit');
    expect(names).toContain('Interval');
    expect(names).toContain('Uncertainty');
    expect(names).toContain('Range');
    expect(names).toContain('Polynomial');
  });

  it('should export PARALLEL_TYPES array', () => {
    expect(PARALLEL_TYPES).toBeDefined();
    expect(Array.isArray(PARALLEL_TYPES)).toBe(true);

    const names = PARALLEL_TYPES.map((t) => t.name);
    expect(names).toContain('Future');
    expect(names).toContain('Stream');
    expect(names).toContain('Channel');
    expect(names).toContain('SharedArray');
    expect(names).toContain('AtomicNumber');
  });

  it('should export TYPED_ARRAY_TYPES array', () => {
    expect(TYPED_ARRAY_TYPES).toBeDefined();
    expect(Array.isArray(TYPED_ARRAY_TYPES)).toBe(true);

    const names = TYPED_ARRAY_TYPES.map((t) => t.name);
    expect(names).toContain('TypedArray');
    expect(names).toContain('Int8Array');
    expect(names).toContain('Float64Array');
  });

  it('should export GPU_TYPES array', () => {
    expect(GPU_TYPES).toBeDefined();
    expect(Array.isArray(GPU_TYPES)).toBe(true);

    const names = GPU_TYPES.map((t) => t.name);
    expect(names).toContain('GPUBuffer');
    expect(names).toContain('GPUTensor');
  });

  it('should export ADVANCED_TYPES combining all types', () => {
    expect(ADVANCED_TYPES).toBeDefined();
    expect(ADVANCED_TYPES.length).toBe(
      NUMERIC_TYPES.length +
        LINEAR_ALGEBRA_TYPES.length +
        SCIENTIFIC_TYPES.length +
        PARALLEL_TYPES.length +
        TYPED_ARRAY_TYPES.length +
        GPU_TYPES.length +
        DECIMAL_TYPES.length
    );
  });
});

describe('Numeric Types - Test Functions', () => {
  describe('isComplex', () => {
    it('should return true for valid complex numbers', () => {
      expect(isComplex({ re: 1, im: 2 })).toBe(true);
      expect(isComplex({ re: 0, im: 0 })).toBe(true);
      expect(isComplex({ re: -3.14, im: 2.71 })).toBe(true);
    });

    it('should return false for invalid values', () => {
      expect(isComplex(null)).toBe(false);
      expect(isComplex(undefined)).toBe(false);
      expect(isComplex({ re: 1 })).toBe(false);
      expect(isComplex({ im: 1 })).toBe(false);
      expect(isComplex({ re: '1', im: 2 })).toBe(false);
      expect(isComplex(123)).toBe(false);
    });
  });

  describe('isFraction', () => {
    it('should return true for valid fractions', () => {
      expect(isFraction({ numerator: 1, denominator: 2 })).toBe(true);
      expect(isFraction({ numerator: BigInt(1), denominator: BigInt(2) })).toBe(true);
      expect(isFraction({ numerator: 1, denominator: BigInt(3) })).toBe(true);
    });

    it('should return false for invalid values', () => {
      expect(isFraction(null)).toBe(false);
      expect(isFraction({ numerator: 1 })).toBe(false);
      expect(isFraction({ numerator: '1', denominator: 2 })).toBe(false);
    });
  });

  describe('isBigDecimal', () => {
    it('should return true for valid BigDecimals', () => {
      expect(isBigDecimal({ value: BigInt(123), scale: 2 })).toBe(true);
      expect(isBigDecimal({ value: BigInt(0), scale: 0 })).toBe(true);
    });

    it('should return false for invalid values', () => {
      expect(isBigDecimal(null)).toBe(false);
      expect(isBigDecimal({ value: 123, scale: 2 })).toBe(false);
      expect(isBigDecimal({ value: BigInt(123), scale: '2' })).toBe(false);
    });
  });

  describe('isInt8', () => {
    it('should return true for valid Int8 values', () => {
      expect(isInt8(0)).toBe(true);
      expect(isInt8(-128)).toBe(true);
      expect(isInt8(127)).toBe(true);
    });

    it('should return false for invalid values', () => {
      expect(isInt8(-129)).toBe(false);
      expect(isInt8(128)).toBe(false);
      expect(isInt8(1.5)).toBe(false);
      expect(isInt8('1')).toBe(false);
    });
  });

  describe('isInt16', () => {
    it('should return true for valid Int16 values', () => {
      expect(isInt16(0)).toBe(true);
      expect(isInt16(-32768)).toBe(true);
      expect(isInt16(32767)).toBe(true);
    });

    it('should return false for out of range values', () => {
      expect(isInt16(-32769)).toBe(false);
      expect(isInt16(32768)).toBe(false);
    });
  });

  describe('isInt32', () => {
    it('should return true for valid Int32 values', () => {
      expect(isInt32(0)).toBe(true);
      expect(isInt32(-2147483648)).toBe(true);
      expect(isInt32(2147483647)).toBe(true);
    });

    it('should return false for out of range values', () => {
      expect(isInt32(-2147483649)).toBe(false);
      expect(isInt32(2147483648)).toBe(false);
    });
  });

  describe('isInt64', () => {
    it('should return true for valid Int64 values', () => {
      expect(isInt64(BigInt(0))).toBe(true);
      expect(isInt64(BigInt('-9223372036854775808'))).toBe(true);
      expect(isInt64(BigInt('9223372036854775807'))).toBe(true);
    });

    it('should return false for non-bigint values', () => {
      expect(isInt64(0)).toBe(false);
      expect(isInt64('0')).toBe(false);
    });
  });

  describe('isUInt8', () => {
    it('should return true for valid UInt8 values', () => {
      expect(isUInt8(0)).toBe(true);
      expect(isUInt8(255)).toBe(true);
    });

    it('should return false for invalid values', () => {
      expect(isUInt8(-1)).toBe(false);
      expect(isUInt8(256)).toBe(false);
    });
  });

  describe('isUInt16', () => {
    it('should return true for valid UInt16 values', () => {
      expect(isUInt16(0)).toBe(true);
      expect(isUInt16(65535)).toBe(true);
    });

    it('should return false for out of range values', () => {
      expect(isUInt16(-1)).toBe(false);
      expect(isUInt16(65536)).toBe(false);
    });
  });

  describe('isUInt32', () => {
    it('should return true for valid UInt32 values', () => {
      expect(isUInt32(0)).toBe(true);
      expect(isUInt32(4294967295)).toBe(true);
    });

    it('should return false for out of range values', () => {
      expect(isUInt32(-1)).toBe(false);
      expect(isUInt32(4294967296)).toBe(false);
    });
  });

  describe('isUInt64', () => {
    it('should return true for valid UInt64 values', () => {
      expect(isUInt64(BigInt(0))).toBe(true);
      expect(isUInt64(BigInt('18446744073709551615'))).toBe(true);
    });

    it('should return false for negative or non-bigint', () => {
      expect(isUInt64(BigInt(-1))).toBe(false);
      expect(isUInt64(0)).toBe(false);
    });
  });

  describe('isFloat32 / isFloat64', () => {
    it('should return true for number values', () => {
      expect(isFloat32(3.14)).toBe(true);
      expect(isFloat64(3.14)).toBe(true);
      expect(isFloat32(Infinity)).toBe(true);
      expect(isFloat64(-Infinity)).toBe(true);
    });

    it('isFloat32 should return false for NaN', () => {
      expect(isFloat32(NaN)).toBe(false);
    });

    it('isFloat64 should return true for NaN', () => {
      expect(isFloat64(NaN)).toBe(true);
    });
  });
});

describe('Linear Algebra Types - Test Functions', () => {
  describe('isVector', () => {
    it('should return true for valid vectors', () => {
      expect(isVector({ data: [1, 2, 3], length: 3 })).toBe(true);
      expect(isVector({ data: new Float32Array([1, 2]), length: 2 })).toBe(true);
      expect(isVector({ data: new Float64Array([1]), length: 1 })).toBe(true);
    });

    it('should return false for invalid vectors', () => {
      expect(isVector(null)).toBe(false);
      expect(isVector({ data: [1, 2] })).toBe(false);
      expect(isVector({ length: 2 })).toBe(false);
      expect(isVector({ data: 'not array', length: 1 })).toBe(false);
    });
  });

  describe('isMatrix', () => {
    it('should return true for valid matrices', () => {
      expect(isMatrix({ data: [1, 2, 3, 4], rows: 2, cols: 2 })).toBe(true);
      expect(isMatrix({ data: new Float64Array([1, 2, 3, 4, 5, 6]), rows: 2, cols: 3 })).toBe(true);
    });

    it('should return false for invalid matrices', () => {
      expect(isMatrix(null)).toBe(false);
      expect(isMatrix({ data: [1, 2], rows: 2 })).toBe(false);
      expect(isMatrix({ data: [1, 2], cols: 2 })).toBe(false);
    });
  });

  describe('isTensor', () => {
    it('should return true for valid tensors', () => {
      expect(isTensor({ data: [1, 2, 3, 4, 5, 6], shape: [2, 3] })).toBe(true);
      expect(isTensor({ data: new Float32Array(24), shape: [2, 3, 4] })).toBe(true);
      expect(isTensor({ data: [1], shape: [1], strides: [1] })).toBe(true);
    });

    it('should return false for invalid tensors', () => {
      expect(isTensor(null)).toBe(false);
      expect(isTensor({ data: [1, 2] })).toBe(false);
      expect(isTensor({ shape: [2, 3] })).toBe(false);
    });
  });

  describe('isSparseMatrix', () => {
    it('should return true for valid sparse matrices', () => {
      expect(
        isSparseMatrix({
          rows: [0, 1, 2],
          cols: [0, 1, 2],
          values: [1, 2, 3],
          shape: [3, 3],
        })
      ).toBe(true);
    });

    it('should return false for invalid sparse matrices', () => {
      expect(isSparseMatrix(null)).toBe(false);
      expect(isSparseMatrix({ rows: [0], cols: [0], values: [1] })).toBe(false);
      expect(isSparseMatrix({ rows: [0], cols: [0], values: [1], shape: [3] })).toBe(false);
    });
  });

  describe('isQuaternion', () => {
    it('should return true for valid quaternions', () => {
      expect(isQuaternion({ w: 1, x: 0, y: 0, z: 0 })).toBe(true);
      expect(isQuaternion({ w: 0.707, x: 0.707, y: 0, z: 0 })).toBe(true);
    });

    it('should return false for invalid quaternions', () => {
      expect(isQuaternion(null)).toBe(false);
      expect(isQuaternion({ w: 1, x: 0, y: 0 })).toBe(false);
      expect(isQuaternion({ w: '1', x: 0, y: 0, z: 0 })).toBe(false);
    });
  });
});

describe('Scientific Types - Test Functions', () => {
  describe('isUnit', () => {
    it('should return true for valid units', () => {
      expect(isUnit({ value: 10, unit: 'meter' })).toBe(true);
      expect(isUnit({ value: 3.14, unit: 'radian' })).toBe(true);
      expect(isUnit({ value: 'text', unit: 'string' })).toBe(true);
    });

    it('should return false for invalid units', () => {
      expect(isUnit(null)).toBe(false);
      expect(isUnit({ value: 10 })).toBe(false);
      expect(isUnit({ unit: 'meter' })).toBe(false);
      expect(isUnit({ value: 10, unit: 123 })).toBe(false);
    });
  });

  describe('isInterval', () => {
    it('should return true for valid intervals', () => {
      expect(isInterval({ low: 0, high: 10 })).toBe(true);
      expect(isInterval({ low: -1.5, high: 1.5 })).toBe(true);
    });

    it('should return false for invalid intervals', () => {
      expect(isInterval(null)).toBe(false);
      expect(isInterval({ low: 0 })).toBe(false);
      expect(isInterval({ low: '0', high: 10 })).toBe(false);
    });
  });

  describe('isUncertainty', () => {
    it('should return true for valid uncertainty values', () => {
      expect(isUncertainty({ value: 9.81, uncertainty: 0.02 })).toBe(true);
      expect(isUncertainty({ value: 3.14159, uncertainty: 0.00001 })).toBe(true);
    });

    it('should return false for invalid values', () => {
      expect(isUncertainty(null)).toBe(false);
      expect(isUncertainty({ value: 9.81 })).toBe(false);
      expect(isUncertainty({ value: '9.81', uncertainty: 0.02 })).toBe(false);
    });
  });

  describe('isRange', () => {
    it('should return true for valid ranges', () => {
      expect(isRange({ start: 0, end: 10 })).toBe(true);
      expect(isRange({ start: 0, end: 100, step: 5 })).toBe(true);
    });

    it('should return false for invalid ranges', () => {
      expect(isRange(null)).toBe(false);
      expect(isRange({ start: 0 })).toBe(false);
      expect(isRange({ start: '0', end: 10 })).toBe(false);
    });
  });

  describe('isPolynomial', () => {
    it('should return true for valid polynomials', () => {
      expect(isPolynomial({ coefficients: [1, 2, 3] })).toBe(true);
      expect(isPolynomial({ coefficients: [1, 0, -1], variable: 'x' })).toBe(true);
    });

    it('should return false for invalid polynomials', () => {
      expect(isPolynomial(null)).toBe(false);
      expect(isPolynomial({})).toBe(false);
      expect(isPolynomial({ coefficients: 'not array' })).toBe(false);
    });
  });
});

describe('Parallel Types - Test Functions', () => {
  describe('isFuture', () => {
    it('should return true for Promise-like objects', () => {
      expect(isFuture(Promise.resolve(1))).toBe(true);
      expect(isFuture({ then: () => {} })).toBe(true);
    });

    it('should return false for non-thenable', () => {
      expect(isFuture(null)).toBe(false);
      expect(isFuture({})).toBe(false);
      expect(isFuture({ then: 'not a function' })).toBe(false);
    });
  });

  describe('isStream', () => {
    it('should return true for valid streams', () => {
      expect(isStream({ next: () => ({ value: 1, done: false }) })).toBe(true);
    });

    it('should return false for invalid streams', () => {
      expect(isStream(null)).toBe(false);
      expect(isStream({})).toBe(false);
      expect(isStream({ next: 'not a function' })).toBe(false);
    });
  });

  describe('isChannel', () => {
    it('should return true for valid channels', () => {
      expect(isChannel({ send: () => {}, receive: () => {} })).toBe(true);
    });

    it('should return false for invalid channels', () => {
      expect(isChannel(null)).toBe(false);
      expect(isChannel({ send: () => {} })).toBe(false);
      expect(isChannel({ receive: () => {} })).toBe(false);
    });
  });

  describe('isSharedArray', () => {
    it('should return true for valid SharedArrays', () => {
      if (typeof SharedArrayBuffer !== 'undefined') {
        const buffer = new SharedArrayBuffer(16);
        expect(isSharedArray({ buffer, length: 16 })).toBe(true);
      }
    });

    it('should return false for invalid values', () => {
      expect(isSharedArray(null)).toBe(false);
      expect(isSharedArray({ buffer: new ArrayBuffer(16), length: 16 })).toBe(false);
    });
  });

  describe('isAtomicNumber', () => {
    it('should return true for valid AtomicNumbers', () => {
      if (typeof SharedArrayBuffer !== 'undefined') {
        const buffer = new SharedArrayBuffer(8);
        expect(isAtomicNumber({ value: 42, buffer })).toBe(true);
        expect(isAtomicNumber({ value: BigInt(42), buffer })).toBe(true);
      }
    });

    it('should return false for invalid values', () => {
      expect(isAtomicNumber(null)).toBe(false);
      expect(isAtomicNumber({ value: 42 })).toBe(false);
    });
  });
});

describe('TypedArray Types - Test Functions', () => {
  describe('isTypedArray', () => {
    it('should return true for all TypedArray types', () => {
      expect(isTypedArray(new Int8Array(1))).toBe(true);
      expect(isTypedArray(new Uint8Array(1))).toBe(true);
      expect(isTypedArray(new Int16Array(1))).toBe(true);
      expect(isTypedArray(new Uint16Array(1))).toBe(true);
      expect(isTypedArray(new Int32Array(1))).toBe(true);
      expect(isTypedArray(new Uint32Array(1))).toBe(true);
      expect(isTypedArray(new Float32Array(1))).toBe(true);
      expect(isTypedArray(new Float64Array(1))).toBe(true);
      expect(isTypedArray(new BigInt64Array(1))).toBe(true);
      expect(isTypedArray(new BigUint64Array(1))).toBe(true);
    });

    it('should return false for regular arrays', () => {
      expect(isTypedArray([1, 2, 3])).toBe(false);
      expect(isTypedArray(null)).toBe(false);
    });
  });

  describe('specific TypedArray checks', () => {
    it('should correctly identify Int8Array', () => {
      expect(isInt8Array(new Int8Array(1))).toBe(true);
      expect(isInt8Array(new Uint8Array(1))).toBe(false);
    });

    it('should correctly identify Int16Array', () => {
      expect(isInt16Array(new Int16Array(1))).toBe(true);
      expect(isInt16Array(new Int32Array(1))).toBe(false);
    });

    it('should correctly identify Int32Array', () => {
      expect(isInt32Array(new Int32Array(1))).toBe(true);
      expect(isInt32Array(new Int16Array(1))).toBe(false);
    });

    it('should correctly identify Uint8Array', () => {
      expect(isUint8Array(new Uint8Array(1))).toBe(true);
      expect(isUint8Array(new Int8Array(1))).toBe(false);
    });

    it('should correctly identify Uint16Array', () => {
      expect(isUint16Array(new Uint16Array(1))).toBe(true);
      expect(isUint16Array(new Uint8Array(1))).toBe(false);
    });

    it('should correctly identify Uint32Array', () => {
      expect(isUint32Array(new Uint32Array(1))).toBe(true);
      expect(isUint32Array(new Uint16Array(1))).toBe(false);
    });

    it('should correctly identify Float32Array', () => {
      expect(isFloat32Array(new Float32Array(1))).toBe(true);
      expect(isFloat32Array(new Float64Array(1))).toBe(false);
    });

    it('should correctly identify Float64Array', () => {
      expect(isFloat64Array(new Float64Array(1))).toBe(true);
      expect(isFloat64Array(new Float32Array(1))).toBe(false);
    });

    it('should correctly identify BigInt64Array', () => {
      expect(isBigInt64Array(new BigInt64Array(1))).toBe(true);
      expect(isBigInt64Array(new BigUint64Array(1))).toBe(false);
    });

    it('should correctly identify BigUint64Array', () => {
      expect(isBigUint64Array(new BigUint64Array(1))).toBe(true);
      expect(isBigUint64Array(new BigInt64Array(1))).toBe(false);
    });
  });
});

describe('GPU Types - Test Functions', () => {
  describe('isGPUBuffer', () => {
    it('should return true for valid GPUBuffers', () => {
      expect(isGPUBuffer({ size: 1024, usage: 1 })).toBe(true);
      expect(isGPUBuffer({ size: 0, usage: 0, mapState: 'unmapped' })).toBe(true);
    });

    it('should return false for invalid GPUBuffers', () => {
      expect(isGPUBuffer(null)).toBe(false);
      expect(isGPUBuffer({ size: 1024 })).toBe(false);
      expect(isGPUBuffer({ size: '1024', usage: 1 })).toBe(false);
    });
  });

  describe('isGPUTensor', () => {
    it('should return true for valid GPUTensors', () => {
      expect(isGPUTensor({ shape: [2, 3], dtype: 'float32', device: 'gpu:0' })).toBe(true);
      expect(isGPUTensor({ shape: [1, 2, 3, 4], dtype: 'int8', device: 'cuda' })).toBe(true);
    });

    it('should return false for invalid GPUTensors', () => {
      expect(isGPUTensor(null)).toBe(false);
      expect(isGPUTensor({ shape: [2, 3], dtype: 'float32' })).toBe(false);
      expect(isGPUTensor({ shape: '2x3', dtype: 'float32', device: 'gpu' })).toBe(false);
    });
  });
});

describe('Factory Functions', () => {
  describe('complex()', () => {
    it('should create Complex numbers', () => {
      const c1 = complex(3, 4);
      expect(c1.re).toBe(3);
      expect(c1.im).toBe(4);
      expect(isComplex(c1)).toBe(true);

      const c2 = complex(5);
      expect(c2.re).toBe(5);
      expect(c2.im).toBe(0);
    });
  });

  describe('fraction()', () => {
    it('should create Fractions', () => {
      const f1 = fraction(1, 2);
      expect(f1.numerator).toBe(1);
      expect(f1.denominator).toBe(2);
      expect(isFraction(f1)).toBe(true);

      const f2 = fraction(BigInt(3), BigInt(4));
      expect(f2.numerator).toBe(BigInt(3));
      expect(isFraction(f2)).toBe(true);
    });
  });

  describe('bigDecimal()', () => {
    it('should create BigDecimals', () => {
      const bd = bigDecimal(BigInt(12345), 2);
      expect(bd.value).toBe(BigInt(12345));
      expect(bd.scale).toBe(2);
      expect(isBigDecimal(bd)).toBe(true);
    });
  });

  describe('vector()', () => {
    it('should create Vectors', () => {
      const v = vector([1, 2, 3]);
      expect(v.data).toEqual([1, 2, 3]);
      expect(v.length).toBe(3);
      expect(isVector(v)).toBe(true);
    });
  });

  describe('matrix()', () => {
    it('should create Matrices', () => {
      const m = matrix([1, 2, 3, 4], 2, 2);
      expect(m.rows).toBe(2);
      expect(m.cols).toBe(2);
      expect(isMatrix(m)).toBe(true);
    });
  });

  describe('tensor()', () => {
    it('should create Tensors', () => {
      const t = tensor([1, 2, 3, 4, 5, 6], [2, 3]);
      expect(t.shape).toEqual([2, 3]);
      expect(isTensor(t)).toBe(true);
    });
  });

  describe('quaternion()', () => {
    it('should create Quaternions', () => {
      const q = quaternion(1, 0, 0, 0);
      expect(q.w).toBe(1);
      expect(q.x).toBe(0);
      expect(isQuaternion(q)).toBe(true);
    });
  });

  describe('unit()', () => {
    it('should create Units', () => {
      const u = unit(10, 'meter');
      expect(u.value).toBe(10);
      expect(u.unit).toBe('meter');
      expect(isUnit(u)).toBe(true);
    });
  });

  describe('interval()', () => {
    it('should create Intervals', () => {
      const i = interval(0, 10);
      expect(i.low).toBe(0);
      expect(i.high).toBe(10);
      expect(isInterval(i)).toBe(true);
    });
  });

  describe('uncertainty()', () => {
    it('should create Uncertainty values', () => {
      const u = uncertainty(9.81, 0.02);
      expect(u.value).toBe(9.81);
      expect(u.uncertainty).toBe(0.02);
      expect(isUncertainty(u)).toBe(true);
    });
  });

  describe('range()', () => {
    it('should create Ranges', () => {
      const r = range(0, 100, 10);
      expect(r.start).toBe(0);
      expect(r.end).toBe(100);
      expect(r.step).toBe(10);
      expect(isRange(r)).toBe(true);
    });
  });

  describe('polynomial()', () => {
    it('should create Polynomials', () => {
      const p = polynomial([1, 2, 3], 'x');
      expect(p.coefficients).toEqual([1, 2, 3]);
      expect(p.variable).toBe('x');
      expect(isPolynomial(p)).toBe(true);
    });
  });
});

describe('Integration with typed-function', () => {
  let myTyped: ReturnType<typeof create>;

  beforeEach(() => {
    myTyped = create();
    myTyped.addTypes(NUMERIC_TYPES);
    myTyped.addTypes(LINEAR_ALGEBRA_TYPES);
    myTyped.addTypes(SCIENTIFIC_TYPES);
  });

  it('should use Complex type in typed functions', () => {
    const magnitude = myTyped('magnitude', {
      Complex: (c: Complex) => Math.sqrt(c.re * c.re + c.im * c.im),
    });

    expect(magnitude(complex(3, 4))).toBe(5);
  });

  it('should use Vector type in typed functions', () => {
    const sum = myTyped('sum', {
      Vector: (v: Vector) => (v.data as number[]).reduce((a, b) => a + b, 0),
    });

    expect(sum(vector([1, 2, 3, 4]))).toBe(10);
  });

  it('should use Matrix type in typed functions', () => {
    const trace = myTyped('trace', {
      Matrix: (m: Matrix) => {
        let sum = 0;
        const data = m.data as number[];
        for (let i = 0; i < Math.min(m.rows, m.cols); i++) {
          sum += data[i * m.cols + i];
        }
        return sum;
      },
    });

    expect(trace(matrix([1, 2, 3, 4], 2, 2))).toBe(5);
  });

  it('should use Unit type in typed functions', () => {
    const toMeters = myTyped('toMeters', {
      Unit: (u: Unit<number>) => {
        if (u.unit === 'km') return unit(u.value * 1000, 'meter');
        if (u.unit === 'cm') return unit(u.value / 100, 'meter');
        return u;
      },
    });

    expect(toMeters(unit(5, 'km')).value).toBe(5000);
  });

  it('should use Interval type in typed functions', () => {
    const midpoint = myTyped('midpoint', {
      Interval: (i: Interval) => (i.low + i.high) / 2,
    });

    expect(midpoint(interval(0, 10))).toBe(5);
  });

  it('should use multiple scientific types together', () => {
    const add = myTyped('add', {
      'Complex, Complex': (a: Complex, b: Complex) => complex(a.re + b.re, a.im + b.im),
      'Interval, Interval': (a: Interval, b: Interval) => interval(a.low + b.low, a.high + b.high),
      'number, number': (a: number, b: number) => a + b,
    });

    expect(isComplex(add(complex(1, 2), complex(3, 4)))).toBe(true);
    expect((add(complex(1, 2), complex(3, 4)) as Complex).re).toBe(4);

    expect(isInterval(add(interval(0, 1), interval(2, 3)))).toBe(true);
    expect((add(interval(0, 1), interval(2, 3)) as Interval).low).toBe(2);

    expect(add(1, 2)).toBe(3);
  });
});
