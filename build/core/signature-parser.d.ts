/**
 * Signature Parser Module for typed-function
 *
 * This module handles parsing signature strings like "number, string | boolean"
 * into structured Param arrays, and expanding parameters with available type conversions.
 */
import type { Param, Type, ConversionDef } from './types.js';
import type { TypeRegistry } from './type-registry.js';
/**
 * Parse a single parameter string like "number | boolean" or "...string"
 *
 * @param param - The raw parameter string
 * @param registry - The type registry
 * @returns A Param object
 * @throws TypeError if the type is not found
 */
export declare function parseParam(param: string, registry: TypeRegistry): Param;
/**
 * Parse a full signature string like "number, string | boolean"
 *
 * @param rawSignature - The raw signature string
 * @param registry - The type registry
 * @returns An array of Param objects, or null if the signature is invalid
 * @throws TypeError if the signature is not a string
 * @throws SyntaxError if a rest param is not the last parameter
 */
export declare function parseSignature(rawSignature: string, registry: TypeRegistry): Param[] | null;
/**
 * Get available conversions to the given type names
 *
 * For each type that can be converted to one of the target types,
 * return the lowest-index conversion.
 *
 * @param typeNames - Target type names
 * @param registry - The type registry
 * @returns Array of available conversions
 */
export declare function availableConversions(typeNames: string[], registry: TypeRegistry): ConversionDef[];
/**
 * Expand a parameter with available type conversions
 *
 * @param param - The parameter to expand
 * @param registry - The type registry
 * @returns A new Param with conversion types added
 */
export declare function expandParam(param: Param, registry: TypeRegistry): Param;
/**
 * Check if a type is an exact type (not a conversion)
 */
export declare function isExactType(type: Type): boolean;
/**
 * Split params with union types into separate param combinations
 *
 * For example:
 *   splitParams([{types: ['Array', 'Object']}, {types: ['string', 'RegExp']}])
 * returns:
 *   [
 *     [{types: ['Array']}, {types: ['string']}],
 *     [{types: ['Array']}, {types: ['RegExp']}],
 *     [{types: ['Object']}, {types: ['string']}],
 *     [{types: ['Object']}, {types: ['RegExp']}]
 *   ]
 *
 * @param params - The parameters to split
 * @returns An array of parameter arrays
 */
export declare function splitParams(params: Param[]): Param[][];
/**
 * Stringify parameters to a canonical form
 *
 * @param params - The parameters to stringify
 * @param separator - The separator (default: ',')
 * @returns A string representation
 */
export declare function stringifyParams(params: Param[], separator?: string): string;
//# sourceMappingURL=signature-parser.d.ts.map