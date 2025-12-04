/**
 * isTypedFunction tests ported from isTypedFunction.test.mjs
 * Tests for typed.isTypedFunction() functionality
 */

import { describe, it, expect } from 'vitest';
import typed from '../src/index.js';

describe('isTypedFunction (legacy)', () => {
  function a() {}
  function b() {}

  const fn = typed('fn', {
    number: a,
    string: b,
  });

  it('should distinguish typed functions from others', () => {
    expect(typed.isTypedFunction(fn)).toBe(true);
    expect(typed.isTypedFunction(a)).toBe(false);
    expect(typed.isTypedFunction(7)).toBe(false);
  });

  it('recognize typed functions from any typed instance', () => {
    const parallel = typed.create();
    const fn2 = parallel('fn', {
      number: b,
      string: a,
    });

    expect(parallel.isTypedFunction(fn2)).toBe(true);
    expect(parallel.isTypedFunction(fn)).toBe(true);
    expect(typed.isTypedFunction(fn2)).toBe(true);
  });
});
