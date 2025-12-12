# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
- `Uncertainty` - Values with error bounds (value ± uncertainty)
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
- Custom type bit positions now start at bit 16 (previously 10)
- Built-in type count increased from 11 to 17 (including 'any')

## [5.0.0-alpha.1] - 2025-12-04

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
  - fast-path.ts: 30% → 100%
  - generic-path.ts: 42% → 100%
  - array-helpers.ts: 46% → 100%
  - object-helpers.ts: 9.5% → 100%
- Overall coverage: 74% → 89% statements
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

## [4.x and earlier]

See [HISTORY.md](./HISTORY.md) for changes in previous versions.
