/**
 * Performance regression tests for typed-function
 *
 * These tests verify that critical paths meet performance expectations.
 * They use timing thresholds that should be generous enough to pass
 * on various systems while still catching major regressions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import typed from '../src/index.js';
import {
  fallbackAddSignature,
  fallbackDispatchFind,
  fallbackClear,
  fallbackClearCache,
} from '../src/wasm/fallback.js';
import {
  getTypeMaskForValue,
  getTypeMaskForName,
  resetTypeMasks,
} from '../src/wasm/type-masks.js';

/**
 * Measure execution time for an operation
 */
function measureTime(fn: () => void, iterations: number): number {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  return performance.now() - start;
}

/**
 * Calculate operations per millisecond
 */
function opsPerMs(timeMs: number, iterations: number): number {
  return iterations / timeMs;
}

describe('Performance: Typed Function Dispatch', () => {
  it('should dispatch single-signature function quickly', () => {
    const fn = typed({
      number: (x: number) => x * 2,
    });

    const iterations = 10000;
    const time = measureTime(() => fn(42), iterations);

    // Should complete 10k calls in under 100ms (conservative)
    expect(time).toBeLessThan(100);

    // Should achieve at least 100 ops/ms
    expect(opsPerMs(time, iterations)).toBeGreaterThan(100);
  });

  it('should dispatch multi-signature function quickly', () => {
    const fn = typed({
      number: (x: number) => x * 2,
      string: (s: string) => s.length,
      boolean: (b: boolean) => !b,
      Array: (a: unknown[]) => a.length,
      Object: (o: object) => Object.keys(o).length,
    });

    const iterations = 10000;
    const args = [42, 'hello', true, [1, 2, 3], { a: 1 }];

    const time = measureTime(() => {
      for (const arg of args) {
        fn(arg);
      }
    }, iterations / 5);

    // Should complete 10k dispatches in under 500ms (generous for CI/slower machines)
    expect(time).toBeLessThan(500);
  });

  it('should dispatch union types quickly', () => {
    const fn = typed({
      'number | string': (x: number | string) => String(x),
    });

    const iterations = 10000;

    const timeNum = measureTime(() => fn(42), iterations);
    const timeStr = measureTime(() => fn('hello'), iterations);

    // Both should be fast (generous limit for CI/slower machines)
    expect(timeNum).toBeLessThan(200);
    expect(timeStr).toBeLessThan(200);
  });

  it('should handle rest parameters efficiently', () => {
    const fn = typed({
      '...number': (nums: number[]) => nums.reduce((a, b) => a + b, 0),
    });

    const iterations = 5000;
    const args = [1, 2, 3, 4, 5];

    const time = measureTime(() => fn(...args), iterations);

    // Should complete 5k calls in under 600ms (generous for CI/slower machines)
    expect(time).toBeLessThan(600);
  });

  it('should dispatch with type conversions efficiently', () => {
    const typed2 = typed.create();
    typed2.addConversion({
      from: 'string',
      to: 'number',
      convert: (s: string) => parseFloat(s),
    });

    const fn = typed2({
      number: (x: number) => x * 2,
    });

    const iterations = 5000;

    // Direct number call
    const timeNum = measureTime(() => fn(42), iterations);
    expect(timeNum).toBeLessThan(100);

    // Conversion call
    const timeConv = measureTime(() => fn('42'), iterations);
    // Conversions can be slightly slower
    expect(timeConv).toBeLessThan(150);
  });
});

describe('Performance: Fast Path vs Generic Path', () => {
  it('should dispatch fast-path eligible signatures quickly', () => {
    // Create function with exactly 6 simple signatures (fast-path eligible)
    const fn = typed({
      number: (x: number) => x,
      string: (s: string) => s,
      boolean: (b: boolean) => b,
      null: () => null,
      undefined: () => undefined,
      Array: (a: unknown[]) => a,
    });

    const iterations = 10000;

    // First signature should be very fast (slot 0)
    const time1 = measureTime(() => fn(42), iterations);
    expect(time1).toBeLessThan(300);

    // Last fast-path signature should still be fast
    const time6 = measureTime(() => fn([1, 2]), iterations);
    expect(time6).toBeLessThan(250);
  });

  it('should handle generic path reasonably well', () => {
    // Create function with more than 6 signatures to force generic path
    const fn = typed({
      number: () => 'number',
      string: () => 'string',
      boolean: () => 'boolean',
      null: () => 'null',
      undefined: () => 'undefined',
      Array: () => 'Array',
      Date: () => 'Date',
      RegExp: () => 'RegExp',
      Object: () => 'Object',
    });

    const iterations = 5000;

    // Later signatures will use generic path
    const timeDate = measureTime(() => fn(new Date()), iterations);
    const timeRegexp = measureTime(() => fn(/test/), iterations);
    const timeObj = measureTime(() => fn({}), iterations);

    // Generic path should still be reasonable (generous for CI/slower machines)
    expect(timeDate).toBeLessThan(500);
    expect(timeRegexp).toBeLessThan(500);
    expect(timeObj).toBeLessThan(500);
  });
});

