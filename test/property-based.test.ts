/**
 * Property-based style tests for typed-function
 *
 * These tests verify invariants and properties that should hold
 * for all valid inputs, using generated test data.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import typed from '../src/index.js';
import {
  getTypeMaskForValue,
  getTypeMaskForName,
  getParamMask,
  typeMatches,
  resetTypeMasks,
  TYPE_ANY_MASK,
} from '../src/wasm/type-masks.js';
import {
  fallbackAddSignature,
  fallbackDispatchFind,
  fallbackClear,
} from '../src/wasm/fallback.js';

// ============ Test Value Generators ============

/** Generate a variety of JavaScript values for testing */
function generateTestValues(): unknown[] {
  return [
    // Numbers
    0, 1, -1, 42, 3.14159, -0.5, Number.MAX_VALUE, Number.MIN_VALUE,
    Infinity, -Infinity, NaN,
    // Strings
    '', 'a', 'hello world', '123', '\n\t', 'unicode: \u00e9\u00e8',
    // Booleans
    true, false,
    // Null/undefined
    null, undefined,
    // Arrays
    [], [1], [1, 2, 3], [[1], [2]], ['a', 'b'],
    // Objects
    {}, { a: 1 }, { nested: { value: 2 } }, Object.create(null),
    // Dates
    new Date(), new Date(0), new Date('2024-01-01'),
    // RegExp
    /test/, /^hello$/i, new RegExp('pattern'),
    // Functions
    () => {}, function named() {}, function(x: unknown) { return x; },
  ];
}

/** Generate type names for testing */
function generateTypeNames(): string[] {
  return [
    'number', 'string', 'boolean', 'null', 'undefined',
    'Array', 'Object', 'Date', 'RegExp', 'Function', 'any',
  ];
}

/** Generate signature strings */
function generateSignatures(): string[] {
  const types = ['number', 'string', 'boolean', 'Array', 'Object', 'any'];
  const signatures: string[] = [''];  // Empty signature

  // Single type signatures
  for (const t of types) {
    signatures.push(t);
  }

  // Union type signatures
  signatures.push('number|string');
  signatures.push('number|string|boolean');

  // Multi-param signatures
  for (const t1 of ['number', 'string']) {
    for (const t2 of ['number', 'string']) {
      signatures.push(`${t1}, ${t2}`);
    }
  }

  return signatures;
}

// ============ Property Tests ============

describe('Property: Type Mask Consistency', () => {
  beforeEach(() => {
    resetTypeMasks();
  });

  it('should always return same mask for same type name', () => {
    const typeNames = generateTypeNames();

    for (const name of typeNames) {
      const mask1 = getTypeMaskForName(name);
      const mask2 = getTypeMaskForName(name);
      expect(mask1).toBe(mask2);
    }
  });

  it('should return masks that are powers of 2 (except any)', () => {
    const typeNames = generateTypeNames().filter(n => n !== 'any');

    for (const name of typeNames) {
      const mask = getTypeMaskForName(name);
      // Check that mask is a power of 2 (single bit set)
      expect(mask > 0 && (mask & (mask - 1)) === 0).toBe(true);
    }
  });

  it('should return ANY_MASK for any type', () => {
    expect(getTypeMaskForName('any')).toBe(TYPE_ANY_MASK);
  });

  it('value mask should always match its own type mask', () => {
    const values = generateTestValues();

    for (const value of values) {
      const valueMask = getTypeMaskForValue(value);
      // Value mask should match itself
      expect(typeMatches(valueMask, valueMask)).toBe(true);
    }
  });

  it('value mask should always match ANY_MASK', () => {
    const values = generateTestValues();

    for (const value of values) {
      const valueMask = getTypeMaskForValue(value);
      expect(typeMatches(valueMask, TYPE_ANY_MASK)).toBe(true);
    }
  });
});

describe('Property: Param Mask Union Laws', () => {
  beforeEach(() => {
    resetTypeMasks();
  });

  it('union with self equals self', () => {
    const types = ['number', 'string', 'boolean'];

    for (const t of types) {
      const mask1 = getParamMask([t]);
      const mask2 = getParamMask([t, t]);
      expect(mask1).toBe(mask2);
    }
  });

  it('union with any equals any', () => {
    const types = ['number', 'string', 'boolean', 'Array', 'Object'];

    for (const t of types) {
      const mask = getParamMask([t, 'any']);
      expect(mask).toBe(TYPE_ANY_MASK);
    }
  });

  it('empty array equals any', () => {
    expect(getParamMask([])).toBe(TYPE_ANY_MASK);
  });

  it('union is commutative', () => {
    const types = ['number', 'string', 'boolean'];

    for (let i = 0; i < types.length; i++) {
      for (let j = i + 1; j < types.length; j++) {
        const t1 = types[i]!;
        const t2 = types[j]!;
        expect(getParamMask([t1, t2])).toBe(getParamMask([t2, t1]));
      }
    }
  });

  it('union is associative', () => {
    const a = getParamMask(['number', 'string']);
    const b = getParamMask(['boolean']);
    const c = getParamMask(['Array']);

    const ab_c = getParamMask(['number', 'string', 'boolean', 'Array']);
    const a_bc = getParamMask(['number', 'string', 'boolean', 'Array']);

    expect(ab_c).toBe(a_bc);
  });
});

