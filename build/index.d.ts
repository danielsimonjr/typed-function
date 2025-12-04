/**
 * typed-function v5.0
 *
 * Type checking for JavaScript functions
 *
 * This is the main entry point for the typed-function library.
 */
export type { TypeDef, ConversionDef, Type, Param, Signature, SignatureFunction, TypedFunction, TypedFunctionData, ReferTo, ReferToSelf, FindSignatureOptions, AddConversionOptions, TypedError, TypedErrorData, TypeTest, SignatureTest, ArgConverter, MismatchHandler, TypedDispatcher, GenericDispatcher, TypedContext, TypedInstance, } from './core/types.js';
export { NOT_TYPED_FUNCTION } from './core/types.js';
export { TypeRegistry, BUILTIN_TYPES, createTypeRegistry } from './core/type-registry.js';
export type { InternalTypeDef } from './core/type-registry.js';
export { createError, defaultOnMismatch, stringifyParams as stringifyParamsError, hasRestParam as hasRestParamError, getParamAtIndex, paramTypeSet, getTypeSetAtIndex, mergeExpectedParams, createParamTest, } from './core/error-factory.js';
export { parseParam, parseSignature, availableConversions, expandParam, isExactType, splitParams, stringifyParams, } from './core/signature-parser.js';
export { compileTest, compileTests, compileArgConversion, compileArgsPreprocessing, } from './core/signature-compiler.js';
export { hasRestParam, getLowestTypeIndex, getLowestConversionIndex, compareParams, compareSignatures, conflicting, createSignatureComparator, } from './core/signature-comparator.js';
export { ConversionManager, createConversionManager } from './core/conversion-manager.js';
export { isReferTo, isReferToSelf, makeReferTo, makeReferToSelf, clearResolutions, collectResolutions, resolveReferences, validateDeprecatedThis, } from './core/reference-resolver.js';
export { isFastPathEligible, createFastPathSlot, createInactiveSlot, createFastPathDispatcher, createDispatcher, compileSignatureTests, } from './dispatch/fast-path.js';
export type { FastPathSlot, FastPathDispatcher } from './dispatch/fast-path.js';
export { createGenericDispatcher, createSimpleDispatcher, hasCompiledTests, hasImplementations, } from './dispatch/generic-path.js';
export type { GenericDispatcher as GenericDispatcherFn } from './dispatch/generic-path.js';
export { createTypedFunction, checkName, getObjectName, mergeSignatures, } from './dispatch/dispatcher.js';
export type { CreateTypedFunctionOptions } from './dispatch/dispatcher.js';
export { last, initial, slice, flatMap, findInArray, hasItem, createArray, arraysEqual } from './utils/array-helpers.js';
export { isPlainObject, hasOwnProperty, getProperty, shallowCopy, mapObject, objectSize, isEmptyObject, mergeObjects, pick, omit, } from './utils/object-helpers.js';
export { create } from './factory.js';
import typedInstance from './factory.js';
/**
 * Check if an entity is a typed function created by any instance
 */
export declare function isTypedFunction(entity: unknown): boolean;
export default typedInstance;
//# sourceMappingURL=index.d.ts.map