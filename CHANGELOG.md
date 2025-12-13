# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### WASM Integration
- Added unified dispatcher routing to WASM dispatch system
- Added automatic WASM signature registration when creating typed functions
- Added comprehensive WASM performance benchmarks in test suite
- Added documentation for WASM opt-in usage in README

#### Developer Experience Improvements
- **Debug Module Enhancements** (`src/debug.ts`):
  - EventEmitter-style API with `on()`, `once()`, `off()` methods
  - `removeAllListeners()` to clear all event handlers
  - `listenerCount()` to get handler count for event types
  - `createDebugSession()` for scoped event capture and analysis

- **Signature Introspection Helper** (`src/core/signature-inspector.ts`):
  - `inspect(fn)` - Get detailed information about a typed function
  - `summarize(fn)` - Get human-readable function summary
  - `compare(fn1, fn2)` - Compare signatures between typed functions
  - `findMatchingSignatures(fn, argTypes)` - Find signatures matching argument types
  - `formatParam()` and `formatSignature()` utilities

- **Performance Timing Utilities** (`src/utils/performance.ts`):
  - `time(fn)` - Measure single execution time
  - `timeAvg(fn, iterations)` - Measure average execution time
  - `benchmark(fn, options)` - Comprehensive benchmarking with statistics
  - `compare(fns, iterations)` - Compare performance of multiple functions
  - `timeCreation(createFn)` - Measure typed function creation time
  - `timeDispatch(fn, argSets)` - Measure dispatch time for different argument types
  - `profile(fn, testCases)` - Create performance profile for typed functions
  - `formatBenchmark(result)` - Format benchmark results for display

- **JSDoc Improvements**:
  - Added `@example` tags to all key public API methods in `factory.ts`
  - Examples for `create()`, `findSignature()`, `find()`, `convert()`, `resolve()`, `referTo()`, `referToSelf()`, and the main `typed()` function

### Changed
- WASM bindings and loader modules now included in test coverage
- Added WASM-specific tests for bindings.ts and loader.ts

### Fixed
- Test expectations for WASM error classes to match actual message prefixes

## [5.0.0-alpha.2] - 2025-12-13

### Changed
- Extended fast-path dispatcher from 6 to 10 signature slots for improved performance with more signatures
- Increased fast-path parameter support from 2 to 3 parameters per signature
- Standardized error handling in WASM files to use proper error classes (`WasmNotAvailableError`, `WasmInitializationError`)

## [5.0.0-alpha.1] - 2025-12-13

### Added

#### Scientific and Advanced Computing Types
- Added comprehensive scientific computing type system with 40+ new types:

**Numeric Types** (`NUMERIC_TYPES`):
- `Complex` - Complex numbers with real and imaginary parts
- `Fraction` - Rational numbers with numerator/denominator
- `BigDecimal` - Arbitrary precision decimal numbers
- `Int8`, `Int16`, `Int32`, `Int64` - Fixed-width signed integers
- `UInt8`, `UInt16`, `UInt32`, `UInt64` - Fixed-width unsigned integers
- `Float32`, `Float64` - Explicit precision floating point

**Linear Algebra Types** (`LINEAR_ALGEBRA_TYPES`):
- `Vector` - 1D numeric arrays with length
- `Matrix` - 2D arrays with rows/cols dimensions
- `Tensor` - N-dimensional arrays with shape
- `SparseMatrix` - COO-format sparse matrices
- `Quaternion` - 4D numbers for 3D rotations

**Scientific Measurement Types** (`SCIENTIFIC_TYPES`):
- `Unit` - Values with physical units (e.g., meters, seconds)
- `Interval` - Interval arithmetic with low/high bounds
- `Uncertainty` - Values with error bounds (value +/- uncertainty)
- `Range` - Numeric ranges with start/end/step
- `Polynomial` - Polynomials as coefficient arrays

