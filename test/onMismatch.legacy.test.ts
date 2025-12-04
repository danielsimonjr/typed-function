/**
 * onMismatch tests ported from onMismatch.test.mjs
 * Tests for custom mismatch handlers
 */

import { describe, it, expect, afterEach } from 'vitest';
import typed from '../src/index.js';

describe('onMismatch handler (legacy)', () => {
  const square = typed('square', {
    number: (x: number) => x * x,
    string: (s: string) => s + s,
  });

  afterEach(() => {
    // Reset to default behavior after each test
    typed.onMismatch = typed.throwMismatchError;
  });

  it('should replace the return value of a mismatched call', () => {
    typed.onMismatch = () => 42;
    expect(square(5)).toBe(25);
    expect(square('yo')).toBe('yoyo');
    expect(square([13])).toBe(42);
  });

  const myErrorLog: Error[] = [];
  it('should allow error logging', () => {
    typed.onMismatch = (name, args, signatures) => {
      myErrorLog.push(typed.createError(name, args, signatures));
      return null;
    };
    square({ the: 'circle' });
    square(7);
    square('me');
    square(1, 2);
    expect(myErrorLog.length).toBe(2);
    expect('data' in myErrorLog[0]).toBe(true);
  });

  it('should allow changing the error', () => {
    typed.onMismatch = (name) => {
      throw Error('Problem with ' + name);
    };
    expect(() => square(['one'])).toThrow(/Problem with square/);
  });

  it('should allow a return to standard behavior', () => {
    typed.onMismatch = typed.throwMismatchError;
    expect(() => square('be', 'there')).toThrow(TypeError);
  });
});
