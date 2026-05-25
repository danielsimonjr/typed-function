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
declare class TypeCache {
    /** WeakMap storing type names by object reference */
    private cache;
    /** Counter for cache hits (for debugging/metrics) */
    private hits;
    /** Counter for cache misses (for debugging/metrics) */
    private misses;
    /** Whether caching is enabled */
    private enabled;
    /**
     * Get a cached type name for an object.
     *
     * @param value - The value to look up
     * @returns The cached type name, or undefined if not cached
     */
    get(value: unknown): string | undefined;
    /**
     * Cache a type name for an object.
     *
     * @param value - The value to cache
     * @param typeName - The type name to associate
     */
    set(value: unknown, typeName: string): void;
    /**
     * Check if a value is cached.
     *
     * @param value - The value to check
     * @returns true if the value is cached
     */
    has(value: unknown): boolean;
    /**
     * Remove a value from the cache.
     *
     * @param value - The value to remove
     * @returns true if the value was cached and removed
     */
    delete(value: unknown): boolean;
    /**
     * Clear all cached entries.
     *
     * Note: This creates a new WeakMap. Existing entries will be
     * garbage collected when their keys are no longer referenced.
     */
    clear(): void;
    /**
     * Enable caching.
     */
    enable(): void;
    /**
     * Disable caching.
     */
    disable(): void;
    /**
     * Check if caching is enabled.
     */
    isEnabled(): boolean;
    /**
     * Get cache statistics.
     *
     * @returns Object with hit and miss counts
     */
    getStats(): {
        hits: number;
        misses: number;
        hitRate: number;
    };
    /**
     * Reset cache statistics.
     */
    resetStats(): void;
}
/**
 * Global type cache instance.
 *
 * This is shared across all typed-function instances for maximum efficiency,
 * since type identification is global (same object = same type).
 */
export declare const globalTypeCache: TypeCache;
/**
 * Create a new isolated type cache.
 *
 * Use this if you need separate caching for different typed-function instances.
 *
 * @returns A new TypeCache instance
 */
export declare function createTypeCache(): TypeCache;
/**
 * Helper function to get or compute a type name with caching.
 *
 * @param value - The value to resolve
 * @param compute - Function to compute the type name if not cached
 * @param cache - Optional cache to use (defaults to global cache)
 * @returns The type name
 */
export declare function cachedTypeResolve(value: unknown, compute: (value: unknown) => string, cache?: TypeCache): string;
export { TypeCache };
//# sourceMappingURL=type-cache.d.ts.map