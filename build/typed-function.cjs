/**
 * typed-function v5.0.0
 * https://github.com/josdejong/typed-function
 *
 * Type checking for JavaScript functions
 *
 * @license MIT
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _documentCurrentScript = typeof document !== 'undefined' ? document.currentScript : null;
/**
 * Core TypeScript type definitions for typed-function v5.0
 *
 * This module defines all the fundamental interfaces and types used
 * throughout the typed-function library.
 */
/**
 * Constant error message for non-typed-function arguments
 */
const NOT_TYPED_FUNCTION = 'Argument is not a typed-function.';

/**
 * Type Registry - Manages type storage and lookup for typed-function
 *
 * This module provides a Map-based registry for storing type definitions,
 * with support for type ordering, bit masks (for future WASM optimization),
 * and helpful error messages.
 */
/**
 * Type Registry class for managing type definitions
 */
class TypeRegistry {
    /**
     * Create a new TypeRegistry instance
     */
    constructor() {
        /** Primary store of all types */
        this.typeMap = new Map();
        /** Ordered array of type names */
        this.typeList = [];
        /** Map from type name to bit position for WASM dispatch */
        this.typeIdMap = new Map();
        /** Next available bit position for custom types */
        this.nextTypeBit = 16;
        // Initialize with empty state - call clear() to add default types
    }
    /**
     * Get the number of registered types
     */
    get size() {
        return this.typeList.length;
    }
    /**
     * Alias for size - get the number of registered types
     */
    get typeCount() {
        return this.typeList.length;
    }
    /**
     * Get a copy of the type list
     */
    getTypeList() {
        return [...this.typeList];
    }
    /**
     * Check if a type exists
     */
    hasType(typeName) {
        return this.typeMap.has(typeName);
    }
    /**
     * Find a type by name, throwing a helpful error if not found
     *
     * @param typeName - The name of the type to find
     * @returns The type definition
     * @throws TypeError if the type is not found
     */
    findType(typeName) {
        const type = this.typeMap.get(typeName);
        if (type) {
            return type;
        }
        // Provide helpful error message with suggestions
        let message = `Unknown type "${typeName}"`;
        const nameLower = typeName.toLowerCase();
        for (const otherName of this.typeList) {
            if (otherName.toLowerCase() === nameLower) {
                message += `. Did you mean "${otherName}"?`;
                break;
            }
        }
        throw new TypeError(message);
    }
    /**
     * Get a type by name, or undefined if not found
     */
    getType(typeName) {
        return this.typeMap.get(typeName);
    }
    /**
     * Add an array of type definitions to the registry
     *
     * @param types - Array of type definitions to add
     * @param beforeSpec - Name of type to insert before, or false to append
     * @throws TypeError if types are invalid or duplicate
     */
    addTypes(types, beforeSpec = 'any') {
        const beforeIndex = beforeSpec
            ? this.findType(beforeSpec).index
            : this.typeList.length;
        const newTypes = [];
        for (let i = 0; i < types.length; i++) {
            const typeDef = types[i];
            if (!typeDef || typeof typeDef.name !== 'string' || typeof typeDef.test !== 'function') {
                throw new TypeError('Object with properties {name: string, test: function} expected');
            }
            const typeName = typeDef.name;
            if (this.typeMap.has(typeName)) {
                throw new TypeError(`Duplicate type name "${typeName}"`);
            }
            newTypes.push(typeName);
            const internalType = {
                name: typeName,
                test: typeDef.test,
                isAny: typeDef.isAny === true,
                index: beforeIndex + i,
                conversionsTo: [],
            };
            // Add optional properties only if defined
            if (typeDef.factory !== undefined) {
                internalType.factory = typeDef.factory;
            }
            if (typeDef.constructor !== undefined) {
                internalType.constructor = typeDef.constructor;
            }
            this.typeMap.set(typeName, internalType);
            // Assign bit position for WASM dispatch
            const builtinBit = TypeRegistry.BUILTIN_TYPE_BITS[typeName];
            if (builtinBit !== undefined) {
                this.typeIdMap.set(typeName, builtinBit);
            }
            else if (typeName === 'any') {
                // 'any' type gets all bits set (handled specially)
                this.typeIdMap.set(typeName, -1);
            }
            else {
                this.typeIdMap.set(typeName, this.nextTypeBit++);
            }
        }
        // Update the typeList
        const affectedTypes = this.typeList.slice(beforeIndex);
        this.typeList = this.typeList.slice(0, beforeIndex).concat(newTypes).concat(affectedTypes);
        // Fix the indices for affected types
        for (let i = beforeIndex + newTypes.length; i < this.typeList.length; i++) {
            const typeName = this.typeList[i];
            if (typeName !== undefined) {
                const type = this.typeMap.get(typeName);
                if (type) {
                    type.index = i;
                }
            }
        }
    }
    /**
     * Get the bit mask for a value based on its runtime type
     *
     * This is used for WASM-accelerated dispatch
     *
     * @param value - The value to get the type mask for
     * @returns A bit mask representing the value's type
     */
    getTypeMask(value) {
        // Bit positions for built-in types (constants)
        const NULL_BIT = 8;
        const UNDEFINED_BIT = 9;
        const NUMBER_BIT = 0;
        const STRING_BIT = 1;
        const BOOLEAN_BIT = 2;
        const FUNCTION_BIT = 3;
        const ARRAY_BIT = 4;
        const DATE_BIT = 5;
        const REGEXP_BIT = 6;
        const OBJECT_BIT = 7;
        // Modern types (ES6+)
        const BIGINT_BIT = 10;
        const SYMBOL_BIT = 11;
        const MAP_BIT = 12;
        const SET_BIT = 13;
        const WEAKMAP_BIT = 14;
        const WEAKSET_BIT = 15;
        if (value === null)
            return 1 << NULL_BIT;
        if (value === undefined)
            return 1 << UNDEFINED_BIT;
        switch (typeof value) {
            case 'number':
                return 1 << NUMBER_BIT;
            case 'string':
                return 1 << STRING_BIT;
            case 'boolean':
                return 1 << BOOLEAN_BIT;
            case 'function':
                return 1 << FUNCTION_BIT;
            case 'bigint':
                return 1 << BIGINT_BIT;
            case 'symbol':
                return 1 << SYMBOL_BIT;
            case 'object': {
                if (Array.isArray(value))
                    return 1 << ARRAY_BIT;
                if (value instanceof Date)
                    return 1 << DATE_BIT;
                if (value instanceof RegExp)
                    return 1 << REGEXP_BIT;
                if (value instanceof Map)
                    return 1 << MAP_BIT;
                if (value instanceof Set)
                    return 1 << SET_BIT;
                if (value instanceof WeakMap)
                    return 1 << WEAKMAP_BIT;
                if (value instanceof WeakSet)
                    return 1 << WEAKSET_BIT;
                // Check custom types by iterating through registered types
                for (const [name, type] of this.typeMap) {
                    if (!type.isAny && name !== 'Object' && type.test(value)) {
                        const bit = this.typeIdMap.get(name);
                        if (bit !== undefined && bit >= 0) {
                            return 1 << bit;
                        }
                    }
                }
                return 1 << OBJECT_BIT;
            }
            default:
                return 0;
        }
    }
    /**
     * Get the bit position for a type name
     */
    getTypeBit(typeName) {
        const bit = this.typeIdMap.get(typeName);
        if (bit !== undefined) {
            return bit;
        }
        // Assign new bit for unknown type
        const newBit = this.nextTypeBit++;
        this.typeIdMap.set(typeName, newBit);
        return newBit;
    }
    /**
     * Find all type names that match a value
     *
     * @param value - The value to check
     * @returns Array of matching type names, or ['any'] if no specific matches
     */
    findTypeNames(value) {
        const matches = this.typeList.filter((name) => {
            const type = this.typeMap.get(name);
            return type && !type.isAny && type.test(value);
        });
        if (matches.length > 0) {
            return matches;
        }
        return ['any'];
    }
    /**
     * Clear all types and conversions, resetting to default 'any' type
     */
    clear() {
        this.typeMap = new Map();
        this.typeList = [];
        this.typeIdMap = new Map();
        this.nextTypeBit = 16;
        // Add the 'any' type which matches everything
        const anyType = {
            name: 'any',
            test: () => true,
            isAny: true,
        };
        this.addTypes([anyType], false);
    }
    /**
     * Clear all conversions, keeping types intact
     */
    clearConversions() {
        for (const typeName of this.typeList) {
            const type = this.typeMap.get(typeName);
            if (type) {
                type.conversionsTo = [];
            }
        }
    }
    /**
     * Iterate over all types
     */
    *[Symbol.iterator]() {
        for (const entry of this.typeMap) {
            yield entry;
        }
    }
    /**
     * Get all type names in order
     */
    keys() {
        return [...this.typeList];
    }
    /**
     * Get all type definitions in order
     */
    values() {
        return this.typeList.map((name) => this.typeMap.get(name)).filter((t) => t !== undefined);
    }
}
/** Built-in type bit positions */
TypeRegistry.BUILTIN_TYPE_BITS = {
    number: 0,
    string: 1,
    boolean: 2,
    Function: 3,
    Array: 4,
    Date: 5,
    RegExp: 6,
    Object: 7,
    null: 8,
    undefined: 9,
    // Modern types (ES6+)
    BigInt: 10,
    Symbol: 11,
    Map: 12,
    Set: 13,
    WeakMap: 14,
    WeakSet: 15,
};
/**
 * Default built-in types for initialization
 */
const BUILTIN_TYPES = [
    { name: 'number', test: (x) => typeof x === 'number' },
    { name: 'string', test: (x) => typeof x === 'string' },
    { name: 'boolean', test: (x) => typeof x === 'boolean' },
    { name: 'Function', test: (x) => typeof x === 'function' },
    { name: 'Array', test: (x) => Array.isArray(x) },
    { name: 'Date', test: (x) => x instanceof Date },
    { name: 'RegExp', test: (x) => x instanceof RegExp },
    {
        name: 'Object',
        test: (x) => typeof x === 'object' && x !== null && x.constructor === Object,
    },
    { name: 'null', test: (x) => x === null },
    { name: 'undefined', test: (x) => x === undefined },
    // Modern types (ES6+)
    { name: 'BigInt', test: (x) => typeof x === 'bigint' },
    { name: 'Symbol', test: (x) => typeof x === 'symbol' },
    { name: 'Map', test: (x) => x instanceof Map },
    { name: 'Set', test: (x) => x instanceof Set },
    { name: 'WeakMap', test: (x) => x instanceof WeakMap },
    { name: 'WeakSet', test: (x) => x instanceof WeakSet },
];
/**
 * Create and initialize a new TypeRegistry with default types
 */
function createTypeRegistry() {
    const registry = new TypeRegistry();
    registry.clear();
    registry.addTypes(BUILTIN_TYPES);
    return registry;
}

/**
 * Array Helper Utilities for typed-function
 *
 * This module provides utility functions for working with arrays
 * and array-like objects (Arguments).
 */
/**
 * Return the last item of an array or array-like object
 *
 * @param arr - The array or array-like object
 * @returns The last element, or undefined if empty
 */
function last(arr) {
    return arr[arr.length - 1];
}
/**
 * Return all but the last item of an array or array-like object
 *
 * @param arr - The array or array-like object
 * @returns A new array with all elements except the last
 */
function initial(arr) {
    return slice(arr, 0, arr.length - 1);
}
/**
 * Slice an array or array-like object
 *
 * This is particularly useful for slicing the `arguments` object.
 *
 * @param arr - The array or array-like object to slice
 * @param start - The start index
 * @param end - The end index (optional)
 * @returns A new array containing the sliced elements
 */
function slice(arr, start, end) {
    return Array.prototype.slice.call(arr, start, end);
}
/**
 * Flat map over an array, concatenating results
 *
 * @param arr - The array to map over
 * @param callback - Function that returns an array for each element
 * @returns A new array with all results concatenated
 */
function flatMap(arr, callback) {
    return arr.reduce((acc, item, index, array) => {
        return acc.concat(callback(item, index, array));
    }, []);
}
/**
 * Find the first item in an array that matches a predicate
 *
 * @param arr - The array to search
 * @param predicate - Function that tests each element
 * @returns The first matching element, or undefined
 */
function findInArray(arr, predicate) {
    for (let i = 0; i < arr.length; i++) {
        const item = arr[i];
        if (item !== undefined && predicate(item, i)) {
            return item;
        }
    }
    return undefined;
}
/**
 * Check if an array has a specific item by predicate
 *
 * @param arr - The array to search
 * @param predicate - Function that tests each element
 * @returns true if a matching element is found
 */
function hasItem(arr, predicate) {
    return findInArray(arr, predicate) !== undefined;
}
/**
 * Create an array with a specified length and fill it using a callback
 *
 * @param length - The length of the array to create
 * @param callback - Function that generates each element
 * @returns A new array with generated elements
 */
function createArray(length, callback) {
    const result = new Array(length);
    for (let i = 0; i < length; i++) {
        result[i] = callback(i);
    }
    return result;
}
/**
 * Check if two arrays are equal using strict equality
 *
 * @param a - First array
 * @param b - Second array
 * @returns true if arrays have same length and equal elements
 */
function arraysEqual(a, b) {
    if (a.length !== b.length)
        return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i])
            return false;
    }
    return true;
}

/**
 * Error Factory Module for typed-function
 *
 * This module provides functions for creating detailed error messages
 * when typed function calls fail due to type mismatches.
 */
/**
 * Test whether a set of params contains a rest param
 *
 * @param params - The parameters to check
 * @returns true if the last parameter is a rest param
 */
function hasRestParam$2(params) {
    const param = last(params);
    return param ? param.restParam : false;
}
/**
 * Get the parameter at a specific index, handling rest params
 *
 * @param params - The parameters array
 * @param index - The index to retrieve
 * @returns The parameter at that index, or null if out of bounds
 */
function getParamAtIndex(params, index) {
    if (index < params.length) {
        return params[index] ?? null;
    }
    return hasRestParam$2(params) ? (last(params) ?? null) : null;
}
/**
 * Get the set of type names in a parameter
 *
 * Caches the result on the parameter for efficiency
 *
 * @param param - The parameter
 * @returns Set of type names
 */
function paramTypeSet(param) {
    if (!param.typeSet) {
        param.typeSet = new Set();
        for (const type of param.types) {
            param.typeSet.add(type.name);
        }
    }
    return param.typeSet;
}
/**
 * Get the type set at a specific index in a params array
 *
 * @param params - The parameters array
 * @param index - The index to retrieve
 * @returns Set of type names, or empty set if no param at index
 */
function getTypeSetAtIndex$1(params, index) {
    const param = getParamAtIndex(params, index);
    if (!param) {
        return new Set();
    }
    return paramTypeSet(param);
}
/**
 * Merge expected parameters from multiple signatures at a given index
 *
 * @param signatures - Array of signatures
 * @param index - The parameter index
 * @returns Array of unique type names expected at this index
 */
function mergeExpectedParams(signatures, index) {
    const typeSet = new Set();
    for (const signature of signatures) {
        const paramSet = getTypeSetAtIndex$1(signature.params, index);
        for (const name of paramSet) {
            typeSet.add(name);
        }
    }
    // If 'any' is expected, just return ['any']
    return typeSet.has('any') ? ['any'] : Array.from(typeSet);
}
/**
 * Create a test function for a parameter
 *
 * @param param - The parameter to create a test for
 * @param registry - The type registry
 * @returns A function that tests if a value matches the parameter
 */
function createParamTest(param, registry) {
    if (!param || param.types.length === 0) {
        return () => true;
    }
    if (param.types.length === 1) {
        const type = param.types[0];
        if (type) {
            return registry.findType(type.name).test;
        }
        return () => true;
    }
    if (param.types.length === 2) {
        const type0 = param.types[0];
        const type1 = param.types[1];
        if (type0 && type1) {
            const test0 = registry.findType(type0.name).test;
            const test1 = registry.findType(type1.name).test;
            return (x) => test0(x) || test1(x);
        }
        return () => true;
    }
    // 3+ types
    const tests = param.types.map((type) => registry.findType(type.name).test);
    return (x) => {
        for (const test of tests) {
            if (test(x))
                return true;
        }
        return false;
    };
}
/**
 * Create a detailed error for a failed typed function call
 *
 * @param name - The name of the function
 * @param args - The actual arguments passed
 * @param signatures - The available signatures
 * @param registry - The type registry
 * @returns A TypeError with detailed information
 */
function createError(name, args, signatures, registry) {
    const _name = name || 'unnamed';
    // Test for wrong type at some index
    let matchingSignatures = [...signatures];
    let index;
    for (index = 0; index < args.length; index++) {
        const nextMatchingDefs = [];
        for (const signature of matchingSignatures) {
            const param = getParamAtIndex(signature.params, index);
            const test = createParamTest(param, registry);
            if ((index < signature.params.length || hasRestParam$2(signature.params)) &&
                test(args[index])) {
                nextMatchingDefs.push(signature);
            }
        }
        if (nextMatchingDefs.length === 0) {
            // No matching signatures anymore, throw error "wrong type"
            const expected = mergeExpectedParams(matchingSignatures, index);
            if (expected.length > 0) {
                const actualTypes = registry.findTypeNames(args[index]);
                const err = new TypeError(`Unexpected type of argument in function ${_name} ` +
                    `(expected: ${expected.join(' or ')}, ` +
                    `actual: ${actualTypes.join(' | ')}, index: ${index})`);
                err.data = {
                    category: 'wrongType',
                    fn: _name,
                    index,
                    actual: actualTypes,
                    expected,
                };
                return err;
            }
        }
        else {
            matchingSignatures = nextMatchingDefs;
        }
    }
    // Test for too few arguments
    const lengths = matchingSignatures.map((signature) => hasRestParam$2(signature.params) ? Infinity : signature.params.length);
    const minLength = Math.min(...lengths);
    if (args.length < minLength) {
        const expected = mergeExpectedParams(matchingSignatures, index);
        const err = new TypeError(`Too few arguments in function ${_name} ` + `(expected: ${expected.join(' or ')}, index: ${args.length})`);
        err.data = {
            category: 'tooFewArgs',
            fn: _name,
            index: args.length,
            expected,
        };
        return err;
    }
    // Test for too many arguments
    const maxLength = Math.max(...lengths);
    if (args.length > maxLength) {
        const err = new TypeError(`Too many arguments in function ${_name} ` + `(expected: ${maxLength}, actual: ${args.length})`);
        err.data = {
            category: 'tooManyArgs',
            fn: _name,
            index: args.length,
            expectedLength: maxLength,
        };
        return err;
    }
    // Generic error - arguments don't match any signature
    const argTypes = [];
    for (let i = 0; i < args.length; i++) {
        argTypes.push(registry.findTypeNames(args[i]).join('|'));
    }
    const err = new TypeError(`Arguments of type "${argTypes.join(', ')}" do not match any of the ` +
        `defined signatures of function ${_name}.`);
    err.data = {
        category: 'mismatch',
        fn: _name,
        actual: argTypes,
    };
    return err;
}
/**
 * Default mismatch handler that throws an error
 *
 * @param name - The function name
 * @param args - The actual arguments
 * @param signatures - The available signatures
 * @param registry - The type registry
 * @throws TypedError
 */
function defaultOnMismatch(name, args, signatures, registry) {
    throw createError(name, args, signatures, registry);
}
/**
 * Stringify parameters in a normalized way
 *
 * @param params - The parameters to stringify
 * @param separator - The separator to use (default: ',')
 * @returns A string representation of the parameters
 */
function stringifyParams$1(params, separator = ',') {
    return params.map((p) => p.name).join(separator);
}

/**
 * Specific Error Classes for typed-function
 *
 * This module provides specific error types for better error handling
 * and type-safe error catching in TypeScript.
 */
/**
 * Error codes for typed-function errors
 *
 * Use these codes for programmatic error handling:
 * - TF1xx: Type definition errors
 * - TF2xx: Signature errors
 * - TF3xx: Dispatch/argument errors
 * - TF4xx: Conversion errors
 * - TF5xx: Reference errors
 * - TF6xx: WASM errors
 * - TF9xx: General errors
 */
var ErrorCode;
(function (ErrorCode) {
    // Type errors (1xx)
    /** Unknown type name */
    ErrorCode["UNKNOWN_TYPE"] = "TF101";
    /** Duplicate type name */
    ErrorCode["DUPLICATE_TYPE"] = "TF102";
    /** Invalid type definition */
    ErrorCode["INVALID_TYPE_DEFINITION"] = "TF103";
    // Signature errors (2xx)
    /** No signatures provided */
    ErrorCode["NO_SIGNATURES"] = "TF201";
    /** Conflicting signatures */
    ErrorCode["CONFLICTING_SIGNATURES"] = "TF202";
    /** Invalid signature syntax */
    ErrorCode["INVALID_SIGNATURE"] = "TF203";
    /** Duplicate signature */
    ErrorCode["DUPLICATE_SIGNATURE"] = "TF204";
    /** Signature not found */
    ErrorCode["SIGNATURE_NOT_FOUND"] = "TF205";
    // Dispatch errors (3xx)
    /** Type mismatch */
    ErrorCode["TYPE_MISMATCH"] = "TF301";
    /** Too few arguments */
    ErrorCode["TOO_FEW_ARGUMENTS"] = "TF302";
    /** Too many arguments */
    ErrorCode["TOO_MANY_ARGUMENTS"] = "TF303";
    /** No matching signature */
    ErrorCode["NO_MATCHING_SIGNATURE"] = "TF304";
    // Conversion errors (4xx)
    /** Conversion not found */
    ErrorCode["CONVERSION_NOT_FOUND"] = "TF401";
    /** Duplicate conversion */
    ErrorCode["DUPLICATE_CONVERSION"] = "TF402";
    /** Conversion failed */
    ErrorCode["CONVERSION_FAILED"] = "TF403";
    /** Invalid conversion definition */
    ErrorCode["INVALID_CONVERSION"] = "TF404";
    // Reference errors (5xx)
    /** Circular reference in referTo */
    ErrorCode["CIRCULAR_REFERENCE"] = "TF501";
    /** Unresolved reference */
    ErrorCode["UNRESOLVED_REFERENCE"] = "TF502";
    // WASM errors (6xx)
    /** WASM not initialized */
    ErrorCode["WASM_NOT_INITIALIZED"] = "TF601";
    /** WASM load failed */
    ErrorCode["WASM_LOAD_FAILED"] = "TF602";
    /** WASM not supported */
    ErrorCode["WASM_NOT_SUPPORTED"] = "TF603";
    // General errors (9xx)
    /** Not a typed function */
    ErrorCode["NOT_A_TYPED_FUNCTION"] = "TF901";
    /** Internal error */
    ErrorCode["INTERNAL_ERROR"] = "TF999";
})(ErrorCode || (ErrorCode = {}));
/**
 * Base class for all typed-function errors
 */
