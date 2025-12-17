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
 * Cache entry for resolved type information
 */
export interface TypeCacheEntry {
  /** The resolved type name */
  typeName: string;
  /** Timestamp when this entry was created */
  timestamp: number;
}

/**
 * Type cache using WeakMap for object-based caching.
 *
 * This allows type resolution results to be cached for repeated calls
 * with the same object, while still allowing garbage collection when
 * objects are no longer referenced.
 */
class TypeCache {
  /** WeakMap storing type names by object reference */
  private cache = new WeakMap<object, string>();

  /** Counter for cache hits (for debugging/metrics) */
  private hits = 0;

  /** Counter for cache misses (for debugging/metrics) */
  private misses = 0;

  /** Whether caching is enabled */
  private enabled = true;

  /**
   * Get a cached type name for an object.
   *
   * @param value - The value to look up
   * @returns The cached type name, or undefined if not cached
   */
  get(value: unknown): string | undefined {
    if (!this.enabled) return undefined;
    if (value === null || value === undefined) return undefined;
    if (typeof value !== 'object' && typeof value !== 'function') return undefined;

    const result = this.cache.get(value as object);
    if (result !== undefined) {
      this.hits++;
    } else {
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
  set(value: unknown, typeName: string): void {
    if (!this.enabled) return;
    if (value === null || value === undefined) return;
    if (typeof value !== 'object' && typeof value !== 'function') return;

    this.cache.set(value as object, typeName);
  }

  /**
   * Check if a value is cached.
   *
   * @param value - The value to check
   * @returns true if the value is cached
   */
  has(value: unknown): boolean {
    if (!this.enabled) return false;
    if (value === null || value === undefined) return false;
    if (typeof value !== 'object' && typeof value !== 'function') return false;

    return this.cache.has(value as object);
  }

  /**
   * Remove a value from the cache.
   *
   * @param value - The value to remove
   * @returns true if the value was cached and removed
   */
  delete(value: unknown): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value !== 'object' && typeof value !== 'function') return false;

    return this.cache.delete(value as object);
  }

  /**
   * Clear all cached entries.
   *
   * Note: This creates a new WeakMap. Existing entries will be
   * garbage collected when their keys are no longer referenced.
   */
  clear(): void {
    this.cache = new WeakMap();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Enable caching.
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * Disable caching.
   */
  disable(): void {
    this.enabled = false;
  }

  /**
   * Check if caching is enabled.
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get cache statistics.
   *
   * @returns Object with hit and miss counts
   */
  getStats(): { hits: number; misses: number; hitRate: number } {
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
  resetStats(): void {
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
export const globalTypeCache = new TypeCache();

/**
 * Create a new isolated type cache.
 *
 * Use this if you need separate caching for different typed-function instances.
 *
 * @returns A new TypeCache instance
 */
export function createTypeCache(): TypeCache {
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
export function cachedTypeResolve(
  value: unknown,
  compute: (value: unknown) => string,
  cache: TypeCache = globalTypeCache
): string {
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

export { TypeCache };