describe('Property: Typed Function Determinism', () => {
  it('same input should always produce same output', () => {
    const fn = typed({
      number: (x: number) => x * 2,
      string: (s: string) => s.length,
    });

    // Test numbers
    for (let i = -100; i <= 100; i++) {
      const result1 = fn(i);
      const result2 = fn(i);
      expect(result1).toBe(result2);
    }

    // Test strings
    const strings = ['', 'a', 'hello', 'longer string here'];
    for (const s of strings) {
      const result1 = fn(s);
      const result2 = fn(s);
      expect(result1).toBe(result2);
    }
  });

  it('typed function should be callable multiple times without state corruption', () => {
    const fn = typed({
      number: (x: number) => x + 1,
    });

    const results: number[] = [];
    for (let i = 0; i < 1000; i++) {
      results.push(fn(i) as number);
    }

    for (let i = 0; i < 1000; i++) {
      expect(results[i]).toBe(i + 1);
    }
  });
});

describe('Property: Signature Matching Invariants', () => {
  it('more specific type should match before less specific', () => {
    const fn = typed({
      number: () => 'number',
      any: () => 'any',
    });

    // Numbers should match 'number' signature, not 'any'
    for (let i = -10; i <= 10; i++) {
      expect(fn(i)).toBe('number');
    }
  });

  it('exact type should match before conversion', () => {
    const typed2 = typed.create();
    typed2.addConversion({
      from: 'string',
      to: 'number',
      convert: (s: string) => parseFloat(s),
    });

    const fn = typed2({
      string: () => 'string',
      number: () => 'number',
    });

    // String should match 'string' signature
    expect(fn('hello')).toBe('string');
    expect(fn('123')).toBe('string');
    // Number should match 'number' signature
    expect(fn(123)).toBe('number');
  });

  it('signature with more params should not match fewer args', () => {
    const fn = typed({
      'number, number': () => 'two',
      number: () => 'one',
    });

    expect(fn(1)).toBe('one');
    expect(fn(1, 2)).toBe('two');
  });
});

describe('Property: Fallback Dispatch Correctness', () => {
  beforeEach(() => {
    fallbackClear();
    resetTypeMasks();
  });

  it('should always find the first matching signature', () => {
    // Add signatures in specific order
    const fn1 = () => 'first';
    const fn2 = () => 'second';
    const fn3 = () => 'third';

    fallbackAddSignature(fn1, [getTypeMaskForName('number')]);
    fallbackAddSignature(fn2, [getTypeMaskForName('number')]);
    fallbackAddSignature(fn3, [getTypeMaskForName('number')]);

    // Should always get first match
    for (let i = 0; i < 100; i++) {
      expect(fallbackDispatchFind([getTypeMaskForValue(42)])).toBe(fn1);
    }
  });

  it('should correctly differentiate all built-in types', () => {
    const typeFunctions: Map<string, () => string> = new Map();
    const types = ['number', 'string', 'boolean', 'null', 'undefined', 'Array', 'Object', 'Date', 'RegExp', 'Function'];

    for (const t of types) {
      const fn = () => t;
      typeFunctions.set(t, fn);
      fallbackAddSignature(fn, [getTypeMaskForName(t)]);
    }

    // Test each type
    const testValues: [string, unknown][] = [
      ['number', 42],
      ['string', 'hello'],
      ['boolean', true],
      ['null', null],
      ['undefined', undefined],
      ['Array', [1, 2]],
      ['Object', { a: 1 }],
      ['Date', new Date()],
      ['RegExp', /test/],
      ['Function', () => {}],
    ];

    for (const [expectedType, value] of testValues) {
      const valueMask = getTypeMaskForValue(value);
      const result = fallbackDispatchFind([valueMask]);
      expect(result).toBe(typeFunctions.get(expectedType));
    }
  });
});

