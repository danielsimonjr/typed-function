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
export declare function isPlainObject(x: unknown): x is Record<string, unknown>;
/**
 * Check if a value has a specific property
 *
 * @param obj - The object to check
 * @param prop - The property name
 * @returns true if the object has the property
 */
export declare function hasOwnProperty(obj: unknown, prop: string): boolean;
/**
 * Safely get a property from an object
 *
 * @param obj - The object to get the property from
 * @param prop - The property name
 * @returns The property value, or undefined
 */
export declare function getProperty<T>(obj: Record<string, T>, prop: string): T | undefined;
/**
 * Create a shallow copy of an object
 *
 * @param obj - The object to copy
 * @returns A new object with the same properties
 */
export declare function shallowCopy<T extends object>(obj: T): T;
/**
 * Map over object entries and return a new object
 *
 * @param obj - The object to map over
 * @param callback - Function that transforms each entry
 * @returns A new object with transformed values
 */
export declare function mapObject<T, U>(obj: Record<string, T>, callback: (value: T, key: string) => U): Record<string, U>;
/**
 * Get the number of own properties in an object
 *
 * @param obj - The object to count properties in
 * @returns The number of own properties
 */
export declare function objectSize(obj: object): number;
/**
 * Check if an object is empty (has no own properties)
 *
 * @param obj - The object to check
 * @returns true if the object has no own properties
 */
export declare function isEmptyObject(obj: object): boolean;
/**
 * Merge multiple objects into a new object
 *
 * Later objects override earlier ones.
 *
 * @param objects - Objects to merge
 * @returns A new merged object
 */
export declare function mergeObjects<T extends object>(...objects: T[]): T;
/**
 * Pick specific keys from an object
 *
 * @param obj - The source object
 * @param keys - The keys to pick
 * @returns A new object with only the specified keys
 */
export declare function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>;
/**
 * Omit specific keys from an object
 *
 * @param obj - The source object
 * @param keys - The keys to omit
 * @returns A new object without the specified keys
 */
export declare function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K>;
//# sourceMappingURL=object-helpers.d.ts.map