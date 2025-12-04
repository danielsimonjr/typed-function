/**
 * WASM Loader for typed-function dispatch
 *
 * Handles sync/async loading of WASM module with graceful fallback.
 */

import type { WasmExports } from './bindings.js';
import { initWasm, isWasmAvailable } from './bindings.js';

/** Loading state */
let loadingPromise: Promise<boolean> | null = null;
let loadError: Error | null = null;

/**
 * Load WASM module asynchronously
 *
 * @param wasmPath - Path to the WASM file
 * @returns Promise that resolves to true if loaded, false otherwise
 */
export async function loadWasm(wasmPath?: string): Promise<boolean> {
  // Return cached promise if already loading
  if (loadingPromise) {
    return loadingPromise;
  }

  // Already loaded
  if (isWasmAvailable()) {
    return true;
  }

  loadingPromise = doLoadWasm(wasmPath);
  return loadingPromise;
}

/**
 * Internal async loader
 */
async function doLoadWasm(wasmPath?: string): Promise<boolean> {
  try {
    // Determine WASM path
    const path = wasmPath || getDefaultWasmPath();

    // Check for WebAssembly support
    if (typeof WebAssembly === 'undefined') {
      throw new Error('WebAssembly not supported');
    }

    // Fetch and instantiate
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to fetch WASM: ${response.status}`);
    }

    const wasmBuffer = await response.arrayBuffer();
    const wasmModule = await WebAssembly.compile(wasmBuffer);
    const instance = await WebAssembly.instantiate(wasmModule, {
      env: {
        abort: () => {
          throw new Error('WASM abort');
        },
      },
    });

    // Initialize with exports
    initWasm(instance.exports as unknown as WasmExports);
    return true;
  } catch (error) {
    loadError = error instanceof Error ? error : new Error(String(error));
    return false;
  }
}

/**
 * Load WASM module synchronously (if possible)
 *
 * Note: This only works in environments that support synchronous
 * WebAssembly instantiation (e.g., Node.js with fs module)
 *
 * @param wasmBuffer - Pre-loaded WASM buffer
 * @returns true if loaded, false otherwise
 */
export function loadWasmSync(wasmBuffer: ArrayBuffer): boolean {
  try {
    if (typeof WebAssembly === 'undefined') {
      throw new Error('WebAssembly not supported');
    }

    const wasmModule = new WebAssembly.Module(wasmBuffer);
    const instance = new WebAssembly.Instance(wasmModule, {
      env: {
        abort: () => {
          throw new Error('WASM abort');
        },
      },
    });

    initWasm(instance.exports as unknown as WasmExports);
    return true;
  } catch (error) {
    loadError = error instanceof Error ? error : new Error(String(error));
    return false;
  }
}

/**
 * Ensure WASM is loaded before continuing
 *
 * @param wasmPath - Optional path to WASM file
 * @returns Promise that resolves when WASM is ready (or fallback should be used)
 */
export async function ensureWasm(wasmPath?: string): Promise<boolean> {
  if (isWasmAvailable()) {
    return true;
  }
  return loadWasm(wasmPath);
}

/**
 * Check if WASM is available without loading
 */
export function checkWasmAvailable(): boolean {
  return isWasmAvailable();
}

/**
 * Get the error from last load attempt
 */
export function getLoadError(): Error | null {
  return loadError;
}

/**
 * Reset loading state (for testing)
 */
export function resetLoadState(): void {
  loadingPromise = null;
  loadError = null;
}

/**
 * Get default WASM path based on environment
 */
function getDefaultWasmPath(): string {
  // In browser, assume WASM is served from same directory
  if (typeof window !== 'undefined') {
    return 'dispatch.wasm';
  }

  // In Node.js, use relative path from module
  return new URL('../../../build/dispatch.wasm', import.meta.url).href;
}

/**
 * Create a WASM module from inline base64 data
 *
 * @param base64 - Base64-encoded WASM binary
 * @returns true if loaded, false otherwise
 */
export function loadWasmFromBase64(base64: string): boolean {
  try {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return loadWasmSync(bytes.buffer);
  } catch (error) {
    loadError = error instanceof Error ? error : new Error(String(error));
    return false;
  }
}

/**
 * Preload WASM in background (doesn't block)
 */
export function preloadWasm(wasmPath?: string): void {
  // Start loading but don't await
  loadWasm(wasmPath).catch(() => {
    // Errors are stored in loadError, no need to throw
  });
}
