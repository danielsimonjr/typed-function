/**
 * Factory Function for typed-function
 *
 * Creates isolated typed universes with independent type registries
 * and conversion managers.
 */

import type {
  TypeDef,
  ConversionDef,
  SignatureFunction,
  TypedFunction,
  Signature,
  FindSignatureOptions,
  AddConversionOptions,
  ReferTo,
  ReferToSelf,
  TypedInstance,
  MismatchHandler,
} from './core/types.js';
import { NOT_TYPED_FUNCTION } from './core/types.js';

import { BUILTIN_TYPES, createTypeRegistry } from './core/type-registry.js';
import { createConversionManager } from './core/conversion-manager.js';
import { createError } from './core/error-factory.js';
import { parseSignature, stringifyParams } from './core/signature-parser.js';
import { getParamAtIndex, paramTypeSet } from './core/error-factory.js';
import { createTypedFunction, checkName, getObjectName, mergeSignatures } from './dispatch/dispatcher.js';
import { makeReferTo, makeReferToSelf } from './core/reference-resolver.js';
import { initial, last } from './utils/array-helpers.js';
import { isPlainObject } from './utils/object-helpers.js';

/**
 * Create a new typed-function instance
 *
 * Each instance has its own type registry and conversion manager,
 * creating an isolated "typed universe".
 *
 * @returns A new typed-function instance
 */
