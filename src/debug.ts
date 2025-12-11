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
export type DebugEventType =
  | 'function:create'
  | 'function:call'
  | 'dispatch:start'
  | 'dispatch:match'
  | 'dispatch:nomatch'
  | 'dispatch:conversion'
  | 'type:register'
  | 'conversion:register'
  | 'wasm:init'
  | 'wasm:dispatch'
  | 'cache:hit'
  | 'cache:miss';

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

// Default configuration
const defaultConfig: DebugConfig = {
  enabled: false,
  level: 'info',
  timing: false,
  stackTraces: false,
};

// Current configuration
let config: DebugConfig = { ...defaultConfig };

// Event handlers
const handlers: Set<DebugHandler> = new Set();

// Level priority for filtering (exported for potential future use)
export const levelPriority: Record<DebugLevel, number> = {
  none: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  trace: 5,
};

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
export function configureDebug(options: Partial<DebugConfig>): void {
  config = { ...config, ...options };

  if (options.handler) {
    handlers.add(options.handler);
  }
}

/**
 * Reset debug configuration to defaults
 */
export function resetDebug(): void {
  config = { ...defaultConfig };
  handlers.clear();
}

/**
 * Check if debug mode is enabled
 */
export function isDebugEnabled(): boolean {
  return config.enabled;
}

/**
 * Get current debug level
 */
export function getDebugLevel(): DebugLevel {
  return config.level;
}

/**
 * Add a debug event handler
 *
 * @param handler - The handler function
 * @returns A function to remove the handler
 */
export function addDebugHandler(handler: DebugHandler): () => void {
  handlers.add(handler);
  return () => handlers.delete(handler);
}

/**
 * Emit a debug event
 *
 * @param type - The event type
 * @param data - Additional event data
 * @param fnName - Function name (if applicable)
 */
export function emitDebugEvent(
  type: DebugEventType,
  data?: Record<string, unknown>,
  fnName?: string
): void {
  if (!config.enabled) return;

  // Check filter
  if (config.filter && !config.filter.includes(type)) return;

  // Build the event object, only including optional fields if defined
  const event: DebugEvent = {
    type,
    timestamp: config.timing ? performance.now() : Date.now(),
  };

  if (fnName !== undefined) {
    event.fnName = fnName;
  }

  if (data !== undefined) {
    event.data = data;

    // Add stack trace if configured
    if (config.stackTraces) {
      data.stack = new Error().stack;
    }
  }

  // Call all handlers
  for (const handler of handlers) {
    try {
      handler(event);
    } catch {
      // Ignore handler errors
    }
  }

  // Default console output if no custom handler
  if (handlers.size === 0 || config.handler === undefined) {
    logEvent(event);
  }
}

/**
 * Log an event to console
 */
function logEvent(event: DebugEvent): void {
  const prefix = `[typed-function:${event.type}]`;
  const fnInfo = event.fnName ? ` ${event.fnName}` : '';

  switch (event.type) {
    case 'function:create':
      console.log(`${prefix}${fnInfo} created with ${event.data?.signatureCount ?? 0} signatures`);
      break;
    case 'function:call':
      console.log(`${prefix}${fnInfo} called with ${event.data?.argCount ?? 0} arguments`);
      break;
    case 'dispatch:start':
      console.log(`${prefix}${fnInfo} dispatching...`);
      break;
    case 'dispatch:match':
      console.log(`${prefix}${fnInfo} matched signature: ${event.data?.signature ?? 'unknown'}`);
      break;
    case 'dispatch:nomatch':
      console.warn(`${prefix}${fnInfo} no matching signature found`);
      break;
    case 'dispatch:conversion':
      console.log(`${prefix}${fnInfo} converting ${event.data?.from} -> ${event.data?.to}`);
      break;
    case 'type:register':
      console.log(`${prefix} registered type: ${event.data?.typeName}`);
      break;
    case 'conversion:register':
      console.log(`${prefix} registered conversion: ${event.data?.from} -> ${event.data?.to}`);
      break;
    case 'wasm:init':
      console.log(`${prefix} WASM initialized: ${event.data?.success ? 'success' : 'failed'}`);
      break;
    case 'wasm:dispatch':
      console.log(`${prefix}${fnInfo} using WASM dispatch`);
      break;
    case 'cache:hit':
      console.log(`${prefix}${fnInfo} cache hit`);
      break;
    case 'cache:miss':
      console.log(`${prefix}${fnInfo} cache miss`);
      break;
    default:
      console.log(`${prefix}${fnInfo}`, event.data);
  }
}

/**
 * Format a signature for logging
 */
export function formatSignature(signature: Signature): string {
  return signature.params.map((p) => p.name).join(', ');
}

/**
 * Format a parameter for logging
 */
export function formatParam(param: Param): string {
  const prefix = param.restParam ? '...' : '';
  return `${prefix}${param.name}`;
}

/**
 * Format arguments for logging
 */
export function formatArgs(args: ArrayLike<unknown>): string {
  const types: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    types.push(typeof arg === 'object' ? (arg === null ? 'null' : arg.constructor.name) : typeof arg);
  }
  return types.join(', ');
}

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
export function wrapWithDebug<T extends TypedFunction>(fn: T): T {
  const wrapper = function (this: unknown, ...args: unknown[]): unknown {
    const fnName = fn.name || 'anonymous';

    emitDebugEvent('function:call', { argCount: args.length, argTypes: formatArgs(args) }, fnName);
    emitDebugEvent('dispatch:start', {}, fnName);

    try {
      const result = fn.apply(this, args);
      emitDebugEvent('dispatch:match', { argTypes: formatArgs(args) }, fnName);
      return result;
    } catch (error) {
      emitDebugEvent('dispatch:nomatch', { error: String(error) }, fnName);
      throw error;
    }
  };

  // Copy properties from original function
  Object.defineProperty(wrapper, 'name', { value: fn.name, writable: false });
  Object.defineProperty(wrapper, 'signatures', { value: fn.signatures, writable: false });
  Object.defineProperty(wrapper, '_typedFunctionData', { value: fn._typedFunctionData, writable: false });

  return wrapper as T;
}

/**
 * Convenience function to enable debug mode
 */
export function enableDebug(level: DebugLevel = 'info'): void {
  configureDebug({ enabled: true, level });
}

/**
 * Convenience function to disable debug mode
 */
export function disableDebug(): void {
  configureDebug({ enabled: false });
}
