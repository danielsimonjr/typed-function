/**
 * Tests for wasm/index.ts - unified interface exports
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  addSignature,
  dispatchFind,
  fallbackClear,
  resetTypeMasks,
  getTypeMaskForName,
  TYPE_ANY_MASK,
  isWasmAvailable,
} from '../src/wasm/index.js';

describe('wasm unified interface', () => {
  beforeEach(() => {
    fallbackClear();
    resetTypeMasks();
  });

  describe('addSignature', () => {
    it('should add a signature and return an index', () => {
      const fn = (a: number, b: number) => a + b;
      const paramMasks = [getTypeMaskForName('number'), getTypeMaskForName('number')];

      const index = addSignature(fn, paramMasks);
      expect(typeof index).toBe('number');
      expect(index).toBeGreaterThanOrEqual(0);
    });

    it('should add multiple signatures with different indices', () => {
      const fn1 = (a: number) => a;
      const fn2 = (a: string) => a;

      const index1 = addSignature(fn1, [getTypeMaskForName('number')]);
      const index2 = addSignature(fn2, [getTypeMaskForName('string')]);

      expect(index1).not.toBe(index2);
    });

    it('should handle signature with any type', () => {
      const fn = (a: unknown) => a;
      const index = addSignature(fn, [TYPE_ANY_MASK]);

      expect(typeof index).toBe('number');
    });

    it('should handle signature with no params', () => {
      const fn = () => 42;
      const index = addSignature(fn, []);

      expect(typeof index).toBe('number');
    });

    it('should handle union type masks', () => {
      const fn = (a: number | string) => String(a);
      const unionMask = getTypeMaskForName('number') | getTypeMaskForName('string');
      const index = addSignature(fn, [unionMask]);

      expect(typeof index).toBe('number');
    });
  });

  describe('dispatchFind', () => {
    beforeEach(() => {
      fallbackClear();
    });

    it('should find matching function for exact type match', () => {
      const fn = (a: number) => a * 2;
      addSignature(fn, [getTypeMaskForName('number')]);

      const result = dispatchFind([getTypeMaskForName('number')]);
      expect(result).toBe(fn);
    });

    it('should return null when no match found', () => {
      const fn = (a: number) => a * 2;
      addSignature(fn, [getTypeMaskForName('number')]);

      const result = dispatchFind([getTypeMaskForName('string')]);
      expect(result).toBeNull();
    });

    it('should match any type parameter', () => {
      const fn = (a: unknown) => String(a);
      addSignature(fn, [TYPE_ANY_MASK]);

      const result = dispatchFind([getTypeMaskForName('number')]);
      expect(result).toBe(fn);
    });

    it('should match union types', () => {
      const fn = (a: number | string) => String(a);
      const unionMask = getTypeMaskForName('number') | getTypeMaskForName('string');
      addSignature(fn, [unionMask]);

      const numberResult = dispatchFind([getTypeMaskForName('number')]);
      expect(numberResult).toBe(fn);

      const stringResult = dispatchFind([getTypeMaskForName('string')]);
      expect(stringResult).toBe(fn);

      const boolResult = dispatchFind([getTypeMaskForName('boolean')]);
      expect(boolResult).toBeNull();
    });

    it('should find correct function among multiple signatures', () => {
      const numberFn = (a: number) => `number: ${a}`;
      const stringFn = (a: string) => `string: ${a}`;
      const boolFn = (a: boolean) => `boolean: ${a}`;

      addSignature(numberFn, [getTypeMaskForName('number')]);
      addSignature(stringFn, [getTypeMaskForName('string')]);
      addSignature(boolFn, [getTypeMaskForName('boolean')]);

      expect(dispatchFind([getTypeMaskForName('number')])).toBe(numberFn);
      expect(dispatchFind([getTypeMaskForName('string')])).toBe(stringFn);
      expect(dispatchFind([getTypeMaskForName('boolean')])).toBe(boolFn);
    });

    it('should handle zero-argument functions', () => {
      const fn = () => 42;
      addSignature(fn, []);

      const result = dispatchFind([]);
      expect(result).toBe(fn);
    });

    it('should handle multi-parameter signatures', () => {
      const fn = (a: number, b: string, c: boolean) => `${a}-${b}-${c}`;
      addSignature(fn, [
        getTypeMaskForName('number'),
        getTypeMaskForName('string'),
        getTypeMaskForName('boolean'),
      ]);

      const result = dispatchFind([
        getTypeMaskForName('number'),
        getTypeMaskForName('string'),
        getTypeMaskForName('boolean'),
      ]);
      expect(result).toBe(fn);

      // Wrong order should not match
      const wrongResult = dispatchFind([
        getTypeMaskForName('string'),
        getTypeMaskForName('number'),
        getTypeMaskForName('boolean'),
      ]);
      expect(wrongResult).toBeNull();
    });
  });

  describe('WASM availability', () => {
    it('should report WASM availability status', () => {
      // In Node.js test environment, WASM might or might not be initialized
      expect(typeof isWasmAvailable()).toBe('boolean');
    });

    it('should use fallback when WASM not available', () => {
      // The unified interface should work regardless of WASM availability
      const fn = (x: number) => x;
      const index = addSignature(fn, [getTypeMaskForName('number')]);
      expect(typeof index).toBe('number');

      const result = dispatchFind([getTypeMaskForName('number')]);
      expect(result).toBe(fn);
    });
  });
});
