/**
 * Debug Module for typed-function
 *
 * Provides logging and debugging utilities for understanding
 * dispatch decisions and function creation.
 */
import type { Signature, TypedFunction, Param } from './core/types.js';
/**
 * Debug log levels
 */
export type DebugLevel = 'none' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
/**
 * Debug event types
 */
export type DebugEventType = 'function:create' | 'function:call' | 'dispatch:start' | 'dispatch:match' | 'dispatch:nomatch' | 'dispatch:conversion' | 'type:register' | 'conversion:register' | 'wasm:init' | 'wasm:dispatch' | 'cache:hit' | 'cache:miss';
/**
 * Debug event payload
 */
export interface DebugEvent {
    /** Type of the event */
    type: DebugEventType;
    /** Timestamp of the event */
    timestamp: number;
    /** Function name (if applicable) */
    fnName?: string;
    /** Additional event data */
    data?: Record<string, unknown>;
}
/**
 * Debug handler function type
 */
export type DebugHandler = (event: DebugEvent) => void;
/**
 * Debug configuration
 */
export interface DebugConfig {
    /** Enable/disable debug mode */
    enabled: boolean;
    /** Minimum log level to output */
    level: DebugLevel;
    /** Custom handler for debug events */
    handler?: DebugHandler;
    /** Filter events by type */
    filter?: DebugEventType[];
    /** Include timing information */
    timing: boolean;
    /** Include stack traces */
    stackTraces: boolean;
}
export declare const levelPriority: Record<DebugLevel, number>;
/**
 * Configure debug mode
 *
 * @param options - Debug configuration options
 *
 * @example
 * ```ts
 * import { configureDebug } from 'typed-function';
 *
 * // Enable debug mode with info level
 * configureDebug({ enabled: true, level: 'info' });
 *
 * // Enable with custom handler
 * configureDebug({
 *   enabled: true,
 *   handler: (event) => console.log(JSON.stringify(event))
 * });
 * ```
 */
export declare function configureDebug(options: Partial<DebugConfig>): void;
/**
 * Reset debug configuration to defaults
 */
export declare function resetDebug(): void;
/**
 * Check if debug mode is enabled
 */
export declare function isDebugEnabled(): boolean;
/**
 * Get current debug level
 */
export declare function getDebugLevel(): DebugLevel;
/**
 * Add a debug event handler
 *
 * @param handler - The handler function
 * @returns A function to remove the handler
 */
export declare function addDebugHandler(handler: DebugHandler): () => void;
/**
 * Emit a debug event
 *
 * @param type - The event type
 * @param data - Additional event data
 * @param fnName - Function name (if applicable)
 */
export declare function emitDebugEvent(type: DebugEventType, data?: Record<string, unknown>, fnName?: string): void;
/**
 * Format a signature for logging
 */
export declare function formatSignature(signature: Signature): string;
/**
 * Format a parameter for logging
 */
export declare function formatParam(param: Param): string;
/**
 * Format arguments for logging
 */
export declare function formatArgs(args: ArrayLike<unknown>): string;
/**
 * Create a debug wrapper for a typed function
 *
 * @param fn - The typed function to wrap
 * @returns A wrapped function that logs debug info
 *
 * @example
 * ```ts
 * const add = typed('add', { 'number, number': (a, b) => a + b });
 * const debugAdd = wrapWithDebug(add);
 *
 * // Now calls to debugAdd will be logged
 * debugAdd(1, 2);
 * ```
 */
export declare function wrapWithDebug<T extends TypedFunction>(fn: T): T;
/**
 * Convenience function to enable debug mode
 */
export declare function enableDebug(level?: DebugLevel): void;
/**
 * Convenience function to disable debug mode
 */
export declare function disableDebug(): void;
//# sourceMappingURL=debug.d.ts.map