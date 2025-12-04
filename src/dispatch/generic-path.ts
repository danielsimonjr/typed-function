/**
 * Generic Dispatcher for typed-function
 *
 * Fallback loop dispatcher for signatures beyond fast-path,
 * with onMismatch handler integration.
 */

import type { Signature, MismatchHandler, SignatureFunction } from '../core/types.js';

/**
 * Generic dispatch function type
 */
export type GenericDispatcher = (args: IArguments, context: unknown) => unknown;

/**
 * Create a generic dispatcher that iterates through all signatures
 *
 * @param name - Function name for error messages
 * @param signatures - Array of signatures to check
 * @param startIndex - Index to start iteration from (for fast-path integration)
 * @param onMismatch - Handler called when no signature matches
 * @returns Generic dispatch function
 */
export function createGenericDispatcher(
  name: string,
  signatures: Signature[],
  startIndex: number,
  onMismatch: MismatchHandler
): GenericDispatcher {
  const iStart = startIndex;
  const iEnd = signatures.length;

  // Pre-dereference for execution speed, filtering out null/undefined
  const tests: Array<(args: ArrayLike<unknown>) => boolean> = [];
  const fns: SignatureFunction[] = [];

  for (const s of signatures) {
    if (s.test && s.implementation) {
      tests.push(s.test);
      fns.push(s.implementation);
    }
  }

  return function generic(args: IArguments, context: unknown): unknown {
    const argsArray = Array.prototype.slice.call(args);

    for (let i = iStart; i < iEnd; i++) {
      const test = tests[i];
      const fn = fns[i];
      if (test && fn && test(argsArray)) {
        return fn.apply(context, args as unknown as unknown[]);
      }
    }

    return onMismatch(name, argsArray, signatures);
  };
}

/**
 * Create a simple dispatcher that only uses the generic path
 * (no fast-path optimization)
 *
 * @param name - Function name for error messages
 * @param signatures - Array of signatures to check
 * @param onMismatch - Handler called when no signature matches
 * @returns Dispatch function
 */
export function createSimpleDispatcher(
  name: string,
  signatures: Signature[],
  onMismatch: MismatchHandler
): SignatureFunction {
  // Pre-dereference for execution speed, filtering out null/undefined
  const tests: Array<(args: ArrayLike<unknown>) => boolean> = [];
  const fns: SignatureFunction[] = [];

  for (const s of signatures) {
    if (s.test && s.implementation) {
      tests.push(s.test);
      fns.push(s.implementation);
    }
  }

  const len = tests.length;

  const dispatcher: SignatureFunction = function (this: unknown): unknown {
    const args = Array.prototype.slice.call(arguments);

    for (let i = 0; i < len; i++) {
      const test = tests[i];
      const fn = fns[i];
      if (test && fn && test(args)) {
        return fn.apply(this, args);
      }
    }

    return onMismatch(name, args, signatures);
  };

  try {
    Object.defineProperty(dispatcher, 'name', { value: name });
  } catch {
    // Some environments don't support setting function name
  }

  return dispatcher;
}

/**
 * Check if all signatures have compiled test functions
 */
export function hasCompiledTests(signatures: Signature[]): boolean {
  return signatures.every((s) => typeof s.test === 'function');
}

/**
 * Check if all signatures have implementation functions
 */
export function hasImplementations(signatures: Signature[]): boolean {
  return signatures.every((s) => typeof s.implementation === 'function');
}
