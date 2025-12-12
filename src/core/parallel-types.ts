/**
 * Parallel and Concurrent Computing Types
 *
 * This module provides type definitions for parallel computing including
 * futures, streams, channels, shared arrays, and atomic numbers.
 */

import type { TypeDef } from './types.js';

// =============================================================================
// Type Interfaces
// =============================================================================

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
  next: () => { value: T; done: boolean } | { done: true };
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

// =============================================================================
// Type Test Functions
// =============================================================================

/**
 * Test if value is a Future/Promise-like
 */
export function isFuture(x: unknown): x is Future {
  return x !== null && typeof x === 'object' && 'then' in x && typeof (x as Future).then === 'function';
}

/**
 * Test if value is a Stream
 */
export function isStream(x: unknown): x is Stream {
  return x !== null && typeof x === 'object' && 'next' in x && typeof (x as Stream).next === 'function';
}

/**
 * Test if value is a Channel
 */
export function isChannel(x: unknown): x is Channel {
  if (x === null || typeof x !== 'object') return false;
  const c = x as Channel;
  return 'send' in c && 'receive' in c && typeof c.send === 'function' && typeof c.receive === 'function';
}

/**
 * Test if value is a SharedArray
 */
export function isSharedArray(x: unknown): x is SharedArray {
  if (x === null || typeof x !== 'object') return false;
  const s = x as SharedArray;
  return (
    'buffer' in s &&
    'length' in s &&
    typeof s.length === 'number' &&
    typeof SharedArrayBuffer !== 'undefined' &&
    s.buffer instanceof SharedArrayBuffer
  );
}

/**
 * Test if value is an AtomicNumber
 */
export function isAtomicNumber(x: unknown): x is AtomicNumber {
  if (x === null || typeof x !== 'object') return false;
  const a = x as AtomicNumber;
  return (
    'value' in a &&
    'buffer' in a &&
    (typeof a.value === 'number' || typeof a.value === 'bigint') &&
    typeof SharedArrayBuffer !== 'undefined' &&
    a.buffer instanceof SharedArrayBuffer
  );
}

// =============================================================================
// Type Definitions for Registration
// =============================================================================

/**
 * Parallel/concurrent computing types
 */
export const PARALLEL_TYPES: TypeDef[] = [
  { name: 'Future', test: isFuture },
  { name: 'Stream', test: isStream },
  { name: 'Channel', test: isChannel },
  { name: 'SharedArray', test: isSharedArray },
  { name: 'AtomicNumber', test: isAtomicNumber },
];
