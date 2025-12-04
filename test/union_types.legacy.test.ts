/**
 * Union types tests ported from union_types.test.mjs
 * Tests for union type handling in typed functions
 */

import { describe, it, expect } from 'vitest';
import typed from '../src/index.js';

describe('union types (legacy)', () => {
  it('should create a typed function with union types', () => {
    const fn = typed({
      'number | boolean': function (arg: number | boolean) {
        return typeof arg;
      },
    });

    expect(fn(true)).toBe('boolean');
    expect(fn(2)).toBe('number');
    expect(() => fn('string')).toThrow(
      /Unexpected type of argument in function unnamed \(expected: number or boolean, actual: string, index: 0\)/
    );
  });
});
