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
export { TypedFunctionError, TypeMismatchError, TooFewArgumentsError, TooManyArgumentsError, SignatureMismatchError, SignatureNotFoundError, WasmNotAvailableError, WasmInitializationError, TypeNotFoundError, DuplicateTypeError, isTypedFunctionError, isTypeMismatchError, isTooFewArgumentsError, isTooManyArgumentsError, isWasmNotAvailableError, } from './core/errors.js';
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
export type { InitOptions } from './factory.js';
export { TYPE_SYMBOL, BRAND_SYMBOL, registerConstructor, unregisterConstructor, getTypeByConstructor, isRegisteredType, registerInstance, isRegisteredInstance, clearInstanceRegistry, clearAllInstanceRegistries, getTypeFromSymbol, getBrandFromSymbol, createBundlerSafeTest, createTypedClass, addTypeIdentification, identifyType, } from './core/bundler-compat.js';
export type { TypeIdentificationResult } from './core/bundler-compat.js';
export { globalTypeCache, createTypeCache, cachedTypeResolve, TypeCache, } from './core/type-cache.js';
export type { TypeCacheEntry } from './core/type-cache.js';
export type { TypedConfig, TypedConfigState } from './core/types.js';
export { TypeMasks, createMask, optionalMask, nullableMask, combineMasks, } from './wasm/type-masks.js';
export { configureDebug, resetDebug, isDebugEnabled, getDebugLevel, addDebugHandler, emitDebugEvent, formatSignature, formatParam, formatArgs, wrapWithDebug, enableDebug, disableDebug, } from './debug.js';
export type { DebugLevel, DebugEventType, DebugEvent, DebugHandler, DebugConfig } from './debug.js';
export { COMPLEX_TYPES, FRACTION_TYPES, BIGDOUBLE_TYPES, NUMERIC_TYPES, LINEAR_ALGEBRA_TYPES, SCIENTIFIC_TYPES, MEASUREMENT_TYPES, PARALLEL_TYPES, ARRAY_TYPES, TYPED_ARRAY_TYPES, GPU_TYPES, DECIMAL_TYPES, ADVANCED_TYPES, isComplex, isFraction, isBigDouble, isBigDecimal, isInt8, isInt16, isInt32, isInt64, isUInt8, isUInt16, isUInt32, isUInt64, isFloat32, isFloat64, isVector, isMatrix, isTensor, isSparseMatrix, isQuaternion, isUnit, isInterval, isUncertainty, isRange, isPolynomial, isFuture, isStream, isChannel, isSharedArray, isAtomicNumber, isTypedArray, isFloat32Array, isFloat64Array, isInt8Array, isInt16Array, isInt32Array, isUint8Array, isUint16Array, isUint32Array, isBigInt64Array, isBigUint64Array, isGPUBuffer, isGPUTensor, isDecimal, isBigFloat, isDecimal32, isDecimal64, isDecimal128, isMoney, isFixedDecimal, isRational, complex, fraction, bigDouble, bigDecimal, vector, matrix, tensor, quaternion, unit, interval, uncertainty, range, polynomial, bigFloat, decimal32, decimal64, decimal128, money, fixedDecimal, rational, } from './core/export-types.js';
export type { Complex, Fraction, BigDouble, BigDecimal, Vector, Matrix, Tensor, SparseMatrix, Quaternion, Unit, Interval, Uncertainty, Range, Polynomial, Future, Stream, Channel, SharedArray, AtomicNumber, GPUBufferType, GPUTensor, Decimal, BigFloat, Decimal32, Decimal64, Decimal128, Money, FixedDecimal, Rational, } from './core/export-types.js';
import typedInstance from './factory.js';
/**
 * Check if an entity is a typed function created by any instance
 */
export declare function isTypedFunction(entity: unknown): boolean;
export default typedInstance;
//# sourceMappingURL=index.d.ts.map