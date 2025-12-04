/**
 * WASM Loader for typed-function dispatch
 *
 * Handles sync/async loading of WASM module with graceful fallback.
 */
/**
 * Load WASM module asynchronously
 *
 * @param wasmPath - Path to the WASM file
 * @returns Promise that resolves to true if loaded, false otherwise
 */
export declare function loadWasm(wasmPath?: string): Promise<boolean>;
/**
 * Load WASM module synchronously (if possible)
 *
 * Note: This only works in environments that support synchronous
 * WebAssembly instantiation (e.g., Node.js with fs module)
 *
 * @param wasmBuffer - Pre-loaded WASM buffer
 * @returns true if loaded, false otherwise
 */
export declare function loadWasmSync(wasmBuffer: ArrayBuffer): boolean;
/**
 * Ensure WASM is loaded before continuing
 *
 * @param wasmPath - Optional path to WASM file
 * @returns Promise that resolves when WASM is ready (or fallback should be used)
 */
export declare function ensureWasm(wasmPath?: string): Promise<boolean>;
/**
 * Check if WASM is available without loading
 */
export declare function checkWasmAvailable(): boolean;
/**
 * Get the error from last load attempt
 */
export declare function getLoadError(): Error | null;
/**
 * Reset loading state (for testing)
 */
export declare function resetLoadState(): void;
/**
 * Create a WASM module from inline base64 data
 *
 * @param base64 - Base64-encoded WASM binary
 * @returns true if loaded, false otherwise
 */
export declare function loadWasmFromBase64(base64: string): boolean;
/**
 * Preload WASM in background (doesn't block)
 */
export declare function preloadWasm(wasmPath?: string): void;
//# sourceMappingURL=loader.d.ts.map