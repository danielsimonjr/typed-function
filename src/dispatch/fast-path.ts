/**
 * Fast-Path Dispatcher for typed-function
 *
 * Implements optimized dispatch for up to 6 signatures with max 2 arguments.
 * Falls back to generic dispatcher for more complex cases.
 */

import type { Signature, SignatureFunction, MismatchHandler, Param } from '../core/types.js';
import type { TypeRegistry } from '../core/type-registry.js';
import { compileTest, compileTests } from '../core/signature-compiler.js';
import { hasRestParam } from '../core/signature-comparator.js';

/**
 * Helper that always returns true (for empty/any param)
 */
function ok(): boolean {
  return true;
}

/**
 * Helper that always returns false (for disabled slots)
 */
function notOk(): boolean {
  return false;
}

/**
 * Helper that always returns undefined (for disabled function slots)
 */
function undef(): undefined {
  return undefined;
}

/**
 * Check if a signature is eligible for fast-path dispatch
 * (max 2 parameters, no rest param)
 */
export function isFastPathEligible(signature: Signature): boolean {
  return signature.params.length <= 2 && !hasRestParam(signature.params);
}

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
 * Create a simple test function for a parameter (without registry)
 */
function createSimpleTest(param: Param): (x: unknown) => boolean {
  if (param.types.length === 0 || param.hasAny) {
    return ok;
  }
  if (param.types.length === 1) {
    const firstType = param.types[0];
    return firstType ? firstType.test : ok;
  }
  const tests = param.types.map(t => t.test);
  return (x: unknown) => {
    for (const test of tests) {
      if (test(x)) return true;
    }
    return false;
  };
}

/**
 * Create a fast-path slot for a signature
 */
export function createFastPathSlot(signature: Signature, registry?: TypeRegistry): FastPathSlot {
  const params = signature.params;

  let test0: (x: unknown) => boolean;
  let test1: (x: unknown) => boolean;

  if (registry) {
    test0 = params[0] ? compileTest(params[0], registry) : ok;
    test1 = params[1] ? compileTest(params[1], registry) : ok;
  } else {
    test0 = params[0] ? createSimpleTest(params[0]) : ok;
    test1 = params[1] ? createSimpleTest(params[1]) : ok;
  }

  return {
    test0,
    test1,
    length: params.length,
    fn: signature.implementation!,
    active: true,
  };
}

/**
 * Create an inactive (disabled) fast-path slot
 */
export function createInactiveSlot(): FastPathSlot {
  return {
    test0: notOk,
    test1: notOk,
    length: -1,
    fn: undef as unknown as SignatureFunction,
    active: false,
  };
}

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
export function createFastPathDispatcher(signatures: Signature[]): FastPathDispatcher {
  const slots: FastPathSlot[] = [];
  let allActive = true;

  // Create slots for first 6 signatures
  for (let i = 0; i < 6; i++) {
    const sig = signatures[i];
    if (sig && isFastPathEligible(sig) && sig.implementation) {
      slots.push(createFastPathSlot(sig));
    } else {
      slots.push(createInactiveSlot());
      allActive = false;
    }
  }

  return {
    slots,
    allActive,
    genericStartIndex: allActive ? 6 : 0,
  };
}

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
export function createDispatcher(
  name: string,
  signatures: Signature[],
  genericDispatch: (args: IArguments, context: unknown) => unknown,
  _onMismatch: MismatchHandler
): SignatureFunction {
  // Suppress unused parameter warning
  void _onMismatch;

  const fp = createFastPathDispatcher(signatures);

  // Extract slot data for closure optimization
  const slot0 = fp.slots[0] || createInactiveSlot();
  const slot1 = fp.slots[1] || createInactiveSlot();
  const slot2 = fp.slots[2] || createInactiveSlot();
  const slot3 = fp.slots[3] || createInactiveSlot();
  const slot4 = fp.slots[4] || createInactiveSlot();
  const slot5 = fp.slots[5] || createInactiveSlot();

  const test00 = slot0.test0;
  const test01 = slot0.test1;
  const test10 = slot1.test0;
  const test11 = slot1.test1;
  const test20 = slot2.test0;
  const test21 = slot2.test1;
  const test30 = slot3.test0;
  const test31 = slot3.test1;
  const test40 = slot4.test0;
  const test41 = slot4.test1;
  const test50 = slot5.test0;
  const test51 = slot5.test1;

  const fn0 = slot0.fn;
  const fn1 = slot1.fn;
  const fn2 = slot2.fn;
  const fn3 = slot3.fn;
  const fn4 = slot4.fn;
  const fn5 = slot5.fn;

  const len0 = slot0.length;
  const len1 = slot1.length;
  const len2 = slot2.length;
  const len3 = slot3.length;
  const len4 = slot4.length;
  const len5 = slot5.length;

  // Create the typed function with fast-path dispatch
  function theTypedFn(this: unknown, arg0?: unknown, arg1?: unknown): unknown {
    const argc = arguments.length;

    // Fast path checks for first 6 signatures
    if (argc === len0 && test00(arg0) && test01(arg1)) {
      return fn0.apply(this, arguments as unknown as unknown[]);
    }
    if (argc === len1 && test10(arg0) && test11(arg1)) {
      return fn1.apply(this, arguments as unknown as unknown[]);
    }
    if (argc === len2 && test20(arg0) && test21(arg1)) {
      return fn2.apply(this, arguments as unknown as unknown[]);
    }
    if (argc === len3 && test30(arg0) && test31(arg1)) {
      return fn3.apply(this, arguments as unknown as unknown[]);
    }
    if (argc === len4 && test40(arg0) && test41(arg1)) {
      return fn4.apply(this, arguments as unknown as unknown[]);
    }
    if (argc === len5 && test50(arg0) && test51(arg1)) {
      return fn5.apply(this, arguments as unknown as unknown[]);
    }

    // Fall back to generic dispatch
    return genericDispatch(arguments, this);
  }

  // Set the function name
  try {
    Object.defineProperty(theTypedFn, 'name', { value: name });
  } catch {
    // Some environments don't support setting function name
  }

  return theTypedFn;
}

/**
 * Compile test functions for all signatures
 *
 * @param signatures - Array of signatures to compile tests for
 * @param registry - The type registry
 */
export function compileSignatureTests(signatures: Signature[], registry: TypeRegistry): void {
  for (const sig of signatures) {
    if (!sig.test) {
      sig.test = compileTests(sig.params, registry);
    }
  }
}
