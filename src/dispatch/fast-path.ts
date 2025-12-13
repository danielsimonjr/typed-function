/**
 * Fast-Path Dispatcher for typed-function
 *
 * Implements optimized dispatch for up to 10 signatures with max 3 arguments.
 * Falls back to generic dispatcher for more complex cases.
 */

import type { Signature, SignatureFunction, MismatchHandler, Param } from '../core/types.js';
import type { TypeRegistry } from '../core/type-registry.js';
import { compileTest, compileTests } from '../core/signature-compiler.js';
import { hasRestParam } from '../core/signature-comparator.js';

/** Maximum number of fast-path signature slots */
export const FAST_PATH_SLOT_COUNT = 10;

/** Maximum number of parameters supported in fast-path */
export const FAST_PATH_MAX_PARAMS = 3;

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
 * (max 3 parameters, no rest param)
 */
export function isFastPathEligible(signature: Signature): boolean {
  return signature.params.length <= FAST_PATH_MAX_PARAMS && !hasRestParam(signature.params);
}

/**
 * Fast-path slot data for a single signature
 */
export interface FastPathSlot {
  /** Test for first parameter */
  test0: (x: unknown) => boolean;
  /** Test for second parameter */
  test1: (x: unknown) => boolean;
  /** Test for third parameter */
  test2: (x: unknown) => boolean;
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
  let test2: (x: unknown) => boolean;

  if (registry) {
    test0 = params[0] ? compileTest(params[0], registry) : ok;
    test1 = params[1] ? compileTest(params[1], registry) : ok;
    test2 = params[2] ? compileTest(params[2], registry) : ok;
  } else {
    test0 = params[0] ? createSimpleTest(params[0]) : ok;
    test1 = params[1] ? createSimpleTest(params[1]) : ok;
    test2 = params[2] ? createSimpleTest(params[2]) : ok;
  }

  return {
    test0,
    test1,
    test2,
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
    test2: notOk,
    length: -1,
    fn: undef as unknown as SignatureFunction,
    active: false,
  };
}

/**
 * Fast-path dispatch data structure
 */
export interface FastPathDispatcher {
  /** Slots for first 10 signatures */
  slots: FastPathSlot[];
  /** Whether all 10 slots are active (enables full fast-path) */
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

  // Create slots for first 10 signatures
  for (let i = 0; i < FAST_PATH_SLOT_COUNT; i++) {
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
    genericStartIndex: allActive ? FAST_PATH_SLOT_COUNT : 0,
  };
}

/**
 * Create the fast-path dispatch function
 *
 * This returns a function that tries fast-path dispatch for the first 10 signatures,
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _onMismatch: MismatchHandler
): SignatureFunction {
  const fp = createFastPathDispatcher(signatures);

  // Extract slot data for closure optimization - 10 slots
  const slot0 = fp.slots[0] || createInactiveSlot();
  const slot1 = fp.slots[1] || createInactiveSlot();
  const slot2 = fp.slots[2] || createInactiveSlot();
  const slot3 = fp.slots[3] || createInactiveSlot();
  const slot4 = fp.slots[4] || createInactiveSlot();
  const slot5 = fp.slots[5] || createInactiveSlot();
  const slot6 = fp.slots[6] || createInactiveSlot();
  const slot7 = fp.slots[7] || createInactiveSlot();
  const slot8 = fp.slots[8] || createInactiveSlot();
  const slot9 = fp.slots[9] || createInactiveSlot();

  // Test functions for each slot (3 params each)
  const test00 = slot0.test0;
  const test01 = slot0.test1;
  const test02 = slot0.test2;
  const test10 = slot1.test0;
  const test11 = slot1.test1;
  const test12 = slot1.test2;
  const test20 = slot2.test0;
  const test21 = slot2.test1;
  const test22 = slot2.test2;
  const test30 = slot3.test0;
  const test31 = slot3.test1;
  const test32 = slot3.test2;
  const test40 = slot4.test0;
  const test41 = slot4.test1;
  const test42 = slot4.test2;
  const test50 = slot5.test0;
  const test51 = slot5.test1;
  const test52 = slot5.test2;
  const test60 = slot6.test0;
  const test61 = slot6.test1;
  const test62 = slot6.test2;
  const test70 = slot7.test0;
  const test71 = slot7.test1;
  const test72 = slot7.test2;
  const test80 = slot8.test0;
  const test81 = slot8.test1;
  const test82 = slot8.test2;
  const test90 = slot9.test0;
  const test91 = slot9.test1;
  const test92 = slot9.test2;

  // Implementation functions
  const fn0 = slot0.fn;
  const fn1 = slot1.fn;
  const fn2 = slot2.fn;
  const fn3 = slot3.fn;
  const fn4 = slot4.fn;
  const fn5 = slot5.fn;
  const fn6 = slot6.fn;
  const fn7 = slot7.fn;
  const fn8 = slot8.fn;
  const fn9 = slot9.fn;

  // Expected argument lengths
  const len0 = slot0.length;
  const len1 = slot1.length;
  const len2 = slot2.length;
  const len3 = slot3.length;
  const len4 = slot4.length;
  const len5 = slot5.length;
  const len6 = slot6.length;
  const len7 = slot7.length;
  const len8 = slot8.length;
  const len9 = slot9.length;

  // Create the typed function with fast-path dispatch
  function theTypedFn(this: unknown, arg0?: unknown, arg1?: unknown, arg2?: unknown): unknown {
    const argc = arguments.length;

    // Fast path checks for first 10 signatures (with 3-param support)
    if (argc === len0 && test00(arg0) && test01(arg1) && test02(arg2)) {
      return fn0.apply(this, arguments as unknown as unknown[]);
    }
    if (argc === len1 && test10(arg0) && test11(arg1) && test12(arg2)) {
      return fn1.apply(this, arguments as unknown as unknown[]);
    }
    if (argc === len2 && test20(arg0) && test21(arg1) && test22(arg2)) {
      return fn2.apply(this, arguments as unknown as unknown[]);
    }
    if (argc === len3 && test30(arg0) && test31(arg1) && test32(arg2)) {
      return fn3.apply(this, arguments as unknown as unknown[]);
    }
    if (argc === len4 && test40(arg0) && test41(arg1) && test42(arg2)) {
      return fn4.apply(this, arguments as unknown as unknown[]);
    }
    if (argc === len5 && test50(arg0) && test51(arg1) && test52(arg2)) {
      return fn5.apply(this, arguments as unknown as unknown[]);
    }
    if (argc === len6 && test60(arg0) && test61(arg1) && test62(arg2)) {
      return fn6.apply(this, arguments as unknown as unknown[]);
    }
    if (argc === len7 && test70(arg0) && test71(arg1) && test72(arg2)) {
      return fn7.apply(this, arguments as unknown as unknown[]);
    }
    if (argc === len8 && test80(arg0) && test81(arg1) && test82(arg2)) {
      return fn8.apply(this, arguments as unknown as unknown[]);
    }
    if (argc === len9 && test90(arg0) && test91(arg1) && test92(arg2)) {
      return fn9.apply(this, arguments as unknown as unknown[]);
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
