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
export function time(fn: () => unknown): TimingResult {
  const startTime = performance.now();
  fn();
  const endTime = performance.now();

  const durationMs = endTime - startTime;
  const durationUs = durationMs * 1000;
  const opsPerSecond = durationMs > 0 ? 1000 / durationMs : Infinity;

  return {
    durationMs,
    durationUs,
    opsPerSecond,
    startTime,
    endTime,
  };
}

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
export function timeAvg(fn: () => unknown, iterations: number): TimingResult {
  const startTime = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const endTime = performance.now();

  const durationMs = endTime - startTime;
  const avgMs = durationMs / iterations;
  const avgUs = avgMs * 1000;
  const opsPerSecond = avgMs > 0 ? 1000 / avgMs : Infinity;

  return {
    durationMs: avgMs,
    durationUs: avgUs,
    opsPerSecond,
    startTime,
    endTime,
  };
}

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
export function benchmark(
  fn: () => unknown,
  options: {
    /** Number of iterations (default: 1000) */
    iterations?: number;
    /** Warmup iterations (default: 100) */
    warmup?: number;
  } = {}
): BenchmarkResult {
  const { iterations = 1000, warmup = 100 } = options;

  // Warmup phase
  for (let i = 0; i < warmup; i++) {
    fn();
  }

  // Collect individual timings
  const timings: number[] = [];
  const startTime = performance.now();

  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    fn();
    const t1 = performance.now();
    timings.push((t1 - t0) * 1000); // Convert to microseconds
  }

  const endTime = performance.now();
  const totalMs = endTime - startTime;

  // Calculate statistics
  const sum = timings.reduce((a, b) => a + b, 0);
  const avgUs = sum / iterations;
  const minUs = Math.min(...timings);
  const maxUs = Math.max(...timings);

  // Standard deviation
  const squaredDiffs = timings.map((t) => Math.pow(t - avgUs, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / iterations;
  const stdDevUs = Math.sqrt(avgSquaredDiff);

  const avgMs = avgUs / 1000;
  const opsPerSecond = avgMs > 0 ? 1000 / avgMs : Infinity;

  return {
    iterations,
    totalMs,
    avgMs,
    avgUs,
    minUs,
    maxUs,
    opsPerSecond,
    stdDevUs,
    timings,
  };
}

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
export function compare(
  fns: Record<string, () => unknown>,
  iterations: number = 1000
): Record<string, BenchmarkResult & { relative: number }> {
  const results: Record<string, BenchmarkResult & { relative: number }> = {};

  // Run benchmarks
  for (const name in fns) {
    const fn = fns[name];
    if (fn) {
      results[name] = { ...benchmark(fn, { iterations }), relative: 1 };
    }
  }

  // Calculate relative performance (baseline is fastest)
  const entries = Object.entries(results);
  if (entries.length > 0) {
    const fastest = Math.min(...entries.map(([, r]) => r.avgUs));

    for (const [, result] of entries) {
      result.relative = result.avgUs / fastest;
    }
  }

  return results;
}

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
export function timeCreation(
  createFn: () => TypedFunction,
  iterations: number = 100
): BenchmarkResult {
  return benchmark(createFn, { iterations, warmup: 10 });
}

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
export function timeDispatch(
  fn: TypedFunction | SignatureFunction,
  argSets: unknown[][],
  iterations: number = 1000
): BenchmarkResult[] {
  return argSets.map((args) =>
    benchmark(() => (fn as (...args: unknown[]) => unknown)(...args), { iterations, warmup: 100 })
  );
}

/**
 * Create a performance profile of a typed function
 *
 * @param fn - Typed function to profile
 * @param testCases - Array of test case arguments
 * @param options - Profiling options
 * @returns Comprehensive profile results
 */
export function profile(
  fn: TypedFunction,
  testCases: unknown[][],
  options: { iterations?: number } = {}
): {
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
} {
  const { iterations = 1000 } = options;

  const dispatches = testCases.map((args) => ({
    args,
    benchmark: benchmark(() => (fn as (...args: unknown[]) => unknown)(...args), {
      iterations,
      warmup: 50,
    }),
  }));

  // Calculate summary
  const avgUs = dispatches.map((d) => d.benchmark.avgUs);
  const avgDispatchUs = avgUs.reduce((a, b) => a + b, 0) / avgUs.length;
  const minDispatchUs = Math.min(...avgUs);
  const maxDispatchUs = Math.max(...avgUs);
  const totalOpsPerSecond = dispatches.reduce((sum, d) => sum + d.benchmark.opsPerSecond, 0);

  return {
    functionName: fn.name || '(anonymous)',
    signatureCount: fn._typedFunctionData.signatures.length,
    dispatches,
    summary: {
      avgDispatchUs,
      minDispatchUs,
      maxDispatchUs,
      totalOpsPerSecond,
    },
  };
}

/**
 * Format benchmark results as a readable string
 *
 * @param result - Benchmark result
 * @param name - Optional name for the benchmark
 * @returns Formatted string
 */
export function formatBenchmark(result: BenchmarkResult, name?: string): string {
  const lines: string[] = [];

  if (name) {
    lines.push(`Benchmark: ${name}`);
  }

  lines.push(`  Iterations: ${result.iterations}`);
  lines.push(`  Total time: ${result.totalMs.toFixed(2)}ms`);
  lines.push(`  Average: ${result.avgUs.toFixed(3)}µs (${result.avgMs.toFixed(6)}ms)`);
  lines.push(`  Min: ${result.minUs.toFixed(3)}µs`);
  lines.push(`  Max: ${result.maxUs.toFixed(3)}µs`);
  lines.push(`  Std Dev: ${result.stdDevUs.toFixed(3)}µs`);
  lines.push(`  Ops/sec: ${result.opsPerSecond.toFixed(0)}`);

  return lines.join('\n');
}
