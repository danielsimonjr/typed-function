/**
 * typed-function v5.0
 *
 * Type checking for JavaScript functions
 *
 * This is the main entry point for the typed-function library.
 * The full implementation will be completed in Sprint 3.
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

// Placeholder for the main typed function (will be implemented in Sprint 3)
// For now, export a stub to verify the module structure

/**
 * Check if an entity is a typed function created by any instance
 */
export function isTypedFunction(entity: unknown): boolean {
  return entity !== null && typeof entity === 'function' && '_typedFunctionData' in entity;
}

/**
 * Placeholder create function - full implementation in Sprint 3
 */
export function create(): unknown {
  // This will be fully implemented in Sprint 3
  throw new Error('typed-function create() not yet implemented - Sprint 3');
}

// Default export placeholder
const typed = {
  create,
  isTypedFunction,
  // Additional methods will be added in Sprint 3
};

export default typed;