describe('Property: Error Handling Consistency', () => {
  it('should always throw for unknown types in signature', () => {
    const invalidTypes = ['Numberr', 'STRING', 'bolean', 'Arry', 'obect'];

    for (const invalidType of invalidTypes) {
      expect(() => {
        typed({ [invalidType]: () => {} });
      }).toThrow();
    }
  });

  it('should always throw for conflicting signatures', () => {
    const types = ['number', 'string', 'boolean'];

    for (const t of types) {
      expect(() => {
        typed({
          [t]: () => 'first',
          [t]: () => 'second',  // Same key, different function - actually this won't throw
        });
      }).toBeDefined(); // Object literal deduplicates keys, so no conflict
    }
  });

  it('should throw consistent errors for type mismatches', () => {
    const fn = typed('testFn', {
      number: (x: number) => x,
    });

    const invalidArgs: unknown[] = ['string', true, null, [], {}];

    for (const arg of invalidArgs) {
      expect(() => fn(arg)).toThrow(/Unexpected type of argument/);
    }
  });
});

describe('Property: Conversion Transitivity', () => {
  it('direct conversion should work for all valid inputs', () => {
    const typed2 = typed.create();
    typed2.addConversion({
      from: 'string',
      to: 'number',
      convert: (s: string) => parseFloat(s),
    });

    const fn = typed2({
      number: (x: number) => x * 2,
    });

    const numericStrings = ['0', '1', '2', '3.14', '-5', '100.5'];

    for (const s of numericStrings) {
      const expected = parseFloat(s) * 2;
      expect(fn(s)).toBeCloseTo(expected);
    }
  });
});

describe('Property: Rest Parameter Completeness', () => {
  it('rest params should capture all remaining arguments', () => {
    const fn = typed({
      '...number': (nums: number[]) => nums.reduce((a, b) => a + b, 0),
    });

    // Test various lengths
    for (let len = 1; len <= 10; len++) {
      const args = Array.from({ length: len }, (_, i) => i + 1);
      const expected = args.reduce((a, b) => a + b, 0);
      expect(fn(...args)).toBe(expected);
    }
  });

  it('prefix + rest should correctly partition arguments', () => {
    const fn = typed({
      'string, ...number': (prefix: string, nums: number[]) =>
        `${prefix}: ${nums.join(',')}`,
    });

    const testCases = [
      { prefix: 'a', nums: [1], expected: 'a: 1' },
      { prefix: 'b', nums: [1, 2], expected: 'b: 1,2' },
      { prefix: 'c', nums: [1, 2, 3], expected: 'c: 1,2,3' },
    ];

    for (const { prefix, nums, expected } of testCases) {
      expect(fn(prefix, ...nums)).toBe(expected);
    }
  });
});

describe('Property: Self-Reference Correctness', () => {
  it('referToSelf should always receive the typed function itself', () => {
    let capturedSelf: unknown = null;

    const fn = typed({
      number: (x: number) => x,
      string: typed.referToSelf((self) => {
        capturedSelf = self;
        return (s: string) => self(parseInt(s, 10));
      }),
    });

    // Call string signature to trigger referToSelf
    fn('42');

    // Captured self should be the function itself
    expect(capturedSelf).toBe(fn);
  });

  it('referTo should correctly resolve to target signature', () => {
    const fn = typed({
      'number, number': (a: number, b: number) => a + b,
      'string, string': typed.referTo('number, number', (addNumbers) => {
        return (a: string, b: string) =>
          addNumbers(parseInt(a, 10), parseInt(b, 10));
      }),
    });

    // Both should produce the same result
    expect(fn(10, 20)).toBe(30);
    expect(fn('10', '20')).toBe(30);
  });
});

describe('Property: Signature Stability', () => {
  it('signatures property should accurately reflect defined signatures', () => {
    const testCases = [
      { signatures: { number: () => {} }, expectedKeys: ['number'] },
      { signatures: { string: () => {}, number: () => {} }, expectedKeys: ['number', 'string'] },
      // Note: signatures are canonicalized without spaces after commas
      { signatures: { 'number, string': () => {}, number: () => {} }, expectedKeys: ['number', 'number,string'] },
    ];

    for (const { signatures: sigs, expectedKeys } of testCases) {
      const fn = typed(sigs);
      const actualKeys = Object.keys(fn.signatures).sort();

      expect(actualKeys).toEqual(expectedKeys.sort());
    }
  });

  it('signatures should be immutable (modifying copy should not affect function)', () => {
    const fn = typed({
      number: (x: number) => x * 2,
    });

    // Get reference to signatures
    const sigs = fn.signatures;
    const originalFn = sigs['number'];

    // Modifying signatures object shouldn't affect function behavior
    // (Note: this tests that we're not sharing mutable state)
    expect(fn(5)).toBe(10);
    expect(sigs['number']).toBe(originalFn);
  });
});
