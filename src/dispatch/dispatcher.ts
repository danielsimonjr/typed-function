/**
 * Main Typed Function Builder for typed-function
 *
 * Creates typed functions with signature parsing, conflict detection,
 * sorting, compilation, and dispatcher creation.
 */

import type {
  Signature,
  SignatureFunction,
  TypedFunction,
  MismatchHandler,
  ReferTo,
  ReferToSelf,
} from '../core/types.js';
import type { TypeRegistry } from '../core/type-registry.js';
import type { ConversionManager } from '../core/conversion-manager.js';

import { parseSignature, expandParam, stringifyParams, splitParams } from '../core/signature-parser.js';
import { compareSignatures, conflicting } from '../core/signature-comparator.js';
import { compileArgsPreprocessing } from '../core/signature-compiler.js';
import { resolveReferences, validateDeprecatedThis } from '../core/reference-resolver.js';
import {
  compileSignatureTests,
  createFastPathDispatcher,
  createInactiveSlot,
  FAST_PATH_SLOT_COUNT,
} from './fast-path.js';
import { createGenericDispatcher } from './generic-path.js';
import { isWasmAvailable, wasmAddSignature } from '../wasm/bindings.js';
import { getTypeMaskForName } from '../wasm/type-masks.js';

/**
 * Options for creating a typed function
 */
export interface CreateTypedFunctionOptions {
  /** Type registry to use */
  registry: TypeRegistry;
  /** Conversion manager to use */
  conversions: ConversionManager;
  /** Handler for signature mismatch */
  onMismatch: MismatchHandler;
  /** Whether to warn against deprecated this usage */
  warnAgainstDeprecatedThis?: boolean;
  /** Whether to use WASM dispatch when available */
  useWasm?: boolean;
}

/**
 * Create a typed function from a signature map
 *
 * @param name - Name of the typed function
 * @param rawSignaturesMap - Map of signature strings to functions
 * @param options - Creation options
 * @returns The created typed function
 */
