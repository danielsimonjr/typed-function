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
export function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && x.constructor === Object;
}

/**
 * Check if a value has a specific property
 *
 * @param obj - The object to check
 * @param prop - The property name
 * @returns true if the object has the property
 */
export function hasOwnProperty(obj: unknown, prop: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

/**
 * Safely get a property from an object
 *
 * @param obj - The object to get the property from
 * @param prop - The property name
 * @returns The property value, or undefined
 */
export function getProperty<T>(obj: Record<string, T>, prop: string): T | undefined {
  return hasOwnProperty(obj, prop) ? obj[prop] : undefined;
}

/**
 * Create a shallow copy of an object
 *
 * @param obj - The object to copy
 * @returns A new object with the same properties
 */
export function shallowCopy<T extends object>(obj: T): T {
  return Object.assign({} as T, obj);
}

/**
 * Map over object entries and return a new object
 *
 * @param obj - The object to map over
 * @param callback - Function that transforms each entry
 * @returns A new object with transformed values
 */
export function mapObject<T, U>(
  obj: Record<string, T>,
  callback: (value: T, key: string) => U
): Record<string, U> {
  const result: Record<string, U> = {};
  for (const key in obj) {
    if (hasOwnProperty(obj, key)) {
      result[key] = callback(obj[key] as T, key);
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
export function objectSize(obj: object): number {
  return Object.keys(obj).length;
}

/**
 * Check if an object is empty (has no own properties)
 *
 * @param obj - The object to check
 * @returns true if the object has no own properties
 */
export function isEmptyObject(obj: object): boolean {
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
export function mergeObjects<T extends object>(...objects: T[]): T {
  return Object.assign({} as T, ...objects);
}

/**
 * Pick specific keys from an object
 *
 * @param obj - The source object
 * @param keys - The keys to pick
 * @returns A new object with only the specified keys
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (hasOwnProperty(obj, key as string)) {
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
export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result as Omit<T, K>;
}
