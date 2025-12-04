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
import { createDispatcher, compileSignatureTests, createFastPathDispatcher } from './fast-path.js';
import { createGenericDispatcher } from './generic-path.js';

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
  const { registry, conversions, onMismatch, warnAgainstDeprecatedThis = true } = options;

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

  // Create placeholder for the typed function (for referToSelf)
  let theTypedFn: TypedFunction;

  // Resolve references
  const resolvedFunctions = resolveReferences(
    originalFunctions,
    signaturesMap,
    // Forward reference - will be set after function is created
    { signatures: {} } as unknown as TypedFunction
  );

  // Fill in the proper function for each signature
  const publicSignaturesMap: Record<string, SignatureFunction> = {};
  for (const s in signaturesMap) {
    if (Object.prototype.hasOwnProperty.call(signaturesMap, s)) {
      const idx = signaturesMap[s];
      if (idx !== undefined) {
        const fn = resolvedFunctions[idx];
        if (fn) {
          publicSignaturesMap[s] = fn;
        }
      }
    }
  }

  // Build final signatures array
  const signatures: Signature[] = [];
  const internalSignatureMap = new Map<string, Signature>();

  for (const s of preliminarySignatures) {
    // Only add unique signatures (after sorting, duplicates from conversions are eliminated)
    if (!internalSignatureMap.has(s.name)) {
      const resolvedFn = resolvedFunctions[s.fn];
      const signature: Signature = {
        params: s.params,
        fn: resolvedFn ?? null,
        test: null,
        implementation: null,
      };
      signatures.push(signature);
      internalSignatureMap.set(s.name, signature);
    }
  }

  // Compile test functions
  compileSignatureTests(signatures, registry);

  // Compile args preprocessing (implementation)
  for (const sig of signatures) {
    if (sig.fn) {
      sig.implementation = compileArgsPreprocessing(sig.params, sig.fn, registry);
    }
  }

  // Create fast-path dispatcher data
  const fpData = createFastPathDispatcher(signatures);

  // Create generic dispatcher
  const genericDispatch = createGenericDispatcher(
    name,
    signatures,
    fpData.genericStartIndex,
    onMismatch
  );

  // Create the main dispatcher with fast-path
  theTypedFn = createDispatcher(
    name,
    signatures,
    genericDispatch,
    onMismatch
  ) as TypedFunction;

  // Now resolve references again with the actual function
  const fullyResolvedFunctions = resolveReferences(
    originalFunctions,
    signaturesMap,
    theTypedFn
  );

  // Update implementations with fully resolved functions
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

  // Attach signatures to the function
  theTypedFn.signatures = publicSignaturesMap;

  // Store internal data
  theTypedFn._typedFunctionData = {
    signatures,
    signatureMap: internalSignatureMap,
  };

  return theTypedFn;
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
