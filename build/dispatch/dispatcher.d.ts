/**
 * Main Typed Function Builder for typed-function
 *
 * Creates typed functions with signature parsing, conflict detection,
 * sorting, compilation, and dispatcher creation.
 */
import type { SignatureFunction, TypedFunction, MismatchHandler, ReferTo, ReferToSelf } from '../core/types.js';
import type { TypeRegistry } from '../core/type-registry.js';
import type { ConversionManager } from '../core/conversion-manager.js';
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
    /** Whether to use WASM dispatch when available */
    useWasm?: boolean;
}
/**
 * Create a typed function from a signature map
 *
 * @param name - Name of the typed function
 * @param rawSignaturesMap - Map of signature strings to functions
 * @param options - Creation options
 * @returns The created typed function
 */
export declare function createTypedFunction(name: string, rawSignaturesMap: Record<string, SignatureFunction | ReferTo | ReferToSelf>, options: CreateTypedFunctionOptions): TypedFunction;
/**
 * Check if a name is valid (A) new, (B) a match, or (C) a mismatch
 *
 * @param nameSoFar - Current name
 * @param newName - New name to check
 * @returns Updated name
 * @throws Error if names mismatch
 */
export declare function checkName(nameSoFar: string | undefined, newName: string | undefined): string;
/**
 * Retrieve the implied name from an object with signature keys
 *
 * @param obj - Object with signature keys and function values
 * @param isTypedFunction - Function to check if a value is a typed function
 * @returns The implied name, or undefined
 */
export declare function getObjectName(obj: Record<string, SignatureFunction>, isTypedFunction: (entity: unknown) => boolean): string | undefined;
/**
 * Merge signatures from source into dest
 *
 * @param dest - Destination object
 * @param source - Source object
 * @throws Error if signature is defined twice with different functions
 */
export declare function mergeSignatures(dest: Record<string, SignatureFunction | ReferTo | ReferToSelf>, source: Record<string, SignatureFunction | ReferTo | ReferToSelf>): void;
//# sourceMappingURL=dispatcher.d.ts.map