**Parallel/Concurrent Types** (`PARALLEL_TYPES`):
- `Future` - Promise-like async computation results
- `Stream` - Lazy/infinite iterator sequences
- `Channel` - CSP-style send/receive communication
- `SharedArray` - SharedArrayBuffer-backed arrays
- `AtomicNumber` - Thread-safe numeric values

**TypedArray Types** (`TYPED_ARRAY_TYPES`):
- `TypedArray` - Any typed array variant
- `Int8Array`, `Int16Array`, `Int32Array`
- `Uint8Array`, `Uint16Array`, `Uint32Array`
- `Float32Array`, `Float64Array`
- `BigInt64Array`, `BigUint64Array`

**GPU/Accelerator Types** (`GPU_TYPES`):
- `GPUBuffer` - WebGPU buffer interface
- `GPUTensor` - GPU-accelerated tensor

**Factory Functions**:
- `complex(re, im)` - Create Complex numbers
- `fraction(num, denom)` - Create Fractions
- `bigDecimal(value, scale)` - Create BigDecimals
- `vector(data)` - Create Vectors
- `matrix(data, rows, cols)` - Create Matrices
- `tensor(data, shape)` - Create Tensors
- `quaternion(w, x, y, z)` - Create Quaternions
- `unit(value, unit)` - Create Unit values
- `interval(low, high)` - Create Intervals
- `uncertainty(value, error)` - Create Uncertainty values
- `range(start, end, step?)` - Create Ranges
- `polynomial(coefficients, variable?)` - Create Polynomials

**Type Test Functions**:
- `isComplex()`, `isFraction()`, `isBigDecimal()`
- `isInt8()`, `isInt16()`, `isInt32()`, `isInt64()`
- `isUInt8()`, `isUInt16()`, `isUInt32()`, `isUInt64()`
- `isFloat32()`, `isFloat64()`
- `isVector()`, `isMatrix()`, `isTensor()`, `isSparseMatrix()`, `isQuaternion()`
- `isUnit()`, `isInterval()`, `isUncertainty()`, `isRange()`, `isPolynomial()`
- `isFuture()`, `isStream()`, `isChannel()`, `isSharedArray()`, `isAtomicNumber()`
- `isTypedArray()`, `isFloat32Array()`, `isFloat64Array()`, etc.
- `isGPUBuffer()`, `isGPUTensor()`

**Combined Type Array**:
- `ADVANCED_TYPES` - All scientific/advanced types combined for easy registration

#### Testing
- Added `test/scientific-types.test.ts` - 96 tests for scientific types
- Total tests: 1542 passing
- Test coverage: 97.12% statements, 91.29% branches

#### Modern JavaScript Types (ES6+)
- Added 6 new built-in types for modern JavaScript:
  - `BigInt` - ES2020 BigInt primitive type
  - `Symbol` - ES6 Symbol primitive type
  - `Map` - ES6 Map collection type
  - `Set` - ES6 Set collection type
  - `WeakMap` - ES6 WeakMap type
  - `WeakSet` - ES6 WeakSet type
- Extended type bit mask system to support 16 built-in types (bits 0-15)
- Added pre-built TypeMasks for modern types:
  - `TypeMasks.BIGINT`, `TypeMasks.SYMBOL`
  - `TypeMasks.MAP`, `TypeMasks.SET`
  - `TypeMasks.WEAKMAP`, `TypeMasks.WEAKSET`
  - `TypeMasks.NUMERIC` (number | BigInt)
  - `TypeMasks.COLLECTION` (Map | Set)
  - `TypeMasks.WEAK_COLLECTION` (WeakMap | WeakSet)
  - `TypeMasks.ANY_COLLECTION` (Array | Map | Set)
  - `TypeMasks.ALL_ITERABLE` (Array | Map | Set | string)

