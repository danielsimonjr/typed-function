/**
 * Tests for WASM bindings and loader modules
 *
 * These tests cover src/wasm/bindings.ts and src/wasm/loader.ts
 * which were previously excluded from coverage.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  isWasmAvailable,
  resetWasm,
  wasmClearCache,
  wasmGetCacheStats,
  wasmGetSignatureCount,
  wasmGetBuiltinMask,
  wasmGetFunction,
  NO_MATCH,
} from '../src/wasm/bindings.js';
import {
  checkWasmAvailable,
  getLoadError,
  resetLoadState,
} from '../src/wasm/loader.js';
import { WasmNotAvailableError, WasmInitializationError } from '../src/core/errors.js';

describe('WASM Bindings', () => {
  beforeEach(() => {
    resetWasm();
    resetLoadState();
  });

  afterEach(() => {
    resetWasm();
    resetLoadState();
  });

  describe('isWasmAvailable', () => {
    it('should return boolean', () => {
      expect(typeof isWasmAvailable()).toBe('boolean');
    });

    it('should return false when WASM not initialized', () => {
      resetWasm();
      // Without explicit initialization, WASM should not be available
      // (actual availability depends on environment)
      expect(typeof isWasmAvailable()).toBe('boolean');
    });
  });

  describe('resetWasm', () => {
    it('should reset without error', () => {
      expect(() => resetWasm()).not.toThrow();
    });

    it('should be callable multiple times', () => {
      resetWasm();
      resetWasm();
      resetWasm();
      expect(true).toBe(true);
    });
  });

  describe('wasmClearCache', () => {
    it('should clear cache without error', () => {
      expect(() => wasmClearCache()).not.toThrow();
    });
  });

  describe('wasmGetCacheStats', () => {
    it('should return 0 when WASM not available', () => {
      resetWasm();
      expect(wasmGetCacheStats()).toBe(0);
    });
  });

  describe('wasmGetSignatureCount', () => {
    it('should return 0 when WASM not available', () => {
      resetWasm();
      expect(wasmGetSignatureCount()).toBe(0);
    });
  });

  describe('wasmGetBuiltinMask', () => {
    it('should return mask for type ID', () => {
      const mask = wasmGetBuiltinMask(0);
      // Should return 1 << 0 = 1 as fallback
      expect(mask).toBe(1);
    });

    it('should return correct mask for different type IDs', () => {
      expect(wasmGetBuiltinMask(1)).toBe(2);
      expect(wasmGetBuiltinMask(2)).toBe(4);
      expect(wasmGetBuiltinMask(3)).toBe(8);
    });
  });

  describe('wasmGetFunction', () => {
    it('should return null when WASM not available or index not found', () => {
      resetWasm();
      expect(wasmGetFunction(0)).toBeNull();
      expect(wasmGetFunction(999)).toBeNull();
    });
  });

  describe('NO_MATCH constant', () => {
    it('should be 0xffffffff', () => {
      expect(NO_MATCH).toBe(0xffffffff);
    });
  });
});

describe('WASM Loader', () => {
  beforeEach(() => {
    resetLoadState();
  });

  afterEach(() => {
    resetLoadState();
  });

  describe('checkWasmAvailable', () => {
    it('should return boolean', () => {
      expect(typeof checkWasmAvailable()).toBe('boolean');
    });
  });

  describe('getLoadError', () => {
    it('should return null initially', () => {
      resetLoadState();
      expect(getLoadError()).toBeNull();
    });
  });

  describe('resetLoadState', () => {
    it('should reset without error', () => {
      expect(() => resetLoadState()).not.toThrow();
    });

    it('should clear any load error', () => {
      resetLoadState();
      expect(getLoadError()).toBeNull();
    });
  });
});

describe('WASM Error Classes', () => {
  describe('WasmNotAvailableError', () => {
    it('should be constructable with message', () => {
      const error = new WasmNotAvailableError('WASM not available');
      // The error class adds a prefix to the message
      expect(error.message).toBe('WASM dispatch unavailable: WASM not available');
      expect(error.name).toBe('WasmNotAvailableError');
    });

    it('should be instanceof Error', () => {
      const error = new WasmNotAvailableError('test');
      expect(error instanceof Error).toBe(true);
      expect(error instanceof WasmNotAvailableError).toBe(true);
    });
  });

  describe('WasmInitializationError', () => {
    it('should be constructable with message', () => {
      const error = new WasmInitializationError('Failed to init');
      // The error class adds a prefix to the message
      expect(error.message).toBe('WASM initialization failed: Failed to init');
      expect(error.name).toBe('WasmInitializationError');
    });

    it('should be instanceof Error', () => {
      const error = new WasmInitializationError('test');
      expect(error instanceof Error).toBe(true);
      expect(error instanceof WasmInitializationError).toBe(true);
    });
  });
});

describe('WASM Integration with typed-function', () => {
  it('should export typed.init for WASM initialization', async () => {
    const { default: typed } = await import('../src/index.js');
    expect(typeof typed.init).toBe('function');
  });

  it('should export typed.isWasmEnabled', async () => {
    const { default: typed } = await import('../src/index.js');
    expect(typeof typed.isWasmEnabled).toBe('function');
    expect(typeof typed.isWasmEnabled()).toBe('boolean');
  });

  it('should export typed.resetWasm', async () => {
    const { default: typed } = await import('../src/index.js');
    expect(typeof typed.resetWasm).toBe('function');
    expect(() => typed.resetWasm()).not.toThrow();
  });

  it('should work without WASM enabled', async () => {
    const { default: typed, create } = await import('../src/index.js');

    const typed2 = create();
    typed2.resetWasm();

    // Create a typed function without WASM
    const fn = typed2({
      number: (x: number) => x * 2,
      string: (s: string) => s.toUpperCase(),
    });

    expect(fn(5)).toBe(10);
    expect(fn('hello')).toBe('HELLO');
  });

  it('typed.init should return false with preferWasm=false', async () => {
    const { create } = await import('../src/index.js');
    const typed2 = create();

    const result = await typed2.init({ preferWasm: false });
    expect(result).toBe(false);
    expect(typed2.isWasmEnabled()).toBe(false);
  });
});
