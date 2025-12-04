/**
 * Resolve tests ported from resolve.test.mjs
 * Tests for typed.resolve() functionality
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import typed from '../src/index.js';

describe('resolve (legacy)', () => {
  beforeAll(() => {
    typed.addConversion({
      from: 'boolean',
      to: 'string',
      convert: (x: boolean) => '' + x,
    });
  });

  afterAll(() => {
    typed.clearConversions();
  });

  it('should choose the signature that direct execution would', () => {
    const fn = typed({
      number: (n: number) => 'b ' + n,
      boolean: (b: boolean) => (b ? 'c' : 'd'),
      'number, string': (n: number, s: string) => 'e ' + n + ' ' + s,
      '...string': (a: string[]) => 'f ' + a.length,
      '...': (a: unknown[]) => 'g ' + a.length,
    });
    const examples: unknown[][] = [
      [3],
      ['hello'],
      [false],
      [3, 'me'],
      [0, true],
      ['x', 'y', 'z'],
      [false, 'y', false],
      [[1]],
      ['x', [1], 'z', 'w'],
    ];
    for (const example of examples) {
      expect(typed.resolve(fn, example).implementation.apply(null, example)).toBe(fn.apply(fn, example));
    }
  });
});