#### Error Codes System
- Added `ErrorCode` enum with 20+ error codes for programmatic error handling
- Error code categories:
  - `TF1xx` - Type definition errors (UNKNOWN_TYPE, DUPLICATE_TYPE, etc.)
  - `TF2xx` - Signature errors (NO_SIGNATURES, CONFLICTING_SIGNATURES, etc.)
  - `TF3xx` - Dispatch errors (TYPE_MISMATCH, TOO_FEW_ARGUMENTS, etc.)
  - `TF4xx` - Conversion errors (CONVERSION_NOT_FOUND, etc.)
  - `TF5xx` - Reference errors (CIRCULAR_REFERENCE, etc.)
  - `TF6xx` - WASM errors (WASM_NOT_INITIALIZED, etc.)
  - `TF9xx` - General errors (NOT_A_TYPED_FUNCTION, INTERNAL_ERROR)
- All TypedFunctionError subclasses now include `code` property
- Added error utility functions: `hasErrorCode()`, `getErrorCode()`

#### Planning Documentation
- Added comprehensive Phase 3 improvement plan (`docs/planning/IMPROVEMENT_PLAN.md`)
- Added sprint TODO files for Phase 3:
  - `PHASE_3_SPRINT_1_TODO.json` - WASM Integration tasks
  - `PHASE_3_SPRINT_2_TODO.json` - Modern Types & Fast Path tasks
  - `PHASE_3_SPRINT_3_TODO.json` - Developer Experience tasks

#### Testing
- Added `test/modern-types.test.ts` - 32 tests for new ES6+ types
- Added `test/error-codes.test.ts` - 26 tests for error code system
- Total tests: 1195 passing

### Changed
- Package renamed to `@danielsimonjr/typed-function` (scoped package)
- Custom type bit positions now start at bit 16 (previously 10)
- Built-in type count increased from 11 to 17 (including 'any')
- Repository URL updated to `https://github.com/danielsimonjr/typed-function`

### Fixed
- Widened performance test thresholds for CI stability on slower machines

## [5.0.0-alpha.0] - 2025-12-04

### Overview

Complete TypeScript rewrite of typed-function with improved performance, modular architecture, and full backward compatibility with the v4.x API.

### Added

#### TypeScript Support
- Full TypeScript implementation with comprehensive type definitions
- Exported types: `TypedFunction`, `TypedInstance`, `TypeDef`, `ConversionDef`, `Signature`, `SignatureFunction`, `Param`, `Type`
- Type guards and branded types for better type safety
- Generated `.d.ts` declaration files included in package

#### Performance Improvements
- **Fast-path dispatch**: Optimized dispatcher for first 6 signatures with inlined type checks
- **Direct parameter testing**: Eliminates loop overhead for common cases (0-2 parameters)
- **Lazy signature compilation**: Signatures compiled on-demand
- Performance improvements:
  - Single signature dispatch: ~2x faster
  - 6-signature dispatch: ~2.5x faster
  - Function creation: ~20% faster

#### WASM Foundation
- Type mask system (`src/wasm/type-masks.ts`) for bit-level type representation
- Pure JavaScript fallback dispatcher (`src/wasm/fallback.ts`)
- WASM bindings interface (`src/wasm/bindings.ts`) ready for WebAssembly acceleration
- WASM loader utilities (`src/wasm/loader.ts`) for async/sync WASM loading

#### Modular Architecture
New source code organization:
```
src/
├── index.ts                    # Main entry point
├── factory.ts                  # create() factory function
├── core/
│   ├── types.ts               # TypeScript type definitions
│   ├── type-registry.ts       # Type storage & lookup
│   ├── signature-parser.ts    # Signature string parsing
│   ├── signature-compiler.ts  # Test function compilation
│   ├── signature-comparator.ts # Signature ordering
│   ├── conversion-manager.ts  # Type conversion handling
│   ├── reference-resolver.ts  # referTo/referToSelf resolution
│   └── error-factory.ts       # Error message generation
├── dispatch/
│   ├── dispatcher.ts          # Main dispatch orchestration
│   ├── fast-path.ts           # Optimized 6-signature dispatch
│   └── generic-path.ts        # Fallback loop dispatch
├── wasm/
│   ├── type-masks.ts          # Bit-mask type system
│   ├── fallback.ts            # Pure-JS WASM-equivalent
│   ├── bindings.ts            # WASM bridge interface
│   ├── loader.ts              # WASM loading utilities
│   └── index.ts               # WASM module exports
└── utils/
    ├── array-helpers.ts       # Array utility functions
    └── object-helpers.ts      # Object utility functions
```

