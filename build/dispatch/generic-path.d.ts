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
export declare function createGenericDispatcher(name: string, signatures: Signature[], startIndex: number, onMismatch: MismatchHandler): GenericDispatcher;
/**
 * Create a simple dispatcher that only uses the generic path
 * (no fast-path optimization)
 *
 * @param name - Function name for error messages
 * @param signatures - Array of signatures to check
 * @param onMismatch - Handler called when no signature matches
 * @returns Dispatch function
 */
export declare function createSimpleDispatcher(name: string, signatures: Signature[], onMismatch: MismatchHandler): SignatureFunction;
/**
 * Check if all signatures have compiled test functions
 */
export declare function hasCompiledTests(signatures: Signature[]): boolean;
/**
 * Check if all signatures have implementation functions
 */
export declare function hasImplementations(signatures: Signature[]): boolean;
//# sourceMappingURL=generic-path.d.ts.map