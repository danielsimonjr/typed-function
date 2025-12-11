/**
 * typed-function v5.0
 *
 * Type checking for JavaScript functions
 *
 * This is the main entry point for the typed-function library.
 */

// Re-export core types
export type {
  TypeDef,
  ConversionDef,
  Type,
  Param,
  Signature,
  SignatureFunction,
  TypedFunction,
  TypedFunctionData,
  ReferTo,
  ReferToSelf,
  FindSignatureOptions,
  AddConversionOptions,
  TypedError,
  TypedErrorData,
  TypeTest,
  SignatureTest,
  ArgConverter,
  MismatchHandler,
  TypedDispatcher,
  GenericDispatcher,
  TypedContext,
  TypedInstance,
} from './core/types.js';

export { NOT_TYPED_FUNCTION } from './core/types.js';

// Re-export type registry
export { TypeRegistry, BUILTIN_TYPES, createTypeRegistry } from './core/type-registry.js';
export type { InternalTypeDef } from './core/type-registry.js';

// Re-export error factory
export {
  createError,
  defaultOnMismatch,
  stringifyParams as stringifyParamsError,
  hasRestParam as hasRestParamError,
  getParamAtIndex,
  paramTypeSet,
  getTypeSetAtIndex,
  mergeExpectedParams,
  createParamTest,
} from './core/error-factory.js';

// Re-export signature parser
export {
  parseParam,
  parseSignature,
  availableConversions,
  expandParam,
  isExactType,
  splitParams,
  stringifyParams,
} from './core/signature-parser.js';

// Re-export signature compiler
export {
  compileTest,
  compileTests,
  compileArgConversion,
  compileArgsPreprocessing,
} from './core/signature-compiler.js';

// Re-export signature comparator
export {
  hasRestParam,
  getLowestTypeIndex,
  getLowestConversionIndex,
  compareParams,
  compareSignatures,
  conflicting,
  createSignatureComparator,
} from './core/signature-comparator.js';

// Re-export conversion manager
export { ConversionManager, createConversionManager } from './core/conversion-manager.js';

// Re-export reference resolver
export {
  isReferTo,
  isReferToSelf,
  makeReferTo,
  makeReferToSelf,
  clearResolutions,
  collectResolutions,
  resolveReferences,
  validateDeprecatedThis,
} from './core/reference-resolver.js';

// Re-export dispatcher components
export {
  isFastPathEligible,
  createFastPathSlot,
  createInactiveSlot,
  createFastPathDispatcher,
  createDispatcher,
  compileSignatureTests,
} from './dispatch/fast-path.js';
export type { FastPathSlot, FastPathDispatcher } from './dispatch/fast-path.js';

export {
  createGenericDispatcher,
  createSimpleDispatcher,
  hasCompiledTests,
  hasImplementations,
} from './dispatch/generic-path.js';
export type { GenericDispatcher as GenericDispatcherFn } from './dispatch/generic-path.js';

export {
  createTypedFunction,
  checkName,
  getObjectName,
  mergeSignatures,
} from './dispatch/dispatcher.js';
export type { CreateTypedFunctionOptions } from './dispatch/dispatcher.js';

// Re-export utility functions
export { last, initial, slice, flatMap, findInArray, hasItem, createArray, arraysEqual } from './utils/array-helpers.js';

export {
  isPlainObject,
  hasOwnProperty,
  getProperty,
  shallowCopy,
  mapObject,
  objectSize,
  isEmptyObject,
  mergeObjects,
  pick,
  omit,
} from './utils/object-helpers.js';

// Re-export factory and create function
export { create } from './factory.js';
export type { InitOptions } from './factory.js';

// Re-export WASM utilities for advanced usage
export {
  TypeMasks,
  createMask,
  optionalMask,
  nullableMask,
  combineMasks,
} from './wasm/type-masks.js';

// Import the default typed instance
import typedInstance from './factory.js';

/**
 * Check if an entity is a typed function created by any instance
 */
export function isTypedFunction(entity: unknown): boolean {
  return entity !== null && typeof entity === 'function' && '_typedFunctionData' in entity;
}

// Default export: the default typed instance
export default typedInstance;