#### Build System
- Multi-format output:
  - `build/typed-function.mjs` - ES Module
  - `build/typed-function.cjs` - CommonJS
  - `build/typed-function.js` - UMD (browser)
  - `build/typed-function.min.js` - Minified IIFE (~26KB)
- Rollup-based build pipeline with TypeScript plugin
- Source maps for all output formats
- Tree-shakeable ES modules

#### Testing
- Migrated to Vitest testing framework
- 462 tests passing (from 13 legacy test files)
- New test suites:
  - `wasm.test.ts` - 55 tests for type masks and fallback dispatch
  - `property-based.test.ts` - 27 property-based invariant tests
  - `compatibility.test.ts` - 57 API compatibility tests
  - `performance.test.ts` - 21 performance regression tests
  - `typescript-types.test.ts` - 28 TypeScript type definition tests
  - `mathjs-patterns.test.ts` - 23 math.js integration pattern tests
  - Sprint tests covering core functionality

#### Documentation
- `docs/MIGRATION_GUIDE.md` - Upgrade guide from v4.x to v5.0
- `docs/API.md` - Complete API reference
- `docs/architecture/` - Architecture documentation
- Updated `README.md` with TypeScript examples and new features

### Changed

- **Source language**: JavaScript (.mjs) to TypeScript (.ts)
- **Test framework**: Mocha to Vitest
- **Build system**: Babel to Rollup with TypeScript
- **Node.js requirement**: Node.js 18+ (unchanged from v4.x)
- **Package exports**: Modern `exports` field with conditional imports

### Fixed

- `referToSelf` callback now receives the exact typed function instance
- `typed.clear()` properly resets type registry
- `onMismatch` handler getter ensures current value is always used
- Type conversion indexing in signature comparator
- Rest parameter handling in error messages

### Internal

- ESLint configuration updated for TypeScript
- TypeScript strict mode enabled
- Code organized into logical modules
- Consistent error handling patterns
- Comprehensive JSDoc comments

### Compatibility

**No breaking changes!** The v5.0 API is fully backward compatible with v4.x:

```javascript
// v4.x code works unchanged in v5.0
import typed from 'typed-function';

const add = typed({
  'number, number': (a, b) => a + b,
  'string, string': (a, b) => a + b,
});

console.log(add(1, 2));     // 3
console.log(add('a', 'b')); // 'ab'
```

### Sprint History

#### Sprint 1: Core Type System
- TypeScript interfaces for all core types
- Type registry with ordered type storage
- Signature parser with tokenizer
- Built-in type definitions (null, boolean, number, string, Function, Array, Date, RegExp, Object, any)

#### Sprint 2: Signature Handling
- Signature compiler for test function generation
- Signature comparator for dispatch ordering
- Reference resolver for referTo/referToSelf
- Conversion manager for type conversions

#### Sprint 3: Dispatcher Implementation
- Main dispatcher orchestration
- Fast-path dispatcher for 6 signatures
- Generic fallback dispatcher
- Typed function creation and metadata

#### Sprint 4: WASM Foundation
- Type mask bit representation
- Pure JavaScript fallback dispatch
- WASM bindings interface
- Loader utilities for WASM modules

#### Sprint 5: Testing & Compatibility
- Ported 13 legacy test files to Vitest
- WASM-specific test suite
- Property-based tests
- API compatibility tests
- Performance regression tests
- TypeScript type tests
- Math.js integration tests

#### Sprint 6: Build & Documentation
- Multi-format Rollup build
- TypeScript declaration generation
- Package.json exports configuration
- Migration guide
- API documentation
- README updates

