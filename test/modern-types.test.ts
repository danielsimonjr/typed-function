/**
 * Tests for modern JavaScript types (ES6+)
 *
 * Tests BigInt, Symbol, Map, Set, WeakMap, WeakSet support
 */

import { describe, it, expect, beforeEach } from 'vitest';
import typed from '../src/index.js';
import {
  getTypeMaskForValue,
  getTypeMaskForName,
  resetTypeMasks,
  TYPE_BIGINT,
  TYPE_SYMBOL,
  TYPE_MAP,
  TYPE_SET,
  TYPE_WEAKMAP,
  TYPE_WEAKSET,
  TypeMasks,
} from '../src/wasm/type-masks.js';

describe('Modern Types: BigInt', () => {
  beforeEach(() => {
    resetTypeMasks();
  });

  it('should recognize BigInt values', () => {
    const mask = getTypeMaskForValue(BigInt(42));
    expect(mask).toBe(1 << TYPE_BIGINT);
  });

  it('should get mask for BigInt type name', () => {
    const mask = getTypeMaskForName('BigInt');
    expect(mask).toBe(1 << TYPE_BIGINT);
  });

  it('should dispatch to BigInt signature', () => {
    const fn = typed({
      BigInt: (x: bigint) => `bigint:${x}`,
      number: (x: number) => `number:${x}`,
    });

    expect(fn(BigInt(42))).toBe('bigint:42');
    expect(fn(42)).toBe('number:42');
  });

  it('should support BigInt in union types', () => {
    const fn = typed({
      'number | BigInt': (x: number | bigint) => typeof x,
    });

    expect(fn(42)).toBe('number');
    expect(fn(BigInt(42))).toBe('bigint');
  });
});

describe('Modern Types: Symbol', () => {
  beforeEach(() => {
    resetTypeMasks();
  });

  it('should recognize Symbol values', () => {
    const mask = getTypeMaskForValue(Symbol('test'));
    expect(mask).toBe(1 << TYPE_SYMBOL);
  });

  it('should get mask for Symbol type name', () => {
    const mask = getTypeMaskForName('Symbol');
    expect(mask).toBe(1 << TYPE_SYMBOL);
  });

  it('should dispatch to Symbol signature', () => {
    const fn = typed({
      Symbol: (x: symbol) => `symbol:${x.description}`,
      string: (x: string) => `string:${x}`,
    });

    expect(fn(Symbol('test'))).toBe('symbol:test');
    expect(fn('test')).toBe('string:test');
  });
});

describe('Modern Types: Map', () => {
  beforeEach(() => {
    resetTypeMasks();
  });

  it('should recognize Map values', () => {
    const mask = getTypeMaskForValue(new Map());
    expect(mask).toBe(1 << TYPE_MAP);
  });

  it('should get mask for Map type name', () => {
    const mask = getTypeMaskForName('Map');
    expect(mask).toBe(1 << TYPE_MAP);
  });

  it('should dispatch to Map signature', () => {
    const fn = typed({
      Map: (m: Map<unknown, unknown>) => `map:${m.size}`,
      Object: (_o: object) => 'object',
    });

    const map = new Map([['a', 1], ['b', 2]]);
    expect(fn(map)).toBe('map:2');
    expect(fn({})).toBe('object');
  });

  it('should not confuse Map with plain Object', () => {
    const fn = typed({
      Map: () => 'map',
      Object: () => 'object',
    });

    expect(fn(new Map())).toBe('map');
    expect(fn({})).toBe('object');
  });
});

describe('Modern Types: Set', () => {
  beforeEach(() => {
    resetTypeMasks();
  });

  it('should recognize Set values', () => {
    const mask = getTypeMaskForValue(new Set());
    expect(mask).toBe(1 << TYPE_SET);
  });

  it('should get mask for Set type name', () => {
    const mask = getTypeMaskForName('Set');
    expect(mask).toBe(1 << TYPE_SET);
  });

  it('should dispatch to Set signature', () => {
    const fn = typed({
      Set: (s: Set<unknown>) => `set:${s.size}`,
      Array: (a: unknown[]) => `array:${a.length}`,
    });

    const set = new Set([1, 2, 3]);
    expect(fn(set)).toBe('set:3');
    expect(fn([1, 2, 3])).toBe('array:3');
  });
});

