/**
 * Tests for type caching functionality
 *
 * These tests verify that type resolution caching works correctly
 * for performance optimization.
 *
 * @see docs/TYPED_FUNCTION_IMPROVEMENTS.md - Issue 6
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  TypeCache,
  createTypeCache,
  globalTypeCache,
  cachedTypeResolve,
} from '../src/core/type-cache.js';

describe('TypeCache', () => {
  let cache: TypeCache;

  beforeEach(() => {
    cache = createTypeCache();
  });

  describe('basic operations', () => {
    it('should store and retrieve type names for objects', () => {
      const obj = { value: 42 };
      cache.set(obj, 'TestObject');
      expect(cache.get(obj)).toBe('TestObject');
    });

    it('should return undefined for uncached objects', () => {
      const obj = { value: 42 };
      expect(cache.get(obj)).toBeUndefined();
    });

    it('should check if an object is cached', () => {
      const obj = { value: 42 };
      expect(cache.has(obj)).toBe(false);
      cache.set(obj, 'TestObject');
      expect(cache.has(obj)).toBe(true);
    });

    it('should delete cached entries', () => {
      const obj = { value: 42 };
      cache.set(obj, 'TestObject');
      expect(cache.delete(obj)).toBe(true);
      expect(cache.has(obj)).toBe(false);
    });

    it('should return false when deleting non-existent entry', () => {
      const obj = { value: 42 };
      expect(cache.delete(obj)).toBe(false);
    });

    it('should clear all entries', () => {
      const obj1 = { a: 1 };
      const obj2 = { b: 2 };
      cache.set(obj1, 'Type1');
      cache.set(obj2, 'Type2');
      cache.clear();
      expect(cache.has(obj1)).toBe(false);
      expect(cache.has(obj2)).toBe(false);
    });
  });

  describe('handling primitive types', () => {
    it('should return undefined for null', () => {
      expect(cache.get(null)).toBeUndefined();
    });

    it('should return undefined for undefined', () => {
      expect(cache.get(undefined)).toBeUndefined();
    });

    it('should return undefined for numbers', () => {
      expect(cache.get(42)).toBeUndefined();
    });

    it('should return undefined for strings', () => {
      expect(cache.get('hello')).toBeUndefined();
    });

    it('should return undefined for booleans', () => {
      expect(cache.get(true)).toBeUndefined();
    });

    it('should not throw when setting primitives', () => {
      expect(() => cache.set(null, 'null')).not.toThrow();
      expect(() => cache.set(undefined, 'undefined')).not.toThrow();
      expect(() => cache.set(42, 'number')).not.toThrow();
    });
  });

  describe('function caching', () => {
    it('should cache function types', () => {
      const fn = () => 42;
      cache.set(fn, 'Function');
      expect(cache.get(fn)).toBe('Function');
    });

    it('should cache class instances', () => {
      class TestClass {
        value: number;
        constructor(value: number) {
          this.value = value;
        }
      }
      const instance = new TestClass(42);
      cache.set(instance, 'TestClass');
      expect(cache.get(instance)).toBe('TestClass');
    });
  });

  describe('enable/disable', () => {
    it('should not cache when disabled', () => {
      const obj = { value: 42 };
      cache.disable();
      cache.set(obj, 'TestObject');
      expect(cache.get(obj)).toBeUndefined();
    });

    it('should resume caching when re-enabled', () => {
      const obj = { value: 42 };
      cache.disable();
      cache.set(obj, 'TestObject');
      cache.enable();
      cache.set(obj, 'TestObject');
      expect(cache.get(obj)).toBe('TestObject');
    });

    it('should report enabled state', () => {
      expect(cache.isEnabled()).toBe(true);
      cache.disable();
      expect(cache.isEnabled()).toBe(false);
      cache.enable();
      expect(cache.isEnabled()).toBe(true);
    });
  });

  describe('statistics', () => {
    it('should track cache hits', () => {
      const obj = { value: 42 };
      cache.set(obj, 'TestObject');
      cache.get(obj);
      cache.get(obj);
      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
    });

    it('should track cache misses', () => {
      const obj = { value: 42 };
      cache.get(obj);
      cache.get({ other: 1 });
      const stats = cache.getStats();
      expect(stats.misses).toBe(2);
    });

    it('should calculate hit rate', () => {
      const obj = { value: 42 };
      cache.set(obj, 'TestObject');
      cache.get(obj); // hit
      cache.get(obj); // hit
      cache.get({ other: 1 }); // miss
      const stats = cache.getStats();
      expect(stats.hitRate).toBeCloseTo(2 / 3);
    });

    it('should return 0 hit rate when no operations', () => {
      const stats = cache.getStats();
      expect(stats.hitRate).toBe(0);
    });

    it('should reset statistics', () => {
      const obj = { value: 42 };
      cache.set(obj, 'TestObject');
      cache.get(obj);
      cache.get({ other: 1 });
      cache.resetStats();
      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });

    it('should reset statistics on clear', () => {
      const obj = { value: 42 };
      cache.set(obj, 'TestObject');
      cache.get(obj);
      cache.clear();
      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });
});

describe('globalTypeCache', () => {
  beforeEach(() => {
    globalTypeCache.clear();
  });

  it('should be a TypeCache instance', () => {
    expect(globalTypeCache).toBeInstanceOf(TypeCache);
  });

  it('should persist across test operations', () => {
    const obj = { global: true };
    globalTypeCache.set(obj, 'GlobalType');
    expect(globalTypeCache.get(obj)).toBe('GlobalType');
  });
});

describe('cachedTypeResolve', () => {
  let cache: TypeCache;

  beforeEach(() => {
    cache = createTypeCache();
  });

  it('should compute and cache type on first call', () => {
    const obj = { value: 42 };
    let computeCount = 0;

    const compute = () => {
      computeCount++;
      return 'ComputedType';
    };

    const result = cachedTypeResolve(obj, compute, cache);

    expect(result).toBe('ComputedType');
    expect(computeCount).toBe(1);
    expect(cache.get(obj)).toBe('ComputedType');
  });

  it('should return cached result on subsequent calls', () => {
    const obj = { value: 42 };
    let computeCount = 0;

    const compute = () => {
      computeCount++;
      return 'ComputedType';
    };

    cachedTypeResolve(obj, compute, cache);
    cachedTypeResolve(obj, compute, cache);
    cachedTypeResolve(obj, compute, cache);

    expect(computeCount).toBe(1);
  });

  it('should use global cache by default', () => {
    globalTypeCache.clear();
    const obj = { defaultCache: true };

    cachedTypeResolve(obj, () => 'DefaultCached');

    expect(globalTypeCache.get(obj)).toBe('DefaultCached');
  });

  it('should compute for different objects', () => {
    const obj1 = { id: 1 };
    const obj2 = { id: 2 };
    let computeCount = 0;

    const compute = (value: unknown) => {
      computeCount++;
      return `Type${(value as { id: number }).id}`;
    };

    const result1 = cachedTypeResolve(obj1, compute, cache);
    const result2 = cachedTypeResolve(obj2, compute, cache);

    expect(result1).toBe('Type1');
    expect(result2).toBe('Type2');
    expect(computeCount).toBe(2);
  });
});

describe('createTypeCache', () => {
  it('should create independent cache instances', () => {
    const cache1 = createTypeCache();
    const cache2 = createTypeCache();
    const obj = { shared: true };

    cache1.set(obj, 'Cache1Type');

    expect(cache1.get(obj)).toBe('Cache1Type');
    expect(cache2.get(obj)).toBeUndefined();
  });
});