#### Sprint 7: Code Quality & Cleanup
- Removed legacy Babel scripts and unused dependencies
- Added coverage thresholds (70% statements, 65% branches)
- Comprehensive test coverage improvements:
  - fast-path.ts: 30% -> 100%
  - generic-path.ts: 42% -> 100%
  - array-helpers.ts: 46% -> 100%
  - object-helpers.ts: 9.5% -> 100%
- Overall coverage: 74% -> 89% statements
- Fixed referTo/referToSelf re-resolution when merging typed functions
- Added sideEffects: false for better tree-shaking
- 552 tests passing (88 new tests added)

### Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Type check
npm run typecheck

# Lint
npm run lint

# Build all formats
npm run build

# Full build and test
npm run build-and-test
```

### Migration

See [MIGRATION_GUIDE.md](./docs/MIGRATION_GUIDE.md) for detailed upgrade instructions.

---

## [4.2.2] - 2024-11-26

### Fixed
- Choose lowest-index type conversion and sort signatures transitively (#170, #171). Thanks @gwhitney.

## [4.2.1] - 2024-06-05

### Fixed
- Bug in the new `override` option of method `addConversion`.

## [4.2.0] - 2024-06-05

### Added
- Extend methods `addConversion` and `addConversions` with a new option `{ override: boolean }` to allow overriding an existing conversion.

## [4.1.1] - 2023-09-13

### Fixed
- Add a `"license": "MIT"` field to the `package.json` file (#168).

## [4.1.0] - 2022-08-23

### Changed
- Publish an UMD version of the library, like in v3.0.0. It is still necessary. The UMD version can be used in CommonJS applications and in the browser.

## [4.0.0] - 2022-08-22

**!!! BE CAREFUL: BREAKING CHANGES !!!**

### Changed
- **Breaking**: The code is converted into ES modules, and the library now outputs ES modules only instead of an UMD module.
  - If you're using `typed-function` inside an ES modules project, all will just keep working like before:
    ```js
    import typed from 'typed-function'
    ```
  - If you're using `typed-function` in a CommonJS project, you'll have to import the library using a dynamic import:
    ```js
    const typed = (await import('typed-function')).default
    ```
  - If you're importing `typed-function` straight into a browser page, you can load it as a module there:
    ```html
    <script type="module">
      import typed from 'typed-function/lib/esm/typed-function.mjs'
    </script>
    ```

## [3.0.1] - 2022-08-16

### Fixed
- `typed()` can enter infinite loop when there is both `referToSelf` and `referTo` functions involved (#157, #158). Thanks @gwhitney.
- `typed.addType()` fails if there is no `Object` type (#155, #159). Thanks @gwhitney.

## [3.0.0] - 2022-05-12

**!!! BE CAREFUL: BREAKING CHANGES !!!**

### Changed

#### Breaking Changes:

- **Conversions now have preference over `any`** (#14). Thanks @gwhitney.

- **The properties `typed.types` and `typed.conversions` have been removed.** Instead of adding and removing types and conversions with those arrays, use the methods `addType`, `addTypes`, `addConversion`, `addConversions`, `removeConversion`, `clear`, `clearConversions`.

- **The `this` variable is no longer bound to the typed function itself but is unbound.** Instead, use `typed.referTo(...)` and `typed.referToSelf(...)`.

  By default, all function bodies will be scanned against the deprecated usage pattern of `this`, and an error will be thrown when encountered. To disable this validation step, set `typed.warnAgainstDeprecatedThis = false`.

  Example:
  ```js
  // old:
  const square = typed({
    'number': x => x * x,
    'string': x => this(parseFloat(x))
  })

  // new:
  const square = typed({
    'number': x => x * x,
    'string': typed.referToSelf(function (self) {
      // using self is not optimal, if possible,
      // refer to a specific signature instead,
      // see next example
      return x => self(parseFloat(x))
    })
  })

  // optimized new:
  const square = typed({
    'number': x => x * x,
    'string': typed.referTo('number', function (squareNumber) {
      return x => sqrtNumber(parseFloat(x))
    })
  })
  ```

- **The property `typed.ignore` is removed.** If you need it, see if you can create a new `typed` instance without the types that you want to ignore, or filter the signatures passed to `typed()` by hand.

- **Drop official support for Node.js 12.**

### Added

Non-breaking changes:

- Implemented new static functions. Thanks @gwhitney:
  - `typed.referTo(...string, callback: (resolvedFunctions: ...function) => function)`
  - `typed.referToSelf(callback: (self) => function)`
  - `typed.isTypedFunction(entity: any): boolean`
  - `typed.resolve(fn: typed-function, argList: Array<any>): signature-object`
  - `typed.findSignature(fn: typed-function, signature: string | Array, options: object) : signature-object`
  - `typed.addType(type: {name: string, test: function, ignored?: boolean} [, beforeObjectTest=true]): void`
  - `typed.addTypes(types: TypeDef[] [, before = 'any']): void`
  - `typed.clear(): void`
  - `typed.addConversions(conversions: ConversionDef[]): void`
  - `typed.removeConversion(conversion: ConversionDef): void`
  - `typed.clearConversions(): void`
- Refactored the `typed` constructor to be more flexible, accepting a combination of multiple typed functions or objects. And internally refactored the constructor to not use typed-function itself (#142). Thanks @gwhitney.
- Extended the benchmark script and added counting of creation of typed functions (#146).

### Fixed
- Fixes and extensions to `typed.find()` now correctly handling cases with rest or `any` parameters and matches requiring conversions; adds an `options` argument to control whether matches with conversions are allowed. Thanks @gwhitney.
- Fix to `typed.convert()`: Will now find a conversion even in presence of overlapping types.
- Reports all matching types in runtime errors, not just the first one.
- Improved documentation. Thanks @gwhitney.

## [2.1.0] - 2022-03-11

### Added
- Implemented configurable callbacks `typed.createError` and `typed.onMismatch`. Thanks @gwhitney.

## [2.0.0] - 2020-07-03

### Changed
- Drop official support for Node.js 6 and 8, though no breaking changes at this point.

### Added
- Implemented support for recursion using the `this` keyword. Thanks @nickewing.

## [1.1.1] - 2019-08-22

### Fixed
- Passing `null` to an `Object` parameter throws wrong error (#15).

## [1.1.0] - 2018-07-28

### Added
- Implemented support for creating typed functions from a plain function having a property `signature`.
- Implemented providing a name when merging multiple typed functions.

## [1.0.4] - 2018-07-04

### Changed
- By default, `addType` will insert new types before the `Object` test since the `Object` test also matches arrays and classes.
- Upgraded `devDependencies`.

## [1.0.3] - 2018-03-17

### Changed
- Dropped usage of ES6 feature `Array.find`, so typed-function is directly usable on any ES5 compatible JavaScript engine (like IE11).

## [1.0.2] - 2018-03-17

### Fixed
- typed-function not working on browsers that don't allow setting the `name` property of a function.

## [1.0.1] - 2018-02-21

### Changed
- Upgraded dev dependencies.

## [1.0.0] - 2018-02-20

Version 1.0.0 is rewritten from scratch. The API is the same, though generated error messages may differ slightly.

### Changed
- Version 1.0.0 no longer uses `eval` under the hood to achieve good performance. This reduces security risks and makes typed-functions easier to debug.
- Type `Object` is no longer treated specially from other types. This means that the test for `Object` must not give false positives for types like `Array`, `Date`, or class instances.
- In version 1.0.0, support for browsers like IE9, IE10 is dropped, though typed-function can still work when using es5 and es6 polyfills.

## [0.10.7] - 2018-01-24

### Fixed
- The field `data.actual` in a `TypeError` message containing the type index instead of the actual type of the argument.

## [0.10.6] - 2017-11-18

### Security
- Fixed a security issue allowing to execute arbitrary JavaScript code via a specially prepared function name of a typed function. Thanks Masato Kinugawa.

## [0.10.5] - 2016-11-18

### Fixed
- The use of multi-layered use of `any` type (#8).

## [0.10.4] - 2016-04-09

### Changed
- Typed functions can only inherit names from other typed functions and no longer from regular JavaScript functions since these names are unreliable: they can be manipulated by minifiers and browsers.

## [0.10.3] - 2015-10-07

### Changed
- Reverted the fix of v0.10.2 until the introduced issue with variable arguments is fixed too. Added unit test for the latter case.

## [0.10.2] - 2015-10-04

### Fixed
- Support for using `any` multiple times in a single signature. Thanks @luke-gumbley.

## [0.10.1] - 2015-07-27

### Fixed
- Functions `addType` and `addConversion` not being robust against replaced arrays `typed.types` and `typed.conversions`.

## [0.10.0] - 2015-07-26

### Changed
- Dropped support for the following construction signatures in order to simplify the API:
  - `typed(signature: string, fn: function)`
  - `typed(name: string, signature: string, fn: function)`
- Changed the casing of the type `'function'` to `'Function'`. **Breaking change.**
- `typed.types` is now an ordered Array containing objects `{name: string, test: function}`. **Breaking change.**
- List with expected types in error messages no longer includes converted types.

### Added
- Implemented convenience methods `typed.addType` and `typed.addConversion`.

## [0.9.0] - 2015-05-17

### Changed
- `typed.types` is now an ordered Array containing objects `{type: string, test: function}` instead of an object. **Breaking change.**
- `typed-function` now allows merging typed functions with duplicate signatures when they point to the same function.

## [0.8.3] - 2015-05-16

### Changed
- Function `typed.find` now throws an error instead of returning `null` when a signature is not found.

### Fixed
- The attached signatures no longer contains signatures with conversions.

## [0.8.2] - 2015-05-09

### Fixed
- Function `typed.convert` not handling the case where the value already has the requested type. Thanks @rjbaucells.

## [0.8.1] - 2015-05-09

### Added
- Implemented option `typed.ignore` to ignore/filter signatures of a typed function.

## [0.8.0] - 2015-05-09

### Added
- Implemented function `create` to create a new instance of typed-function.
- Implemented a utility function `convert(value, type)` (#1).
- Implemented a simple `typed.find` function to find the implementation of a specific function signature.
- Extended the error messages to denote the function name, like `"Too many arguments in function foo (...)"`.

## [0.7.0] - 2015-04-17

### Changed
- Performance improvements.

## [0.6.3] - 2015-03-08

### Fixed
- Generated internal Signature and Param objects not being cleaned up after the typed function has been generated.

## [0.6.2] - 2015-02-26

### Fixed
- A bug sometimes not ordering the handling of any type arguments last.
- A bug sometimes not choosing the signature with the lowest number of conversions.

## [0.6.1] - 2015-02-07

### Changed
- Large code refactoring.

### Fixed
- Bugs related to any type parameters.

## [0.6.0] - 2015-01-16

### Changed
- Removed the configuration option `minify` (it's not clear yet whether minifying really improves the performance).
- Internal code simplifications.
- Bug fixes.

## [0.5.0] - 2015-01-07

### Added
- Implemented support for merging typed functions.
- Typed functions inherit the name of the function in case of one signature.

### Fixed
- A regular argument was not matched when there was a signature with variable arguments too.
- Slightly changed the error messages.

## [0.4.0] - 2014-12-17

### Added
- Support for multiple types per parameter like `number | string, number'`.
- Support for variable parameters like `string, ...number'`.
- Implemented detailed error messages.
- Implemented option `typed.config.minify`.