describe('Modern Types: WeakMap', () => {
  beforeEach(() => {
    resetTypeMasks();
  });

  it('should recognize WeakMap values', () => {
    const mask = getTypeMaskForValue(new WeakMap());
    expect(mask).toBe(1 << TYPE_WEAKMAP);
  });

  it('should get mask for WeakMap type name', () => {
    const mask = getTypeMaskForName('WeakMap');
    expect(mask).toBe(1 << TYPE_WEAKMAP);
  });

  it('should dispatch to WeakMap signature', () => {
    const fn = typed({
      WeakMap: () => 'weakmap',
      Map: () => 'map',
    });

    expect(fn(new WeakMap())).toBe('weakmap');
    expect(fn(new Map())).toBe('map');
  });
});

describe('Modern Types: WeakSet', () => {
  beforeEach(() => {
    resetTypeMasks();
  });

  it('should recognize WeakSet values', () => {
    const mask = getTypeMaskForValue(new WeakSet());
    expect(mask).toBe(1 << TYPE_WEAKSET);
  });

  it('should get mask for WeakSet type name', () => {
    const mask = getTypeMaskForName('WeakSet');
    expect(mask).toBe(1 << TYPE_WEAKSET);
  });

  it('should dispatch to WeakSet signature', () => {
    const fn = typed({
      WeakSet: () => 'weakset',
      Set: () => 'set',
    });

    expect(fn(new WeakSet())).toBe('weakset');
    expect(fn(new Set())).toBe('set');
  });
});

describe('Modern Types: TypeMasks', () => {
  it('should have BIGINT mask', () => {
    expect(TypeMasks.BIGINT).toBe(1 << TYPE_BIGINT);
  });

  it('should have SYMBOL mask', () => {
    expect(TypeMasks.SYMBOL).toBe(1 << TYPE_SYMBOL);
  });

  it('should have MAP mask', () => {
    expect(TypeMasks.MAP).toBe(1 << TYPE_MAP);
  });

  it('should have SET mask', () => {
    expect(TypeMasks.SET).toBe(1 << TYPE_SET);
  });

  it('should have WEAKMAP mask', () => {
    expect(TypeMasks.WEAKMAP).toBe(1 << TYPE_WEAKMAP);
  });

  it('should have WEAKSET mask', () => {
    expect(TypeMasks.WEAKSET).toBe(1 << TYPE_WEAKSET);
  });

  it('should have NUMERIC mask (number | BigInt)', () => {
    expect(TypeMasks.NUMERIC).toBe((1 << 0) | (1 << TYPE_BIGINT));
  });

  it('should have COLLECTION mask (Map | Set)', () => {
    expect(TypeMasks.COLLECTION).toBe((1 << TYPE_MAP) | (1 << TYPE_SET));
  });

  it('should have WEAK_COLLECTION mask (WeakMap | WeakSet)', () => {
    expect(TypeMasks.WEAK_COLLECTION).toBe((1 << TYPE_WEAKMAP) | (1 << TYPE_WEAKSET));
  });

  it('should have ANY_COLLECTION mask (Array | Map | Set)', () => {
    expect(TypeMasks.ANY_COLLECTION).toBe((1 << 4) | (1 << TYPE_MAP) | (1 << TYPE_SET));
  });
});

describe('Modern Types: Combined Usage', () => {
  beforeEach(() => {
    resetTypeMasks();
  });

  it('should handle multiple modern types in one function', () => {
    const fn = typed({
      BigInt: (_x: bigint) => 'bigint',
      Symbol: (_x: symbol) => 'symbol',
      Map: (_x: Map<unknown, unknown>) => 'map',
      Set: (_x: Set<unknown>) => 'set',
      WeakMap: (_x: WeakMap<object, unknown>) => 'weakmap',
      WeakSet: (_x: WeakSet<object>) => 'weakset',
      number: (_x: number) => 'number',
      string: (_x: string) => 'string',
    });

    expect(fn(BigInt(1))).toBe('bigint');
    expect(fn(Symbol('x'))).toBe('symbol');
    expect(fn(new Map())).toBe('map');
    expect(fn(new Set())).toBe('set');
    expect(fn(new WeakMap())).toBe('weakmap');
    expect(fn(new WeakSet())).toBe('weakset');
    expect(fn(42)).toBe('number');
    expect(fn('hello')).toBe('string');
  });

  it('should support union types with modern types', () => {
    const fn = typed({
      'Map | Set': (_x: Map<unknown, unknown> | Set<unknown>) => 'collection',
      'WeakMap | WeakSet': (_x: WeakMap<object, unknown> | WeakSet<object>) => 'weak-collection',
    });

    expect(fn(new Map())).toBe('collection');
    expect(fn(new Set())).toBe('collection');
    expect(fn(new WeakMap())).toBe('weak-collection');
    expect(fn(new WeakSet())).toBe('weak-collection');
  });
});
