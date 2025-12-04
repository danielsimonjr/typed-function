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
export function last<T>(arr: ArrayLike<T>): T | undefined {
  return arr[arr.length - 1];
}

/**
 * Return all but the last item of an array or array-like object
 *
 * @param arr - The array or array-like object
 * @returns A new array with all elements except the last
 */
export function initial<T>(arr: ArrayLike<T>): T[] {
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
export function slice<T>(arr: ArrayLike<T>, start: number, end?: number): T[] {
  return Array.prototype.slice.call(arr, start, end);
}

/**
 * Flat map over an array, concatenating results
 *
 * @param arr - The array to map over
 * @param callback - Function that returns an array for each element
 * @returns A new array with all results concatenated
 */
export function flatMap<T, U>(arr: T[], callback: (item: T, index: number, array: T[]) => U[]): U[] {
  return arr.reduce((acc: U[], item, index, array) => {
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
export function findInArray<T>(arr: T[], predicate: (item: T, index: number) => boolean): T | undefined {
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
export function hasItem<T>(arr: T[], predicate: (item: T, index: number) => boolean): boolean {
  return findInArray(arr, predicate) !== undefined;
}

/**
 * Create an array with a specified length and fill it using a callback
 *
 * @param length - The length of the array to create
 * @param callback - Function that generates each element
 * @returns A new array with generated elements
 */
export function createArray<T>(length: number, callback: (index: number) => T): T[] {
  const result: T[] = new Array(length);
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
export function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