describe('Performance: Type Mask Operations', () => {
  beforeEach(() => {
    resetTypeMasks();
  });

  it('should compute type masks quickly', () => {
    const iterations = 50000;
    const testValues = [42, 'hello', true, null, undefined, [], {}, new Date()];

    const time = measureTime(() => {
      for (const val of testValues) {
        getTypeMaskForValue(val);
      }
    }, iterations / testValues.length);

    // Should compute 50k masks in under 500ms (generous for CI/slower machines)
    expect(time).toBeLessThan(500);
  });

  it('should look up type names quickly', () => {
    const iterations = 50000;
    const typeNames = ['number', 'string', 'boolean', 'Array', 'Object', 'Date'];

    const time = measureTime(() => {
      for (const name of typeNames) {
        getTypeMaskForName(name);
      }
    }, iterations / typeNames.length);

    // Should look up 50k names in under 500ms (generous for CI/slower machines)
    expect(time).toBeLessThan(500);
  });
});

describe('Performance: Fallback Dispatch', () => {
  beforeEach(() => {
    fallbackClear();
    resetTypeMasks();
  });

  it('should add signatures quickly', () => {
    const iterations = 1000;

    const time = measureTime(() => {
      fallbackClear();
      for (let i = 0; i < 100; i++) {
        fallbackAddSignature(() => i, [getTypeMaskForName('number')]);
      }
    }, iterations / 100);

    // Should add 1000 signatures in under 300ms (generous for CI/slower machines)
    expect(time).toBeLessThan(300);
  });

  it('should dispatch find quickly', () => {
    // Set up some signatures
    for (let i = 0; i < 10; i++) {
      const typeNames = ['number', 'string', 'boolean', 'Array', 'Object'];
      fallbackAddSignature(() => i, [getTypeMaskForName(typeNames[i % 5]!)]);
    }

    const iterations = 10000;
    const numMask = getTypeMaskForValue(42);

    const time = measureTime(() => {
      fallbackDispatchFind([numMask]);
    }, iterations);

    // Should dispatch 10k finds in under 100ms
    expect(time).toBeLessThan(100);
  });

  it('should utilize cache effectively', () => {
    fallbackAddSignature(() => 'num', [getTypeMaskForName('number')]);
    fallbackAddSignature(() => 'str', [getTypeMaskForName('string')]);

    const numMask = getTypeMaskForValue(42);
    const strMask = getTypeMaskForValue('hello');

    // First call populates cache
    fallbackDispatchFind([numMask]);
    fallbackDispatchFind([strMask]);

    const iterations = 20000;

    // Cached lookups should be very fast
    const time = measureTime(() => {
      fallbackDispatchFind([numMask]);
      fallbackDispatchFind([strMask]);
    }, iterations / 2);

    // Cached lookups should be very fast
    expect(time).toBeLessThan(150);
  });

  it('should handle cache clear efficiently', () => {
    // Add some signatures and warm the cache
    for (let i = 0; i < 50; i++) {
      fallbackAddSignature(() => i, [1 << (i % 10)]);
    }

    for (let i = 0; i < 10; i++) {
      fallbackDispatchFind([1 << i]);
    }

    const iterations = 10000;

    const time = measureTime(() => {
      fallbackClearCache();
    }, iterations);

    // Should clear cache 10k times in under 200ms (generous for CI/slower machines)
    expect(time).toBeLessThan(200);
  });
});