export function createTypedFunction(
  name: string,
  rawSignaturesMap: Record<string, SignatureFunction | ReferTo | ReferToSelf>,
  options: CreateTypedFunctionOptions
): TypedFunction {
  const { registry, conversions, warnAgainstDeprecatedThis = true, useWasm = false } = options;
  // Create a wrapper that dynamically calls options.onMismatch
  // This allows the handler to be changed after function creation
  const onMismatch: MismatchHandler = (fnName, args, sigs) => options.onMismatch(fnName, args, sigs);

  if (Object.keys(rawSignaturesMap).length === 0) {
    throw new SyntaxError('No signatures provided');
  }

  if (warnAgainstDeprecatedThis) {
    validateDeprecatedThis(rawSignaturesMap as Record<string, SignatureFunction>);
  }

  // Main processing loop for signatures
  const parsedParams: Array<Signature['params']> = [];
  const originalFunctions: Array<SignatureFunction | ReferTo | ReferToSelf> = [];
  const signaturesMap: Record<string, number> = {};
  const preliminarySignatures: Array<{
    params: Signature['params'];
    name: string;
    fn: number;
  }> = [];

  for (const signature in rawSignaturesMap) {
    // Protect against polluted Object prototype
    if (!Object.prototype.hasOwnProperty.call(rawSignaturesMap, signature)) {
      continue;
    }

    // Parse the signature
    const params = parseSignature(signature, registry);
    if (!params) continue;

    // Check for conflicts
    for (const pp of parsedParams) {
      if (conflicting(pp, params)) {
        throw new TypeError(
          `Conflicting signatures "${stringifyParams(pp)}" and "${stringifyParams(params)}".`
        );
      }
    }
    parsedParams.push(params);

    // Store the provided function and add conversions
    const functionIndex = originalFunctions.length;
    const rawFn = rawSignaturesMap[signature];
    if (rawFn !== undefined) {
      originalFunctions.push(rawFn);
    }

    // Expand params with conversions
    const conversionParams = params.map((p) => expandParam(p, registry));

    // Split the signatures and collect them
    for (const sp of splitParams(conversionParams)) {
      const spName = stringifyParams(sp);
      preliminarySignatures.push({
        params: sp,
        name: spName,
        fn: functionIndex,
      });

      // Only map exact (non-conversion) signatures
      if (sp.every((p) => !p.hasConversion)) {
        signaturesMap[spName] = functionIndex;
      }
    }
  }

  // Sort signatures by priority
  const maxTypeIndex = registry.typeCount - 1;
  const maxConversionIndex = conversions.conversionCount;
  preliminarySignatures.sort((a, b) =>
    compareSignatures(a, b, maxTypeIndex, maxConversionIndex)
  );

  // PublicSignaturesMap will be filled after reference resolution
  const publicSignaturesMap: Record<string, SignatureFunction> = {};

  // Build final signatures array
  const signatures: Signature[] = [];
  const internalSignatureMap = new Map<string, Signature>();

  for (const s of preliminarySignatures) {
    // Only add unique signatures (after sorting, duplicates from conversions are eliminated)
    if (!internalSignatureMap.has(s.name)) {
      // Initially, fn will be null - it's filled in after reference resolution
      const signature: Signature = {
        params: s.params,
        fn: null,
        test: null,
        implementation: null,
      };
      signatures.push(signature);
      internalSignatureMap.set(s.name, signature);
    }
  }

  // Compile test functions
  compileSignatureTests(signatures, registry);

  // Create the typed function shell FIRST
  // This is the actual function that will be returned and passed to referToSelf
  // The dispatch logic will be set up via closure after reference resolution
  let genericDispatch: ((args: IArguments, context: unknown) => unknown) | null = null;
  let fastPathReady = false;
  let wasmDispatchEnabled = useWasm && isWasmAvailable();

  // Fast-path slot variables for 10 slots with 3 params each
  // These are assigned once after theTypedFn is defined, then used via closure
  /* eslint-disable prefer-const */
  let slot0Test0: (x: unknown) => boolean;
  let slot0Test1: (x: unknown) => boolean;
  let slot0Test2: (x: unknown) => boolean;
  let slot0Len: number;
  let slot0Fn: SignatureFunction;
  let slot1Test0: (x: unknown) => boolean;
  let slot1Test1: (x: unknown) => boolean;
  let slot1Test2: (x: unknown) => boolean;
  let slot1Len: number;
  let slot1Fn: SignatureFunction;
  let slot2Test0: (x: unknown) => boolean;
  let slot2Test1: (x: unknown) => boolean;
  let slot2Test2: (x: unknown) => boolean;
  let slot2Len: number;
  let slot2Fn: SignatureFunction;
  let slot3Test0: (x: unknown) => boolean;
  let slot3Test1: (x: unknown) => boolean;
  let slot3Test2: (x: unknown) => boolean;
  let slot3Len: number;
  let slot3Fn: SignatureFunction;
  let slot4Test0: (x: unknown) => boolean;
  let slot4Test1: (x: unknown) => boolean;
  let slot4Test2: (x: unknown) => boolean;
  let slot4Len: number;
  let slot4Fn: SignatureFunction;
  let slot5Test0: (x: unknown) => boolean;
  let slot5Test1: (x: unknown) => boolean;
  let slot5Test2: (x: unknown) => boolean;
  let slot5Len: number;
  let slot5Fn: SignatureFunction;
  let slot6Test0: (x: unknown) => boolean;
  let slot6Test1: (x: unknown) => boolean;
  let slot6Test2: (x: unknown) => boolean;
  let slot6Len: number;
  let slot6Fn: SignatureFunction;
  let slot7Test0: (x: unknown) => boolean;
  let slot7Test1: (x: unknown) => boolean;
  let slot7Test2: (x: unknown) => boolean;
  let slot7Len: number;
  let slot7Fn: SignatureFunction;
  let slot8Test0: (x: unknown) => boolean;
  let slot8Test1: (x: unknown) => boolean;
  let slot8Test2: (x: unknown) => boolean;
  let slot8Len: number;
  let slot8Fn: SignatureFunction;
  let slot9Test0: (x: unknown) => boolean;
  let slot9Test1: (x: unknown) => boolean;
  let slot9Test2: (x: unknown) => boolean;
  let slot9Len: number;
  let slot9Fn: SignatureFunction;
  /* eslint-enable prefer-const */

  function theTypedFn(this: unknown, arg0?: unknown, arg1?: unknown, arg2?: unknown): unknown {
    const argc = arguments.length;

    if (fastPathReady) {
      // Fast path checks for first 10 signatures with 3-param support
      if (argc === slot0Len && slot0Test0(arg0) && slot0Test1(arg1) && slot0Test2(arg2)) {
        return slot0Fn.apply(this, arguments as unknown as unknown[]);
      }
      if (argc === slot1Len && slot1Test0(arg0) && slot1Test1(arg1) && slot1Test2(arg2)) {
        return slot1Fn.apply(this, arguments as unknown as unknown[]);
      }
      if (argc === slot2Len && slot2Test0(arg0) && slot2Test1(arg1) && slot2Test2(arg2)) {
        return slot2Fn.apply(this, arguments as unknown as unknown[]);
      }
      if (argc === slot3Len && slot3Test0(arg0) && slot3Test1(arg1) && slot3Test2(arg2)) {
        return slot3Fn.apply(this, arguments as unknown as unknown[]);
      }
      if (argc === slot4Len && slot4Test0(arg0) && slot4Test1(arg1) && slot4Test2(arg2)) {
        return slot4Fn.apply(this, arguments as unknown as unknown[]);
      }
      if (argc === slot5Len && slot5Test0(arg0) && slot5Test1(arg1) && slot5Test2(arg2)) {
        return slot5Fn.apply(this, arguments as unknown as unknown[]);
      }
      if (argc === slot6Len && slot6Test0(arg0) && slot6Test1(arg1) && slot6Test2(arg2)) {
        return slot6Fn.apply(this, arguments as unknown as unknown[]);
      }
      if (argc === slot7Len && slot7Test0(arg0) && slot7Test1(arg1) && slot7Test2(arg2)) {
        return slot7Fn.apply(this, arguments as unknown as unknown[]);
      }
      if (argc === slot8Len && slot8Test0(arg0) && slot8Test1(arg1) && slot8Test2(arg2)) {
        return slot8Fn.apply(this, arguments as unknown as unknown[]);
      }
      if (argc === slot9Len && slot9Test0(arg0) && slot9Test1(arg1) && slot9Test2(arg2)) {
        return slot9Fn.apply(this, arguments as unknown as unknown[]);
      }
    }

    // Fall back to generic dispatch
    if (genericDispatch) {
      return genericDispatch(arguments, this);
    }

    // Should never happen - function not fully initialized
    throw new Error('Typed function not initialized');
  }

  // Set the function name
  try {
    Object.defineProperty(theTypedFn, 'name', { value: name });
  } catch {
    // Some environments don't support setting function name
  }

  // Cast to TypedFunction and set initial properties
  const typedFn = theTypedFn as unknown as TypedFunction;
  typedFn.signatures = publicSignaturesMap; // Will be filled in
  typedFn._typedFunctionData = {
    signatures,
    signatureMap: internalSignatureMap,
  };

  // Now resolve references with the actual function
  // referToSelf callbacks will receive this exact function
  const fullyResolvedFunctions = resolveReferences(
    originalFunctions,
    signaturesMap,
    typedFn
  );

  // Update signatures with fully resolved functions
  for (let i = 0; i < signatures.length; i++) {
    const sig = signatures[i];
    if (sig) {
      const sigName = stringifyParams(sig.params);
      const prelim = preliminarySignatures.find((p) => p.name === sigName);
      if (prelim) {
        sig.fn = fullyResolvedFunctions[prelim.fn] ?? null;
        if (sig.fn) {
          sig.implementation = compileArgsPreprocessing(sig.params, sig.fn, registry);
        }
      }
    }
  }

  // Fill in the public signatures map with resolved functions
  for (const s in signaturesMap) {
    if (Object.prototype.hasOwnProperty.call(signaturesMap, s)) {
      const idx = signaturesMap[s];
      if (idx !== undefined) {
        const fn = fullyResolvedFunctions[idx];
        if (fn) {
          publicSignaturesMap[s] = fn;
        }
      }
    }
  }

  // Now set up the fast-path dispatch slots
  const fpData = createFastPathDispatcher(signatures);

  // Initialize slot variables from fast-path data (10 slots)
  const inactiveSlot = createInactiveSlot();

  const s0 = fpData.slots[0] || inactiveSlot;
  const s1 = fpData.slots[1] || inactiveSlot;
  const s2 = fpData.slots[2] || inactiveSlot;
  const s3 = fpData.slots[3] || inactiveSlot;
  const s4 = fpData.slots[4] || inactiveSlot;
  const s5 = fpData.slots[5] || inactiveSlot;
  const s6 = fpData.slots[6] || inactiveSlot;
  const s7 = fpData.slots[7] || inactiveSlot;
  const s8 = fpData.slots[8] || inactiveSlot;
  const s9 = fpData.slots[9] || inactiveSlot;

  slot0Test0 = s0.test0; slot0Test1 = s0.test1; slot0Test2 = s0.test2; slot0Len = s0.length; slot0Fn = s0.fn;
  slot1Test0 = s1.test0; slot1Test1 = s1.test1; slot1Test2 = s1.test2; slot1Len = s1.length; slot1Fn = s1.fn;
  slot2Test0 = s2.test0; slot2Test1 = s2.test1; slot2Test2 = s2.test2; slot2Len = s2.length; slot2Fn = s2.fn;
  slot3Test0 = s3.test0; slot3Test1 = s3.test1; slot3Test2 = s3.test2; slot3Len = s3.length; slot3Fn = s3.fn;
  slot4Test0 = s4.test0; slot4Test1 = s4.test1; slot4Test2 = s4.test2; slot4Len = s4.length; slot4Fn = s4.fn;
  slot5Test0 = s5.test0; slot5Test1 = s5.test1; slot5Test2 = s5.test2; slot5Len = s5.length; slot5Fn = s5.fn;
  slot6Test0 = s6.test0; slot6Test1 = s6.test1; slot6Test2 = s6.test2; slot6Len = s6.length; slot6Fn = s6.fn;
  slot7Test0 = s7.test0; slot7Test1 = s7.test1; slot7Test2 = s7.test2; slot7Len = s7.length; slot7Fn = s7.fn;
  slot8Test0 = s8.test0; slot8Test1 = s8.test1; slot8Test2 = s8.test2; slot8Len = s8.length; slot8Fn = s8.fn;
  slot9Test0 = s9.test0; slot9Test1 = s9.test1; slot9Test2 = s9.test2; slot9Len = s9.length; slot9Fn = s9.fn;

  // Create generic dispatcher
  genericDispatch = createGenericDispatcher(
    name,
    signatures,
    fpData.genericStartIndex,
    onMismatch
  );

  // Enable fast path
  fastPathReady = true;

  // Register signatures with WASM dispatch if enabled
  if (wasmDispatchEnabled) {
    try {
      for (const sig of signatures) {
        if (sig && sig.implementation) {
          // Build param masks for WASM
          const paramMasks = sig.params.map((param) => {
            // Combine all type masks for this parameter
            let mask = 0;
            for (const type of param.types) {
              mask |= getTypeMaskForName(type.name);
            }
            return mask;
          });
          wasmAddSignature(sig.implementation, paramMasks);
        }
      }
      (typedFn as TypedFunction & { _wasmEnabled?: boolean })._wasmEnabled = true;
    } catch {
      // WASM registration failed, fall back to JS dispatch
      (typedFn as TypedFunction & { _wasmEnabled?: boolean })._wasmEnabled = false;
    }
  }

  // Suppress unused variable warning - FAST_PATH_SLOT_COUNT used for documentation
  void FAST_PATH_SLOT_COUNT;

  return typedFn;
}