export function create(): TypedInstance {
  // Create type registry (already has 'any' and builtin types from createTypeRegistry)
  const registry = createTypeRegistry();

  // Create conversion manager
  const conversions = createConversionManager(registry);

  // Track creation count
  let createCount = 0;

  /**
   * Check if an entity is a typed function
   */
  function isTypedFunction(entity: unknown): entity is TypedFunction {
    return entity !== null && typeof entity === 'function' && '_typedFunctionData' in entity;
  }

  /**
   * Find a specific signature from a typed function
   */
  function findSignature(
    fn: TypedFunction,
    signature: string | string[],
    options?: FindSignatureOptions
  ): Signature {
    if (!isTypedFunction(fn)) {
      throw new TypeError(NOT_TYPED_FUNCTION);
    }

    // Canonicalize input
    const exact = options?.exact ?? false;
    const stringSignature = Array.isArray(signature) ? signature.join(',') : signature;
    const params = parseSignature(stringSignature, registry);

    if (!params) {
      throw new TypeError(`Invalid signature: ${stringSignature}`);
    }

    const canonicalSignature = stringifyParams(params);

    // First try exact match
    if (!exact || canonicalSignature in fn.signatures) {
      const match = fn._typedFunctionData.signatureMap.get(canonicalSignature);
      if (match) {
        return match;
      }
    }

    // Check parameters one by one for any/rest matches
    const nParams = params.length;
    let remainingSignatures: Signature[];

    if (exact) {
      remainingSignatures = [];
      for (const name in fn.signatures) {
        const sig = fn._typedFunctionData.signatureMap.get(name);
        if (sig) {
          remainingSignatures.push(sig);
        }
      }
    } else {
      remainingSignatures = fn._typedFunctionData.signatures;
    }

    for (let i = 0; i < nParams; i++) {
      const want = params[i];
      if (!want) continue;

      const filteredSignatures: Signature[] = [];

      for (const possibility of remainingSignatures) {
        const have = getParamAtIndex(possibility.params, i);
        if (!have || (want.restParam && !have.restParam)) {
          continue;
        }

        if (!have.hasAny) {
          const haveTypes = paramTypeSet(have);
          if (want.types.some((wtype) => !haveTypes.has(wtype.name))) {
            continue;
          }
        }

        filteredSignatures.push(possibility);
      }

      remainingSignatures = filteredSignatures;
      if (remainingSignatures.length === 0) break;
    }

    // Return first remaining signature that was totally matched
    for (const candidate of remainingSignatures) {
      if (candidate.params.length <= nParams) {
        return candidate;
      }
    }

    throw new TypeError(
      `Signature not found (signature: ${fn.name || 'unnamed'}(${stringifyParams(params, ', ')}))`
    );
  }

  /**
   * Find the implementation for a specific signature
   */
  function find(
    fn: TypedFunction,
    signature: string | string[],
    options?: FindSignatureOptions
  ): SignatureFunction {
    const sig = findSignature(fn, signature, options);
    if (!sig.implementation) {
      throw new TypeError('Signature has no implementation');
    }
    return sig.implementation;
  }

  /**
   * Convert a value to a specific type
   */
  function convert(value: unknown, typeName: string): unknown {
    return conversions.convert(value, typeName);
  }

  /**
   * Resolve the matching signature for given arguments
   */
  function resolve(fn: TypedFunction, argList: unknown[]): Signature | null {
    if (!isTypedFunction(fn)) {
      throw new TypeError(NOT_TYPED_FUNCTION);
    }

    const sigs = fn._typedFunctionData.signatures;
    for (let i = 0; i < sigs.length; i++) {
      const sig = sigs[i];
      if (sig && sig.test && sig.test(argList)) {
        return sig;
      }
    }

    return null;
  }

  /**
   * Create a referTo reference
   */
  function referTo(...args: [...string[], (...fns: SignatureFunction[]) => SignatureFunction]): ReferTo {
    const references = initial(args as unknown[]).map((s) =>
      stringifyParams(parseSignature(s as string, registry)!)
    );
    const callback = last(args as unknown[]) as (...fns: SignatureFunction[]) => SignatureFunction;

    if (typeof callback !== 'function') {
      throw new TypeError('Callback function expected as last argument');
    }

    return makeReferTo(references, callback);
  }

  /**
   * Create a referToSelf reference
   */
  function referToSelf(callback: (self: TypedFunction) => SignatureFunction): ReferToSelf {
    if (typeof callback !== 'function') {
      throw new TypeError('Callback function expected as first argument');
    }

    return makeReferToSelf(callback);
  }

  /**
   * The main typed function creator
   */
  function typed(maybeName: string | Record<string, SignatureFunction>, ...items: Array<Record<string, SignatureFunction> | TypedFunction | (SignatureFunction & { signature?: string })>): TypedFunction {
    const named = typeof maybeName === 'string';
    let name = named ? maybeName : '';
    const allSignatures: Record<string, SignatureFunction | ReferTo | ReferToSelf> = {};

    // If first arg isn't a string, it's also an item
    const allItems = named ? items : [maybeName as Record<string, SignatureFunction>, ...items];

    for (let i = 0; i < allItems.length; i++) {
      const item = allItems[i];
      let theseSignatures: Record<string, SignatureFunction | ReferTo | ReferToSelf> = {};
      let thisName: string | undefined;

      if (typeof item === 'function') {
        thisName = item.name;
        const itemWithSig = item as SignatureFunction & { signature?: string };

        if (typeof itemWithSig.signature === 'string') {
          // Case 1: Ordinary function with a string 'signature' property
          theseSignatures[itemWithSig.signature] = item as SignatureFunction;
        } else if (isTypedFunction(item)) {
          // Case 2: Existing typed function
          theseSignatures = item.signatures;
        }
      } else if (isPlainObject(item)) {
        // Case 3: Plain object with signatures
        theseSignatures = item as Record<string, SignatureFunction>;
        if (!named) {
          thisName = getObjectName(item as Record<string, SignatureFunction>, isTypedFunction);
        }
      }

      if (Object.keys(theseSignatures).length === 0) {
        const err = new TypeError(
          `Argument to 'typed' at index ${i + (named ? 1 : 0)} is not a (typed) function, ` +
            'nor an object with signatures as keys and functions as values.'
        ) as TypeError & { data?: { index: number; argument: unknown } };
        err.data = { index: i + (named ? 1 : 0), argument: item };
        throw err;
      }

      if (!named) {
        name = checkName(name, thisName);
      }

      mergeSignatures(allSignatures, theseSignatures);
    }

    createCount++;

    return createTypedFunction(name || '', allSignatures, {
      registry,
      conversions,
      onMismatch: typed.onMismatch,
      warnAgainstDeprecatedThis: typed.warnAgainstDeprecatedThis,
    });
  }

  // Create the mismatch handler that wraps createError
  const onMismatch: MismatchHandler = (fnName, args, signatures) => {
    throw createError(fnName, Array.from(args), signatures, registry);
  };

  // Attach properties and methods to typed
  typed.create = create;
  typed.createCount = createCount;
  typed.onMismatch = onMismatch;
  typed.throwMismatchError = onMismatch;
  typed.createError = (fnName: string, args: ArrayLike<unknown>, signatures: Signature[]) =>
    createError(fnName, Array.from(args), signatures, registry);

  typed.clear = () => {
    // registry.clear() already adds 'any' type, then we add builtin types
    registry.clear();
    registry.addTypes(BUILTIN_TYPES);
    conversions.clearConversions();
  };

  typed.clearConversions = () => conversions.clearConversions();

  typed.addTypes = (types: TypeDef[], before?: string | boolean) =>
    registry.addTypes(types, before);

  typed.addType = (type: TypeDef, beforeObjectTest?: boolean) => {
    let before: string | boolean = 'any';
    if (beforeObjectTest !== false && registry.hasType('Object')) {
      before = 'Object';
    }
    typed.addTypes([type], before);
  };

  typed.addConversion = (conversion: ConversionDef, options?: AddConversionOptions) =>
    conversions.addConversion(conversion, options);

  typed.addConversions = (conversionList: ConversionDef[], options?: AddConversionOptions) =>
    conversions.addConversions(conversionList, options);

  typed.removeConversion = (conversion: ConversionDef) =>
    conversions.removeConversion(conversion);

  typed.referTo = referTo;
  typed.referToSelf = referToSelf;
  typed.convert = convert;
  typed.findSignature = findSignature;
  typed.find = find;
  typed.resolve = resolve;
  typed.isTypedFunction = isTypedFunction;
  typed.warnAgainstDeprecatedThis = true;

  // Internal access for testing
  typed._findType = (fnName: string) => registry.findType(fnName);

  return typed as TypedInstance;
}

// Export the default typed instance
export default create();
