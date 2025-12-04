/**
 * Fast-Path Dispatcher for typed-function
 *
 * Implements optimized dispatch for up to 6 signatures with max 2 arguments.
 * Falls back to generic dispatcher for more complex cases.
 */
import type { Signature, SignatureFunction, MismatchHandler } from '../core/types.js';
import type { TypeRegistry } from '../core/type-registry.js';
/**
 * Check if a signature is eligible for fast-path dispatch
 * (max 2 parameters, no rest param)
 */
export declare function isFastPathEligible(signature: Signature): boolean;
/**
 * Fast-path slot data for a single signature
 */
export interface FastPathSlot {
    /** Test for first parameter */
    test0: (x: unknown) => boolean;
    /** Test for second parameter */
    test1: (x: unknown) => boolean;
    /** Expected argument length */
    length: number;
    /** Implementation function */
    fn: SignatureFunction;
    /** Whether this slot is active */
    active: boolean;
}
/**
 * Create a fast-path slot for a signature
 */
export declare function createFastPathSlot(signature: Signature, registry?: TypeRegistry): FastPathSlot;
/**
 * Create an inactive (disabled) fast-path slot
 */
export declare function createInactiveSlot(): FastPathSlot;
/**
 * Fast-path dispatch data structure
 */
export interface FastPathDispatcher {
    /** Slots for first 6 signatures */
    slots: FastPathSlot[];
    /** Whether all 6 slots are active (enables full fast-path) */
    allActive: boolean;
    /** Index to start generic dispatch from */
    genericStartIndex: number;
}
/**
 * Create fast-path dispatcher data for a list of signatures
 *
 * @param signatures - The sorted signatures array
 * @returns Fast-path dispatcher data
 */
export declare function createFastPathDispatcher(signatures: Signature[]): FastPathDispatcher;
/**
 * Create the fast-path dispatch function
 *
 * This returns a function that tries fast-path dispatch for the first 6 signatures,
 * then falls back to the generic dispatcher.
 *
 * @param name - Function name for error messages
 * @param signatures - The sorted signatures array
 * @param genericDispatch - Generic dispatcher to fall back to
 * @param _onMismatch - Handler for when no signature matches (handled by generic)
 * @returns The typed function dispatcher
 */
export declare function createDispatcher(name: string, signatures: Signature[], genericDispatch: (args: IArguments, context: unknown) => unknown, _onMismatch: MismatchHandler): SignatureFunction;
/**
 * Compile test functions for all signatures
 *
 * @param signatures - Array of signatures to compile tests for
 * @param registry - The type registry
 */
export declare function compileSignatureTests(signatures: Signature[], registry: TypeRegistry): void;
//# sourceMappingURL=fast-path.d.ts.map