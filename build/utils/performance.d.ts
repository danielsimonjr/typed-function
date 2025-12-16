/**
 * Performance Timing Utilities for typed-function
 *
 * Provides utilities for measuring dispatch and creation times.
 */
import type { TypedFunction, SignatureFunction } from '../core/types.js';
/**
 * Timing result for a single measurement
 */
export interface TimingResult {
    /** Duration in milliseconds */
    durationMs: number;
    /** Duration in microseconds (more precise) */
    durationUs: number;
    /** Operations per second */
    opsPerSecond: number;
    /** Start timestamp */
    startTime: number;
    /** End timestamp */
    endTime: number;
}
/**
 * Benchmark result with statistics
 */
export interface BenchmarkResult {
    /** Number of iterations run */
    iterations: number;
    /** Total time in milliseconds */
    totalMs: number;
    /** Average time per operation in milliseconds */
    avgMs: number;
    /** Average time per operation in microseconds */
    avgUs: number;
    /** Minimum time per operation in microseconds */
    minUs: number;
    /** Maximum time per operation in microseconds */
    maxUs: number;
    /** Operations per second */
    opsPerSecond: number;
    /** Standard deviation in microseconds */
    stdDevUs: number;
    /** All individual timings in microseconds */
    timings: number[];
}
/**
 * Measure the execution time of a single function call
 *
 * @param fn - Function to measure
 * @param args - Arguments to pass
 * @returns Timing result
 *
 * @example
 * ```ts
 * const add = typed({ 'number, number': (a, b) => a + b });
 * const result = time(() => add(1, 2));
 * console.log(`Duration: ${result.durationMs}ms`);
 * ```
 */
export declare function time(fn: () => unknown): TimingResult;
/**
 * Measure average execution time over multiple iterations
 *
 * @param fn - Function to measure
 * @param iterations - Number of iterations
 * @returns Average timing result
 *
 * @example
 * ```ts
 * const add = typed({ 'number, number': (a, b) => a + b });
 * const result = timeAvg(() => add(1, 2), 10000);
 * console.log(`Average: ${result.avgMs}ms`);
 * console.log(`Ops/sec: ${result.opsPerSecond}`);
 * ```
 */
export declare function timeAvg(fn: () => unknown, iterations: number): TimingResult;
/**
 * Run a comprehensive benchmark with statistics
 *
 * @param fn - Function to benchmark
 * @param options - Benchmark options
 * @returns Detailed benchmark results
 *
 * @example
 * ```ts
 * const add = typed({ 'number, number': (a, b) => a + b });
 * const result = benchmark(() => add(1, 2), { iterations: 10000 });
 * console.log(`Avg: ${result.avgUs}µs, Min: ${result.minUs}µs, Max: ${result.maxUs}µs`);
 * ```
 */
export declare function benchmark(fn: () => unknown, options?: {
    /** Number of iterations (default: 1000) */
    iterations?: number;
    /** Warmup iterations (default: 100) */
    warmup?: number;
}): BenchmarkResult;
/**
 * Compare performance of multiple functions
 *
 * @param fns - Object mapping names to functions
 * @param iterations - Number of iterations per function
 * @returns Comparison results
 *
 * @example
 * ```ts
 * const add1 = typed({ 'number, number': (a, b) => a + b });
 * const add2 = (a: number, b: number) => a + b;
 *
 * const results = compare({
 *   'typed-function': () => add1(1, 2),
 *   'native': () => add2(1, 2),
 * }, 10000);
 *
 * for (const [name, result] of Object.entries(results)) {
 *   console.log(`${name}: ${result.avgUs}µs/op`);
 * }
 * ```
 */
export declare function compare(fns: Record<string, () => unknown>, iterations?: number): Record<string, BenchmarkResult & {
    relative: number;
}>;
/**
 * Measure typed function creation time
 *
 * @param createFn - Factory function that creates a typed function
 * @param iterations - Number of iterations
 * @returns Creation timing results
 *
 * @example
 * ```ts
 * import typed from 'typed-function';
 *
 * const result = timeCreation(() => typed({
 *   'number, number': (a, b) => a + b,
 * }), 100);
 *
 * console.log(`Creation: ${result.avgMs}ms per function`);
 * ```
 */
export declare function timeCreation(createFn: () => TypedFunction, iterations?: number): BenchmarkResult;
/**
 * Measure dispatch time for specific argument types
 *
 * @param fn - Typed function to measure
 * @param argSets - Array of argument arrays to test
 * @param iterations - Number of iterations per argument set
 * @returns Dispatch timing for each argument set
 *
 * @example
 * ```ts
 * const fn = typed({
 *   'number': (x) => x * 2,
 *   'string': (s) => s.toUpperCase(),
 * });
 *
 * const results = timeDispatch(fn, [[42], ['hello']], 5000);
 * console.log(`Number dispatch: ${results[0].avgUs}µs`);
 * console.log(`String dispatch: ${results[1].avgUs}µs`);
 * ```
 */
export declare function timeDispatch(fn: TypedFunction | SignatureFunction, argSets: unknown[][], iterations?: number): BenchmarkResult[];
/**
 * Create a performance profile of a typed function
 *
 * @param fn - Typed function to profile
 * @param testCases - Array of test case arguments
 * @param options - Profiling options
 * @returns Comprehensive profile results
 */
export declare function profile(fn: TypedFunction, testCases: unknown[][], options?: {
    iterations?: number;
}): {
    functionName: string;
    signatureCount: number;
    dispatches: Array<{
        args: unknown[];
        benchmark: BenchmarkResult;
    }>;
    summary: {
        avgDispatchUs: number;
        minDispatchUs: number;
        maxDispatchUs: number;
        totalOpsPerSecond: number;
    };
};
/**
 * Format benchmark results as a readable string
 *
 * @param result - Benchmark result
 * @param name - Optional name for the benchmark
 * @returns Formatted string
 */
export declare function formatBenchmark(result: BenchmarkResult, name?: string): string;
//# sourceMappingURL=performance.d.ts.map