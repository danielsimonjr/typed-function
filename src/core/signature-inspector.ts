/**
 * Signature Introspection Helper for typed-function
 *
 * Provides utilities for inspecting and formatting typed function signatures.
 */

import type { TypedFunction, Signature, Param } from './types.js';

/**
 * Formatted signature information
 */
export interface FormattedSignature {
  /** The signature string (e.g., "number, string") */
  signature: string;

  /** Number of parameters */
  paramCount: number;

  /** Whether it has a rest parameter */
  hasRestParam: boolean;

  /** Whether it uses any type */
  hasAnyType: boolean;

  /** Whether it uses type conversions */
  hasConversions: boolean;

  /** Parameter details */
  params: FormattedParam[];
}

/**
 * Formatted parameter information
 */
export interface FormattedParam {
  /** Parameter position (0-indexed) */
  index: number;

  /** Parameter name (e.g., "number", "string | boolean") */
  name: string;

  /** Type names accepted */
  types: string[];

  /** Whether this is a rest parameter */
  isRest: boolean;

  /** Whether this accepts any type */
  isAny: boolean;

  /** Whether conversions are applied */
  hasConversion: boolean;
}

/**
 * Typed function inspection results
 */
export interface TypedFunctionInspection {
  /** Function name */
  name: string;

  /** Total number of signatures */
  signatureCount: number;

  /** All formatted signatures */
  signatures: FormattedSignature[];

  /** Signature strings for quick reference */
  signatureStrings: string[];

  /** Whether WASM dispatch is enabled */
  wasmEnabled: boolean;

  /** Summary statistics */
  stats: {
    /** Total parameters across all signatures */
    totalParams: number;

    /** Max parameters in any signature */
    maxParams: number;

    /** Min parameters in any signature */
    minParams: number;

    /** Number of signatures with rest params */
    restParamCount: number;

    /** Number of signatures with any type */
    anyTypeCount: number;

    /** Number of signatures with conversions */
    conversionCount: number;
  };
}

/**
 * Format a single parameter for display
 *
 * @param param - The parameter to format
 * @param index - Parameter position
 * @returns Formatted parameter info
 */
export function formatParam(param: Param, index: number): FormattedParam {
  const typeNames = param.types.map((t) => t.name);

  return {
    index,
    name: param.name,
    types: typeNames,
    isRest: param.restParam,
    isAny: param.hasAny,
    hasConversion: param.hasConversion,
  };
}

/**
 * Format a signature for display
 *
 * @param signature - The signature to format
 * @returns Formatted signature info
 */
export function formatSignature(signature: Signature): FormattedSignature {
  const params = signature.params.map((p, i) => formatParam(p, i));
  const hasRest = params.some((p) => p.isRest);
  const hasAny = params.some((p) => p.isAny);
  const hasConversions = params.some((p) => p.hasConversion);

  const sigParts = signature.params.map((p) => {
    const prefix = p.restParam ? '...' : '';
    return `${prefix}${p.name}`;
  });

  return {
    signature: sigParts.join(', '),
    paramCount: signature.params.length,
    hasRestParam: hasRest,
    hasAnyType: hasAny,
    hasConversions,
    params,
  };
}

/**
 * Inspect a typed function and return detailed information
 *
 * @param fn - The typed function to inspect
 * @returns Detailed inspection results
 *
 * @example
 * ```ts
 * import typed from 'typed-function';
 * import { inspect } from 'typed-function/core/signature-inspector';
 *
 * const add = typed('add', {
 *   'number, number': (a, b) => a + b,
 *   'string, string': (a, b) => a + b,
 * });
 *
 * const info = inspect(add);
 * console.log(`Function: ${info.name}`);
 * console.log(`Signatures: ${info.signatureCount}`);
 * info.signatures.forEach((sig) => {
 *   console.log(`  - ${sig.signature}`);
 * });
 * ```
 */
