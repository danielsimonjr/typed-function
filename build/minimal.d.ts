/**
 * typed-function Minimal Entry Point
 *
 * This is a lightweight entry point (~5KB) that provides core functionality
 * without WASM dispatch. Use this for smaller bundle sizes when WASM
 * acceleration is not needed.
 *
 * @example
 * ```ts
 * import typed from 'typed-function/minimal';
 *
 * const add = typed('add', {
 *   'number, number': (a, b) => a + b,
 *   'string, string': (a, b) => a + b,
 * });
 * ```
 */
export type { TypeDef, ConversionDef, Type, Param, Signature, SignatureFunction, TypedFunction, TypedFunctionData, ReferTo, ReferToSelf, FindSignatureOptions, AddConversionOptions, TypedError, TypedErrorData, TypeTest, SignatureTest, ArgConverter, MismatchHandler, TypedInstance, } from './core/types.js';
export { NOT_TYPED_FUNCTION } from './core/types.js';
export { TypeRegistry, BUILTIN_TYPES, createTypeRegistry } from './core/type-registry.js';
export type { InternalTypeDef } from './core/type-registry.js';
export { createError, defaultOnMismatch, getParamAtIndex, paramTypeSet, mergeExpectedParams, } from './core/error-factory.js';
export { TypedFunctionError, TypeMismatchError, TooFewArgumentsError, TooManyArgumentsError, SignatureMismatchError, SignatureNotFoundError, TypeNotFoundError, DuplicateTypeError, isTypedFunctionError, isTypeMismatchError, isTooFewArgumentsError, isTooManyArgumentsError, } from './core/errors.js';
export { parseParam, parseSignature, stringifyParams, } from './core/signature-parser.js';
export { hasRestParam, compareParams, compareSignatures, } from './core/signature-comparator.js';
export { ConversionManager, createConversionManager } from './core/conversion-manager.js';
export { isReferTo, isReferToSelf, makeReferTo, makeReferToSelf, } from './core/reference-resolver.js';
export { createGenericDispatcher, createSimpleDispatcher, } from './dispatch/generic-path.js';
export { createTypedFunction, checkName, mergeSignatures, } from './dispatch/dispatcher.js';
export { create } from './factory.js';
export { last, initial } from './utils/array-helpers.js';
export { isPlainObject, hasOwnProperty } from './utils/object-helpers.js';
import typedInstance from './factory.js';
/**
 * Check if an entity is a typed function created by any instance
 */
export declare function isTypedFunction(entity: unknown): boolean;
export default typedInstance;
//# sourceMappingURL=minimal.d.ts.map