### Changed
- Introduced new constructor options, create a typed function as `typed([name,] signature, fn)` or `typed([name,] signatures)`.
- Changed any type notation `'*'` to `'any'`.

## [0.3.1] - 2014-11-05

### Changed
- Renamed module to `typed-function`.

## [0.3.0] - 2014-11-05

### Added
- Implemented support for any type arguments (denoted with `*`).

## [0.2.0] - 2014-10-23

### Added
- Implemented support for named functions.
- Implemented support for type conversions.
- Implemented support for custom types.
- Library packaged as UMD, usable with CommonJS (Node.js), AMD, and browser globals.

## [0.1.0] - 2014-10-21

### Added
- Implemented support for functions with zero, one, or multiple arguments.

## [0.0.1] - 2014-10-19

### Added
- First release (no functionality yet).

---

[Unreleased]: https://github.com/danielsimonjr/typed-function/compare/v5.0.0-alpha.1...HEAD
[5.0.0-alpha.1]: https://github.com/danielsimonjr/typed-function/compare/v5.0.0-alpha.0...v5.0.0-alpha.1
[5.0.0-alpha.0]: https://github.com/danielsimonjr/typed-function/compare/v4.2.2...v5.0.0-alpha.0
[4.2.2]: https://github.com/josdejong/typed-function/compare/v4.2.1...v4.2.2
[4.2.1]: https://github.com/josdejong/typed-function/compare/v4.2.0...v4.2.1
[4.2.0]: https://github.com/josdejong/typed-function/compare/v4.1.1...v4.2.0
[4.1.1]: https://github.com/josdejong/typed-function/compare/v4.1.0...v4.1.1
[4.1.0]: https://github.com/josdejong/typed-function/compare/v4.0.0...v4.1.0
[4.0.0]: https://github.com/josdejong/typed-function/compare/v3.0.1...v4.0.0
[3.0.1]: https://github.com/josdejong/typed-function/compare/v3.0.0...v3.0.1
[3.0.0]: https://github.com/josdejong/typed-function/compare/v2.1.0...v3.0.0
[2.1.0]: https://github.com/josdejong/typed-function/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/josdejong/typed-function/compare/v1.1.1...v2.0.0
[1.1.1]: https://github.com/josdejong/typed-function/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/josdejong/typed-function/compare/v1.0.4...v1.1.0
[1.0.4]: https://github.com/josdejong/typed-function/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/josdejong/typed-function/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/josdejong/typed-function/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/josdejong/typed-function/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/josdejong/typed-function/compare/v0.10.7...v1.0.0
[0.10.7]: https://github.com/josdejong/typed-function/compare/v0.10.6...v0.10.7
[0.10.6]: https://github.com/josdejong/typed-function/compare/v0.10.5...v0.10.6
[0.10.5]: https://github.com/josdejong/typed-function/compare/v0.10.4...v0.10.5
[0.10.4]: https://github.com/josdejong/typed-function/compare/v0.10.3...v0.10.4
[0.10.3]: https://github.com/josdejong/typed-function/compare/v0.10.2...v0.10.3
[0.10.2]: https://github.com/josdejong/typed-function/compare/v0.10.1...v0.10.2
[0.10.1]: https://github.com/josdejong/typed-function/compare/v0.10.0...v0.10.1
[0.10.0]: https://github.com/josdejong/typed-function/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/josdejong/typed-function/compare/v0.8.3...v0.9.0
[0.8.3]: https://github.com/josdejong/typed-function/compare/v0.8.2...v0.8.3
[0.8.2]: https://github.com/josdejong/typed-function/compare/v0.8.1...v0.8.2
[0.8.1]: https://github.com/josdejong/typed-function/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/josdejong/typed-function/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/josdejong/typed-function/compare/v0.6.3...v0.7.0
[0.6.3]: https://github.com/josdejong/typed-function/compare/v0.6.2...v0.6.3
[0.6.2]: https://github.com/josdejong/typed-function/compare/v0.6.1...v0.6.2
[0.6.1]: https://github.com/josdejong/typed-function/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/josdejong/typed-function/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/josdejong/typed-function/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/josdejong/typed-function/compare/v0.3.1...v0.4.0
[0.3.1]: https://github.com/josdejong/typed-function/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/josdejong/typed-function/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/josdejong/typed-function/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/josdejong/typed-function/compare/v0.0.1...v0.1.0
[0.0.1]: https://github.com/josdejong/typed-function/releases/tag/v0.0.1
