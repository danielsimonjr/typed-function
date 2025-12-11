/**
 * typed-function v5.0.0
 * https://github.com/josdejong/typed-function
 *
 * Type checking for JavaScript functions
 *
 * @license MIT
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.typed = {}));
})(this, (function (exports) { 'use strict';

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
            this.nextTypeBit = 10;
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
                case 'object': {
                    if (Array.isArray(value))
                        return 1 << ARRAY_BIT;
                    if (value instanceof Date)
                        return 1 << DATE_BIT;
                    if (value instanceof RegExp)
                        return 1 << REGEXP_BIT;
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
            this.nextTypeBit = 10;
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
     * Implements optimized dispatch for up to 6 signatures with max 2 arguments.
     * Falls back to generic dispatcher for more complex cases.
     */
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
     * (max 2 parameters, no rest param)
     */
    function isFastPathEligible(signature) {
        return signature.params.length <= 2 && !hasRestParam(signature.params);
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
        if (registry) {
            test0 = params[0] ? compileTest(params[0], registry) : ok;
            test1 = params[1] ? compileTest(params[1], registry) : ok;
        }
        else {
            test0 = params[0] ? createSimpleTest(params[0]) : ok;
            test1 = params[1] ? createSimpleTest(params[1]) : ok;
        }
        return {
            test0,
            test1,
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
        // Create slots for first 6 signatures
        for (let i = 0; i < 6; i++) {
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
            genericStartIndex: allActive ? 6 : 0,
        };
    }
    /**
     * Create the fast-path dispatch function
     *
     * This returns a function that tries fast-path dispatch for the first 6 signatures,
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
        // Extract slot data for closure optimization
        const slot0 = fp.slots[0] || createInactiveSlot();
        const slot1 = fp.slots[1] || createInactiveSlot();
        const slot2 = fp.slots[2] || createInactiveSlot();
        const slot3 = fp.slots[3] || createInactiveSlot();
        const slot4 = fp.slots[4] || createInactiveSlot();
        const slot5 = fp.slots[5] || createInactiveSlot();
        const test00 = slot0.test0;
        const test01 = slot0.test1;
        const test10 = slot1.test0;
        const test11 = slot1.test1;
        const test20 = slot2.test0;
        const test21 = slot2.test1;
        const test30 = slot3.test0;
        const test31 = slot3.test1;
        const test40 = slot4.test0;
        const test41 = slot4.test1;
        const test50 = slot5.test0;
        const test51 = slot5.test1;
        const fn0 = slot0.fn;
        const fn1 = slot1.fn;
        const fn2 = slot2.fn;
        const fn3 = slot3.fn;
        const fn4 = slot4.fn;
        const fn5 = slot5.fn;
        const len0 = slot0.length;
        const len1 = slot1.length;
        const len2 = slot2.length;
        const len3 = slot3.length;
        const len4 = slot4.length;
        const len5 = slot5.length;
        // Create the typed function with fast-path dispatch
        function theTypedFn(arg0, arg1) {
            const argc = arguments.length;
            // Fast path checks for first 6 signatures
            if (argc === len0 && test00(arg0) && test01(arg1)) {
                return fn0.apply(this, arguments);
            }
            if (argc === len1 && test10(arg0) && test11(arg1)) {
                return fn1.apply(this, arguments);
            }
            if (argc === len2 && test20(arg0) && test21(arg1)) {
                return fn2.apply(this, arguments);
            }
            if (argc === len3 && test30(arg0) && test31(arg1)) {
                return fn3.apply(this, arguments);
            }
            if (argc === len4 && test40(arg0) && test41(arg1)) {
                return fn4.apply(this, arguments);
            }
            if (argc === len5 && test50(arg0) && test51(arg1)) {
                return fn5.apply(this, arguments);
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
        const { registry, conversions, warnAgainstDeprecatedThis = true } = options;
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
        // Fast-path slot variables - intentionally use `let` for closure pattern
        // These are assigned once after theTypedFn is defined, then used via closure
        /* eslint-disable prefer-const */
        let slot0Test0;
        let slot0Test1;
        let slot0Len;
        let slot0Fn;
        let slot1Test0;
        let slot1Test1;
        let slot1Len;
        let slot1Fn;
        let slot2Test0;
        let slot2Test1;
        let slot2Len;
        let slot2Fn;
        let slot3Test0;
        let slot3Test1;
        let slot3Len;
        let slot3Fn;
        let slot4Test0;
        let slot4Test1;
        let slot4Len;
        let slot4Fn;
        let slot5Test0;
        let slot5Test1;
        let slot5Len;
        let slot5Fn;
        /* eslint-enable prefer-const */
        function theTypedFn(arg0, arg1) {
            const argc = arguments.length;
            if (fastPathReady) {
                // Fast path checks for first 6 signatures
                if (argc === slot0Len && slot0Test0(arg0) && slot0Test1(arg1)) {
                    return slot0Fn.apply(this, arguments);
                }
                if (argc === slot1Len && slot1Test0(arg0) && slot1Test1(arg1)) {
                    return slot1Fn.apply(this, arguments);
                }
                if (argc === slot2Len && slot2Test0(arg0) && slot2Test1(arg1)) {
                    return slot2Fn.apply(this, arguments);
                }
                if (argc === slot3Len && slot3Test0(arg0) && slot3Test1(arg1)) {
                    return slot3Fn.apply(this, arguments);
                }
                if (argc === slot4Len && slot4Test0(arg0) && slot4Test1(arg1)) {
                    return slot4Fn.apply(this, arguments);
                }
                if (argc === slot5Len && slot5Test0(arg0) && slot5Test1(arg1)) {
                    return slot5Fn.apply(this, arguments);
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
        // Initialize slot variables from fast-path data
        const inactiveSlot = createInactiveSlot();
        const s0 = fpData.slots[0] || inactiveSlot;
        const s1 = fpData.slots[1] || inactiveSlot;
        const s2 = fpData.slots[2] || inactiveSlot;
        const s3 = fpData.slots[3] || inactiveSlot;
        const s4 = fpData.slots[4] || inactiveSlot;
        const s5 = fpData.slots[5] || inactiveSlot;
        slot0Test0 = s0.test0;
        slot0Test1 = s0.test1;
        slot0Len = s0.length;
        slot0Fn = s0.fn;
        slot1Test0 = s1.test0;
        slot1Test1 = s1.test1;
        slot1Len = s1.length;
        slot1Fn = s1.fn;
        slot2Test0 = s2.test0;
        slot2Test1 = s2.test1;
        slot2Len = s2.length;
        slot2Fn = s2.fn;
        slot3Test0 = s3.test0;
        slot3Test1 = s3.test1;
        slot3Len = s3.length;
        slot3Fn = s3.fn;
        slot4Test0 = s4.test0;
        slot4Test1 = s4.test1;
        slot4Len = s4.length;
        slot4Fn = s4.fn;
        slot5Test0 = s5.test0;
        slot5Test1 = s5.test1;
        slot5Len = s5.length;
        slot5Fn = s5.fn;
        // Create generic dispatcher
        genericDispatch = createGenericDispatcher(name, signatures, fpData.genericStartIndex, onMismatch);
        // Enable fast path
        fastPathReady = true;
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
    /**
     * Initialize WASM module with given exports
     *
     * @param exports - WASM module exports
     */
    function initWasm(exports$1) {
        wasmState.exports = exports$1;
        wasmState.functionTable = [];
        wasmState.initError = null;
        wasmState.initialized = true;
        // Initialize built-in types
        exports$1.initBuiltinTypes();
    }
    /**
     * Check if WASM is available and initialized
     */
    function isWasmAvailable() {
        return wasmState.initialized && wasmState.exports !== null;
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
                throw new Error('WebAssembly not supported');
            }
            // Fetch and instantiate
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`Failed to fetch WASM: ${response.status}`);
            }
            const wasmBuffer = await response.arrayBuffer();
            const wasmModule = await WebAssembly.compile(wasmBuffer);
            const instance = await WebAssembly.instantiate(wasmModule, {
                env: {
                    abort: () => {
                        throw new Error('WASM abort');
                    },
                },
            });
            // Initialize with exports
            initWasm(instance.exports);
            return true;
        }
        catch (error) {
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
        return new URL('../../../build/dispatch.wasm', (typeof document === 'undefined' && typeof location === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : typeof document === 'undefined' ? location.href : (_documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _documentCurrentScript.src || new URL('typed-function.js', document.baseURI).href))).href;
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
    /** Mask for any type (matches all) */
    const TYPE_ANY_MASK = 0xffffffff;
    /** Next available custom type ID */
    let nextCustomTypeId = 10;
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
     */
    function create() {
        // Create type registry (already has 'any' and builtin types from createTypeRegistry)
        const registry = createTypeRegistry();
        // Create conversion manager
        const conversions = createConversionManager(registry);
        // Track creation count
        let createCount = 0;
        /**
         * Check if an entity is a typed function
         */
        function isTypedFunction(entity) {
            return entity !== null && typeof entity === 'function' && '_typedFunctionData' in entity;
        }
        /**
         * Find a specific signature from a typed function
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
         */
        function convert(value, typeName) {
            return conversions.convert(value, typeName);
        }
        /**
         * Resolve the matching signature for given arguments
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
         * Create a referTo reference
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
         * Create a referToSelf reference
         */
        function referToSelf(callback) {
            if (typeof callback !== 'function') {
                throw new TypeError('Callback function expected as first argument');
            }
            return makeReferToSelf(callback);
        }
        /**
         * The main typed function creator
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
            // Auto-register WASM type masks for all new types
            for (const type of types) {
                registerCustomType(type.name);
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
        return typed;
    }
    // Export the default typed instance
    var typedInstance = create();

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

    exports.BUILTIN_TYPES = BUILTIN_TYPES;
    exports.ConversionManager = ConversionManager;
    exports.NOT_TYPED_FUNCTION = NOT_TYPED_FUNCTION;
    exports.TypeMasks = TypeMasks;
    exports.TypeRegistry = TypeRegistry;
    exports.arraysEqual = arraysEqual;
    exports.availableConversions = availableConversions;
    exports.checkName = checkName;
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
    exports.conflicting = conflicting;
    exports.create = create;
    exports.createArray = createArray;
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
    exports.createTypeRegistry = createTypeRegistry;
    exports.createTypedFunction = createTypedFunction;
    exports.default = typedInstance;
    exports.defaultOnMismatch = defaultOnMismatch;
    exports.expandParam = expandParam;
    exports.findInArray = findInArray;
    exports.flatMap = flatMap;
    exports.getLowestConversionIndex = getLowestConversionIndex;
    exports.getLowestTypeIndex = getLowestTypeIndex;
    exports.getObjectName = getObjectName;
    exports.getParamAtIndex = getParamAtIndex;
    exports.getProperty = getProperty;
    exports.getTypeSetAtIndex = getTypeSetAtIndex$1;
    exports.hasCompiledTests = hasCompiledTests;
    exports.hasImplementations = hasImplementations;
    exports.hasItem = hasItem;
    exports.hasOwnProperty = hasOwnProperty;
    exports.hasRestParam = hasRestParam;
    exports.hasRestParamError = hasRestParam$2;
    exports.initial = initial;
    exports.isEmptyObject = isEmptyObject;
    exports.isExactType = isExactType$1;
    exports.isFastPathEligible = isFastPathEligible;
    exports.isPlainObject = isPlainObject;
    exports.isReferTo = isReferTo;
    exports.isReferToSelf = isReferToSelf;
    exports.isTypedFunction = isTypedFunction;
    exports.last = last;
    exports.makeReferTo = makeReferTo;
    exports.makeReferToSelf = makeReferToSelf;
    exports.mapObject = mapObject;
    exports.mergeExpectedParams = mergeExpectedParams;
    exports.mergeObjects = mergeObjects;
    exports.mergeSignatures = mergeSignatures;
    exports.nullableMask = nullableMask;
    exports.objectSize = objectSize;
    exports.omit = omit;
    exports.optionalMask = optionalMask;
    exports.paramTypeSet = paramTypeSet;
    exports.parseParam = parseParam;
    exports.parseSignature = parseSignature;
    exports.pick = pick;
    exports.resolveReferences = resolveReferences;
    exports.shallowCopy = shallowCopy;
    exports.slice = slice;
    exports.splitParams = splitParams;
    exports.stringifyParams = stringifyParams;
    exports.stringifyParamsError = stringifyParams$1;
    exports.validateDeprecatedThis = validateDeprecatedThis;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=typed-function.js.map
