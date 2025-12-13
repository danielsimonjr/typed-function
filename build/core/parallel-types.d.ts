/**
 * Parallel and Concurrent Computing Types
 *
 * This module provides type definitions for parallel computing including
 * futures, streams, channels, shared arrays, and atomic numbers.
 */
import type { TypeDef } from './types.js';
/**
 * Future/Promise-like for async computation
 */
export interface Future<T = unknown> {
    then: (onFulfilled?: (value: T) => unknown) => Future;
    catch?: (onRejected?: (reason: unknown) => unknown) => Future;
}
/**
 * Stream for lazy/infinite sequences
 */
export interface Stream<T = unknown> {
    next: () => {
        value: T;
        done: boolean;
    } | {
        done: true;
    };
    [Symbol.iterator]?: () => Iterator<T>;
}
/**
 * Channel for CSP-style communication
 */
export interface Channel<T = unknown> {
    send: (value: T) => Promise<void> | void;
    receive: () => Promise<T> | T;
    close?: () => void;
}
/**
 * Shared array for parallel workers
 */
export interface SharedArray {
    buffer: SharedArrayBuffer;
    length: number;
}
/**
 * Atomic number for thread-safe operations
 */
export interface AtomicNumber {
    value: number | bigint;
    buffer: SharedArrayBuffer;
}
/**
 * Test if value is a Future/Promise-like
 */
export declare function isFuture(x: unknown): x is Future;
/**
 * Test if value is a Stream
 */
export declare function isStream(x: unknown): x is Stream;
/**
 * Test if value is a Channel
 */
export declare function isChannel(x: unknown): x is Channel;
/**
 * Test if value is a SharedArray
 */
export declare function isSharedArray(x: unknown): x is SharedArray;
/**
 * Test if value is an AtomicNumber
 */
export declare function isAtomicNumber(x: unknown): x is AtomicNumber;
/**
 * Parallel/concurrent computing types
 */
export declare const PARALLEL_TYPES: TypeDef[];
//# sourceMappingURL=parallel-types.d.ts.map