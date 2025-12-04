/**
 * Reference Resolver for typed-function
 *
 * Handles typed.referTo() and typed.referToSelf() resolution
 * with circular reference detection.
 */

import type { ReferTo, ReferToSelf, SignatureFunction, TypedFunction } from './types.js';

/**
 * Check if an object is a referTo reference
 */
export function isReferTo(objectOrFn: unknown): objectOrFn is ReferTo {
  return (
    objectOrFn !== null &&
    typeof objectOrFn === 'object' &&
    'referTo' in objectOrFn &&
    typeof (objectOrFn as ReferTo).referTo === 'object' &&
    Array.isArray((objectOrFn as ReferTo).referTo.references) &&
    typeof (objectOrFn as ReferTo).referTo.callback === 'function'
  );
}

/**
 * Check if an object is a referToSelf reference
 */
export function isReferToSelf(objectOrFn: unknown): objectOrFn is ReferToSelf {
  return (
    objectOrFn !== null &&
    typeof objectOrFn === 'object' &&
    'referToSelf' in objectOrFn &&
    typeof (objectOrFn as ReferToSelf).referToSelf === 'object' &&
    typeof (objectOrFn as ReferToSelf).referToSelf.callback === 'function'
  );
}

/**
 * Create a referTo reference object
 *
 * @param references - Array of signature strings to reference
 * @param callback - Callback that receives the resolved functions
 * @returns ReferTo object
 */
export function makeReferTo(
  references: string[],
  callback: (...fns: SignatureFunction[]) => SignatureFunction
): ReferTo {
  return {
    referTo: { references, callback },
  };
}

/**
 * Create a referToSelf reference object
 *
 * @param callback - Callback that receives the typed function itself
 * @returns ReferToSelf object
 */
export function makeReferToSelf(
  callback: (self: TypedFunction) => SignatureFunction
): ReferToSelf {
  return {
    referToSelf: { callback },
  };
}

/**
 * Clear any prior resolutions from a function list
 *
 * This returns a copy of the function list with any prior resolutions cleared,
 * in case we are recycling signatures from a prior typed function construction.
 *
 * @param functionList - Array of functions or reference objects
 * @returns New array with cleared resolutions
 */
export function clearResolutions(
  functionList: Array<SignatureFunction | ReferTo | ReferToSelf>
): Array<SignatureFunction | ReferTo | ReferToSelf> {
  return functionList.map((fn) => {
    if (isReferToSelf(fn)) {
      return makeReferToSelf(fn.referToSelf.callback);
    }
    if (isReferTo(fn)) {
      return makeReferTo(fn.referTo.references, fn.referTo.callback);
    }
    return fn;
  });
}

/**
 * Collect resolutions for a list of references
 *
 * @param references - Array of signature strings to resolve
 * @param functionList - Array of functions being resolved
 * @param signatureMap - Map from signature string to function index
 * @returns Array of resolved functions, or null if not all resolved yet
 */
export function collectResolutions(
  references: string[],
  functionList: Array<SignatureFunction | ReferTo | ReferToSelf>,
  signatureMap: Record<string, number>
): SignatureFunction[] | null {
  const resolvedReferences: SignatureFunction[] = [];

  for (const reference of references) {
    const resolution = signatureMap[reference];

    if (typeof resolution !== 'number') {
      throw new TypeError(`No definition for referenced signature "${reference}"`);
    }

    const resolved = functionList[resolution];

    if (typeof resolved !== 'function') {
      return null; // Not yet resolved
    }

    resolvedReferences.push(resolved as SignatureFunction);
  }

  return resolvedReferences;
}

/**
 * Resolve all references in a function list
 *
 * @param functionList - Array of functions and reference objects
 * @param signatureMap - Map from signature string to function index
 * @param self - The typed function being built
 * @returns Array of fully resolved functions
 * @throws SyntaxError if circular reference is detected
 */
export function resolveReferences(
  functionList: Array<SignatureFunction | ReferTo | ReferToSelf>,
  signatureMap: Record<string, number>,
  self: TypedFunction
): SignatureFunction[] {
  const resolvedFunctions = clearResolutions(functionList);
  const isResolved = new Array(resolvedFunctions.length).fill(false);
  let leftUnresolved = true;

  while (leftUnresolved) {
    leftUnresolved = false;
    let nothingResolved = true;

    for (let i = 0; i < resolvedFunctions.length; i++) {
      if (isResolved[i]) continue;

      const fn = resolvedFunctions[i];

      if (isReferToSelf(fn)) {
        // Resolve referToSelf
        const resolved = fn.referToSelf.callback(self);
        // Preserve reference in case signature is reused someday
        (resolved as SignatureFunction & { referToSelf?: ReferToSelf['referToSelf'] }).referToSelf =
          fn.referToSelf;
        resolvedFunctions[i] = resolved;
        isResolved[i] = true;
        nothingResolved = false;
      } else if (isReferTo(fn)) {
        // Try to resolve referTo
        const resolvedReferences = collectResolutions(
          fn.referTo.references,
          resolvedFunctions as Array<SignatureFunction | ReferTo | ReferToSelf>,
          signatureMap
        );

        if (resolvedReferences) {
          const resolved = fn.referTo.callback(...resolvedReferences);
          // Preserve reference in case signature is reused someday
          (resolved as SignatureFunction & { referTo?: ReferTo['referTo'] }).referTo = fn.referTo;
          resolvedFunctions[i] = resolved;
          isResolved[i] = true;
          nothingResolved = false;
        } else {
          leftUnresolved = true;
        }
      } else {
        // Already a function
        isResolved[i] = true;
      }
    }

    if (nothingResolved && leftUnresolved) {
      throw new SyntaxError('Circular reference detected in resolving typed.referTo');
    }
  }

  return resolvedFunctions as SignatureFunction[];
}

/**
 * Validate that function bodies don't use deprecated this-reference pattern
 *
 * @param signaturesMap - Map of signatures to functions
 * @throws SyntaxError if deprecated this usage is detected
 */
export function validateDeprecatedThis(signaturesMap: Record<string, SignatureFunction>): void {
  // Match occurrences like 'this(' and 'this.signatures'
  const deprecatedThisRegex = /\bthis(\(|\.signatures\b)/;

  for (const signature in signaturesMap) {
    if (Object.prototype.hasOwnProperty.call(signaturesMap, signature)) {
      const fn = signaturesMap[signature];

      if (fn && deprecatedThisRegex.test(fn.toString())) {
        throw new SyntaxError(
          'Using `this` to self-reference a function ' +
            'is deprecated since typed-function@3. ' +
            'Use typed.referTo and typed.referToSelf instead.'
        );
      }
    }
  }
}
