# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