export function inspect(fn: TypedFunction): TypedFunctionInspection {
  const signatures = fn._typedFunctionData.signatures;
  const formatted = signatures.map(formatSignature);

  // Compute statistics
  let totalParams = 0;
  let maxParams = 0;
  let minParams = Infinity;
  let restParamCount = 0;
  let anyTypeCount = 0;
  let conversionCount = 0;

  for (const sig of formatted) {
    totalParams += sig.paramCount;
    maxParams = Math.max(maxParams, sig.paramCount);
    minParams = Math.min(minParams, sig.paramCount);

    if (sig.hasRestParam) restParamCount++;
    if (sig.hasAnyType) anyTypeCount++;
    if (sig.hasConversions) conversionCount++;
  }

  // Handle empty signatures case
  if (minParams === Infinity) minParams = 0;

  // Check WASM status
  const wasmEnabled = '_wasmEnabled' in fn && (fn as TypedFunction & { _wasmEnabled?: boolean })._wasmEnabled === true;

  return {
    name: fn.name || '(anonymous)',
    signatureCount: signatures.length,
    signatures: formatted,
    signatureStrings: formatted.map((s) => s.signature),
    wasmEnabled,
    stats: {
      totalParams,
      maxParams,
      minParams,
      restParamCount,
      anyTypeCount,
      conversionCount,
    },
  };
}

/**
 * Get a human-readable summary of a typed function
 *
 * @param fn - The typed function
 * @returns A formatted string description
 *
 * @example
 * ```ts
 * const add = typed('add', {
 *   'number, number': (a, b) => a + b,
 * });
 *
 * console.log(summarize(add));
 * // Output:
 * // add (1 signature)
 * //   (number, number)
 * ```
 */
export function summarize(fn: TypedFunction): string {
  const info = inspect(fn);
  const lines: string[] = [];

  const suffix = info.signatureCount === 1 ? 'signature' : 'signatures';
  lines.push(`${info.name} (${info.signatureCount} ${suffix})`);

  for (const sig of info.signatures) {
    const prefix = '  ';
    const sigStr = sig.signature || '()';
    const flags: string[] = [];

    if (sig.hasRestParam) flags.push('rest');
    if (sig.hasAnyType) flags.push('any');
    if (sig.hasConversions) flags.push('conv');

    const flagStr = flags.length > 0 ? ` [${flags.join(', ')}]` : '';
    lines.push(`${prefix}(${sigStr})${flagStr}`);
  }

  return lines.join('\n');
}

/**
 * Compare two typed functions and return differences
 *
 * @param fn1 - First typed function
 * @param fn2 - Second typed function
 * @returns Object describing differences
 */
export function compare(
  fn1: TypedFunction,
  fn2: TypedFunction
): {
  onlyInFirst: string[];
  onlyInSecond: string[];
  inBoth: string[];
} {
  const info1 = inspect(fn1);
  const info2 = inspect(fn2);

  const sigs1 = new Set(info1.signatureStrings);
  const sigs2 = new Set(info2.signatureStrings);

  const onlyInFirst: string[] = [];
  const onlyInSecond: string[] = [];
  const inBoth: string[] = [];

  for (const sig of sigs1) {
    if (sigs2.has(sig)) {
      inBoth.push(sig);
    } else {
      onlyInFirst.push(sig);
    }
  }

  for (const sig of sigs2) {
    if (!sigs1.has(sig)) {
      onlyInSecond.push(sig);
    }
  }

  return { onlyInFirst, onlyInSecond, inBoth };
}

/**
 * Find signatures that match given argument types
 *
 * @param fn - The typed function
 * @param argTypes - Array of type names for arguments
 * @returns Matching signature strings
 *
 * @example
 * ```ts
 * const fn = typed({
 *   'number': (x) => x,
 *   'string': (s) => s,
 *   'number, string': (a, b) => `${a}${b}`,
 * });
 *
 * findMatchingSignatures(fn, ['number']);
 * // Returns: ['number']
 *
 * findMatchingSignatures(fn, ['number', 'string']);
 * // Returns: ['number, string']
 * ```
 */
export function findMatchingSignatures(fn: TypedFunction, argTypes: string[]): string[] {
  const info = inspect(fn);
  const matches: string[] = [];

  for (const sig of info.signatures) {
    // Skip if param count doesn't match (unless rest param)
    if (sig.paramCount !== argTypes.length && !sig.hasRestParam) {
      continue;
    }

    // Check if all args match
    let allMatch = true;
    for (let i = 0; i < argTypes.length; i++) {
      const param = sig.params[i];
      if (!param) {
        // Extra args - only ok with rest param
        if (!sig.hasRestParam) {
          allMatch = false;
          break;
        }
        continue;
      }

      // Check if this arg type is accepted
      if (!param.isAny && !param.types.includes(argTypes[i]!)) {
        allMatch = false;
        break;
      }
    }

    if (allMatch) {
      matches.push(sig.signature);
    }
  }

  return matches;
}
