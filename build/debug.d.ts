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
/**
 * Subscribe to a specific event type
 *
 * @param eventType - The event type to subscribe to
 * @param handler - The handler function
 * @returns A function to unsubscribe
 *
 * @example
 * ```ts
 * import { on } from 'typed-function/debug';
 *
 * // Subscribe to dispatch matches
 * const off = on('dispatch:match', (event) => {
 *   console.log(`Matched: ${event.data?.signature}`);
 * });
 *
 * // Later, unsubscribe
 * off();
 * ```
 */
export declare function on(eventType: DebugEventType, handler: DebugHandler): () => void;
/**
 * Subscribe to an event type for a single occurrence
 *
 * @param eventType - The event type to subscribe to
 * @param handler - The handler function
 * @returns A function to unsubscribe early
 *
 * @example
 * ```ts
 * import { once } from 'typed-function/debug';
 *
 * // Subscribe to next function creation only
 * once('function:create', (event) => {
 *   console.log(`Created: ${event.fnName}`);
 * });
 * ```
 */
export declare function once(eventType: DebugEventType, handler: DebugHandler): () => void;
/**
 * Remove all handlers for a specific event type
 *
 * @param eventType - The event type to clear handlers for
 */
export declare function off(eventType: DebugEventType): void;
/**
 * Remove all event handlers
 */
export declare function removeAllListeners(): void;
/**
 * Get the count of handlers for an event type
 *
 * @param eventType - The event type (optional, returns total if not provided)
 * @returns Number of handlers
 */
export declare function listenerCount(eventType?: DebugEventType): number;
/**
 * Create a debug session that tracks events within a scope
 *
 * @returns A debug session object
 *
 * @example
 * ```ts
 * import { createDebugSession } from 'typed-function/debug';
 *
 * const session = createDebugSession();
 * session.start();
 *
 * // ... do some typed function operations ...
 *
 * const events = session.stop();
 * console.log(`Captured ${events.length} events`);
 * ```
 */
export declare function createDebugSession(): {
    start: () => void;
    stop: () => DebugEvent[];
    events: DebugEvent[];
    isActive: boolean;
};
//# sourceMappingURL=debug.d.ts.map