class TypedFunctionError extends TypeError {
    constructor(message, data, code = ErrorCode.INTERNAL_ERROR) {
        super(message);
        this.name = 'TypedFunctionError';
        this.data = data;
        this.code = code;
        // Maintain proper stack trace in V8 environments
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
/**
 * Error thrown when an argument has an unexpected type
 */
class TypeMismatchError extends TypedFunctionError {
    constructor(fnName, index, actualTypes, expectedTypes) {
        const message = `Unexpected type of argument in function ${fnName || 'unnamed'} ` +
            `(expected: ${expectedTypes.join(' or ')}, ` +
            `actual: ${actualTypes.join(' | ')}, index: ${index})`;
        super(message, {
            category: 'wrongType',
            fn: fnName,
            index,
            actual: actualTypes,
            expected: expectedTypes,
        }, ErrorCode.TYPE_MISMATCH);
        this.name = 'TypeMismatchError';
        this.index = index;
        this.actualTypes = actualTypes;
        this.expectedTypes = expectedTypes;
    }
}
/**
 * Error thrown when too few arguments are provided
 */
class TooFewArgumentsError extends TypedFunctionError {
    constructor(fnName, providedCount, expectedTypes) {
        const message = `Too few arguments in function ${fnName || 'unnamed'} ` +
            `(expected: ${expectedTypes.join(' or ')}, index: ${providedCount})`;
        super(message, {
            category: 'tooFewArgs',
            fn: fnName,
            index: providedCount,
            expected: expectedTypes,
        }, ErrorCode.TOO_FEW_ARGUMENTS);
        this.name = 'TooFewArgumentsError';
        this.providedCount = providedCount;
        this.expectedTypes = expectedTypes;
    }
}
/**
 * Error thrown when too many arguments are provided
 */
class TooManyArgumentsError extends TypedFunctionError {
    constructor(fnName, providedCount, expectedCount) {
        const message = `Too many arguments in function ${fnName || 'unnamed'} ` +
            `(expected: ${expectedCount}, actual: ${providedCount})`;
        super(message, {
            category: 'tooManyArgs',
            fn: fnName,
            index: providedCount,
            expectedLength: expectedCount,
        }, ErrorCode.TOO_MANY_ARGUMENTS);
        this.name = 'TooManyArgumentsError';
        this.providedCount = providedCount;
        this.expectedCount = expectedCount;
    }
}
/**
 * Error thrown when arguments don't match any signature
 */
class SignatureMismatchError extends TypedFunctionError {
    constructor(fnName, argumentTypes, signatures) {
        const message = `Arguments of type "${argumentTypes.join(', ')}" do not match any of the ` +
            `defined signatures of function ${fnName || 'unnamed'}.`;
        super(message, {
            category: 'mismatch',
            fn: fnName,
            actual: argumentTypes,
        }, ErrorCode.NO_MATCHING_SIGNATURE);
        this.name = 'SignatureMismatchError';
        this.argumentTypes = argumentTypes;
        this.signatures = signatures;
    }
}
/**
 * Error thrown when a signature is not found
 */
class SignatureNotFoundError extends TypedFunctionError {
    constructor(fnName, signature) {
        const message = `Signature not found (signature: ${fnName || 'unnamed'}(${signature}))`;
        super(message, {
            category: 'mismatch',
            fn: fnName,
        }, ErrorCode.SIGNATURE_NOT_FOUND);
        this.name = 'SignatureNotFoundError';
        this.signature = signature;
    }
}
/**
 * Error thrown when WASM is not available but required
 */
class WasmNotAvailableError extends Error {
    constructor(reason = 'WebAssembly is not available in this environment') {
        super(`WASM dispatch unavailable: ${reason}`);
        this.name = 'WasmNotAvailableError';
        this.reason = reason;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
/**
 * Error thrown when WASM initialization fails
 */
class WasmInitializationError extends Error {
    constructor(message, cause) {
        super(`WASM initialization failed: ${message}`);
        this.name = 'WasmInitializationError';
        this.cause = cause ?? undefined;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
/**
 * Error thrown when a type is not found in the registry
 */
class TypeNotFoundError extends TypeError {
    constructor(typeName, suggestion) {
        let message = `Unknown type "${typeName}"`;
        if (suggestion) {
            message += `. Did you mean "${suggestion}"?`;
        }
        super(message);
        this.name = 'TypeNotFoundError';
        this.typeName = typeName;
        this.suggestion = suggestion ?? undefined;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
/**
 * Error thrown when a duplicate type is registered
 */
class DuplicateTypeError extends TypeError {
    constructor(typeName) {
        super(`Duplicate type name "${typeName}"`);
        this.name = 'DuplicateTypeError';
        this.typeName = typeName;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
/**
 * Type guard to check if an error is a TypedFunctionError
 */
function isTypedFunctionError(error) {
    return error instanceof TypedFunctionError;
}
/**
 * Type guard to check if an error is a TypeMismatchError
 */
function isTypeMismatchError(error) {
    return error instanceof TypeMismatchError;
}
/**
 * Type guard to check if an error is a TooFewArgumentsError
 */
function isTooFewArgumentsError(error) {
    return error instanceof TooFewArgumentsError;
}
/**
 * Type guard to check if an error is a TooManyArgumentsError
 */
function isTooManyArgumentsError(error) {
    return error instanceof TooManyArgumentsError;
}
/**
 * Type guard to check if an error is a WasmNotAvailableError
 */
function isWasmNotAvailableError(error) {
    return error instanceof WasmNotAvailableError;
}

/**
 * Signature Parser Module for typed-function
 *
 * This module handles parsing signature strings like "number, string | boolean"
 * into structured Param arrays, and expanding parameters with available type conversions.
 */
/**
 * Parse a single parameter string like "number | boolean" or "...string"
 *
 * @param param - The raw parameter string
 * @param registry - The type registry
 * @returns A Param object
 * @throws TypeError if the type is not found
 */
function parseParam(param, registry) {
    const trimmed = param.trim();
    const restParam = trimmed.startsWith('...');
    const typeStr = restParam
        ? (trimmed.length > 3 ? trimmed.slice(3) : 'any')
        : trimmed;
    const typeDefs = typeStr.split('|').map((s) => registry.findType(s.trim()));
    let hasAny = false;
    let paramName = restParam ? '...' : '';
    const exactTypes = typeDefs.map((type) => {
        hasAny = type.isAny || hasAny;
        paramName += type.name + '|';
        return {
            name: type.name,
            typeIndex: type.index,
            test: type.test,
            isAny: type.isAny,
            conversion: null,
            conversionIndex: -1,
        };
    });
    return {
        types: exactTypes,
        name: paramName.slice(0, -1), // Remove trailing '|'
        hasAny,
        hasConversion: false,
        restParam,
    };
}
/**
 * Parse a full signature string like "number, string | boolean"
 *
 * @param rawSignature - The raw signature string
 * @param registry - The type registry
 * @returns An array of Param objects, or null if the signature is invalid
 * @throws TypeError if the signature is not a string
 * @throws SyntaxError if a rest param is not the last parameter
 */
function parseSignature(rawSignature, registry) {
    if (typeof rawSignature !== 'string') {
        throw new TypeError('Signatures must be strings');
    }
    const signature = rawSignature.trim();
    if (signature === '') {
        return [];
    }
    const rawParams = signature.split(',');
    const params = [];
    for (let i = 0; i < rawParams.length; i++) {
        const rawParam = rawParams[i];
        if (rawParam === undefined)
            continue;
        const parsedParam = parseParam(rawParam.trim(), registry);
        if (parsedParam.restParam && i !== rawParams.length - 1) {
            throw new SyntaxError(`Unexpected rest parameter "${rawParam}": only allowed for the last parameter`);
        }
        // If invalid (no types), short-circuit
        if (parsedParam.types.length === 0) {
            return null;
        }
        params.push(parsedParam);
    }
    return params;
}
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
function availableConversions(typeNames, registry) {
    if (typeNames.length === 0) {
        return [];
    }
    const types = typeNames.map((name) => registry.findType(name));
    if (typeNames.length === 1) {
        const type = types[0];
        return type ? type.conversionsTo : [];
    }
    // For multiple types, find the lowest-index conversion for each source type
    const knownTypes = new Set(typeNames);
    const convertibleTypes = new Set();
    for (const type of types) {
        if (!type)
            continue;
        for (const match of type.conversionsTo) {
            if (!knownTypes.has(match.from)) {
                convertibleTypes.add(match.from);
            }
        }
    }
    // Get the lowest-index conversion for each convertible type
    const matches = [];
    const nConversions = getMaxConversionIndex(types);
    for (const typeName of convertibleTypes) {
        let bestIndex = nConversions + 1;
        let bestConversion = null;
        for (const type of types) {
            if (!type)
                continue;
            for (const match of type.conversionsTo) {
                if (match.from === typeName && match.index !== undefined && match.index < bestIndex) {
                    bestIndex = match.index;
                    bestConversion = match;
                }
            }
        }
        if (bestConversion) {
            matches.push(bestConversion);
        }
    }
    return matches;
}
/**
 * Get the maximum conversion index from a list of types
 */
function getMaxConversionIndex(types) {
    let max = 0;
    for (const type of types) {
        for (const conv of type.conversionsTo) {
            if (conv.index !== undefined && conv.index > max) {
                max = conv.index;
            }
        }
    }
    return max;
}
/**
 * Expand a parameter with available type conversions
 *
 * @param param - The parameter to expand
 * @param registry - The type registry
 * @returns A new Param with conversion types added
 */
function expandParam(param, registry) {
    const typeNames = param.types.map((t) => t.name);
    const matchingConversions = availableConversions(typeNames, registry);
    let hasAny = param.hasAny;
    let newName = param.name;
    const convertibleTypes = matchingConversions.map((conversion) => {
        const type = registry.findType(conversion.from);
        hasAny = type.isAny || hasAny;
        newName += '|' + conversion.from;
        return {
            name: conversion.from,
            typeIndex: type.index,
            test: type.test,
            isAny: type.isAny,
            conversion,
            conversionIndex: conversion.index ?? -1,
        };
    });
    return {
        types: [...param.types, ...convertibleTypes],
        name: newName,
        hasAny,
        hasConversion: convertibleTypes.length > 0,
        restParam: param.restParam,
    };
}
/**
 * Check if a type is an exact type (not a conversion)
 */
function isExactType$1(type) {
    return type.conversion === null || type.conversion === undefined;
}
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
function splitParams(params) {
    function recurse(index, paramsSoFar) {
        if (index >= params.length) {
            return [paramsSoFar];
        }
        const param = params[index];
        if (!param) {
            return [paramsSoFar];
        }
        let resultingParams;
        if (param.restParam) {
            // Split rest params into two: exact types only, and exact types + conversions
            const exactTypes = param.types.filter(isExactType$1);
            resultingParams = [];
            if (exactTypes.length < param.types.length) {
                // Add a version with only exact types
                resultingParams.push({
                    types: exactTypes,
                    name: '...' + exactTypes.map((t) => t.name).join('|'),
                    hasAny: exactTypes.some((t) => t.isAny),
                    hasConversion: false,
                    restParam: true,
                });
            }
            // Always include the full param
            resultingParams.push(param);
        }
        else {
            // Split each type into a separate param
            resultingParams = param.types.map((type) => ({
                types: [type],
                name: type.name,
                hasAny: type.isAny,
                hasConversion: type.conversion !== null && type.conversion !== undefined,
                restParam: false,
            }));
        }
        // Recurse over each resulting param
        const results = [];
        for (const nextParam of resultingParams) {
            const subResults = recurse(index + 1, [...paramsSoFar, nextParam]);
            results.push(...subResults);
        }
        return results;
    }
    return recurse(0, []);
}
/**
 * Stringify parameters to a canonical form
 *
 * @param params - The parameters to stringify
 * @param separator - The separator (default: ',')
 * @returns A string representation
 */
function stringifyParams(params, separator = ',') {
    return params.map((p) => p.name).join(separator);
}

/**
 * Signature Compiler Module for typed-function
 *
 * This module compiles signature parameters into optimized test functions
 * and argument preprocessing functions.
 */
/**
 * Test whether a set of params contains a rest param
 */
function hasRestParam$1(params) {
    const param = last(params);
    return param ? param.restParam : false;
}
/**
 * Create a type test for a single parameter
 *
 * Optimized for common cases (0, 1, 2 types)
 *
 * @param param - The parameter to create a test for
 * @param registry - The type registry
 * @returns A function that tests if a value matches the parameter
 */
function compileTest(param, registry) {
    if (!param || param.types.length === 0) {
        // Empty param matches everything
        return () => true;
    }
    if (param.types.length === 1) {
        const type = param.types[0];
        if (type) {
            return registry.findType(type.name).test;
        }
        return () => true;
    }
    if (param.types.length === 2) {
        const type0 = param.types[0];
        const type1 = param.types[1];
        if (type0 && type1) {
            const test0 = registry.findType(type0.name).test;
            const test1 = registry.findType(type1.name).test;
            return function or(x) {
                return test0(x) || test1(x);
            };
        }
        return () => true;
    }
    // 3+ types: use a loop
    const tests = param.types
        .map((type) => (type ? registry.findType(type.name).test : null))
        .filter((t) => t !== null);
    return function or(x) {
        for (let i = 0; i < tests.length; i++) {
            const test = tests[i];
            if (test && test(x)) {
                return true;
            }
        }
        return false;
    };
}
/**
 * Create a test function for all parameters of a signature
 *
 * Optimized for common cases (0, 1, 2 params without rest)
 *
 * @param params - The parameters to compile tests for
 * @param registry - The type registry
 * @returns A function that tests if an argument list matches the signature
 */
function compileTests(params, registry) {
    if (hasRestParam$1(params)) {
        // Variable arguments like '...number'
        const tests = initial(params).map((p) => compileTest(p, registry));
        const varIndex = tests.length;
        const lastParam = last(params);
        const lastTest = compileTest(lastParam, registry);
        const testRestParam = function (args) {
            for (let i = varIndex; i < args.length; i++) {
                if (!lastTest(args[i])) {
                    return false;
                }
            }
            return true;
        };
        return function testArgs(args) {
            for (let i = 0; i < tests.length; i++) {
                const test = tests[i];
                if (test && !test(args[i])) {
                    return false;
                }
            }
            return testRestParam(args) && args.length >= varIndex + 1;
        };
    }
    // No variable arguments - specialize for 0, 1, 2 params
    switch (params.length) {
        case 0:
            return function testArgs(args) {
                return args.length === 0;
            };
        case 1: {
            const param0 = params[0];
            const test0 = compileTest(param0, registry);
            return function testArgs(args) {
                return test0(args[0]) && args.length === 1;
            };
        }
        case 2: {
            const param0 = params[0];
            const param1 = params[1];
            const test0 = compileTest(param0, registry);
            const test1 = compileTest(param1, registry);
            return function testArgs(args) {
                return test0(args[0]) && test1(args[1]) && args.length === 2;
            };
        }
        default: {
            // 3+ params
            const tests = params.map((p) => compileTest(p, registry));
            const len = tests.length;
            return function testArgs(args) {
                if (args.length !== len) {
                    return false;
                }
                for (let i = 0; i < len; i++) {
                    const test = tests[i];
                    if (test && !test(args[i])) {
                        return false;
                    }
                }
                return true;
            };
        }
    }
}
/**
 * Compile a conversion function for a single argument
 *
 * @param param - The parameter containing conversion info
 * @param registry - The type registry
 * @returns A function that converts an argument if needed
 */
function compileArgConversion(param, registry) {
    const conversions = [];
    let name = '';
    for (const type of param.types) {
        if (type.conversion) {
            name += type.conversion.from + '~>' + type.conversion.to + ',';
            conversions.push({
                test: registry.findType(type.conversion.from).test,
                convert: type.conversion.convert,
            });
        }
    }
    if (name) {
        name = name.slice(0, -1); // Remove trailing comma
    }
    else {
        name = 'pass';
    }
    // Create optimized conversion functions
    let convertor;
    switch (conversions.length) {
        case 0:
            convertor = (arg) => arg;
            break;
        case 1: {
            const conv = conversions[0];
            if (conv) {
                const { test: test0, convert: conversion0 } = conv;
                convertor = function convertArg(arg) {
                    if (test0(arg)) {
                        return conversion0(arg);
                    }
                    return arg;
                };
            }
            else {
                convertor = (arg) => arg;
            }
            break;
        }
        case 2: {
            const conv0 = conversions[0];
            const conv1 = conversions[1];
            if (conv0 && conv1) {
                const { test: test0, convert: conversion0 } = conv0;
                const { test: test1, convert: conversion1 } = conv1;
                convertor = function convertArg(arg) {
                    if (test0(arg)) {
                        return conversion0(arg);
                    }
                    if (test1(arg)) {
                        return conversion1(arg);
                    }
                    return arg;
                };
            }
            else {
                convertor = (arg) => arg;
            }
            break;
        }
        default:
            convertor = function convertArg(arg) {
                for (let i = 0; i < conversions.length; i++) {
                    const conv = conversions[i];
                    if (conv && conv.test(arg)) {
                        return conv.convert(arg);
                    }
                }
                return arg;
            };
    }
    // Attach name for debugging
    Object.defineProperty(convertor, 'name', { value: name });
    return convertor;
}
/**
 * Compile argument preprocessing for a signature
 *
 * This handles:
 * - Converting arguments if needed
 * - Collecting rest parameters into an array
 *
 * @param params - The signature parameters
 * @param fn - The original function
 * @param registry - The type registry
 * @returns A wrapped function that preprocesses arguments
 */
function compileArgsPreprocessing(params, fn, registry) {
    let fnConvert = fn;
    let name = '';
    // Check if any conversions are needed
    if (params.some((p) => p.hasConversion)) {
        const restParam = hasRestParam$1(params);
        const compiledConversions = params.map((p) => compileArgConversion(p, registry));
        name = compiledConversions.map((conv) => conv.name).join(';');
        fnConvert = function convertArgs() {
            const args = [];
            const lastIdx = restParam ? arguments.length - 1 : arguments.length;
            for (let i = 0; i < lastIdx; i++) {
                const conv = compiledConversions[i];
                args[i] = conv ? conv(arguments[i]) : arguments[i];
            }
            if (restParam) {
                const lastConv = compiledConversions[lastIdx];
                const restArgs = arguments[lastIdx];
                args[lastIdx] = lastConv ? restArgs.map(lastConv) : restArgs;
            }
            return fn.apply(this, args);
        };
    }
    // Handle rest parameters
    let fnPreprocess = fnConvert;
    if (hasRestParam$1(params)) {
        const offset = params.length - 1;
        fnPreprocess = function preprocessRestParams() {
            const args = slice(arguments, 0, offset);
            args.push(slice(arguments, offset));
            return fnConvert.apply(this, args);
        };
    }
    if (name) {
        Object.defineProperty(fnPreprocess, 'name', { value: name });
    }
    return fnPreprocess;
}

/**
 * Signature Comparator Module for typed-function
 *
 * This module handles comparing and ordering signatures for dispatch priority,
 * and detecting conflicts between signatures.
 */
/**
 * Test whether a set of params contains a rest param
 */
function hasRestParam(params) {
    const param = last(params);
    return param ? param.restParam : false;
}
/**
 * Check if a type is an exact type (not a conversion)
 */
function isExactType(type) {
    return type.conversion === null || type.conversion === undefined;
}
/**
 * Find the lowest type index among all types in a parameter
 *
 * @param param - The parameter to check
 * @param maxTypeIndex - The maximum possible type index (from registry)
 * @returns The lowest type index
 */
function getLowestTypeIndex(param, maxTypeIndex) {
    let min = maxTypeIndex + 1;
    for (const type of param.types) {
        if (type.typeIndex < min) {
            min = type.typeIndex;
        }
    }
    return min;
}
/**
 * Find the lowest conversion index among conversions in a parameter
 *
 * @param param - The parameter to check
 * @param maxConversionIndex - The maximum possible conversion index
 * @returns The lowest conversion index
 */
function getLowestConversionIndex(param, maxConversionIndex) {
    let min = maxConversionIndex + 1;
    for (const type of param.types) {
        if (!isExactType(type) && type.conversionIndex >= 0 && type.conversionIndex < min) {
            min = type.conversionIndex;
        }
    }
    return min;
}
/**
 * Compare two parameters for ordering priority
 *
 * Returns:
 * - Negative if param1 should come first
 * - Positive if param2 should come first
 * - Zero if equivalent
 *
 * The absolute value indicates importance (smaller = less important difference)
 *
 * @param param1 - First parameter
 * @param param2 - Second parameter
 * @param maxTypeIndex - Maximum type index in registry
 * @param maxConversionIndex - Maximum conversion index
 * @returns A comparison value
 */
function compareParams(param1, param2, maxTypeIndex, maxConversionIndex) {
    // 1) 'any' parameters are the least preferred
    if (param1.hasAny) {
        if (!param2.hasAny) {
            return 0.1;
        }
    }
    else if (param2.hasAny) {
        return -0.1;
    }
    // 2) Prefer non-rest to rest parameters
    if (param1.restParam) {
        if (!param2.restParam) {
            return 0.01;
        }
    }
    else if (param2.restParam) {
        return -0.01;
    }
    // 3) Prefer lower type index (types defined earlier)
    const typeDiff = getLowestTypeIndex(param1, maxTypeIndex) - getLowestTypeIndex(param2, maxTypeIndex);
    if (typeDiff < 0) {
        return -1e-3;
    }
    if (typeDiff > 0) {
        return 0.001;
    }
    // 4) Prefer exact type match over conversions
    const conv1 = getLowestConversionIndex(param1, maxConversionIndex);
    const conv2 = getLowestConversionIndex(param2, maxConversionIndex);
    if (param1.hasConversion) {
        if (!param2.hasConversion) {
            return (1 + conv1) * 0.000001;
        }
    }
    else if (param2.hasConversion) {
        return -(1 + conv2) * 0.000001;
    }
    // 5) Prefer lower conversion index
    const convDiff = conv1 - conv2;
    if (convDiff < 0) {
        return -1e-7;
    }
    if (convDiff > 0) {
        return 0.0000001;
    }
    // No basis for preference
    return 0;
}
/**
 * Compare two signatures for ordering priority
 *
 * Returns:
 * - Negative if signature1 should come first
 * - Positive if signature2 should come first
 * - Zero if equivalent
 *
 * @param signature1 - First signature
 * @param signature2 - Second signature
 * @param maxTypeIndex - Maximum type index in registry
 * @param maxConversionIndex - Maximum conversion index
 * @returns A comparison value
 */
function compareSignatures(signature1, signature2, maxTypeIndex, maxConversionIndex) {
    const pars1 = signature1.params;
    const pars2 = signature2.params;
    const last1 = last(pars1);
    const last2 = last(pars2);
    const hasRest1 = hasRestParam(pars1);
    const hasRest2 = hasRestParam(pars2);
    // 1) An "any rest param" is least preferred
    if (hasRest1 && last1 && last1.hasAny) {
        if (!hasRest2 || !last2 || !last2.hasAny) {
            return 10000000;
        }
    }
    else if (hasRest2 && last2 && last2.hasAny) {
        return -1e7;
    }
    // 2) Minimize the number of 'any' parameters
    let any1 = 0;
    let conv1 = 0;
    for (const par of pars1) {
        if (par.hasAny)
            any1++;
        if (par.hasConversion)
            conv1++;
    }
    let any2 = 0;
    let conv2 = 0;
    for (const par of pars2) {
        if (par.hasAny)
            any2++;
        if (par.hasConversion)
            conv2++;
    }
    if (any1 !== any2) {
        return (any1 - any2) * 1000000;
    }
    // 3) A conversion rest param is less preferred
    if (hasRest1 && last1 && last1.hasConversion) {
        if (!hasRest2 || !last2 || !last2.hasConversion) {
            return 100000;
        }
    }
    else if (hasRest2 && last2 && last2.hasConversion) {
        return -1e5;
    }
    // 4) Minimize the number of conversions
    if (conv1 !== conv2) {
        return (conv1 - conv2) * 10000;
    }
    // 5) Prefer no rest param
    if (hasRest1) {
        if (!hasRest2) {
            return 1000;
        }
    }
    else if (hasRest2) {
        return -1e3;
    }
    // 6) Prefer shorter with rest param, longer without
    const lengthCriterion = (pars1.length - pars2.length) * (hasRest1 ? -100 : 100);
    if (lengthCriterion !== 0) {
        return lengthCriterion;
    }
    // Signatures are identical in the above metrics and same length
    // Compare parameters one by one
    const comparisons = [];
    let tc = 0;
    for (let i = 0; i < pars1.length; i++) {
        const p1 = pars1[i];
        const p2 = pars2[i];
        if (p1 && p2) {
            const thisComparison = compareParams(p1, p2, maxTypeIndex, maxConversionIndex);
            comparisons.push(thisComparison);
            tc += thisComparison;
        }
    }
    if (tc !== 0) {
        return (tc < 0 ? -10 : 10) + tc;
    }
    // Same number of preferred params, go by earliest difference
    let bonus = 9;
    const decrement = bonus / (comparisons.length + 1);
    for (const c of comparisons) {
        if (c !== 0) {
            return (c < 0 ? -bonus : bonus) + c;
        }
        bonus -= decrement;
    }
    // It's a tossup
    return 0;
}
/**
 * Get the set of type names at a specific index in a params array
 */
function getTypeSetAtIndex(params, index) {
    let param;
    if (index < params.length) {
        param = params[index];
    }
    else if (hasRestParam(params)) {
        param = last(params);
    }
    if (!param) {
        return new Set();
    }
    // Use cached typeSet if available
    if (param.typeSet) {
        return param.typeSet;
    }
    const typeSet = new Set();
    for (const type of param.types) {
        typeSet.add(type.name);
    }
    param.typeSet = typeSet;
    return typeSet;
}
/**
 * Test whether two param lists represent conflicting signatures
 *
 * Signatures conflict if they could both match the same argument list.
 *
 * @param params1 - First parameter list
 * @param params2 - Second parameter list
 * @returns true if the signatures conflict
 */
function conflicting(params1, params2) {
    const maxLen = Math.max(params1.length, params2.length);
    // Check each position for type overlap
    for (let i = 0; i < maxLen; i++) {
        const typeSet1 = getTypeSetAtIndex(params1, i);
        const typeSet2 = getTypeSetAtIndex(params2, i);
        // Check if there's any overlap between the type sets
        let overlap = false;
        for (const name of typeSet2) {
            if (typeSet1.has(name)) {
                overlap = true;
                break;
            }
        }
        if (!overlap) {
            return false; // No conflict at this position
        }
    }
    // All positions have overlapping types, check length compatibility
    const len1 = params1.length;
    const len2 = params2.length;
    const restParam1 = hasRestParam(params1);
    const restParam2 = hasRestParam(params2);
    if (restParam1) {
        return restParam2 ? len1 === len2 : len2 >= len1;
    }
    else {
        return restParam2 ? len1 >= len2 : len1 === len2;
    }
}
/**
 * Create a signature comparator function for sorting
 *
 * @param maxTypeIndex - Maximum type index in registry
 * @param maxConversionIndex - Maximum conversion index
 * @returns A comparator function for Array.sort
 */
function createSignatureComparator(maxTypeIndex, maxConversionIndex) {
    return (a, b) => compareSignatures(a, b, maxTypeIndex, maxConversionIndex);
}

/**
 * Conversion Manager Module for typed-function
 *
 * This module handles registration, removal, and lookup of type conversions.
 */
/**
 * Conversion Manager class for managing type conversions
 */
class ConversionManager {
    /**
     * Create a new ConversionManager
     *
     * @param registry - The type registry to use
     */
    constructor(registry) {
        /** Counter for conversion indices */
        this.nConversions = 0;
        this.registry = registry;
    }
    /**
     * Get the current number of registered conversions
     */
    get conversionCount() {
        return this.nConversions;
    }
    /**
     * Validate a conversion definition
     *
     * @param conversion - The conversion to validate
     * @throws TypeError if the conversion is invalid
     * @throws SyntaxError if converting to self
     */
    validateConversion(conversion) {
        if (!conversion ||
            typeof conversion.from !== 'string' ||
            typeof conversion.to !== 'string' ||
            typeof conversion.convert !== 'function') {
            throw new TypeError('Object with properties {from: string, to: string, convert: function} expected');
        }
        if (conversion.to === conversion.from) {
            throw new SyntaxError(`Illegal to define conversion from "${conversion.from}" to itself.`);
        }
    }
    /**
     * Add a type conversion
     *
     * @param conversion - The conversion to add
     * @param options - Options (override: boolean)
     * @throws TypeError if the conversion is invalid
     * @throws Error if a conversion already exists (unless override is true)
     */
    addConversion(conversion, options = { override: false }) {
        this.validateConversion(conversion);
        // Verify types exist
        this.registry.findType(conversion.from);
        const toType = this.registry.findType(conversion.to);
        // Check for existing conversion
        const existing = toType.conversionsTo.find((other) => other.from === conversion.from);
        if (existing) {
            if (options.override) {
                this.removeConversion({
                    from: existing.from,
                    to: conversion.to,
                    convert: existing.convert,
                });
            }
            else {
                throw new Error(`There is already a conversion from "${conversion.from}" to "${toType.name}"`);
            }
        }
        // Add the conversion
        toType.conversionsTo.push({
            from: conversion.from,
            to: toType.name,
            convert: conversion.convert,
            index: this.nConversions++,
        });
    }
    /**
     * Add multiple conversions
     *
     * @param conversions - Array of conversions to add
     * @param options - Options (override: boolean)
     */
    addConversions(conversions, options) {
        for (const conversion of conversions) {
            this.addConversion(conversion, options);
        }
    }
    /**
     * Remove a conversion
     *
     * The convert function must match the existing conversion.
     *
     * @param conversion - The conversion to remove
     * @throws Error if the conversion doesn't exist or doesn't match
     */
    removeConversion(conversion) {
        this.validateConversion(conversion);
        const toType = this.registry.findType(conversion.to);
        const existingConversion = findInArray(toType.conversionsTo, (c) => c.from === conversion.from);
        if (!existingConversion) {
            throw new Error(`Attempt to remove nonexistent conversion from ${conversion.from} to ${conversion.to}`);
        }
        if (existingConversion.convert !== conversion.convert) {
            throw new Error('Conversion to remove does not match existing conversion');
        }
        const index = toType.conversionsTo.indexOf(existingConversion);
        toType.conversionsTo.splice(index, 1);
    }
    /**
     * Clear all conversions
     */
    clearConversions() {
        this.registry.clearConversions();
        this.nConversions = 0;
    }
    /**
     * Get all conversions to a specific type
     *
     * @param typeName - The target type name
     * @returns Array of conversions to this type
     */
    getConversionsTo(typeName) {
        const type = this.registry.findType(typeName);
        return [...type.conversionsTo];
    }
    /**
     * Get conversions available to convert to any of the given types
     *
     * Returns the lowest-index conversion for each source type.
     *
     * @param typeNames - Target type names
     * @returns Array of available conversions
     */
    availableConversions(typeNames) {
        if (typeNames.length === 0) {
            return [];
        }
        const types = typeNames.map((name) => this.registry.findType(name));
        if (typeNames.length === 1) {
            const type = types[0];
            return type ? [...type.conversionsTo] : [];
        }
        // For multiple types, find the lowest-index conversion for each source type
        const knownTypes = new Set(typeNames);
        const convertibleTypes = new Set();
        for (const type of types) {
            if (!type)
                continue;
            for (const match of type.conversionsTo) {
                if (!knownTypes.has(match.from)) {
                    convertibleTypes.add(match.from);
                }
            }
        }
        // Get the lowest-index conversion for each convertible type
        const matches = [];
        for (const typeName of convertibleTypes) {
            let bestIndex = this.nConversions + 1;
            let bestConversion = null;
            for (const type of types) {
                if (!type)
                    continue;
                for (const match of type.conversionsTo) {
                    if (match.from === typeName && match.index !== undefined && match.index < bestIndex) {
                        bestIndex = match.index;
                        bestConversion = match;
                    }
                }
            }
            if (bestConversion) {
                matches.push(bestConversion);
            }
        }
        return matches;
    }
    /**
     * Convert a value to a specified type
     *
     * @param value - The value to convert
     * @param typeName - The target type name
     * @returns The converted value
     * @throws Error if no conversion is available
     */
    convert(value, typeName) {
        const type = this.registry.findType(typeName);
        // Check if value already matches
        if (type.test(value)) {
            return value;
        }
        const conversions = type.conversionsTo;
        if (conversions.length === 0) {
            throw new Error(`There are no conversions to ${typeName} defined.`);
        }
        // Find a matching conversion
        for (const conversion of conversions) {
            const fromType = this.registry.findType(conversion.from);
            if (fromType.test(value)) {
                return conversion.convert(value);
            }
        }
        throw new Error(`Cannot convert ${value} to ${typeName}`);
    }
}
/**
 * Create a new ConversionManager
 *
 * @param registry - The type registry to use
 * @returns A new ConversionManager instance
 */
function createConversionManager(registry) {
    return new ConversionManager(registry);
}

/**
 * Reference Resolver for typed-function
 *
 * Handles typed.referTo() and typed.referToSelf() resolution
 * with circular reference detection.
 */
/**
 * Check if an object is a referTo reference
 */
function isReferTo(objectOrFn) {
    return (objectOrFn !== null &&
        typeof objectOrFn === 'object' &&
        'referTo' in objectOrFn &&
        typeof objectOrFn.referTo === 'object' &&
        Array.isArray(objectOrFn.referTo.references) &&
        typeof objectOrFn.referTo.callback === 'function');
}
/**
 * Check if an object is a referToSelf reference
 */
function isReferToSelf(objectOrFn) {
    return (objectOrFn !== null &&
        typeof objectOrFn === 'object' &&
        'referToSelf' in objectOrFn &&
        typeof objectOrFn.referToSelf === 'object' &&
        typeof objectOrFn.referToSelf.callback === 'function');
}
/**
 * Create a referTo reference object
 *
 * @param references - Array of signature strings to reference
 * @param callback - Callback that receives the resolved functions
 * @returns ReferTo object
 */
function makeReferTo(references, callback) {
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
function makeReferToSelf(callback) {
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
function clearResolutions(functionList) {
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
function collectResolutions(references, functionList, signatureMap) {
    const resolvedReferences = [];
    for (const reference of references) {
        const resolution = signatureMap[reference];
        if (typeof resolution !== 'number') {
            throw new TypeError(`No definition for referenced signature "${reference}"`);
        }
        const resolved = functionList[resolution];
        if (typeof resolved !== 'function') {
            return null; // Not yet resolved
        }
        resolvedReferences.push(resolved);
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
function resolveReferences(functionList, signatureMap, self) {
    const resolvedFunctions = clearResolutions(functionList);
    const isResolved = new Array(resolvedFunctions.length).fill(false);
    let leftUnresolved = true;
    while (leftUnresolved) {
        leftUnresolved = false;
        let nothingResolved = true;
        for (let i = 0; i < resolvedFunctions.length; i++) {
            if (isResolved[i])
                continue;
            const fn = resolvedFunctions[i];
            if (isReferToSelf(fn)) {
                // Resolve referToSelf
                const resolved = fn.referToSelf.callback(self);
                // Preserve reference in case signature is reused someday
                resolved.referToSelf =
                    fn.referToSelf;
                resolvedFunctions[i] = resolved;
                isResolved[i] = true;
                nothingResolved = false;
            }
            else if (isReferTo(fn)) {
                // Try to resolve referTo
                const resolvedReferences = collectResolutions(fn.referTo.references, resolvedFunctions, signatureMap);
                if (resolvedReferences) {
                    const resolved = fn.referTo.callback(...resolvedReferences);
                    // Preserve reference in case signature is reused someday
                    resolved.referTo = fn.referTo;
                    resolvedFunctions[i] = resolved;
                    isResolved[i] = true;
                    nothingResolved = false;
                }
                else {
                    leftUnresolved = true;
                }
            }
            else {
                // Already a function
                isResolved[i] = true;
            }
        }
        if (nothingResolved && leftUnresolved) {
            throw new SyntaxError('Circular reference detected in resolving typed.referTo');
        }
    }
    return resolvedFunctions;
}
/**
 * Validate that function bodies don't use deprecated this-reference pattern
 *
 * @param signaturesMap - Map of signatures to functions
 * @throws SyntaxError if deprecated this usage is detected
 */
function validateDeprecatedThis(signaturesMap) {
    // Match occurrences like 'this(' and 'this.signatures'
    const deprecatedThisRegex = /\bthis(\(|\.signatures\b)/;
    for (const signature in signaturesMap) {
        if (Object.prototype.hasOwnProperty.call(signaturesMap, signature)) {
            const fn = signaturesMap[signature];
            if (fn && deprecatedThisRegex.test(fn.toString())) {
                throw new SyntaxError('Using `this` to self-reference a function ' +
                    'is deprecated since typed-function@3. ' +
                    'Use typed.referTo and typed.referToSelf instead.');
            }
        }
    }
}

/**
 * Fast-Path Dispatcher for typed-function
 *
 * Implements optimized dispatch for up to 10 signatures with max 3 arguments.
 * Falls back to generic dispatcher for more complex cases.
 */
/** Maximum number of fast-path signature slots */
const FAST_PATH_SLOT_COUNT = 10;
/** Maximum number of parameters supported in fast-path */
const FAST_PATH_MAX_PARAMS = 3;
/**
 * Helper that always returns true (for empty/any param)
 */
function ok() {
    return true;
}
/**
 * Helper that always returns false (for disabled slots)
 */
function notOk() {
    return false;
}
/**
 * Helper that always returns undefined (for disabled function slots)
 */
function undef() {
    return undefined;
}
/**
 * Check if a signature is eligible for fast-path dispatch
 * (max 3 parameters, no rest param)
 */
function isFastPathEligible(signature) {
    return signature.params.length <= FAST_PATH_MAX_PARAMS && !hasRestParam(signature.params);
}
/**
 * Create a simple test function for a parameter (without registry)
 */
function createSimpleTest(param) {
    if (param.types.length === 0 || param.hasAny) {
        return ok;
    }
    if (param.types.length === 1) {
        const firstType = param.types[0];
        return firstType ? firstType.test : ok;
    }
    const tests = param.types.map(t => t.test);
    return (x) => {
        for (const test of tests) {
            if (test(x))
                return true;
        }
        return false;
    };
}
/**
 * Create a fast-path slot for a signature
 */
function createFastPathSlot(signature, registry) {
    const params = signature.params;
    let test0;
    let test1;
    let test2;
    if (registry) {
        test0 = params[0] ? compileTest(params[0], registry) : ok;
        test1 = params[1] ? compileTest(params[1], registry) : ok;
        test2 = params[2] ? compileTest(params[2], registry) : ok;
    }
    else {
        test0 = params[0] ? createSimpleTest(params[0]) : ok;
        test1 = params[1] ? createSimpleTest(params[1]) : ok;
        test2 = params[2] ? createSimpleTest(params[2]) : ok;
    }
    return {
        test0,
        test1,
        test2,
        length: params.length,
        fn: signature.implementation,
        active: true,
    };
}
/**
 * Create an inactive (disabled) fast-path slot
 */
function createInactiveSlot() {
    return {
        test0: notOk,
        test1: notOk,
        test2: notOk,
        length: -1,
        fn: undef,
        active: false,
    };
}
/**
 * Create fast-path dispatcher data for a list of signatures
 *
 * @param signatures - The sorted signatures array
 * @returns Fast-path dispatcher data
 */
function createFastPathDispatcher(signatures) {
    const slots = [];
    let allActive = true;
    // Create slots for first 10 signatures
    for (let i = 0; i < FAST_PATH_SLOT_COUNT; i++) {
        const sig = signatures[i];
        if (sig && isFastPathEligible(sig) && sig.implementation) {
            slots.push(createFastPathSlot(sig));
        }
        else {
            slots.push(createInactiveSlot());
            allActive = false;
        }
    }
    return {
        slots,
        allActive,
        genericStartIndex: allActive ? FAST_PATH_SLOT_COUNT : 0,
    };
}
/**
 * Create the fast-path dispatch function
 *
 * This returns a function that tries fast-path dispatch for the first 10 signatures,
 * then falls back to the generic dispatcher.
 *
 * @param name - Function name for error messages
 * @param signatures - The sorted signatures array
 * @param genericDispatch - Generic dispatcher to fall back to
 * @param _onMismatch - Handler for when no signature matches (handled by generic)
 * @returns The typed function dispatcher
 */
function createDispatcher(name, signatures, genericDispatch, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_onMismatch) {
    const fp = createFastPathDispatcher(signatures);
    // Extract slot data for closure optimization - 10 slots
    const slot0 = fp.slots[0] || createInactiveSlot();
    const slot1 = fp.slots[1] || createInactiveSlot();
    const slot2 = fp.slots[2] || createInactiveSlot();
    const slot3 = fp.slots[3] || createInactiveSlot();
    const slot4 = fp.slots[4] || createInactiveSlot();
    const slot5 = fp.slots[5] || createInactiveSlot();
    const slot6 = fp.slots[6] || createInactiveSlot();
    const slot7 = fp.slots[7] || createInactiveSlot();
    const slot8 = fp.slots[8] || createInactiveSlot();
    const slot9 = fp.slots[9] || createInactiveSlot();
    // Test functions for each slot (3 params each)
    const test00 = slot0.test0;
    const test01 = slot0.test1;
    const test02 = slot0.test2;
    const test10 = slot1.test0;
    const test11 = slot1.test1;
    const test12 = slot1.test2;
    const test20 = slot2.test0;
    const test21 = slot2.test1;
    const test22 = slot2.test2;
    const test30 = slot3.test0;
    const test31 = slot3.test1;
    const test32 = slot3.test2;
    const test40 = slot4.test0;
    const test41 = slot4.test1;
    const test42 = slot4.test2;
    const test50 = slot5.test0;
    const test51 = slot5.test1;
    const test52 = slot5.test2;
    const test60 = slot6.test0;
    const test61 = slot6.test1;
    const test62 = slot6.test2;
    const test70 = slot7.test0;
    const test71 = slot7.test1;
    const test72 = slot7.test2;
    const test80 = slot8.test0;
    const test81 = slot8.test1;
    const test82 = slot8.test2;
    const test90 = slot9.test0;
    const test91 = slot9.test1;
    const test92 = slot9.test2;
    // Implementation functions
    const fn0 = slot0.fn;
    const fn1 = slot1.fn;
    const fn2 = slot2.fn;
    const fn3 = slot3.fn;
    const fn4 = slot4.fn;
    const fn5 = slot5.fn;
    const fn6 = slot6.fn;
    const fn7 = slot7.fn;
    const fn8 = slot8.fn;
    const fn9 = slot9.fn;
    // Expected argument lengths
    const len0 = slot0.length;
    const len1 = slot1.length;
    const len2 = slot2.length;
    const len3 = slot3.length;
    const len4 = slot4.length;
    const len5 = slot5.length;
    const len6 = slot6.length;
    const len7 = slot7.length;
    const len8 = slot8.length;
    const len9 = slot9.length;
    // Create the typed function with fast-path dispatch
    function theTypedFn(arg0, arg1, arg2) {
        const argc = arguments.length;
        // Fast path checks for first 10 signatures (with 3-param support)
        if (argc === len0 && test00(arg0) && test01(arg1) && test02(arg2)) {
            return fn0.apply(this, arguments);
        }
        if (argc === len1 && test10(arg0) && test11(arg1) && test12(arg2)) {
            return fn1.apply(this, arguments);
        }
        if (argc === len2 && test20(arg0) && test21(arg1) && test22(arg2)) {
            return fn2.apply(this, arguments);
        }
        if (argc === len3 && test30(arg0) && test31(arg1) && test32(arg2)) {
            return fn3.apply(this, arguments);
        }
        if (argc === len4 && test40(arg0) && test41(arg1) && test42(arg2)) {
            return fn4.apply(this, arguments);
        }
        if (argc === len5 && test50(arg0) && test51(arg1) && test52(arg2)) {
            return fn5.apply(this, arguments);
        }
        if (argc === len6 && test60(arg0) && test61(arg1) && test62(arg2)) {
            return fn6.apply(this, arguments);
        }
        if (argc === len7 && test70(arg0) && test71(arg1) && test72(arg2)) {
            return fn7.apply(this, arguments);
        }
        if (argc === len8 && test80(arg0) && test81(arg1) && test82(arg2)) {
            return fn8.apply(this, arguments);
        }
        if (argc === len9 && test90(arg0) && test91(arg1) && test92(arg2)) {
            return fn9.apply(this, arguments);
        }
        // Fall back to generic dispatch
        return genericDispatch(arguments, this);
    }
    // Set the function name
    try {
        Object.defineProperty(theTypedFn, 'name', { value: name });
    }
    catch {
        // Some environments don't support setting function name
    }
    return theTypedFn;
}
/**
 * Compile test functions for all signatures
 *
 * @param signatures - Array of signatures to compile tests for
 * @param registry - The type registry
 */
function compileSignatureTests(signatures, registry) {
    for (const sig of signatures) {
        if (!sig.test) {
            sig.test = compileTests(sig.params, registry);
        }
    }
}

/**
 * Generic Dispatcher for typed-function
 *
 * Fallback loop dispatcher for signatures beyond fast-path,
 * with onMismatch handler integration.
 */
/**
 * Create a generic dispatcher that iterates through all signatures
 *
 * @param name - Function name for error messages
 * @param signatures - Array of signatures to check
 * @param startIndex - Index to start iteration from (for fast-path integration)
 * @param onMismatch - Handler called when no signature matches
 * @returns Generic dispatch function
 */
function createGenericDispatcher(name, signatures, startIndex, onMismatch) {
    const iStart = startIndex;
    const iEnd = signatures.length;
    // Pre-dereference for execution speed, filtering out null/undefined
    const tests = [];
    const fns = [];
    for (const s of signatures) {
        if (s.test && s.implementation) {
            tests.push(s.test);
            fns.push(s.implementation);
        }
    }
    return function generic(args, context) {
        const argsArray = Array.prototype.slice.call(args);
        for (let i = iStart; i < iEnd; i++) {
            const test = tests[i];
            const fn = fns[i];
            if (test && fn && test(argsArray)) {
                return fn.apply(context, args);
            }
        }
        return onMismatch(name, argsArray, signatures);
    };
}
/**
 * Create a simple dispatcher that only uses the generic path
 * (no fast-path optimization)
 *
 * @param name - Function name for error messages
 * @param signatures - Array of signatures to check
 * @param onMismatch - Handler called when no signature matches
 * @returns Dispatch function
 */
function createSimpleDispatcher(name, signatures, onMismatch) {
    // Pre-dereference for execution speed, filtering out null/undefined
    const tests = [];
    const fns = [];
    for (const s of signatures) {
        if (s.test && s.implementation) {
            tests.push(s.test);
            fns.push(s.implementation);
        }
    }
    const len = tests.length;
    const dispatcher = function () {
        const args = Array.prototype.slice.call(arguments);
        for (let i = 0; i < len; i++) {
            const test = tests[i];
            const fn = fns[i];
            if (test && fn && test(args)) {
                return fn.apply(this, args);
            }
        }
        return onMismatch(name, args, signatures);
    };
    try {
        Object.defineProperty(dispatcher, 'name', { value: name });
    }
    catch {
        // Some environments don't support setting function name
    }
    return dispatcher;
}
/**
 * Check if all signatures have compiled test functions
 */
function hasCompiledTests(signatures) {
    return signatures.every((s) => typeof s.test === 'function');
}
/**
 * Check if all signatures have implementation functions
 */
function hasImplementations(signatures) {
    return signatures.every((s) => typeof s.implementation === 'function');
}

/**
 * JS-WASM Bridge for typed-function dispatch
 *
 * TypeScript bindings for the WASM dispatch module.
 * Provides type-safe access to WASM functions.
 */
/** Global WASM dispatch state */
const wasmState = {
    initialized: false,
    exports: null,
    functionTable: [],
    initError: null,
};
/** Sentinel value for no match (must match WASM) */
const NO_MATCH = 0xffffffff;
/**
 * Initialize WASM module with given exports
 *
 * @param exports - WASM module exports
 */
function initWasm(exports) {
    wasmState.exports = exports;
    wasmState.functionTable = [];
    wasmState.initError = null;
    wasmState.initialized = true;
    // Initialize built-in types
    exports.initBuiltinTypes();
}
/**
 * Check if WASM is available and initialized
 */
function isWasmAvailable() {
    return wasmState.initialized && wasmState.exports !== null;
}
/**
 * Get WASM exports (throws if not initialized)
 */
function getWasmExports() {
    if (!wasmState.exports) {
        throw new WasmNotAvailableError('WASM module not initialized. Call loadWasm() first.');
    }
    return wasmState.exports;
}
/**
 * Reset WASM state (for testing)
 */
function resetWasm() {
    if (wasmState.exports) {
        wasmState.exports.clearMemory();
        wasmState.exports.clearCache();
    }
    wasmState.functionTable = [];
}
/**
 * Add a signature to WASM dispatch
 *
 * @param fn - The function to dispatch to
 * @param paramMasks - Array of type masks for each parameter
 * @returns The signature index
 */
function wasmAddSignature(fn, paramMasks) {
    const exports = getWasmExports();
    // Add function to table
    const fnIndex = wasmState.functionTable.length;
    wasmState.functionTable.push(fn);
    // Add signature to WASM
    const sigIndex = exports.addSignature(fnIndex, paramMasks.length);
    if (sigIndex === NO_MATCH) {
        throw new WasmInitializationError('Failed to add signature to WASM dispatch table');
    }
    // Set parameter masks
    for (let i = 0; i < paramMasks.length; i++) {
        const mask = paramMasks[i];
        if (mask !== undefined) {
            exports.setParamMask(sigIndex, i, mask);
        }
    }
    return sigIndex;
}

/**
 * Type Mask Assignment for typed-function dispatch
 *
 * Maps JavaScript type checks to bit masks for WASM dispatch.
 */
// === Built-in Type IDs (must match WASM) ===
/** Type ID for number */
const TYPE_NUMBER = 0;
/** Type ID for string */
const TYPE_STRING = 1;
/** Type ID for boolean */
const TYPE_BOOLEAN = 2;
/** Type ID for Function */
const TYPE_FUNCTION = 3;
/** Type ID for Array */
const TYPE_ARRAY = 4;
/** Type ID for Date */
const TYPE_DATE = 5;
/** Type ID for RegExp */
const TYPE_REGEXP = 6;
/** Type ID for Object */
const TYPE_OBJECT = 7;
/** Type ID for null */
const TYPE_NULL = 8;
/** Type ID for undefined */
const TYPE_UNDEFINED = 9;
// === Modern Type IDs (ES6+) ===
/** Type ID for BigInt */
const TYPE_BIGINT = 10;
/** Type ID for Symbol */
const TYPE_SYMBOL$1 = 11;
/** Type ID for Map */
const TYPE_MAP = 12;
/** Type ID for Set */
const TYPE_SET = 13;
/** Type ID for WeakMap */
const TYPE_WEAKMAP = 14;
/** Type ID for WeakSet */
const TYPE_WEAKSET = 15;
/** Mask for any type (matches all) */
const TYPE_ANY_MASK = 0xffffffff;
/** Next available custom type ID */
let nextCustomTypeId = 16;
/** Map from type name to bit */
const typeNameToBit = new Map([
    ['number', TYPE_NUMBER],
    ['string', TYPE_STRING],
    ['boolean', TYPE_BOOLEAN],
    ['Function', TYPE_FUNCTION],
    ['Array', TYPE_ARRAY],
    ['Date', TYPE_DATE],
    ['RegExp', TYPE_REGEXP],
    ['Object', TYPE_OBJECT],
    ['null', TYPE_NULL],
    ['undefined', TYPE_UNDEFINED],
    // Modern types (ES6+)
    ['BigInt', TYPE_BIGINT],
    ['Symbol', TYPE_SYMBOL$1],
    ['Map', TYPE_MAP],
    ['Set', TYPE_SET],
    ['WeakMap', TYPE_WEAKMAP],
    ['WeakSet', TYPE_WEAKSET],
    ['any', -1], // Special marker for any
]);
/**
 * Get the type bit for a type name
 *
 * @param typeName - The type name
 * @returns The type bit position
 */
function getTypeBit(typeName) {
    const existing = typeNameToBit.get(typeName);
    if (existing !== undefined) {
        return existing;
    }
    // Assign new bit for custom type
    const bit = nextCustomTypeId++;
    typeNameToBit.set(typeName, bit);
    return bit;
}
/**
 * Get the type mask for a type name
 *
 * @param typeName - The type name
 * @returns The type mask (1 << bit for single types, or ANY_MASK for 'any')
 */
function getTypeMaskForName(typeName) {
    const bit = getTypeBit(typeName);
    if (bit === -1) {
        return TYPE_ANY_MASK;
    }
    return 1 << bit;
}
/**
 * Get combined mask for a parameter's types
 *
 * @param typeNames - Array of type names that the parameter accepts
 * @returns Combined mask (OR of all type masks)
 */
function getParamMask(typeNames) {
    if (typeNames.length === 0) {
        return TYPE_ANY_MASK;
    }
    let mask = 0;
    for (const name of typeNames) {
        const typeMask = getTypeMaskForName(name);
        if (typeMask === TYPE_ANY_MASK) {
            return TYPE_ANY_MASK;
        }
        mask |= typeMask;
    }
    return mask;
}
/**
 * Register a custom type with its test function
 *
 * @param typeName - The type name
 * @returns The assigned type bit
 */
function registerCustomType(typeName) {
    return getTypeBit(typeName);
}
// =============================================================================
// Pre-built Type Masks for Common Patterns
// =============================================================================
/**
 * Pre-built type masks for common type patterns
 * These combine multiple types into a single mask for efficient dispatch
 */
const TypeMasks = {
    // Numeric types
    /** Matches number only */
    NUMBER: 1 << TYPE_NUMBER,
    /** Matches string only */
    STRING: 1 << TYPE_STRING,
    /** Matches boolean only */
    BOOLEAN: 1 << TYPE_BOOLEAN,
    /** Matches number | string (common for math operations) */
    NUMERIC_OR_STRING: (1 << TYPE_NUMBER) | (1 << TYPE_STRING),
    /** Matches number | boolean (truthy/falsy conversions) */
    NUMERIC_OR_BOOLEAN: (1 << TYPE_NUMBER) | (1 << TYPE_BOOLEAN),
    // Collection types
    /** Matches Array only */
    ARRAY: 1 << TYPE_ARRAY,
    /** Matches Object only (plain objects) */
    OBJECT: 1 << TYPE_OBJECT,
    /** Matches Array | Object (collection-like) */
    ARRAY_LIKE: (1 << TYPE_ARRAY) | (1 << TYPE_OBJECT),
    /** Matches iterable types: Array | string | Object */
    ITERABLE: (1 << TYPE_ARRAY) | (1 << TYPE_STRING) | (1 << TYPE_OBJECT),
    // Function types
    /** Matches Function only */
    FUNCTION: 1 << TYPE_FUNCTION,
    /** Matches Function | null (optional callback) */
    OPTIONAL_FUNCTION: (1 << TYPE_FUNCTION) | (1 << TYPE_NULL),
    // Special object types
    /** Matches Date only */
    DATE: 1 << TYPE_DATE,
    /** Matches RegExp only */
    REGEXP: 1 << TYPE_REGEXP,
    /** Matches Date | string (parseable dates) */
    DATE_LIKE: (1 << TYPE_DATE) | (1 << TYPE_STRING) | (1 << TYPE_NUMBER),
    // Nullable patterns
    /** Matches null only */
    NULL: 1 << TYPE_NULL,
    /** Matches undefined only */
    UNDEFINED: 1 << TYPE_UNDEFINED,
    /** Matches null | undefined (nullish) */
    NULLISH: (1 << TYPE_NULL) | (1 << TYPE_UNDEFINED),
    /** Matches any primitive: number | string | boolean | null | undefined */
    PRIMITIVE: (1 << TYPE_NUMBER) | (1 << TYPE_STRING) | (1 << TYPE_BOOLEAN) | (1 << TYPE_NULL) | (1 << TYPE_UNDEFINED),
    /** Matches any scalar: number | string | boolean */
    SCALAR: (1 << TYPE_NUMBER) | (1 << TYPE_STRING) | (1 << TYPE_BOOLEAN),
    // Optional patterns (type | null | undefined)
    /** Optional number */
    OPTIONAL_NUMBER: (1 << TYPE_NUMBER) | (1 << TYPE_NULL) | (1 << TYPE_UNDEFINED),
    /** Optional string */
    OPTIONAL_STRING: (1 << TYPE_STRING) | (1 << TYPE_NULL) | (1 << TYPE_UNDEFINED),
    /** Optional boolean */
    OPTIONAL_BOOLEAN: (1 << TYPE_BOOLEAN) | (1 << TYPE_NULL) | (1 << TYPE_UNDEFINED),
    /** Optional array */
    OPTIONAL_ARRAY: (1 << TYPE_ARRAY) | (1 << TYPE_NULL) | (1 << TYPE_UNDEFINED),
    /** Optional object */
    OPTIONAL_OBJECT: (1 << TYPE_OBJECT) | (1 << TYPE_NULL) | (1 << TYPE_UNDEFINED),
    // Object type patterns
    /** Matches any object type: Object | Array | Date | RegExp | Function */
    ANY_OBJECT: (1 << TYPE_OBJECT) | (1 << TYPE_ARRAY) | (1 << TYPE_DATE) | (1 << TYPE_REGEXP) | (1 << TYPE_FUNCTION),
    /** Matches all types (same as any) */
    ANY: TYPE_ANY_MASK,
    // === Modern Types (ES6+) ===
    /** Matches BigInt only */
    BIGINT: 1 << TYPE_BIGINT,
    /** Matches Symbol only */
    SYMBOL: 1 << TYPE_SYMBOL$1,
    /** Matches Map only */
    MAP: 1 << TYPE_MAP,
    /** Matches Set only */
    SET: 1 << TYPE_SET,
    /** Matches WeakMap only */
    WEAKMAP: 1 << TYPE_WEAKMAP,
    /** Matches WeakSet only */
    WEAKSET: 1 << TYPE_WEAKSET,
    /** Matches number | BigInt (numeric types) */
    NUMERIC: (1 << TYPE_NUMBER) | (1 << TYPE_BIGINT),
    /** Matches Map | Set (collection types) */
    COLLECTION: (1 << TYPE_MAP) | (1 << TYPE_SET),
    /** Matches WeakMap | WeakSet (weak collection types) */
    WEAK_COLLECTION: (1 << TYPE_WEAKMAP) | (1 << TYPE_WEAKSET),
    /** Matches all collection types: Array | Map | Set */
    ANY_COLLECTION: (1 << TYPE_ARRAY) | (1 << TYPE_MAP) | (1 << TYPE_SET),
    /** Matches all iterable types: Array | Map | Set | string */
    ALL_ITERABLE: (1 << TYPE_ARRAY) | (1 << TYPE_MAP) | (1 << TYPE_SET) | (1 << TYPE_STRING),
};
/**
 * Create a custom type mask by combining type names
 *
 * @param typeNames - Array of type names to combine
 * @returns Combined mask
 *
 * @example
 * ```ts
 * const numericMask = createMask(['number', 'string', 'boolean']);
 * ```
 */
function createMask(typeNames) {
    return getParamMask(typeNames);
}
/**
 * Create an optional mask (type | null | undefined)
 *
 * @param baseMask - The base type mask
 * @returns Mask with null and undefined added
 */
function optionalMask(baseMask) {
    return baseMask | (1 << TYPE_NULL) | (1 << TYPE_UNDEFINED);
}
/**
 * Create a nullable mask (type | null)
 *
 * @param baseMask - The base type mask
 * @returns Mask with null added
 */
function nullableMask(baseMask) {
    return baseMask | (1 << TYPE_NULL);
}
/**
 * Combine multiple masks with OR
 *
 * @param masks - Masks to combine
 * @returns Combined mask
 */
function combineMasks(...masks) {
    let result = 0;
    for (const mask of masks) {
        result |= mask;
    }
    return result;
}

/**
 * Main Typed Function Builder for typed-function
 *
 * Creates typed functions with signature parsing, conflict detection,
 * sorting, compilation, and dispatcher creation.
 */
/**
 * Create a typed function from a signature map
 *
 * @param name - Name of the typed function
 * @param rawSignaturesMap - Map of signature strings to functions
 * @param options - Creation options
 * @returns The created typed function
 */
function createTypedFunction(name, rawSignaturesMap, options) {
    const { registry, conversions, warnAgainstDeprecatedThis = true, useWasm = false } = options;
    // Create a wrapper that dynamically calls options.onMismatch
    // This allows the handler to be changed after function creation
    const onMismatch = (fnName, args, sigs) => options.onMismatch(fnName, args, sigs);
    if (Object.keys(rawSignaturesMap).length === 0) {
        throw new SyntaxError('No signatures provided');
    }
    if (warnAgainstDeprecatedThis) {
        validateDeprecatedThis(rawSignaturesMap);
    }
    // Main processing loop for signatures
    const parsedParams = [];
    const originalFunctions = [];
    const signaturesMap = {};
    const preliminarySignatures = [];
    for (const signature in rawSignaturesMap) {
        // Protect against polluted Object prototype
        if (!Object.prototype.hasOwnProperty.call(rawSignaturesMap, signature)) {
            continue;
        }
        // Parse the signature
        const params = parseSignature(signature, registry);
        if (!params)
            continue;
        // Check for conflicts
        for (const pp of parsedParams) {
            if (conflicting(pp, params)) {
                throw new TypeError(`Conflicting signatures "${stringifyParams(pp)}" and "${stringifyParams(params)}".`);
            }
        }
        parsedParams.push(params);
        // Store the provided function and add conversions
        const functionIndex = originalFunctions.length;
        const rawFn = rawSignaturesMap[signature];
        if (rawFn !== undefined) {
            originalFunctions.push(rawFn);
        }
        // Expand params with conversions
        const conversionParams = params.map((p) => expandParam(p, registry));
        // Split the signatures and collect them
        for (const sp of splitParams(conversionParams)) {
            const spName = stringifyParams(sp);
            preliminarySignatures.push({
                params: sp,
                name: spName,
                fn: functionIndex,
            });
            // Only map exact (non-conversion) signatures
            if (sp.every((p) => !p.hasConversion)) {
                signaturesMap[spName] = functionIndex;
            }
        }
    }
    // Sort signatures by priority
    const maxTypeIndex = registry.typeCount - 1;
    const maxConversionIndex = conversions.conversionCount;
    preliminarySignatures.sort((a, b) => compareSignatures(a, b, maxTypeIndex, maxConversionIndex));
    // PublicSignaturesMap will be filled after reference resolution
    const publicSignaturesMap = {};
    // Build final signatures array
    const signatures = [];
    const internalSignatureMap = new Map();
    for (const s of preliminarySignatures) {
        // Only add unique signatures (after sorting, duplicates from conversions are eliminated)
        if (!internalSignatureMap.has(s.name)) {
            // Initially, fn will be null - it's filled in after reference resolution
            const signature = {
                params: s.params,
                fn: null,
                test: null,
                implementation: null,
            };
            signatures.push(signature);
            internalSignatureMap.set(s.name, signature);
        }
    }
    // Compile test functions
    compileSignatureTests(signatures, registry);
    // Create the typed function shell FIRST
    // This is the actual function that will be returned and passed to referToSelf
    // The dispatch logic will be set up via closure after reference resolution
    let genericDispatch = null;
    let fastPathReady = false;
    let wasmDispatchEnabled = useWasm && isWasmAvailable();
    // Fast-path slot variables for 10 slots with 3 params each
    // These are assigned once after theTypedFn is defined, then used via closure
    /* eslint-disable prefer-const */
    let slot0Test0;
    let slot0Test1;
    let slot0Test2;
    let slot0Len;
    let slot0Fn;
    let slot1Test0;
    let slot1Test1;
    let slot1Test2;
    let slot1Len;
    let slot1Fn;
    let slot2Test0;
    let slot2Test1;
    let slot2Test2;
    let slot2Len;
    let slot2Fn;
    let slot3Test0;
    let slot3Test1;
    let slot3Test2;
    let slot3Len;
    let slot3Fn;
    let slot4Test0;
    let slot4Test1;
    let slot4Test2;
    let slot4Len;
    let slot4Fn;
    let slot5Test0;
    let slot5Test1;
    let slot5Test2;
    let slot5Len;
    let slot5Fn;
    let slot6Test0;
    let slot6Test1;
    let slot6Test2;
    let slot6Len;
    let slot6Fn;
    let slot7Test0;
    let slot7Test1;
    let slot7Test2;
    let slot7Len;
    let slot7Fn;
    let slot8Test0;
    let slot8Test1;
    let slot8Test2;
    let slot8Len;
    let slot8Fn;
    let slot9Test0;
    let slot9Test1;
    let slot9Test2;
    let slot9Len;
    let slot9Fn;
    /* eslint-enable prefer-const */
    function theTypedFn(arg0, arg1, arg2) {
        const argc = arguments.length;
        if (fastPathReady) {
            // Fast path checks for first 10 signatures with 3-param support
            if (argc === slot0Len && slot0Test0(arg0) && slot0Test1(arg1) && slot0Test2(arg2)) {
                return slot0Fn.apply(this, arguments);
            }
            if (argc === slot1Len && slot1Test0(arg0) && slot1Test1(arg1) && slot1Test2(arg2)) {
                return slot1Fn.apply(this, arguments);
            }
            if (argc === slot2Len && slot2Test0(arg0) && slot2Test1(arg1) && slot2Test2(arg2)) {
                return slot2Fn.apply(this, arguments);
            }
            if (argc === slot3Len && slot3Test0(arg0) && slot3Test1(arg1) && slot3Test2(arg2)) {
                return slot3Fn.apply(this, arguments);
            }
            if (argc === slot4Len && slot4Test0(arg0) && slot4Test1(arg1) && slot4Test2(arg2)) {
                return slot4Fn.apply(this, arguments);
            }
            if (argc === slot5Len && slot5Test0(arg0) && slot5Test1(arg1) && slot5Test2(arg2)) {
                return slot5Fn.apply(this, arguments);
            }
            if (argc === slot6Len && slot6Test0(arg0) && slot6Test1(arg1) && slot6Test2(arg2)) {
                return slot6Fn.apply(this, arguments);
            }
            if (argc === slot7Len && slot7Test0(arg0) && slot7Test1(arg1) && slot7Test2(arg2)) {
                return slot7Fn.apply(this, arguments);
            }
            if (argc === slot8Len && slot8Test0(arg0) && slot8Test1(arg1) && slot8Test2(arg2)) {
                return slot8Fn.apply(this, arguments);
            }
            if (argc === slot9Len && slot9Test0(arg0) && slot9Test1(arg1) && slot9Test2(arg2)) {
                return slot9Fn.apply(this, arguments);
            }
        }
        // Fall back to generic dispatch
        if (genericDispatch) {
            return genericDispatch(arguments, this);
        }
        // Should never happen - function not fully initialized
        throw new Error('Typed function not initialized');
    }
    // Set the function name
    try {
        Object.defineProperty(theTypedFn, 'name', { value: name });
    }
    catch {
        // Some environments don't support setting function name
    }
    // Cast to TypedFunction and set initial properties
    const typedFn = theTypedFn;
    typedFn.signatures = publicSignaturesMap; // Will be filled in
    typedFn._typedFunctionData = {
        signatures,
        signatureMap: internalSignatureMap,
    };
    // Now resolve references with the actual function
    // referToSelf callbacks will receive this exact function
    const fullyResolvedFunctions = resolveReferences(originalFunctions, signaturesMap, typedFn);
    // Update signatures with fully resolved functions
    for (let i = 0; i < signatures.length; i++) {
        const sig = signatures[i];
        if (sig) {
            const sigName = stringifyParams(sig.params);
            const prelim = preliminarySignatures.find((p) => p.name === sigName);
            if (prelim) {
                sig.fn = fullyResolvedFunctions[prelim.fn] ?? null;
                if (sig.fn) {
                    sig.implementation = compileArgsPreprocessing(sig.params, sig.fn, registry);
                }
            }
        }
    }
    // Fill in the public signatures map with resolved functions
    for (const s in signaturesMap) {
        if (Object.prototype.hasOwnProperty.call(signaturesMap, s)) {
            const idx = signaturesMap[s];
            if (idx !== undefined) {
                const fn = fullyResolvedFunctions[idx];
                if (fn) {
                    publicSignaturesMap[s] = fn;
                }
            }
        }
    }
    // Now set up the fast-path dispatch slots
    const fpData = createFastPathDispatcher(signatures);
    // Initialize slot variables from fast-path data (10 slots)
    const inactiveSlot = createInactiveSlot();
    const s0 = fpData.slots[0] || inactiveSlot;
    const s1 = fpData.slots[1] || inactiveSlot;
    const s2 = fpData.slots[2] || inactiveSlot;
    const s3 = fpData.slots[3] || inactiveSlot;
    const s4 = fpData.slots[4] || inactiveSlot;
    const s5 = fpData.slots[5] || inactiveSlot;
    const s6 = fpData.slots[6] || inactiveSlot;
    const s7 = fpData.slots[7] || inactiveSlot;
    const s8 = fpData.slots[8] || inactiveSlot;
    const s9 = fpData.slots[9] || inactiveSlot;
    slot0Test0 = s0.test0;
    slot0Test1 = s0.test1;
    slot0Test2 = s0.test2;
    slot0Len = s0.length;
    slot0Fn = s0.fn;
    slot1Test0 = s1.test0;
    slot1Test1 = s1.test1;
    slot1Test2 = s1.test2;
    slot1Len = s1.length;
    slot1Fn = s1.fn;
    slot2Test0 = s2.test0;
    slot2Test1 = s2.test1;
    slot2Test2 = s2.test2;
    slot2Len = s2.length;
    slot2Fn = s2.fn;
    slot3Test0 = s3.test0;
    slot3Test1 = s3.test1;
    slot3Test2 = s3.test2;
    slot3Len = s3.length;
    slot3Fn = s3.fn;
    slot4Test0 = s4.test0;
    slot4Test1 = s4.test1;
    slot4Test2 = s4.test2;
    slot4Len = s4.length;
    slot4Fn = s4.fn;
    slot5Test0 = s5.test0;
    slot5Test1 = s5.test1;
    slot5Test2 = s5.test2;
    slot5Len = s5.length;
    slot5Fn = s5.fn;
    slot6Test0 = s6.test0;
    slot6Test1 = s6.test1;
    slot6Test2 = s6.test2;
    slot6Len = s6.length;
    slot6Fn = s6.fn;
    slot7Test0 = s7.test0;
    slot7Test1 = s7.test1;
    slot7Test2 = s7.test2;
    slot7Len = s7.length;
    slot7Fn = s7.fn;
    slot8Test0 = s8.test0;
    slot8Test1 = s8.test1;
    slot8Test2 = s8.test2;
    slot8Len = s8.length;
    slot8Fn = s8.fn;
    slot9Test0 = s9.test0;
    slot9Test1 = s9.test1;
    slot9Test2 = s9.test2;
    slot9Len = s9.length;
    slot9Fn = s9.fn;
    // Create generic dispatcher
    genericDispatch = createGenericDispatcher(name, signatures, fpData.genericStartIndex, onMismatch);
    // Enable fast path
    fastPathReady = true;
    // Register signatures with WASM dispatch if enabled
    if (wasmDispatchEnabled) {
        try {
            for (const sig of signatures) {
                if (sig && sig.implementation) {
                    // Build param masks for WASM
                    const paramMasks = sig.params.map((param) => {
                        // Combine all type masks for this parameter
                        let mask = 0;
                        for (const type of param.types) {
                            mask |= getTypeMaskForName(type.name);
                        }
                        return mask;
                    });
                    wasmAddSignature(sig.implementation, paramMasks);
                }
            }
            typedFn._wasmEnabled = true;
        }
        catch {
            // WASM registration failed, fall back to JS dispatch
            typedFn._wasmEnabled = false;
        }
    }
    return typedFn;
}
/**
 * Check if a name is valid (A) new, (B) a match, or (C) a mismatch
 *
 * @param nameSoFar - Current name
 * @param newName - New name to check
 * @returns Updated name
 * @throws Error if names mismatch
 */
function checkName(nameSoFar, newName) {
    if (!nameSoFar) {
        return newName || '';
    }
    if (newName && newName !== nameSoFar) {
        const err = new Error(`Function names do not match (expected: ${nameSoFar}, actual: ${newName})`);
        err.data = { actual: newName, expected: nameSoFar };
        throw err;
    }
    return nameSoFar;
}
/**
 * Retrieve the implied name from an object with signature keys
 *
 * @param obj - Object with signature keys and function values
 * @param isTypedFunction - Function to check if a value is a typed function
 * @returns The implied name, or undefined
 */
function getObjectName(obj, isTypedFunction) {
    let name;
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const fn = obj[key];
            if (fn && (isTypedFunction(fn) ||
                typeof fn.signature === 'string')) {
                name = checkName(name, fn.name);
            }
        }
    }
    return name;
}
/**
 * Merge signatures from source into dest
 *
 * @param dest - Destination object
 * @param source - Source object
 * @throws Error if signature is defined twice with different functions
 */
function mergeSignatures(dest, source) {
    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            if (key in dest) {
                if (source[key] !== dest[key]) {
                    const err = new Error(`Signature "${key}" is defined twice`);
                    err.data = {
                        signature: key,
                        sourceFunction: source[key],
                        destFunction: dest[key],
                    };
                    throw err;
                }
            }
            const srcFn = source[key];
            if (srcFn !== undefined) {
                dest[key] = srcFn;
            }
        }
    }
}

/**
 * Object Helper Utilities for typed-function
 *
 * This module provides utility functions for working with objects
 * and type checking.
 */
/**
 * Check if a value is a plain object (created via {} or new Object())
 *
 * @param x - The value to check
 * @returns true if the value is a plain object
 */
function isPlainObject(x) {
    return typeof x === 'object' && x !== null && x.constructor === Object;
}
/**
 * Check if a value has a specific property
 *
 * @param obj - The object to check
 * @param prop - The property name
 * @returns true if the object has the property
 */
function hasOwnProperty(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}
/**
 * Safely get a property from an object
 *
 * @param obj - The object to get the property from
 * @param prop - The property name
 * @returns The property value, or undefined
 */
function getProperty(obj, prop) {
    return hasOwnProperty(obj, prop) ? obj[prop] : undefined;
}
/**
 * Create a shallow copy of an object
 *
 * @param obj - The object to copy
 * @returns A new object with the same properties
 */
function shallowCopy(obj) {
    return Object.assign({}, obj);
}
/**
 * Map over object entries and return a new object
 *
 * @param obj - The object to map over
 * @param callback - Function that transforms each entry
 * @returns A new object with transformed values
 */
function mapObject(obj, callback) {
    const result = {};
    for (const key in obj) {
        if (hasOwnProperty(obj, key)) {
            result[key] = callback(obj[key], key);
        }
    }
    return result;
}
/**
 * Get the number of own properties in an object
 *
 * @param obj - The object to count properties in
 * @returns The number of own properties
 */
function objectSize(obj) {
    return Object.keys(obj).length;
}
/**
 * Check if an object is empty (has no own properties)
 *
 * @param obj - The object to check
 * @returns true if the object has no own properties
 */
function isEmptyObject(obj) {
    return objectSize(obj) === 0;
}
/**
 * Merge multiple objects into a new object
 *
 * Later objects override earlier ones.
 *
 * @param objects - Objects to merge
 * @returns A new merged object
 */
function mergeObjects(...objects) {
    return Object.assign({}, ...objects);
}
/**
 * Pick specific keys from an object
 *
 * @param obj - The source object
 * @param keys - The keys to pick
 * @returns A new object with only the specified keys
 */
function pick(obj, keys) {
    const result = {};
    for (const key of keys) {
        if (hasOwnProperty(obj, key)) {
            result[key] = obj[key];
        }
    }
    return result;
}
/**
 * Omit specific keys from an object
 *
 * @param obj - The source object
 * @param keys - The keys to omit
 * @returns A new object without the specified keys
 */
function omit(obj, keys) {
    const result = { ...obj };
    for (const key of keys) {
        delete result[key];
    }
    return result;
}

/**
 * Bundler Compatibility Module for typed-function
 *
 * This module provides robust type identification mechanisms that survive
 * bundler transformations (esbuild, webpack, rollup, etc.) including:
 *
 * - Symbol-based type identification
 * - Constructor registry using WeakMap
 * - Brand checking patterns
 *
 * These mechanisms address issues where class instances are not recognized
 * after compilation due to prototype chain breakage or constructor renaming.
 *
 * @see docs/TYPED_FUNCTION_IMPROVEMENTS.md
 */
/**
 * Well-known symbol for typed-function type identification.
 *
 * Classes can implement this to ensure type recognition survives bundling:
 *
 * @example
 * ```typescript
 * import { TYPE_SYMBOL } from 'typed-function';
 *
 * class DenseMatrix {
 *   [TYPE_SYMBOL] = 'DenseMatrix';
 * }
 *
 * // Type test becomes bundler-safe:
 * typed.addType({
 *   name: 'DenseMatrix',
 *   test: (x) => x && x[TYPE_SYMBOL] === 'DenseMatrix'
 * });
 * ```
 */
const TYPE_SYMBOL = Symbol.for('typed-function:type');
/**
 * Symbol for brand-based type checking (TypeScript branded types pattern).
 *
 * This provides an alternative to TYPE_SYMBOL for cases where you want
 * TypeScript-style branded types.
 *
 * @example
 * ```typescript
 * import { BRAND_SYMBOL } from 'typed-function';
 *
 * interface Branded<T extends string> {
 *   readonly [BRAND_SYMBOL]: T;
 * }
 *
 * class Complex implements Branded<'Complex'> {
 *   readonly [BRAND_SYMBOL] = 'Complex' as const;
 * }
 * ```
 */
const BRAND_SYMBOL = Symbol.for('typed-function:brand');
/**
 * Constructor registry - maps constructors to type names.
 *
 * This WeakMap allows type identification even when:
 * - Classes are compiled/transpiled
 * - Constructor names are minified
 * - Multiple bundle versions exist
 */
const constructorRegistry = new WeakMap();
/**
 * Instance registry - for WeakSet-based instance tracking.
 *
 * Maps type names to WeakSets of instances.
 */
const instanceRegistry = new Map();
/**
 * Register a constructor with a type name.
 *
 * This allows type identification by constructor reference rather than name.
 *
 * @example
 * ```typescript
 * import { registerConstructor, getTypeByConstructor } from 'typed-function';
 *
 * class DenseMatrix { }
 * registerConstructor(DenseMatrix, 'DenseMatrix');
 *
 * // Later, in type test:
 * test: (x) => getTypeByConstructor(x?.constructor) === 'DenseMatrix'
 * ```
 *
 * @param constructor - The constructor function to register
 * @param typeName - The type name to associate with this constructor
 */
function registerConstructor(constructor, typeName) {
    constructorRegistry.set(constructor, typeName);
}
/**
 * Unregister a constructor from the registry.
 *
 * @param constructor - The constructor to unregister
 * @returns true if the constructor was registered and removed, false otherwise
 */
function unregisterConstructor(constructor) {
    return constructorRegistry.delete(constructor);
}
/**
 * Get the type name for a registered constructor.
 *
 * @param constructor - The constructor to look up
 * @returns The type name, or undefined if not registered
 */
function getTypeByConstructor(constructor) {
    if (!constructor)
        return undefined;
    return constructorRegistry.get(constructor);
}
/**
 * Check if a value is an instance of a registered type by constructor lookup.
 *
 * @param value - The value to check
 * @param typeName - The expected type name
 * @returns true if the value's constructor is registered with the given type name
 */
function isRegisteredType(value, typeName) {
    if (value === null || value === undefined)
        return false;
    if (typeof value !== 'object' && typeof value !== 'function')
        return false;
    const constructor = value.constructor;
    return constructorRegistry.get(constructor) === typeName;
}
/**
 * Register an instance with a type name using WeakSet tracking.
 *
 * This is useful for cases where constructor-based identification doesn't work,
 * such as objects created with Object.create() or cross-realm objects.
 *
 * @example
 * ```typescript
 * import { registerInstance, isRegisteredInstance } from 'typed-function';
 *
 * class Matrix {
 *   constructor() {
 *     registerInstance(this, 'Matrix');
 *   }
 * }
 *
 * // Type test:
 * test: (x) => isRegisteredInstance(x, 'Matrix')
 * ```
 *
 * @param instance - The instance to register
 * @param typeName - The type name to associate with this instance
 */
function registerInstance(instance, typeName) {
    let weakSet = instanceRegistry.get(typeName);
    if (!weakSet) {
        weakSet = new WeakSet();
        instanceRegistry.set(typeName, weakSet);
    }
    weakSet.add(instance);
}
/**
 * Check if an instance is registered with a specific type name.
 *
 * @param instance - The instance to check
 * @param typeName - The expected type name
 * @returns true if the instance is registered with the given type name
 */
function isRegisteredInstance(instance, typeName) {
    if (instance === null || instance === undefined)
        return false;
    if (typeof instance !== 'object')
        return false;
    const weakSet = instanceRegistry.get(typeName);
    return weakSet ? weakSet.has(instance) : false;
}
/**
 * Clear all registered instances for a type name.
 *
 * Note: This creates a new WeakSet, existing instances will no longer be tracked.
 *
 * @param typeName - The type name to clear instances for
 */
function clearInstanceRegistry(typeName) {
    instanceRegistry.delete(typeName);
}
/**
 * Clear all instance registries.
 */
function clearAllInstanceRegistries() {
    instanceRegistry.clear();
}
/**
 * Check if a value has a typed-function type symbol.
 *
 * @param value - The value to check
 * @returns The type name from the symbol, or undefined if not present
 */
function getTypeFromSymbol(value) {
    if (value === null || value === undefined)
        return undefined;
    if (typeof value !== 'object' && typeof value !== 'function')
        return undefined;
    const typeValue = value[TYPE_SYMBOL];
    return typeof typeValue === 'string' ? typeValue : undefined;
}
/**
 * Check if a value has a brand symbol.
 *
 * @param value - The value to check
 * @returns The brand name from the symbol, or undefined if not present
 */
function getBrandFromSymbol(value) {
    if (value === null || value === undefined)
        return undefined;
    if (typeof value !== 'object' && typeof value !== 'function')
        return undefined;
    const brandValue = value[BRAND_SYMBOL];
    return typeof brandValue === 'string' ? brandValue : undefined;
}
/**
 * Create a bundler-safe type test function.
 *
 * This function creates a type test that uses multiple identification strategies
 * in order of reliability:
 * 1. Symbol-based identification (TYPE_SYMBOL)
 * 2. Brand-based identification (BRAND_SYMBOL)
 * 3. Constructor registry lookup
 * 4. Instance registry lookup
 * 5. Fallback custom test function
 *
 * @example
 * ```typescript
 * import { createBundlerSafeTest } from 'typed-function';
 *
 * typed.addType({
 *   name: 'DenseMatrix',
 *   test: createBundlerSafeTest('DenseMatrix', {
 *     fallback: (x) => x && typeof x.get === 'function' && Array.isArray(x._size)
 *   })
 * });
 * ```
 *
 * @param typeName - The type name to check for
 * @param options - Optional configuration
 * @returns A type test function
 */
function createBundlerSafeTest(typeName, options) {
    const { fallback, checkConstructor = true, checkInstance = true, checkSymbols = true, } = options || {};
    return function bundlerSafeTest(value) {
        if (value === null || value === undefined)
            return false;
        // Check symbol-based identification first (most reliable)
        if (checkSymbols) {
            if (getTypeFromSymbol(value) === typeName)
                return true;
            if (getBrandFromSymbol(value) === typeName)
                return true;
        }
        // Check constructor registry
        if (checkConstructor && typeof value === 'object') {
            if (isRegisteredType(value, typeName))
                return true;
        }
        // Check instance registry
        if (checkInstance) {
            if (isRegisteredInstance(value, typeName))
                return true;
        }
        // Fall back to custom test
        if (fallback) {
            return fallback(value);
        }
        return false;
    };
}
/**
 * Helper to create a class that is automatically registered with typed-function.
 *
 * @example
 * ```typescript
 * import { createTypedClass, TYPE_SYMBOL } from 'typed-function';
 *
 * const DenseMatrix = createTypedClass('DenseMatrix', class {
 *   constructor(public data: number[][]) {}
 * });
 *
 * const m = new DenseMatrix([[1, 2], [3, 4]]);
 * m[TYPE_SYMBOL] // 'DenseMatrix'
 * ```
 *
 * @param typeName - The type name for this class
 * @param BaseClass - The base class to extend
 * @returns A new class with type identification built in
 */
function createTypedClass(typeName, BaseClass) {
    var _a, _b;
    // Create a new class that extends the base and adds type identification
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const TypedClass = (_b = class extends BaseClass {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            constructor(...args) {
                super(...args);
                this[_a] = typeName;
                // Also register the instance for WeakSet-based lookup
                registerInstance(this, typeName);
            }
        },
        _a = TYPE_SYMBOL,
        _b);
    // Register the constructor
    registerConstructor(TypedClass, typeName);
    // Try to preserve the class name
    try {
        Object.defineProperty(TypedClass, 'name', {
            value: typeName,
            configurable: true,
        });
    }
    catch {
        // Some environments don't allow setting Function.name
    }
    return TypedClass;
}
/**
 * Decorator-style function to add type identification to an existing class.
 *
 * @example
 * ```typescript
 * import { addTypeIdentification, TYPE_SYMBOL } from 'typed-function';
 *
 * class MyMatrix {
 *   constructor(public data: number[][]) {}
 * }
 *
 * // Add type identification
 * addTypeIdentification(MyMatrix, 'Matrix');
 *
 * // Now instances have TYPE_SYMBOL
 * const m = new MyMatrix([[1, 2]]);
 * m[TYPE_SYMBOL] // 'Matrix'
 * ```
 *
 * @param Class - The class to modify
 * @param typeName - The type name to assign
 */
function addTypeIdentification(Class, typeName) {
    // Register the constructor
    registerConstructor(Class, typeName);
    // Add TYPE_SYMBOL to the prototype
    Object.defineProperty(Class.prototype, TYPE_SYMBOL, {
        value: typeName,
        writable: false,
        enumerable: false,
        configurable: false,
    });
}
/**
 * Identify a value's type using all available methods, returning details.
 *
 * This is useful for debugging type identification issues.
 *
 * @param value - The value to identify
 * @param expectedType - Optional expected type name to check
 * @returns Details about type identification
 */
function identifyType(value, expectedType) {
    if (value === null || value === undefined) {
        return { typeName: null, method: 'none' };
    }
    // Check TYPE_SYMBOL
    const symbolType = getTypeFromSymbol(value);
    if (symbolType) {
        if (!expectedType || symbolType === expectedType) {
            return { typeName: symbolType, method: 'symbol' };
        }
    }
    // Check BRAND_SYMBOL
    const brandType = getBrandFromSymbol(value);
    if (brandType) {
        if (!expectedType || brandType === expectedType) {
            return { typeName: brandType, method: 'brand' };
        }
    }
    // Check constructor registry
    if (typeof value === 'object' || typeof value === 'function') {
        const constructorType = getTypeByConstructor(value.constructor);
        if (constructorType) {
            if (!expectedType || constructorType === expectedType) {
                return { typeName: constructorType, method: 'constructor' };
            }
        }
        // Check instance registry (only if we have an expected type)
        if (expectedType && isRegisteredInstance(value, expectedType)) {
            return { typeName: expectedType, method: 'instance' };
        }
    }
    return { typeName: null, method: 'none' };
}

/**
 * Type Cache Module for typed-function
 *
 * Provides caching for type resolution results to improve performance
 * when repeatedly checking the same objects.
 *
 * Uses WeakMap to allow garbage collection of cached objects.
 *
 * @see docs/TYPED_FUNCTION_IMPROVEMENTS.md - Issue 6
 */
/**
 * Type cache using WeakMap for object-based caching.
 *
 * This allows type resolution results to be cached for repeated calls
 * with the same object, while still allowing garbage collection when
 * objects are no longer referenced.
 */
class TypeCache {
    constructor() {
        /** WeakMap storing type names by object reference */
        this.cache = new WeakMap();
        /** Counter for cache hits (for debugging/metrics) */
        this.hits = 0;
        /** Counter for cache misses (for debugging/metrics) */
        this.misses = 0;
        /** Whether caching is enabled */
        this.enabled = true;
    }
    /**
     * Get a cached type name for an object.
     *
     * @param value - The value to look up
     * @returns The cached type name, or undefined if not cached
     */
    get(value) {
        if (!this.enabled)
            return undefined;
        if (value === null || value === undefined)
            return undefined;
        if (typeof value !== 'object' && typeof value !== 'function')
            return undefined;
        const result = this.cache.get(value);
        if (result !== undefined) {
            this.hits++;
        }
        else {
            this.misses++;
        }
        return result;
    }
    /**
     * Cache a type name for an object.
     *
     * @param value - The value to cache
     * @param typeName - The type name to associate
     */
    set(value, typeName) {
        if (!this.enabled)
            return;
        if (value === null || value === undefined)
            return;
        if (typeof value !== 'object' && typeof value !== 'function')
            return;
        this.cache.set(value, typeName);
    }
    /**
     * Check if a value is cached.
     *
     * @param value - The value to check
     * @returns true if the value is cached
     */
    has(value) {
        if (!this.enabled)
            return false;
        if (value === null || value === undefined)
            return false;
        if (typeof value !== 'object' && typeof value !== 'function')
            return false;
        return this.cache.has(value);
    }
    /**
     * Remove a value from the cache.
     *
     * @param value - The value to remove
     * @returns true if the value was cached and removed
     */
    delete(value) {
        if (value === null || value === undefined)
            return false;
        if (typeof value !== 'object' && typeof value !== 'function')
            return false;
        return this.cache.delete(value);
    }
    /**
     * Clear all cached entries.
     *
     * Note: This creates a new WeakMap. Existing entries will be
     * garbage collected when their keys are no longer referenced.
     */
    clear() {
        this.cache = new WeakMap();
        this.hits = 0;
        this.misses = 0;
    }
    /**
     * Enable caching.
     */
    enable() {
        this.enabled = true;
    }
    /**
     * Disable caching.
     */
    disable() {
        this.enabled = false;
    }
    /**
     * Check if caching is enabled.
     */
    isEnabled() {
        return this.enabled;
    }
    /**
     * Get cache statistics.
     *
     * @returns Object with hit and miss counts
     */
    getStats() {
        const total = this.hits + this.misses;
        return {
            hits: this.hits,
            misses: this.misses,
            hitRate: total > 0 ? this.hits / total : 0,
        };
    }
    /**
     * Reset cache statistics.
     */
    resetStats() {
        this.hits = 0;
        this.misses = 0;
    }
}
/**
 * Global type cache instance.
 *
 * This is shared across all typed-function instances for maximum efficiency,
 * since type identification is global (same object = same type).
 */
const globalTypeCache = new TypeCache();
/**
 * Create a new isolated type cache.
 *
 * Use this if you need separate caching for different typed-function instances.
 *
 * @returns A new TypeCache instance
 */
function createTypeCache() {
    return new TypeCache();
}
/**
 * Helper function to get or compute a type name with caching.
 *
 * @param value - The value to resolve
 * @param compute - Function to compute the type name if not cached
 * @param cache - Optional cache to use (defaults to global cache)
 * @returns The type name
 */
function cachedTypeResolve(value, compute, cache = globalTypeCache) {
    // Check cache first
    const cached = cache.get(value);
    if (cached !== undefined) {
        return cached;
    }
    // Compute the type
    const typeName = compute(value);
    // Cache the result
    cache.set(value, typeName);
    return typeName;
}

/**
 * WASM Loader for typed-function dispatch
 *
 * Handles sync/async loading of WASM module with graceful fallback.
 */
/** Loading state */
let loadingPromise = null;
/**
 * Load WASM module asynchronously
 *
 * @param wasmPath - Path to the WASM file
 * @returns Promise that resolves to true if loaded, false otherwise
 */
async function loadWasm(wasmPath) {
    // Return cached promise if already loading
    if (loadingPromise) {
        return loadingPromise;
    }
    // Already loaded
    if (isWasmAvailable()) {
        return true;
    }
    loadingPromise = doLoadWasm(wasmPath);
    return loadingPromise;
}
/**
 * Internal async loader
 */
async function doLoadWasm(wasmPath) {
    try {
        // Determine WASM path
        const path = wasmPath || getDefaultWasmPath();
        // Check for WebAssembly support
        if (typeof WebAssembly === 'undefined') {
            throw new WasmNotAvailableError('WebAssembly not supported in this environment');
        }
        // Fetch and instantiate
        const response = await fetch(path);
        if (!response.ok) {
            throw new WasmInitializationError(`Failed to fetch WASM: HTTP ${response.status}`);
        }
        const wasmBuffer = await response.arrayBuffer();
        const wasmModule = await WebAssembly.compile(wasmBuffer);
        const instance = await WebAssembly.instantiate(wasmModule, {
            env: {
                abort: () => {
                    throw new WasmInitializationError('WASM abort called');
                },
            },
        });
        // Initialize with exports
        initWasm(instance.exports);
        return true;
    }
    catch (error) {
        if (error instanceof WasmNotAvailableError || error instanceof WasmInitializationError) ;
        else {
            new WasmInitializationError(error instanceof Error ? error.message : String(error), error instanceof Error ? error : undefined);
        }
        return false;
    }
}
/**
 * Get default WASM path based on environment
 */
function getDefaultWasmPath() {
    // In browser, assume WASM is served from same directory
    if (typeof window !== 'undefined') {
        return 'dispatch.wasm';
    }
    // In Node.js, use relative path from module
    return new URL('../../../build/dispatch.wasm', (typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _documentCurrentScript.src || new URL('typed-function.cjs', document.baseURI).href))).href;
}

/**
 * Factory Function for typed-function
 *
 * Creates isolated typed universes with independent type registries
 * and conversion managers.
 */
/**
 * Extract signatures from a typed function, restoring referTo/referToSelf markers
 * so they can be re-resolved in the context of a new typed function.
 *
 * @param signatures - The signatures object from a typed function
 * @returns Object with referTo/referToSelf markers restored
 */
function extractSignaturesWithReferences(signatures) {
    const result = {};
    for (const key in signatures) {
        if (Object.prototype.hasOwnProperty.call(signatures, key)) {
            const fn = signatures[key];
            if (fn) {
                // Check if the function has preserved referTo info
                if (fn.referTo) {
                    result[key] = makeReferTo(fn.referTo.references, fn.referTo.callback);
                }
                // Check if the function has preserved referToSelf info
                else if (fn.referToSelf) {
                    result[key] = makeReferToSelf(fn.referToSelf.callback);
                }
                // Otherwise, use the function directly
                else {
                    result[key] = fn;
                }
            }
        }
    }
    return result;
}
/**
 * Create a new typed-function instance
 *
 * Each instance has its own type registry and conversion manager,
 * creating an isolated "typed universe".
 *
 * @returns A new typed-function instance
 *
 * @example
 * ```ts
 * import typed from 'typed-function';
 *
 * // Create an isolated instance with its own type registry
 * const typed2 = typed.create();
 *
 * // Add a custom type only to this instance
 * typed2.addType({
 *   name: 'positive',
 *   test: (x) => typeof x === 'number' && x > 0,
 * });
 *
 * const fn = typed2({ positive: (x) => x * 2 });
 * fn(5);  // 10
 * fn(-1); // Error: no matching signature
 * ```
 */
function create() {
    // Create type registry (already has 'any' and builtin types from createTypeRegistry)
    const registry = createTypeRegistry();
    // Create conversion manager
    const conversions = createConversionManager(registry);
    // Track creation count
    let createCount = 0;
    // Configuration state with defaults
    const configState = {
        warnOnBigIntCoercion: false,
        enableTypeCache: true,
        bundlerSafeMode: true,
        warnHandler: (message) => console.warn(message),
        maxWarnings: 10,
        warningCount: 0,
    };
    /**
     * Emit a warning using the configured handler
     */
    function emitWarning(message) {
        if (configState.maxWarnings === -1 || configState.warningCount < configState.maxWarnings) {
            configState.warnHandler(message);
            configState.warningCount++;
        }
        else if (configState.warningCount === configState.maxWarnings) {
            configState.warnHandler(`[typed-function] Warning limit reached (${configState.maxWarnings}). Further warnings will be suppressed.`);
            configState.warningCount++;
        }
    }
    /**
     * Check if a conversion involves BigInt and emit warning if configured.
     * This function is exposed for use by conversion managers and custom conversions.
     */
    function checkBigIntCoercion(from, to, value) {
        if (!configState.warnOnBigIntCoercion)
            return;
        const isBigIntSource = typeof value === 'bigint' || from === 'BigInt' || from === 'Fraction';
        const isNumberTarget = to === 'number';
        if (isBigIntSource && isNumberTarget) {
            emitWarning(`[typed-function] BigInt coercion warning: Converting from '${from}' to '${to}'. ` +
                `This may lose precision for large values. Consider using explicit conversions.`);
        }
    }
    // Make checkBigIntCoercion available on the conversion manager for external use
    conversions.checkBigIntCoercion = checkBigIntCoercion;
    /**
     * Check if an entity is a typed function
     */
    function isTypedFunction(entity) {
        return entity !== null && typeof entity === 'function' && '_typedFunctionData' in entity;
    }
    /**
     * Find a specific signature from a typed function
     *
     * @example
     * ```ts
     * const fn = typed({
     *   'number, number': (a, b) => a + b,
     *   'string, string': (a, b) => a + b,
     * });
     *
     * const sig = typed.findSignature(fn, 'number, number');
     * console.log(sig.params.length); // 2
     * ```
     */
    function findSignature(fn, signature, options) {
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
        let remainingSignatures;
        if (exact) {
            remainingSignatures = [];
            for (const name in fn.signatures) {
                const sig = fn._typedFunctionData.signatureMap.get(name);
                if (sig) {
                    remainingSignatures.push(sig);
                }
            }
        }
        else {
            remainingSignatures = fn._typedFunctionData.signatures;
        }
        for (let i = 0; i < nParams; i++) {
            const want = params[i];
            if (!want)
                continue;
            const filteredSignatures = [];
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
            if (remainingSignatures.length === 0)
                break;
        }
        // Return first remaining signature that was totally matched
        for (const candidate of remainingSignatures) {
            if (candidate.params.length <= nParams) {
                return candidate;
            }
        }
        throw new TypeError(`Signature not found (signature: ${fn.name || 'unnamed'}(${stringifyParams(params, ', ')}))`);
    }
    /**
     * Find the implementation for a specific signature
     *
     * @example
     * ```ts
     * const fn = typed({
     *   'number, number': (a, b) => a + b,
     *   'string, string': (a, b) => a + b,
     * });
     *
     * // Get the implementation function directly
     * const addNumbers = typed.find(fn, 'number, number');
     * addNumbers(1, 2); // 3 (bypasses dispatch)
     * ```
     */
    function find(fn, signature, options) {
        const sig = findSignature(fn, signature, options);
        if (!sig.implementation) {
            throw new TypeError('Signature has no implementation');
        }
        return sig.implementation;
    }
    /**
     * Convert a value to a specific type
     *
     * @example
     * ```ts
     * typed.addConversion({
     *   from: 'string',
     *   to: 'number',
     *   convert: (s) => parseFloat(s),
     * });
     *
     * typed.convert('3.14', 'number'); // 3.14
     * ```
     */
    function convert(value, typeName) {
        return conversions.convert(value, typeName);
    }
    /**
     * Resolve the matching signature for given arguments
     *
     * @example
     * ```ts
     * const fn = typed({
     *   number: (x) => x * 2,
     *   string: (s) => s.toUpperCase(),
     * });
     *
     * const sig = typed.resolve(fn, [42]);
     * console.log(sig?.params[0]?.name); // 'number'
     * ```
     */
    function resolve(fn, argList) {
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
     * Create a referTo reference to directly call another signature
     *
     * @example
     * ```ts
     * const fn = typed({
     *   'number, number': (a, b) => a + b,
     *   // referTo lets you call another signature directly
     *   string: typed.referTo('number, number', (add) => {
     *     return (s) => {
     *       const nums = s.split(',').map(Number);
     *       return add(nums[0], nums[1]);
     *     };
     *   }),
     * });
     *
     * fn(1, 2);     // 3
     * fn('3,4');    // 7 (calls number,number signature)
     * ```
     */
    function referTo(...args) {
        const callback = last(args);
        if (typeof callback !== 'function') {
            throw new TypeError('Callback function expected as last argument');
        }
        // Validate that all arguments before callback are strings
        const references = initial(args).map((s) => {
            if (typeof s !== 'string') {
                throw new TypeError('Signatures must be strings');
            }
            return stringifyParams(parseSignature(s, registry));
        });
        return makeReferTo(references, callback);
    }
    /**
     * Create a referToSelf reference for recursive typed function calls
     *
     * @example
     * ```ts
     * const factorial = typed({
     *   number: typed.referToSelf((self) => {
     *     return (n) => {
     *       if (n <= 1) return 1;
     *       return n * self(n - 1); // recursive call through dispatch
     *     };
     *   }),
     * });
     *
     * factorial(5); // 120
     * ```
     */
    function referToSelf(callback) {
        if (typeof callback !== 'function') {
            throw new TypeError('Callback function expected as first argument');
        }
        return makeReferToSelf(callback);
    }
    /**
     * The main typed function creator
     *
     * @example
     * ```ts
     * // Basic usage with signature object
     * const add = typed({
     *   'number, number': (a, b) => a + b,
     *   'string, string': (a, b) => a + b,
     * });
     *
     * // Named typed function
     * const multiply = typed('multiply', {
     *   'number, number': (a, b) => a * b,
     * });
     *
     * // Merge multiple typed functions
     * const math = typed(add, multiply);
     *
     * // Union types
     * const stringify = typed({
     *   'number | boolean': (x) => String(x),
     * });
     *
     * // Rest parameters
     * const sum = typed({
     *   '...number': (nums) => nums.reduce((a, b) => a + b, 0),
     * });
     * ```
     */
    function typed(maybeName, ...items) {
        const named = typeof maybeName === 'string';
        let name = named ? maybeName : '';
        const allSignatures = {};
        // If first arg isn't a string, it's also an item
        const allItems = named ? items : [maybeName, ...items];
        for (let i = 0; i < allItems.length; i++) {
            const item = allItems[i];
            let theseSignatures = {};
            let thisName;
            if (typeof item === 'function') {
                thisName = item.name;
                const itemWithSig = item;
                if (typeof itemWithSig.signature === 'string') {
                    // Case 1: Ordinary function with a string 'signature' property
                    theseSignatures[itemWithSig.signature] = item;
                }
                else if (isTypedFunction(item)) {
                    // Case 2: Existing typed function - extract with preserved references
                    theseSignatures = extractSignaturesWithReferences(item.signatures);
                }
            }
            else if (isPlainObject(item)) {
                // Case 3: Plain object with signatures - extract with preserved references
                theseSignatures = extractSignaturesWithReferences(item);
                if (!named) {
                    thisName = getObjectName(item, isTypedFunction);
                }
            }
            if (Object.keys(theseSignatures).length === 0) {
                const err = new TypeError(`Argument to 'typed' at index ${i + (named ? 1 : 0)} is not a (typed) function, ` +
                    'nor an object with signatures as keys and functions as values.');
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
            // Use getter to always look up current onMismatch value
            get onMismatch() {
                return typed.onMismatch;
            },
            warnAgainstDeprecatedThis: typed.warnAgainstDeprecatedThis,
        });
    }
    // Create the mismatch handler that wraps createError
    const onMismatch = (fnName, args, signatures) => {
        throw createError(fnName, Array.from(args), signatures, registry);
    };
    // Attach properties and methods to typed
    typed.create = create;
    // Make createCount a getter to always return current value
    Object.defineProperty(typed, 'createCount', {
        get: () => createCount,
        enumerable: true,
        configurable: true,
    });
    typed.onMismatch = onMismatch;
    typed.throwMismatchError = onMismatch;
    typed.createError = (fnName, args, signatures) => createError(fnName, Array.from(args), signatures, registry);
    typed.clear = () => {
        // Truly clear the registry - allows creating custom type universes
        registry.clear();
        conversions.clearConversions();
    };
    typed.clearConversions = () => conversions.clearConversions();
    typed.addTypes = (types, before) => {
        registry.addTypes(types, before);
        // Auto-register WASM type masks and constructors for all new types
        for (const type of types) {
            registerCustomType(type.name);
            // Register constructor for bundler-safe type identification
            if (type.constructor) {
                registerConstructor(type.constructor, type.name);
            }
        }
    };
    typed.addType = (type, beforeObjectTest) => {
        let before = 'any';
        if (beforeObjectTest !== false && registry.hasType('Object')) {
            before = 'Object';
        }
        typed.addTypes([type], before);
    };
    typed.addConversion = (conversion, options) => conversions.addConversion(conversion, options);
    typed.addConversions = (conversionList, options) => conversions.addConversions(conversionList, options);
    typed.removeConversion = (conversion) => conversions.removeConversion(conversion);
    typed.referTo = referTo;
    typed.referToSelf = referToSelf;
    typed.convert = convert;
    typed.findSignature = findSignature;
    typed.find = find;
    typed.resolve = resolve;
    typed.isTypedFunction = isTypedFunction;
    typed.warnAgainstDeprecatedThis = true;
    // Internal access for testing
    typed._findType = (fnName) => registry.findType(fnName);
    // Track WASM initialization state
    let wasmInitialized = false;
    let wasmPreferred = true;
    /**
     * Initialize the typed-function instance with optional WASM support
     *
     * @param options - Initialization options
     * @returns Promise that resolves when initialization is complete
     *
     * @example
     * ```ts
     * // Initialize with WASM support (default)
     * await typed.init({ preferWasm: true });
     *
     * // Initialize without WASM
     * await typed.init({ preferWasm: false });
     *
     * // Initialize with custom WASM path
     * await typed.init({ wasmPath: '/path/to/dispatch.wasm' });
     * ```
     */
    typed.init = async (options = {}) => {
        const { preferWasm = true, wasmPath } = options;
        wasmPreferred = preferWasm;
        if (!preferWasm) {
            wasmInitialized = false;
            return false;
        }
        try {
            const loaded = await loadWasm(wasmPath);
            wasmInitialized = loaded;
            return loaded;
        }
        catch {
            wasmInitialized = false;
            return false;
        }
    };
    /**
     * Check if WASM dispatch is available and enabled
     */
    typed.isWasmEnabled = () => {
        return wasmPreferred && wasmInitialized && isWasmAvailable();
    };
    /**
     * Reset WASM state (for testing)
     */
    typed.resetWasm = () => {
        resetWasm();
        wasmInitialized = false;
    };
    /**
     * Configure typed-function behavior
     */
    typed.config = (options) => {
        if (options.warnOnBigIntCoercion !== undefined) {
            configState.warnOnBigIntCoercion = options.warnOnBigIntCoercion;
        }
        if (options.enableTypeCache !== undefined) {
            configState.enableTypeCache = options.enableTypeCache;
            if (options.enableTypeCache) {
                globalTypeCache.enable();
            }
            else {
                globalTypeCache.disable();
            }
        }
        if (options.bundlerSafeMode !== undefined) {
            configState.bundlerSafeMode = options.bundlerSafeMode;
        }
        if (options.warnHandler !== undefined) {
            configState.warnHandler = options.warnHandler;
        }
        if (options.maxWarnings !== undefined) {
            configState.maxWarnings = options.maxWarnings;
        }
    };
    /**
     * Get the current configuration
     */
    typed.getConfig = () => {
        return { ...configState };
    };
    /**
     * Register a constructor for bundler-safe type identification
     */
    typed.registerConstructor = (constructor, typeName) => {
        registerConstructor(constructor, typeName);
    };
    /**
     * Unregister a constructor from the registry
     */
    typed.unregisterConstructor = (constructor) => {
        return unregisterConstructor(constructor);
    };
    /**
     * Get the type name for a registered constructor
     */
    typed.getTypeByConstructor = (constructor) => {
        return getTypeByConstructor(constructor);
    };
    /**
     * Create a bundler-safe type test function
     */
    typed.createBundlerSafeTest = (typeName, options) => {
        return createBundlerSafeTest(typeName, options);
    };
    return typed;
}
// Export the default typed instance
var typedInstance = create();

/**
 * Debug Module for typed-function
 *
 * Provides logging and debugging utilities for understanding
 * dispatch decisions and function creation.
 */
// Default configuration
const defaultConfig = {
    enabled: false,
    level: 'info',
    timing: false,
    stackTraces: false,
};
// Current configuration
let config = { ...defaultConfig };
// Event handlers
const handlers = new Set();
/**
 * Configure debug mode
 *
 * @param options - Debug configuration options
 *
 * @example
 * ```ts
 * import { configureDebug } from 'typed-function';
 *
 * // Enable debug mode with info level
 * configureDebug({ enabled: true, level: 'info' });
 *
 * // Enable with custom handler
 * configureDebug({
 *   enabled: true,
 *   handler: (event) => console.log(JSON.stringify(event))
 * });
 * ```
 */
function configureDebug(options) {
    config = { ...config, ...options };
    if (options.handler) {
        handlers.add(options.handler);
    }
}
/**
 * Reset debug configuration to defaults
 */
function resetDebug() {
    config = { ...defaultConfig };
    handlers.clear();
}
/**
 * Check if debug mode is enabled
 */
function isDebugEnabled() {
    return config.enabled;
}
/**
 * Get current debug level
 */
function getDebugLevel() {
    return config.level;
}
/**
 * Add a debug event handler
 *
 * @param handler - The handler function
 * @returns A function to remove the handler
 */
function addDebugHandler(handler) {
    handlers.add(handler);
    return () => handlers.delete(handler);
}
/**
 * Emit a debug event
 *
 * @param type - The event type
 * @param data - Additional event data
 * @param fnName - Function name (if applicable)
 */
function emitDebugEvent(type, data, fnName) {
    if (!config.enabled)
        return;
    // Check filter
    if (config.filter && !config.filter.includes(type))
        return;
    // Build the event object, only including optional fields if defined
    const event = {
        type,
        timestamp: config.timing ? performance.now() : Date.now(),
    };
    if (fnName !== undefined) {
        event.fnName = fnName;
    }
    if (data !== undefined) {
        event.data = data;
        // Add stack trace if configured
        if (config.stackTraces) {
            data.stack = new Error().stack;
        }
    }
    // Call all handlers
    for (const handler of handlers) {
        try {
            handler(event);
        }
        catch {
            // Ignore handler errors
        }
    }
    // Default console output if no custom handler
    if (handlers.size === 0 || config.handler === undefined) {
        logEvent(event);
    }
}
/**
 * Log an event to console
 */
function logEvent(event) {
    const prefix = `[typed-function:${event.type}]`;
    const fnInfo = event.fnName ? ` ${event.fnName}` : '';
    switch (event.type) {
        case 'function:create':
            console.log(`${prefix}${fnInfo} created with ${event.data?.signatureCount ?? 0} signatures`);
            break;
        case 'function:call':
            console.log(`${prefix}${fnInfo} called with ${event.data?.argCount ?? 0} arguments`);
            break;
        case 'dispatch:start':
            console.log(`${prefix}${fnInfo} dispatching...`);
            break;
        case 'dispatch:match':
            console.log(`${prefix}${fnInfo} matched signature: ${event.data?.signature ?? 'unknown'}`);
            break;
        case 'dispatch:nomatch':
            console.warn(`${prefix}${fnInfo} no matching signature found`);
            break;
        case 'dispatch:conversion':
            console.log(`${prefix}${fnInfo} converting ${event.data?.from} -> ${event.data?.to}`);
            break;
        case 'type:register':
            console.log(`${prefix} registered type: ${event.data?.typeName}`);
            break;
        case 'conversion:register':
            console.log(`${prefix} registered conversion: ${event.data?.from} -> ${event.data?.to}`);
            break;
        case 'wasm:init':
            console.log(`${prefix} WASM initialized: ${event.data?.success ? 'success' : 'failed'}`);
            break;
        case 'wasm:dispatch':
            console.log(`${prefix}${fnInfo} using WASM dispatch`);
            break;
        case 'cache:hit':
            console.log(`${prefix}${fnInfo} cache hit`);
            break;
        case 'cache:miss':
            console.log(`${prefix}${fnInfo} cache miss`);
            break;
        default:
            console.log(`${prefix}${fnInfo}`, event.data);
    }
}
/**
 * Format a signature for logging
 */
function formatSignature(signature) {
    return signature.params.map((p) => p.name).join(', ');
}
/**
 * Format a parameter for logging
 */
function formatParam(param) {
    const prefix = param.restParam ? '...' : '';
    return `${prefix}${param.name}`;
}
/**
 * Format arguments for logging
 */
function formatArgs(args) {
    const types = [];
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        types.push(typeof arg === 'object' ? (arg === null ? 'null' : arg.constructor.name) : typeof arg);
    }
    return types.join(', ');
}
/**
 * Create a debug wrapper for a typed function
 *
 * @param fn - The typed function to wrap
 * @returns A wrapped function that logs debug info
 *
 * @example
 * ```ts
 * const add = typed('add', { 'number, number': (a, b) => a + b });
 * const debugAdd = wrapWithDebug(add);
 *
 * // Now calls to debugAdd will be logged
 * debugAdd(1, 2);
 * ```
 */
function wrapWithDebug(fn) {
    const wrapper = function (...args) {
        const fnName = fn.name || 'anonymous';
        emitDebugEvent('function:call', { argCount: args.length, argTypes: formatArgs(args) }, fnName);
        emitDebugEvent('dispatch:start', {}, fnName);
        try {
            const result = fn.apply(this, args);
            emitDebugEvent('dispatch:match', { argTypes: formatArgs(args) }, fnName);
            return result;
        }
        catch (error) {
            emitDebugEvent('dispatch:nomatch', { error: String(error) }, fnName);
            throw error;
        }
    };
    // Copy properties from original function
    Object.defineProperty(wrapper, 'name', { value: fn.name, writable: false });
    Object.defineProperty(wrapper, 'signatures', { value: fn.signatures, writable: false });
    Object.defineProperty(wrapper, '_typedFunctionData', { value: fn._typedFunctionData, writable: false });
    return wrapper;
}
/**
 * Convenience function to enable debug mode
 */
function enableDebug(level = 'info') {
    configureDebug({ enabled: true, level });
}
/**
 * Convenience function to disable debug mode
 */
function disableDebug() {
    configureDebug({ enabled: false });
}

/**
 * Complex Number Types
 *
 * This module provides type definitions for complex numbers
 * with real and imaginary components.
 */
// =============================================================================
// Type Test Functions
// =============================================================================
/**
 * Test if value is a Complex number
 */
function isComplex(x) {
    return (x !== null &&
        typeof x === 'object' &&
        're' in x &&
        'im' in x &&
        typeof x.re === 'number' &&
        typeof x.im === 'number');
}
// =============================================================================
// Type Definitions for Registration
// =============================================================================
/**
 * Complex number types
 */
const COMPLEX_TYPES = [{ name: 'Complex', test: isComplex }];
// =============================================================================
// Factory Functions
// =============================================================================
/**
 * Create a Complex number
 */
function complex(re, im = 0) {
    return { re, im };
}

/**
 * Fraction Types
 *
 * This module provides type definitions for fractions (rational numbers)
 * with numerator and denominator components.
 */
// =============================================================================
// Type Test Functions
// =============================================================================
/**
 * Test if value is a Fraction
 */
function isFraction(x) {
    if (x === null || typeof x !== 'object')
        return false;
    const f = x;
    return ('numerator' in f &&
        'denominator' in f &&
        (typeof f.numerator === 'number' || typeof f.numerator === 'bigint') &&
        (typeof f.denominator === 'number' || typeof f.denominator === 'bigint'));
}
// =============================================================================
// Type Definitions for Registration
// =============================================================================
/**
 * Fraction types
 */
const FRACTION_TYPES = [{ name: 'Fraction', test: isFraction }];
// =============================================================================
// Factory Functions
// =============================================================================
/**
 * Create a Fraction
 */
function fraction(numerator, denominator = 1) {
    return { numerator, denominator };
}

/**
 * BigDouble Types
 *
 * This module provides type definitions for arbitrary precision
 * double-precision floating point numbers using bigint and scale.
 */
// =============================================================================
// Type Test Functions
// =============================================================================
/**
 * Test if value is a BigDouble
 */
function isBigDouble(x) {
    if (x === null || typeof x !== 'object')
        return false;
    const bd = x;
    return 'value' in bd && 'scale' in bd && typeof bd.value === 'bigint' && typeof bd.scale === 'number';
}
/**
 * @deprecated Use isBigDouble instead
 */
const isBigDecimal = isBigDouble;
// =============================================================================
// Type Definitions for Registration
// =============================================================================
/**
 * BigDouble types
 */
const BIGDOUBLE_TYPES = [{ name: 'BigDouble', test: isBigDouble }];
// =============================================================================
// Factory Functions
// =============================================================================
/**
 * Create a BigDouble
 * @param value The integer value
 * @param scale The number of decimal places (value * 10^(-scale))
 */
function bigDouble(value, scale = 0) {
    return { value, scale };
}
/**
 * @deprecated Use bigDouble instead
 */
const bigDecimal = bigDouble;

/**
 * Numeric Types for Scientific Computing
 *
 * This module provides type definitions for fixed-width integer
 * and floating-point types.
 */
// =============================================================================
// Type Test Functions
// =============================================================================
/**
 * Test if value is an Int8
 */
function isInt8(x) {
    return typeof x === 'number' && Number.isInteger(x) && x >= -128 && x <= 127;
}
/**
 * Test if value is an Int16
 */
function isInt16(x) {
    return typeof x === 'number' && Number.isInteger(x) && x >= -32768 && x <= 32767;
}
/**
 * Test if value is an Int32
 */
function isInt32(x) {
    return typeof x === 'number' && Number.isInteger(x) && x >= -2147483648 && x <= 2147483647;
}
/**
 * Test if value is an Int64 (using BigInt)
 */
function isInt64(x) {
    if (typeof x !== 'bigint')
        return false;
    const MIN = BigInt('-9223372036854775808');
    const MAX = BigInt('9223372036854775807');
    return x >= MIN && x <= MAX;
}
/**
 * Test if value is a UInt8
 */
function isUInt8(x) {
    return typeof x === 'number' && Number.isInteger(x) && x >= 0 && x <= 255;
}
/**
 * Test if value is a UInt16
 */
function isUInt16(x) {
    return typeof x === 'number' && Number.isInteger(x) && x >= 0 && x <= 65535;
}
/**
 * Test if value is a UInt32
 */
function isUInt32(x) {
    return typeof x === 'number' && Number.isInteger(x) && x >= 0 && x <= 4294967295;
}
/**
 * Test if value is a UInt64 (using BigInt)
 */
function isUInt64(x) {
    if (typeof x !== 'bigint')
        return false;
    const MAX = BigInt('18446744073709551615');
    return x >= BigInt(0) && x <= MAX;
}
/**
 * Test if value is a Float32 (any number, conceptually 32-bit)
 */
function isFloat32(x) {
    return typeof x === 'number' && !Number.isNaN(x);
}
/**
 * Test if value is a Float64 (any number)
 */
function isFloat64(x) {
    return typeof x === 'number';
}
// =============================================================================
// Type Definitions for Registration
// =============================================================================
/**
 * Numeric types for scientific computing (integers and floats)
 */
const NUMERIC_TYPES = [
    { name: 'Int8', test: isInt8 },
    { name: 'Int16', test: isInt16 },
    { name: 'Int32', test: isInt32 },
    { name: 'Int64', test: isInt64 },
    { name: 'UInt8', test: isUInt8 },
    { name: 'UInt16', test: isUInt16 },
    { name: 'UInt32', test: isUInt32 },
    { name: 'UInt64', test: isUInt64 },
    { name: 'Float32', test: isFloat32 },
    { name: 'Float64', test: isFloat64 },
];

/**
 * Vector Types
 *
 * This module provides type definitions for vectors in linear algebra.
 */
// =============================================================================
// Type Test Functions
// =============================================================================
/**
 * Test if value is a Vector
 */
function isVector(x) {
    if (x === null || typeof x !== 'object')
        return false;
    const v = x;
    return ('data' in v &&
        'length' in v &&
        typeof v.length === 'number' &&
        (Array.isArray(v.data) || v.data instanceof Float32Array || v.data instanceof Float64Array));
}
// =============================================================================
// Type Definitions for Registration
// =============================================================================
/**
 * Vector types
 */
const VECTOR_TYPES = [{ name: 'Vector', test: isVector }];
// =============================================================================
// Factory Functions
// =============================================================================
/**
 * Create a Vector
 */
function vector(data) {
    return { data, length: data.length };
}

/**
 * Matrix Types
 *
 * This module provides type definitions for matrices in linear algebra.
 */
// =============================================================================
// Type Test Functions
// =============================================================================
/**
 * Test if value is a Matrix
 */
function isMatrix(x) {
    if (x === null || typeof x !== 'object')
        return false;
    const m = x;
    return ('data' in m &&
        'rows' in m &&
        'cols' in m &&
        typeof m.rows === 'number' &&
        typeof m.cols === 'number' &&
        (Array.isArray(m.data) || m.data instanceof Float32Array || m.data instanceof Float64Array));
}
// =============================================================================
// Type Definitions for Registration
// =============================================================================
/**
 * Matrix types
 */
const MATRIX_TYPES = [{ name: 'Matrix', test: isMatrix }];
// =============================================================================
// Factory Functions
// =============================================================================
/**
 * Create a Matrix
 */
function matrix(data, rows, cols) {
    return { data, rows, cols };
}

/**
 * Tensor Types
 *
 * This module provides type definitions for N-dimensional tensors.
 */
// =============================================================================
// Type Test Functions
// =============================================================================
/**
 * Test if value is a Tensor
 */
function isTensor(x) {
    if (x === null || typeof x !== 'object')
        return false;
    const t = x;
    return ('data' in t &&
        'shape' in t &&
        Array.isArray(t.shape) &&
        (Array.isArray(t.data) || t.data instanceof Float32Array || t.data instanceof Float64Array));
}
// =============================================================================
// Type Definitions for Registration
// =============================================================================
/**
 * Tensor types
 */
const TENSOR_TYPES = [{ name: 'Tensor', test: isTensor }];
// =============================================================================
// Factory Functions
// =============================================================================
/**
 * Create a Tensor
 */
function tensor(data, shape) {
    return { data, shape };
}

/**
 * Sparse Matrix Types
 *
 * This module provides type definitions for sparse matrices in COO format.
 */
// =============================================================================
// Type Test Functions
// =============================================================================
/**
 * Test if value is a SparseMatrix
 */
function isSparseMatrix(x) {
    if (x === null || typeof x !== 'object')
        return false;
    const s = x;
    return ('rows' in s &&
        'cols' in s &&
        'values' in s &&
        'shape' in s &&
        Array.isArray(s.rows) &&
        Array.isArray(s.cols) &&
        Array.isArray(s.values) &&
        Array.isArray(s.shape) &&
        s.shape.length === 2);
}
// =============================================================================
// Type Definitions for Registration
// =============================================================================
/**
 * Sparse matrix types
 */
const SPARSE_MATRIX_TYPES = [{ name: 'SparseMatrix', test: isSparseMatrix }];

/**
 * Quaternion Types
 *
 * This module provides type definitions for quaternions used in 3D rotations.
 */
// =============================================================================
// Type Test Functions
// =============================================================================
/**
 * Test if value is a Quaternion
 */
function isQuaternion(x) {
    if (x === null || typeof x !== 'object')
        return false;
    const q = x;
    return ('w' in q &&
        'x' in q &&
        'y' in q &&
        'z' in q &&
        typeof q.w === 'number' &&
        typeof q.x === 'number' &&
        typeof q.y === 'number' &&
        typeof q.z === 'number');
}
// =============================================================================
// Type Definitions for Registration
// =============================================================================
/**
 * Quaternion types
 */
const QUATERNION_TYPES = [{ name: 'Quaternion', test: isQuaternion }];
// =============================================================================
// Factory Functions
// =============================================================================
/**
 * Create a Quaternion
 */
function quaternion(w, x, y, z) {
    return { w, x, y, z };
}

/**
 * Unit Types
 *
 * This module provides type definitions for values with physical units.
 */
// =============================================================================
// Type Test Functions
// =============================================================================
/**
 * Test if value is a Unit
 */
function isUnit(x) {
    if (x === null || typeof x !== 'object')
        return false;
    const u = x;
    return 'value' in u && 'unit' in u && typeof u.unit === 'string';
}
// =============================================================================
// Type Definitions for Registration
// =============================================================================
/**
 * Unit types
 */
const UNIT_TYPES = [{ name: 'Unit', test: isUnit }];
// =============================================================================
// Factory Functions
// =============================================================================
/**
 * Create a Unit value
 */
function unit(value, unitStr) {
    return { value, unit: unitStr };
}

/**
 * Interval Types
 *
 * This module provides type definitions for numeric intervals.
 */
// =============================================================================
// Type Test Functions
// =============================================================================
/**
 * Test if value is an Interval
 */
function isInterval(x) {
    if (x === null || typeof x !== 'object')
        return false;
    const i = x;
    return 'low' in i && 'high' in i && typeof i.low === 'number' && typeof i.high === 'number';
}
// =============================================================================
// Type Definitions for Registration
// =============================================================================
/**
 * Interval types
 */
const INTERVAL_TYPES = [{ name: 'Interval', test: isInterval }];
// =============================================================================
// Factory Functions
// =============================================================================
/**
 * Create an Interval
 */
function interval(low, high) {
    return { low, high };
}

/**
 * Uncertainty Types
 *
 * This module provides type definitions for values with uncertainty/error bounds.
 */
// =============================================================================
// Type Test Functions
// =============================================================================
/**
 * Test if value is an Uncertainty
 */
function isUncertainty(x) {
    if (x === null || typeof x !== 'object')
        return false;
    const u = x;
    return ('value' in u && 'uncertainty' in u && typeof u.value === 'number' && typeof u.uncertainty === 'number');
}
// =============================================================================
// Type Definitions for Registration
// =============================================================================
/**
 * Uncertainty types
 */
const UNCERTAINTY_TYPES = [{ name: 'Uncertainty', test: isUncertainty }];
// =============================================================================
// Factory Functions
// =============================================================================
/**
 * Create an Uncertainty value
 */
function uncertainty(value, error) {
    return { value, uncertainty: error };
}

/**
 * Range Types
 *
 * This module provides type definitions for numeric ranges with optional step.
 */
// =============================================================================
// Type Test Functions
// =============================================================================
/**
 * Test if value is a Range
 */
function isRange(x) {
    if (x === null || typeof x !== 'object')
        return false;
    const r = x;
    return 'start' in r && 'end' in r && typeof r.start === 'number' && typeof r.end === 'number';
}
// =============================================================================
// Type Definitions for Registration
// =============================================================================
/**
 * Range types
 */
const RANGE_TYPES = [{ name: 'Range', test: isRange }];
// =============================================================================
// Factory Functions
// =============================================================================
/**
 * Create a Range
 */
function range(start, end, step) {
    if (step !== undefined) {
        return { start, end, step };
    }
    return { start, end };
}

/**
 * Polynomial Types
 *
 * This module provides type definitions for polynomials represented by coefficients.
 */
// =============================================================================
// Type Test Functions
// =============================================================================
/**
 * Test if value is a Polynomial
 */
function isPolynomial(x) {
    if (x === null || typeof x !== 'object')
        return false;
    const p = x;
    return 'coefficients' in p && Array.isArray(p.coefficients);
}
// =============================================================================
// Type Definitions for Registration
// =============================================================================
/**
 * Polynomial types
 */
const POLYNOMIAL_TYPES = [{ name: 'Polynomial', test: isPolynomial }];
// =============================================================================
// Factory Functions
// =============================================================================
/**
 * Create a Polynomial from coefficients
 */
function polynomial(coefficients, variable = 'x') {
    return { coefficients, variable };
}

/**
 * Parallel and Concurrent Computing Types
 *
 * This module provides type definitions for parallel computing including
 * futures, streams, channels, shared arrays, and atomic numbers.
 */
// =============================================================================
// Type Test Functions
// =============================================================================
/**
 * Test if value is a Future/Promise-like
 */
function isFuture(x) {
    return x !== null && typeof x === 'object' && 'then' in x && typeof x.then === 'function';
}
/**
 * Test if value is a Stream
 */
function isStream(x) {
    return x !== null && typeof x === 'object' && 'next' in x && typeof x.next === 'function';
}
/**
 * Test if value is a Channel
 */
function isChannel(x) {
    if (x === null || typeof x !== 'object')
        return false;
    const c = x;
    return 'send' in c && 'receive' in c && typeof c.send === 'function' && typeof c.receive === 'function';
}
/**
 * Test if value is a SharedArray
 */
function isSharedArray(x) {
    if (x === null || typeof x !== 'object')
        return false;
    const s = x;
    return ('buffer' in s &&
        'length' in s &&
        typeof s.length === 'number' &&
        typeof SharedArrayBuffer !== 'undefined' &&
        s.buffer instanceof SharedArrayBuffer);
}
/**
 * Test if value is an AtomicNumber
 */
function isAtomicNumber(x) {
    if (x === null || typeof x !== 'object')
        return false;
    const a = x;
    return ('value' in a &&
        'buffer' in a &&
        (typeof a.value === 'number' || typeof a.value === 'bigint') &&
        typeof SharedArrayBuffer !== 'undefined' &&
        a.buffer instanceof SharedArrayBuffer);
}
// =============================================================================
// Type Definitions for Registration
// =============================================================================
/**
 * Parallel/concurrent computing types
 */
const PARALLEL_TYPES = [
    { name: 'Future', test: isFuture },
    { name: 'Stream', test: isStream },
    { name: 'Channel', test: isChannel },
    { name: 'SharedArray', test: isSharedArray },
    { name: 'AtomicNumber', test: isAtomicNumber },
];

/**
 * TypedArray Types
 *
 * This module provides type definitions for JavaScript TypedArrays
 * including all standard variants.
 */
// =============================================================================
// Type Test Functions
// =============================================================================
/**
 * Test if value is a TypedArray (any variant)
 */
function isTypedArray(x) {
    return (x instanceof Int8Array ||
        x instanceof Uint8Array ||
        x instanceof Int16Array ||
        x instanceof Uint16Array ||
        x instanceof Int32Array ||
        x instanceof Uint32Array ||
        x instanceof Float32Array ||
        x instanceof Float64Array ||
        x instanceof BigInt64Array ||
        x instanceof BigUint64Array);
}
/**
 * Test if value is a Float32Array
 */
function isFloat32Array(x) {
    return x instanceof Float32Array;
}
/**
 * Test if value is a Float64Array
 */
function isFloat64Array(x) {
    return x instanceof Float64Array;
}
/**
 * Test if value is an Int8Array
 */
function isInt8Array(x) {
    return x instanceof Int8Array;
}
/**
 * Test if value is an Int16Array
 */
function isInt16Array(x) {
    return x instanceof Int16Array;
}
/**
 * Test if value is an Int32Array
 */
function isInt32Array(x) {
    return x instanceof Int32Array;
}
/**
 * Test if value is a Uint8Array
 */
function isUint8Array(x) {
    return x instanceof Uint8Array;
}
/**
 * Test if value is a Uint16Array
 */
function isUint16Array(x) {
    return x instanceof Uint16Array;
}
/**
 * Test if value is a Uint32Array
 */
function isUint32Array(x) {
    return x instanceof Uint32Array;
}
/**
 * Test if value is a BigInt64Array
 */
function isBigInt64Array(x) {
    return x instanceof BigInt64Array;
}
/**
 * Test if value is a BigUint64Array
 */
function isBigUint64Array(x) {
    return x instanceof BigUint64Array;
}
// =============================================================================
// Type Definitions for Registration
// =============================================================================
/**
 * Array types
 */
const ARRAY_TYPES = [
    { name: 'TypedArray', test: isTypedArray },
    { name: 'Int8Array', test: isInt8Array },
    { name: 'Int16Array', test: isInt16Array },
    { name: 'Int32Array', test: isInt32Array },
    { name: 'Uint8Array', test: isUint8Array },
    { name: 'Uint16Array', test: isUint16Array },
    { name: 'Uint32Array', test: isUint32Array },
    { name: 'Float32Array', test: isFloat32Array },
    { name: 'Float64Array', test: isFloat64Array },
    { name: 'BigInt64Array', test: isBigInt64Array },
    { name: 'BigUint64Array', test: isBigUint64Array },
];

/**
 * GPU and Accelerator Types
 *
 * This module provides type definitions for GPU-accelerated computing
 * including WebGPU buffers and GPU tensors.
 */
// =============================================================================
// Type Test Functions
// =============================================================================
/**
 * Test if value is a GPUBuffer (WebGPU)
 */
function isGPUBuffer(x) {
    if (x === null || typeof x !== 'object')
        return false;
    const b = x;
    return 'size' in b && 'usage' in b && typeof b.size === 'number' && typeof b.usage === 'number';
}
/**
 * Test if value is a GPUTensor
 */
function isGPUTensor(x) {
    if (x === null || typeof x !== 'object')
        return false;
    const t = x;
    return ('shape' in t &&
        'dtype' in t &&
        'device' in t &&
        Array.isArray(t.shape) &&
        typeof t.dtype === 'string' &&
        typeof t.device === 'string');
}
// =============================================================================
// Type Definitions for Registration
// =============================================================================
/**
 * GPU/Accelerator types
 */
const GPU_TYPES = [
    { name: 'GPUBuffer', test: isGPUBuffer },
    { name: 'GPUTensor', test: isGPUTensor },
];

/**
 * Decimal and Arbitrary Precision Types
 *
 * This module provides type definitions for arbitrary precision decimals,
 * IEEE 754 decimal formats, and currency-aware numeric types.
 */
// =============================================================================
// Type Test Functions
// =============================================================================
/**
 * Test if value is a Decimal (arbitrary precision)
 */
function isDecimal(x) {
    if (x === null || typeof x !== 'object')
        return false;
    const d = x;
    return typeof d.toString === 'function' && typeof d.toNumber === 'function';
}
/**
 * Test if value is a BigFloat
 */
function isBigFloat(x) {
    if (x === null || typeof x !== 'object')
        return false;
    const bf = x;
    return ('mantissa' in bf &&
        'exponent' in bf &&
        'precision' in bf &&
        typeof bf.mantissa === 'bigint' &&
        typeof bf.exponent === 'number' &&
        typeof bf.precision === 'number');
}
/**
 * Test if value is a Decimal32
 */
function isDecimal32(x) {
    if (x === null || typeof x !== 'object')
        return false;
    const d = x;
    return ('_decimal32' in d &&
        d._decimal32 === true &&
        typeof d.coefficient === 'number' &&
        typeof d.exponent === 'number' &&
        typeof d.sign === 'boolean');
}
/**
 * Test if value is a Decimal64
 */
function isDecimal64(x) {
    if (x === null || typeof x !== 'object')
        return false;
    const d = x;
    return ('_decimal64' in d &&
        d._decimal64 === true &&
        typeof d.coefficient === 'bigint' &&
        typeof d.exponent === 'number' &&
        typeof d.sign === 'boolean');
}
/**
 * Test if value is a Decimal128
 */
function isDecimal128(x) {
    if (x === null || typeof x !== 'object')
        return false;
    const d = x;
    return ('_decimal128' in d &&
        d._decimal128 === true &&
        typeof d.coefficient === 'bigint' &&
        typeof d.exponent === 'number' &&
        typeof d.sign === 'boolean');
}
/**
 * Test if value is a Money type
 */
function isMoney(x) {
    if (x === null || typeof x !== 'object')
        return false;
    const m = x;
    return ('amount' in m &&
        'currency' in m &&
        'decimals' in m &&
        typeof m.amount === 'bigint' &&
        typeof m.currency === 'string' &&
        typeof m.decimals === 'number');
}
/**
 * Test if value is a FixedDecimal
 */
function isFixedDecimal(x) {
    if (x === null || typeof x !== 'object')
        return false;
    const fd = x;
    return ('value' in fd && 'scale' in fd && typeof fd.value === 'bigint' && typeof fd.scale === 'number');
}
/**
 * Test if value is a Rational
 */
function isRational(x) {
    if (x === null || typeof x !== 'object')
        return false;
    const r = x;
    return 'num' in r && 'den' in r && typeof r.num === 'bigint' && typeof r.den === 'bigint';
}
// =============================================================================
// Type Definitions for Registration
// =============================================================================
/**
 * Decimal types for arbitrary precision arithmetic
 */
const DECIMAL_TYPES = [
    { name: 'Decimal', test: isDecimal },
    { name: 'BigFloat', test: isBigFloat },
    { name: 'Decimal32', test: isDecimal32 },
    { name: 'Decimal64', test: isDecimal64 },
    { name: 'Decimal128', test: isDecimal128 },
    { name: 'Money', test: isMoney },
    { name: 'FixedDecimal', test: isFixedDecimal },
    { name: 'Rational', test: isRational },
];
// =============================================================================
// Factory Functions
// =============================================================================
/**
 * Create a BigFloat
 */
function bigFloat(mantissa, exponent, precision = 53) {
    return { mantissa, exponent, precision };
}
/**
 * Create a Decimal32
 */
function decimal32(coefficient, exponent, sign = false) {
    return { coefficient, exponent, sign, _decimal32: true };
}
/**
 * Create a Decimal64
 */
function decimal64(coefficient, exponent, sign = false) {
    return { coefficient, exponent, sign, _decimal64: true };
}
/**
 * Create a Decimal128
 */
function decimal128(coefficient, exponent, sign = false) {
    return { coefficient, exponent, sign, _decimal128: true };
}
/**
 * Create a Money value
 * @param amount Amount in smallest unit (e.g., cents)
 * @param currency ISO 4217 currency code
 * @param decimals Number of decimal places (default 2)
 */
function money(amount, currency, decimals = 2) {
    return { amount, currency, decimals };
}
/**
 * Create a FixedDecimal
 * @param value The scaled integer value
 * @param scale Number of decimal places
 */
function fixedDecimal(value, scale) {
    return { value, scale };
}
/**
 * Create a Rational number
 * @param num Numerator
 * @param den Denominator (must not be zero)
 */
function rational(num, den) {
    if (den === BigInt(0)) {
        throw new Error('Denominator cannot be zero');
    }
    return { num, den };
}

/**
 * Export Types - Central Re-export Module
 *
 * This module re-exports all type definitions from their
 * respective modules for convenience.
 */
// Re-export complex types
/**
 * Combined linear algebra types for backwards compatibility
 */
const LINEAR_ALGEBRA_TYPES = [
    ...VECTOR_TYPES,
    ...MATRIX_TYPES,
    ...TENSOR_TYPES,
    ...SPARSE_MATRIX_TYPES,
    ...QUATERNION_TYPES,
];
/**
 * Combined measurement types for backwards compatibility
 */
const MEASUREMENT_TYPES = [
    ...UNIT_TYPES,
    ...INTERVAL_TYPES,
    ...UNCERTAINTY_TYPES,
    ...RANGE_TYPES,
    ...POLYNOMIAL_TYPES,
];
/**
 * Alias for MEASUREMENT_TYPES for backwards compatibility
 */
const SCIENTIFIC_TYPES = MEASUREMENT_TYPES;
/**
 * Alias for ARRAY_TYPES for backwards compatibility
 */
const TYPED_ARRAY_TYPES = ARRAY_TYPES;
/**
 * All advanced types combined
 */
const ADVANCED_TYPES = [
    ...COMPLEX_TYPES,
    ...FRACTION_TYPES,
    ...BIGDOUBLE_TYPES,
    ...NUMERIC_TYPES,
    ...LINEAR_ALGEBRA_TYPES,
    ...MEASUREMENT_TYPES,
    ...PARALLEL_TYPES,
    ...ARRAY_TYPES,
    ...GPU_TYPES,
    ...DECIMAL_TYPES,
];

/**
 * typed-function v5.0
 *
 * Type checking for JavaScript functions
 *
 * This is the main entry point for the typed-function library.
 */
/**
 * Check if an entity is a typed function created by any instance
 */
function isTypedFunction(entity) {
    return entity !== null && typeof entity === 'function' && '_typedFunctionData' in entity;
}

exports.ADVANCED_TYPES = ADVANCED_TYPES;
exports.ARRAY_TYPES = ARRAY_TYPES;
exports.BIGDOUBLE_TYPES = BIGDOUBLE_TYPES;
exports.BRAND_SYMBOL = BRAND_SYMBOL;
exports.BUILTIN_TYPES = BUILTIN_TYPES;
exports.COMPLEX_TYPES = COMPLEX_TYPES;
exports.ConversionManager = ConversionManager;
exports.DECIMAL_TYPES = DECIMAL_TYPES;
exports.DuplicateTypeError = DuplicateTypeError;
exports.FRACTION_TYPES = FRACTION_TYPES;
exports.GPU_TYPES = GPU_TYPES;
exports.LINEAR_ALGEBRA_TYPES = LINEAR_ALGEBRA_TYPES;
exports.MEASUREMENT_TYPES = MEASUREMENT_TYPES;
exports.NOT_TYPED_FUNCTION = NOT_TYPED_FUNCTION;
exports.NUMERIC_TYPES = NUMERIC_TYPES;
exports.PARALLEL_TYPES = PARALLEL_TYPES;
exports.SCIENTIFIC_TYPES = SCIENTIFIC_TYPES;
exports.SignatureMismatchError = SignatureMismatchError;
exports.SignatureNotFoundError = SignatureNotFoundError;
exports.TYPED_ARRAY_TYPES = TYPED_ARRAY_TYPES;
exports.TYPE_SYMBOL = TYPE_SYMBOL;
exports.TooFewArgumentsError = TooFewArgumentsError;
exports.TooManyArgumentsError = TooManyArgumentsError;
exports.TypeCache = TypeCache;
exports.TypeMasks = TypeMasks;
exports.TypeMismatchError = TypeMismatchError;
exports.TypeNotFoundError = TypeNotFoundError;
exports.TypeRegistry = TypeRegistry;
exports.TypedFunctionError = TypedFunctionError;
exports.WasmInitializationError = WasmInitializationError;
exports.WasmNotAvailableError = WasmNotAvailableError;
exports.addDebugHandler = addDebugHandler;
exports.addTypeIdentification = addTypeIdentification;
exports.arraysEqual = arraysEqual;
exports.availableConversions = availableConversions;
exports.bigDecimal = bigDecimal;
exports.bigDouble = bigDouble;
exports.bigFloat = bigFloat;
exports.cachedTypeResolve = cachedTypeResolve;
exports.checkName = checkName;
exports.clearAllInstanceRegistries = clearAllInstanceRegistries;
exports.clearInstanceRegistry = clearInstanceRegistry;
exports.clearResolutions = clearResolutions;
exports.collectResolutions = collectResolutions;
exports.combineMasks = combineMasks;
exports.compareParams = compareParams;
exports.compareSignatures = compareSignatures;
exports.compileArgConversion = compileArgConversion;
exports.compileArgsPreprocessing = compileArgsPreprocessing;
exports.compileSignatureTests = compileSignatureTests;
exports.compileTest = compileTest;
exports.compileTests = compileTests;
exports.complex = complex;
exports.configureDebug = configureDebug;
exports.conflicting = conflicting;
exports.create = create;
exports.createArray = createArray;
exports.createBundlerSafeTest = createBundlerSafeTest;
exports.createConversionManager = createConversionManager;
exports.createDispatcher = createDispatcher;
exports.createError = createError;
exports.createFastPathDispatcher = createFastPathDispatcher;
exports.createFastPathSlot = createFastPathSlot;
exports.createGenericDispatcher = createGenericDispatcher;
exports.createInactiveSlot = createInactiveSlot;
exports.createMask = createMask;
exports.createParamTest = createParamTest;
exports.createSignatureComparator = createSignatureComparator;
exports.createSimpleDispatcher = createSimpleDispatcher;
exports.createTypeCache = createTypeCache;
exports.createTypeRegistry = createTypeRegistry;
exports.createTypedClass = createTypedClass;
exports.createTypedFunction = createTypedFunction;
exports.decimal128 = decimal128;
exports.decimal32 = decimal32;
exports.decimal64 = decimal64;
exports.default = typedInstance;
exports.defaultOnMismatch = defaultOnMismatch;
exports.disableDebug = disableDebug;
exports.emitDebugEvent = emitDebugEvent;
exports.enableDebug = enableDebug;
exports.expandParam = expandParam;
exports.findInArray = findInArray;
exports.fixedDecimal = fixedDecimal;
exports.flatMap = flatMap;
exports.formatArgs = formatArgs;
exports.formatParam = formatParam;
exports.formatSignature = formatSignature;
exports.fraction = fraction;
exports.getBrandFromSymbol = getBrandFromSymbol;
exports.getDebugLevel = getDebugLevel;
exports.getLowestConversionIndex = getLowestConversionIndex;
exports.getLowestTypeIndex = getLowestTypeIndex;
exports.getObjectName = getObjectName;
exports.getParamAtIndex = getParamAtIndex;
exports.getProperty = getProperty;
exports.getTypeByConstructor = getTypeByConstructor;
exports.getTypeFromSymbol = getTypeFromSymbol;
exports.getTypeSetAtIndex = getTypeSetAtIndex$1;
exports.globalTypeCache = globalTypeCache;
exports.hasCompiledTests = hasCompiledTests;
exports.hasImplementations = hasImplementations;
exports.hasItem = hasItem;
exports.hasOwnProperty = hasOwnProperty;
exports.hasRestParam = hasRestParam;
exports.hasRestParamError = hasRestParam$2;
exports.identifyType = identifyType;
exports.initial = initial;
exports.interval = interval;
exports.isAtomicNumber = isAtomicNumber;
exports.isBigDecimal = isBigDecimal;
exports.isBigDouble = isBigDouble;
exports.isBigFloat = isBigFloat;
exports.isBigInt64Array = isBigInt64Array;
exports.isBigUint64Array = isBigUint64Array;
exports.isChannel = isChannel;
exports.isComplex = isComplex;
exports.isDebugEnabled = isDebugEnabled;
exports.isDecimal = isDecimal;
exports.isDecimal128 = isDecimal128;
exports.isDecimal32 = isDecimal32;
exports.isDecimal64 = isDecimal64;
exports.isEmptyObject = isEmptyObject;
exports.isExactType = isExactType$1;
exports.isFastPathEligible = isFastPathEligible;
exports.isFixedDecimal = isFixedDecimal;
exports.isFloat32 = isFloat32;
exports.isFloat32Array = isFloat32Array;
exports.isFloat64 = isFloat64;
exports.isFloat64Array = isFloat64Array;
exports.isFraction = isFraction;
exports.isFuture = isFuture;
exports.isGPUBuffer = isGPUBuffer;
exports.isGPUTensor = isGPUTensor;
exports.isInt16 = isInt16;
exports.isInt16Array = isInt16Array;
exports.isInt32 = isInt32;
exports.isInt32Array = isInt32Array;
exports.isInt64 = isInt64;
exports.isInt8 = isInt8;
exports.isInt8Array = isInt8Array;
exports.isInterval = isInterval;
exports.isMatrix = isMatrix;
exports.isMoney = isMoney;
exports.isPlainObject = isPlainObject;
exports.isPolynomial = isPolynomial;
exports.isQuaternion = isQuaternion;
exports.isRange = isRange;
exports.isRational = isRational;
exports.isReferTo = isReferTo;
exports.isReferToSelf = isReferToSelf;
exports.isRegisteredInstance = isRegisteredInstance;
exports.isRegisteredType = isRegisteredType;
exports.isSharedArray = isSharedArray;
exports.isSparseMatrix = isSparseMatrix;
exports.isStream = isStream;
exports.isTensor = isTensor;
exports.isTooFewArgumentsError = isTooFewArgumentsError;
exports.isTooManyArgumentsError = isTooManyArgumentsError;
exports.isTypeMismatchError = isTypeMismatchError;
exports.isTypedArray = isTypedArray;
exports.isTypedFunction = isTypedFunction;
exports.isTypedFunctionError = isTypedFunctionError;
exports.isUInt16 = isUInt16;
exports.isUInt32 = isUInt32;
exports.isUInt64 = isUInt64;
exports.isUInt8 = isUInt8;
exports.isUint16Array = isUint16Array;
exports.isUint32Array = isUint32Array;
exports.isUint8Array = isUint8Array;
exports.isUncertainty = isUncertainty;
exports.isUnit = isUnit;
exports.isVector = isVector;
exports.isWasmNotAvailableError = isWasmNotAvailableError;
exports.last = last;
exports.makeReferTo = makeReferTo;
exports.makeReferToSelf = makeReferToSelf;
exports.mapObject = mapObject;
exports.matrix = matrix;
exports.mergeExpectedParams = mergeExpectedParams;
exports.mergeObjects = mergeObjects;
exports.mergeSignatures = mergeSignatures;
exports.money = money;
exports.nullableMask = nullableMask;
exports.objectSize = objectSize;
exports.omit = omit;
exports.optionalMask = optionalMask;
exports.paramTypeSet = paramTypeSet;
exports.parseParam = parseParam;
exports.parseSignature = parseSignature;
exports.pick = pick;
exports.polynomial = polynomial;
exports.quaternion = quaternion;
exports.range = range;
exports.rational = rational;
exports.registerConstructor = registerConstructor;
exports.registerInstance = registerInstance;
exports.resetDebug = resetDebug;
exports.resolveReferences = resolveReferences;
exports.shallowCopy = shallowCopy;
exports.slice = slice;
exports.splitParams = splitParams;
exports.stringifyParams = stringifyParams;
exports.stringifyParamsError = stringifyParams$1;
exports.tensor = tensor;
exports.uncertainty = uncertainty;
exports.unit = unit;
exports.unregisterConstructor = unregisterConstructor;
exports.validateDeprecatedThis = validateDeprecatedThis;
exports.vector = vector;
exports.wrapWithDebug = wrapWithDebug;
//# sourceMappingURL=typed-function.cjs.map