/**
 * Check if a name is valid (A) new, (B) a match, or (C) a mismatch
 *
 * @param nameSoFar - Current name
 * @param newName - New name to check
 * @returns Updated name
 * @throws Error if names mismatch
 */
export function checkName(nameSoFar: string | undefined, newName: string | undefined): string {
  if (!nameSoFar) {
    return newName || '';
  }
  if (newName && newName !== nameSoFar) {
    const err = new Error(
      `Function names do not match (expected: ${nameSoFar}, actual: ${newName})`
    ) as Error & { data?: { actual: string; expected: string } };
    err.data = { actual: newName, expected: nameSoFar };
    throw err;
  }
  return nameSoFar;
}

/**
 * Retrieve the implied name from an object with signature keys
 *
 * @param obj - Object with signature keys and function values
 * @param isTypedFunction - Function to check if a value is a typed function
 * @returns The implied name, or undefined
 */
export function getObjectName(
  obj: Record<string, SignatureFunction>,
  isTypedFunction: (entity: unknown) => boolean
): string | undefined {
  let name: string | undefined;

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const fn = obj[key];
      if (fn && (isTypedFunction(fn) ||
          typeof (fn as SignatureFunction & { signature?: string }).signature === 'string')) {
        name = checkName(name, fn.name);
      }
    }
  }

  return name;
}

/**
 * Merge signatures from source into dest
 *
 * @param dest - Destination object
 * @param source - Source object
 * @throws Error if signature is defined twice with different functions
 */
export function mergeSignatures(
  dest: Record<string, SignatureFunction | ReferTo | ReferToSelf>,
  source: Record<string, SignatureFunction | ReferTo | ReferToSelf>
): void {
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (key in dest) {
        if (source[key] !== dest[key]) {
          const err = new Error(`Signature "${key}" is defined twice`) as Error & {
            data?: { signature: string; sourceFunction: unknown; destFunction: unknown };
          };
          err.data = {
            signature: key,
            sourceFunction: source[key],
            destFunction: dest[key],
          };
          throw err;
        }
      }
      const srcFn = source[key];
      if (srcFn !== undefined) {
        dest[key] = srcFn;
      }
    }
  }
}
