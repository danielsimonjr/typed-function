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
export declare function isReferTo(objectOrFn: unknown): objectOrFn is ReferTo;
/**
 * Check if an object is a referToSelf reference
 */
export declare function isReferToSelf(objectOrFn: unknown): objectOrFn is ReferToSelf;
/**
 * Create a referTo reference object
 *
 * @param references - Array of signature strings to reference
 * @param callback - Callback that receives the resolved functions
 * @returns ReferTo object
 */
export declare function makeReferTo(references: string[], callback: (...fns: SignatureFunction[]) => SignatureFunction): ReferTo;
/**
 * Create a referToSelf reference object
 *
 * @param callback - Callback that receives the typed function itself
 * @returns ReferToSelf object
 */
export declare function makeReferToSelf(callback: (self: TypedFunction) => SignatureFunction): ReferToSelf;
/**
 * Clear any prior resolutions from a function list
 *
 * This returns a copy of the function list with any prior resolutions cleared,
 * in case we are recycling signatures from a prior typed function construction.
 *
 * @param functionList - Array of functions or reference objects
 * @returns New array with cleared resolutions
 */
export declare function clearResolutions(functionList: Array<SignatureFunction | ReferTo | ReferToSelf>): Array<SignatureFunction | ReferTo | ReferToSelf>;
/**
 * Collect resolutions for a list of references
 *
 * @param references - Array of signature strings to resolve
 * @param functionList - Array of functions being resolved
 * @param signatureMap - Map from signature string to function index
 * @returns Array of resolved functions, or null if not all resolved yet
 */
export declare function collectResolutions(references: string[], functionList: Array<SignatureFunction | ReferTo | ReferToSelf>, signatureMap: Record<string, number>): SignatureFunction[] | null;
/**
 * Resolve all references in a function list
 *
 * @param functionList - Array of functions and reference objects
 * @param signatureMap - Map from signature string to function index
 * @param self - The typed function being built
 * @returns Array of fully resolved functions
 * @throws SyntaxError if circular reference is detected
 */
export declare function resolveReferences(functionList: Array<SignatureFunction | ReferTo | ReferToSelf>, signatureMap: Record<string, number>, self: TypedFunction): SignatureFunction[];
/**
 * Validate that function bodies don't use deprecated this-reference pattern
 *
 * @param signaturesMap - Map of signatures to functions
 * @throws SyntaxError if deprecated this usage is detected
 */
export declare function validateDeprecatedThis(signaturesMap: Record<string, SignatureFunction>): void;
//# sourceMappingURL=reference-resolver.d.ts.map