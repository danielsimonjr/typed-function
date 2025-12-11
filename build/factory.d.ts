/**
 * Factory Function for typed-function
 *
 * Creates isolated typed universes with independent type registries
 * and conversion managers.
 */
import type { TypedInstance } from './core/types.js';
/**
 * Options for initializing the typed-function instance
 */
export interface InitOptions {
    /** Whether to prefer WASM dispatch when available (default: true) */
    preferWasm?: boolean;
    /** Custom path to the WASM file (optional) */
    wasmPath?: string;
}
/**
 * Create a new typed-function instance
 *
 * Each instance has its own type registry and conversion manager,
 * creating an isolated "typed universe".
 *
 * @returns A new typed-function instance
 */
export declare function create(): TypedInstance;
declare const _default: TypedInstance;
export default _default;
//# sourceMappingURL=factory.d.ts.map