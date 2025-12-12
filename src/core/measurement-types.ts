/**
 * Scientific Measurement Types
 *
 * This module provides type definitions for scientific measurements including
 * physical units, intervals, uncertainty values, ranges, and polynomials.
 */

import type { TypeDef } from './types.js';

// =============================================================================
// Type Interfaces
// =============================================================================

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

// =============================================================================
// Type Test Functions
// =============================================================================

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

// =============================================================================
// Type Definitions for Registration
// =============================================================================

/**
 * Scientific measurement types
 */
export const MEASUREMENT_TYPES: TypeDef[] = [
  { name: 'Unit', test: isUnit },
  { name: 'Interval', test: isInterval },
  { name: 'Uncertainty', test: isUncertainty },
  { name: 'Range', test: isRange },
  { name: 'Polynomial', test: isPolynomial },
];

// =============================================================================
// Factory Functions
// =============================================================================

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
