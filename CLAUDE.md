# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

typed-function is a runtime type-checking library for JavaScript functions with automatic type conversion and multiple signature support. Version 5.0 is a complete TypeScript rewrite with WASM-ready architecture.

## Build and Development Commands

```bash
# Build (cleans, compiles WASM, then TypeScript)
npm run build

# TypeScript only build (if WASM already compiled)
npm run build:ts

# Type checking
npm run typecheck

# Run tests
npm test

# Run a single test file
npx vitest run test/fast-path.test.ts

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Lint
npm run lint

# Format (auto-fix lint issues)
npm run format

# Full validation (typecheck + build + test)
npm run build-and-test
```

## Architecture

### Entry Points
- `src/index.ts` - Main entry with full exports including WASM utilities
- `src/minimal.ts` - Lightweight entry (~5KB) without WASM dispatch
- `src/factory.ts` - Creates isolated typed-function instances with independent type registries

### Core Modules (`src/core/`)
- `types.ts` - All TypeScript type definitions
- `type-registry.ts` - Map-based type storage with bit masks for WASM dispatch
- `signature-parser.ts` - Parses signature strings like `'number, string'` into structured params
- `signature-compiler.ts` - Compiles type tests and argument converters
- `signature-comparator.ts` - Sorts signatures by dispatch priority
- `conversion-manager.ts` - Manages type conversions between types
- `reference-resolver.ts` - Handles `referTo` and `referToSelf` for self-referencing
- `error-factory.ts` - Generates detailed error messages for type mismatches

### Dispatch System (`src/dispatch/`)
- `dispatcher.ts` - Main typed function builder that orchestrates signature parsing, conflict detection, and dispatcher creation
- `fast-path.ts` - Optimized dispatch for up to 6 signatures using direct slot access
- `generic-path.ts` - Loop-based fallback dispatcher for functions with many signatures

### WASM Components (`src/wasm/`)
- `type-masks.ts` - Bit-mask type system (32-bit masks for fast type matching)
- `loader.ts` / `bindings.ts` - WASM module loading
- `assembly/` - AssemblyScript source for WASM dispatch (compiled separately)

### Build Outputs
- ESM: `build/typed-function.mjs`
- CJS: `build/typed-function.cjs`
- UMD: `build/typed-function.js`
- Minified IIFE: `build/typed-function.min.js`
- TypeScript declarations: `build/index.d.ts`

## Key Concepts

### Typed Function Creation
```typescript
const fn = typed({
  'number, number': (a, b) => a + b,
  'string, string': (a, b) => a + b,
});
```

### Type Definitions
Custom types are added to the registry with a name and test function:
```typescript
typed.addType({
  name: 'positive',
  test: (x: unknown): x is number => typeof x === 'number' && x > 0,
});
```

### Conversions
```typescript
typed.addConversion({
  from: 'string',
  to: 'number',
  convert: (s: string) => parseFloat(s),
});
```

### Self-Reference Patterns
Use `typed.referTo()` for direct signature calls and `typed.referToSelf()` for recursive calls with full dispatch.

## Test Organization

Tests are in `test/` using Vitest. Legacy tests (`.legacy.test.ts`) validate backward compatibility with v4.x API. Coverage thresholds: 70% statements/functions/lines, 65% branches.