describe('Performance: Function Creation', () => {
  it('should create simple typed functions quickly', () => {
    const iterations = 500;

    const time = measureTime(() => {
      typed({ number: (x: number) => x });
    }, iterations);

    // Should create 500 simple functions in under 500ms
    expect(time).toBeLessThan(500);
  });

  it('should create complex typed functions in reasonable time', () => {
    const iterations = 100;

    const time = measureTime(() => {
      typed({
        number: (x: number) => x,
        string: (s: string) => s,
        boolean: (b: boolean) => b,
        'number, number': (a: number, b: number) => a + b,
        'string, string': (a: string, b: string) => a + b,
        'number, string': (a: number, b: string) => `${a}${b}`,
      });
    }, iterations);

    // Should create 100 complex functions in under 500ms
    expect(time).toBeLessThan(500);
  });

  it('should merge typed functions efficiently', () => {
    const fn1 = typed({ number: (x: number) => x });
    const fn2 = typed({ string: (s: string) => s });
    const fn3 = typed({ boolean: (b: boolean) => b });

    const iterations = 200;

    const time = measureTime(() => {
      typed(fn1, fn2, fn3);
    }, iterations);

    // Should merge 200 times in under 500ms
    expect(time).toBeLessThan(500);
  });
});

describe('Performance: referTo and referToSelf', () => {
  it('should resolve referTo quickly during creation', () => {
    const iterations = 200;

    const time = measureTime(() => {
      typed({
        'number, number': (a: number, b: number) => a + b,
        string: typed.referTo('number, number', (add) => {
          return (s: string) => {
            const nums = s.split(',').map(Number);
            return add(nums[0]!, nums[1]!);
          };
        }),
      });
    }, iterations);

    // Should create with referTo 200 times in under 500ms
    expect(time).toBeLessThan(500);
  });

  it('should dispatch referTo signatures quickly', () => {
    const fn = typed({
      'number, number': (a: number, b: number) => a + b,
      string: typed.referTo('number, number', (add) => {
        return (s: string) => {
          const nums = s.split(',').map(Number);
          return add(nums[0]!, nums[1]!);
        };
      }),
    });

    const iterations = 5000;

    // Direct dispatch
    const timeDirect = measureTime(() => fn(1, 2), iterations);
    expect(timeDirect).toBeLessThan(300);

    // referTo dispatch
    const timeReferTo = measureTime(() => fn('1,2'), iterations);
    expect(timeReferTo).toBeLessThan(300);
  });

  it('should dispatch referToSelf quickly', () => {
    const fn = typed({
      number: (x: number) => x * 2,
      string: typed.referToSelf((self) => {
        return (s: string) => self(parseInt(s, 10));
      }),
    });

    const iterations = 5000;

    const time = measureTime(() => fn('42'), iterations);
    expect(time).toBeLessThan(300);
  });
});

describe('Performance: Memory and Scaling', () => {
  it('should handle many signatures without significant slowdown', () => {
    const typed2 = typed.create();

    // Add many custom types
    for (let i = 0; i < 20; i++) {
      typed2.addType({
        name: `CustomType${i}`,
        test: (x: unknown) => x !== null && typeof x === 'object' && `type${i}` in x,
      });
    }

    // Create a function with many signatures
    const signatures: Record<string, (x: unknown) => string> = {};
    for (let i = 0; i < 20; i++) {
      signatures[`CustomType${i}`] = () => `type${i}`;
    }

    const createStart = performance.now();
    const fn = typed2(signatures);
    const createTime = performance.now() - createStart;

    // Creation should complete in reasonable time
    expect(createTime).toBeLessThan(500);

    // Dispatch should still be reasonable
    const iterations = 1000;
    const time = measureTime(() => fn({ type5: true }), iterations);
    expect(time).toBeLessThan(500);
  });

  it('should handle deep type hierarchies efficiently', () => {
    const typed2 = typed.create();

    // Add types in a hierarchy-like manner
    typed2.addTypes([
      { name: 'PositiveNumber', test: (x: unknown) => typeof x === 'number' && x > 0 },
    ], 'number');
    typed2.addTypes([
      { name: 'NegativeNumber', test: (x: unknown) => typeof x === 'number' && x < 0 },
    ], 'number');
    typed2.addTypes([
      { name: 'ZeroNumber', test: (x: unknown) => x === 0 },
    ], 'number');

    const fn = typed2({
      PositiveNumber: () => 'positive',
      NegativeNumber: () => 'negative',
      ZeroNumber: () => 'zero',
    });

    const iterations = 5000;

    const time = measureTime(() => {
      fn(1);
      fn(-1);
      fn(0);
    }, iterations / 3);

    expect(time).toBeLessThan(200);
  });
});
