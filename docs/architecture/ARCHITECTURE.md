# typed-function Architecture

This document describes the architectural design, patterns, and structure of the typed-function library.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          typed-function                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │    Type     │  │  Signature  │  │  Conversion │  │   Error    │ │
│  │   System    │  │   System    │  │    System   │  │   Factory  │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬──────┘ │
│         │                │                │                │        │
│         └────────────────┼────────────────┼────────────────┘        │
│                          │                │                         │
│                          ▼                ▼                         │
│                    ┌─────────────────────────┐                      │
│                    │   Dispatch Engine       │                      │
│                    │  (Fast Path + Generic)  │                      │
│                    └───────────┬─────────────┘                      │
│                                │                                    │
│                                ▼                                    │
│                    ┌─────────────────────────┐                      │
│                    │    Typed Function       │                      │
│                    │    (User-facing API)    │                      │
│                    └─────────────────────────┘                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Design Patterns

### 1. Factory Pattern

The core of typed-function uses a factory pattern through the `create()` function. This enables:

- **Isolated universes**: Each `typed.create()` call creates an independent instance with its own type registry, conversions, and configuration
- **Encapsulated state**: Private state is hidden within closures
- **Customization**: Different parts of an application can use different type configurations

```javascript
function create() {
  // Private state
  let typeMap = new Map()
  let typeList = []
  let nConversions = 0

  // Public interface
  const typed = function(...) { ... }
  typed.addType = function(...) { ... }
  typed.addConversion = function(...) { ... }

  return typed
}

export default create()  // Export a default instance
```

### 2. Closure-Based Encapsulation

All state is private within the `create()` closure:

```javascript
function create() {
  // These are truly private - no external access
  let typeMap        // Map<string, TypeDef>
  let typeList       // string[]
  let nConversions   // number

  // Only accessible via returned typed object
  function findType(name) { ... }
  function addTypes(types) { ... }

  return { typed, addType, ... }
}
```

### 3. Compile-Once, Execute-Many

Typed functions are "compiled" at creation time:

1. **Signature parsing** - Convert string signatures to structured data
2. **Type expansion** - Add conversion-based types to each parameter
3. **Signature splitting** - Expand union types into individual signatures
4. **Signature sorting** - Order by preference for dispatch
5. **Test compilation** - Create optimized type test functions
6. **Implementation wrapping** - Wrap functions with conversion logic

At runtime, the dispatcher simply iterates through pre-compiled signatures.

### 4. Fast Path Optimization

The first 6 signatures (with ≤2 parameters and no rest params) use a specialized fast path:

```javascript
function theTypedFn(arg0, arg1) {
  // Fast path - inline checks for first 6 signatures
  if (arguments.length === len0 && test00(arg0) && test01(arg1)) {
    return fn0.apply(this, arguments)
  }
  if (arguments.length === len1 && test10(arg0) && test11(arg1)) {
    return fn1.apply(this, arguments)
  }
  // ... signatures 2-5 ...

  // Fall back to generic path
  return generic.apply(this, arguments)
}
```

This optimization targets the most common use cases for better performance.

## Core Data Structures

### Type Definition (TypeDef)

```javascript
{
  name: string,              // "number", "string", etc.
  test: (x: any) => boolean, // Type test function
  isAny?: boolean,           // true only for 'any' type
  index: number,             // Position in typeList for ordering
  conversionsTo: ConversionDef[]  // Available conversions TO this type
}
```

### Conversion Definition (ConversionDef)

```javascript
{
  from: string,              // Source type name
  to: string,                // Target type name
  convert: (x: any) => any,  // Conversion function
  index: number              // Priority (lower = higher priority)
}
```

### Parameter (Param)

```javascript
{
  types: Type[],           // Array of acceptable types
  name: string,            // Stringified name (e.g., "number|string")
  hasAny: boolean,         // Contains 'any' type
  hasConversion: boolean,  // Contains types via conversion
  restParam: boolean,      // Is this a rest parameter (...)
  typeSet?: Set<string>    // Cached set of type names
}
```

### Type (within Param)

```javascript
{
  name: string,                    // Type name
  typeIndex: number,               // Index in type registry
  test: (x: any) => boolean,       // Type test function
  isAny: boolean,                  // Is this the 'any' type
  conversion: ConversionDef | null, // Conversion if via conversion
  conversionIndex: number          // -1 if no conversion
}
```

### Signature

```javascript
{
  params: Param[],                 // Array of parameters
  fn: Function,                    // Original user-provided function
  test: (args: any[]) => boolean,  // Compiled argument test
  implementation: Function,        // Wrapped function with conversions
  name: string                     // Stringified signature
}
```

## Module Structure

Version 5.0 introduces a modular TypeScript architecture (~4,500 lines across 26 modules):

```
src/
├── index.ts                     # Main entry point, exports default typed instance
├── factory.ts                   # create() factory function
│
├── core/                        # Core type system modules
│   ├── types.ts                 # TypeScript type definitions
│   ├── type-registry.ts         # Type storage & lookup (TypeRegistry class)
│   ├── signature-parser.ts      # Signature string parsing & tokenization
│   ├── signature-compiler.ts    # Test function compilation
│   ├── signature-comparator.ts  # Signature ordering for dispatch
│   ├── conversion-manager.ts    # Type conversion handling
│   ├── reference-resolver.ts    # referTo/referToSelf resolution
│   └── error-factory.ts         # Error message generation
│
├── dispatch/                    # Dispatch engine modules
│   ├── dispatcher.ts            # Main dispatch orchestration
│   ├── fast-path.ts             # Optimized 6-signature dispatch
│   └── generic-path.ts          # Fallback loop dispatch
│
├── utils/                       # Utility modules
│   ├── array-helpers.ts         # Array utility functions
│   └── object-helpers.ts        # Object utility functions
│
└── wasm/                        # WebAssembly foundation
    ├── type-masks.ts            # Bit-mask type system
    ├── fallback.ts              # Pure-JS WASM-equivalent
    ├── bindings.ts              # WASM bridge interface
    ├── loader.ts                # WASM loading utilities
    ├── index.ts                 # WASM module exports
    └── assembly/                # AssemblyScript sources
        ├── index.ts
        ├── dispatch.ts
        ├── signature-table.ts
        ├── type-registry.ts
        ├── memory.ts
        └── cache.ts
```

### Module Responsibilities

| Module | Responsibility |
|--------|----------------|
| `index.ts` | Entry point, creates default typed instance |
| `factory.ts` | `create()` factory, merges signatures, creates typed functions |
| `type-registry.ts` | Stores types, type lookup, type ordering |
| `signature-parser.ts` | Parses signature strings like `"number, string"` |
| `signature-compiler.ts` | Compiles type tests into optimized functions |
| `signature-comparator.ts` | Orders signatures for dispatch preference |
| `conversion-manager.ts` | Manages type conversions |
| `reference-resolver.ts` | Resolves `referTo()` and `referToSelf()` |
| `error-factory.ts` | Creates detailed type mismatch errors |
| `dispatcher.ts` | Orchestrates fast/generic path selection |
| `fast-path.ts` | Inlined dispatch for first 6 signatures |
| `generic-path.ts` | Loop-based fallback dispatch |

## Build System

### Source to Distribution

```
src/**/*.ts (TypeScript)
         │
         ▼
┌─────────────────────────────┐
│   Rollup + TypeScript       │
│   rollup.config.js          │
│   @rollup/plugin-typescript │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│                    build/                                │
├─────────────────────────────────────────────────────────┤
│  typed-function.mjs      (ES Module)                    │
│  typed-function.cjs      (CommonJS)                     │
│  typed-function.js       (UMD browser bundle)           │
│  typed-function.min.js   (Minified IIFE, ~26KB)         │
│  index.d.ts              (TypeScript declarations)      │
└─────────────────────────────────────────────────────────┘
```

### Output Formats

| Format | File | Usage |
|--------|------|-------|
| ESM | `build/typed-function.mjs` | Modern bundlers, ES6+ environments |
| CJS | `build/typed-function.cjs` | Node.js (CommonJS) |
| UMD | `build/typed-function.js` | Browsers, AMD loaders |
| IIFE | `build/typed-function.min.js` | Direct browser usage (~26KB) |
| Types | `build/index.d.ts` | TypeScript declarations |

### Package.json Entry Points

```json
{
  "type": "module",
  "main": "./build/typed-function.cjs",
  "module": "./build/typed-function.mjs",
  "browser": "./build/typed-function.js",
  "types": "./build/index.d.ts",
  "exports": {
    ".": {
      "types": "./build/index.d.ts",
      "import": "./build/typed-function.mjs",
      "require": "./build/typed-function.cjs"
    }
  },
  "sideEffects": false
}
```

## Error Handling Strategy

### Error Categories

1. **Configuration Errors** (at typed function creation time)
   - `SyntaxError`: No signatures provided, rest param not last, circular references
   - `TypeError`: Conflicting signatures, duplicate types, invalid type definitions

2. **Runtime Errors** (when calling typed functions)
   - `TypeError`: Wrong type, too few args, too many args, signature mismatch

### Error Data Enrichment

All runtime errors include structured `data` property:

```javascript
err.data = {
  category: 'wrongType' | 'tooFewArgs' | 'tooManyArgs' | 'mismatch',
  fn: string,           // Function name
  index: number,        // Argument index (if applicable)
  actual: string[],     // Actual types found
  expected: string[]    // Expected types
}
```

### Custom Error Handler

```javascript
typed.onMismatch = function(name, args, signatures) {
  // Custom handling logic
  // Return a value or throw a custom error
}
```

## Thread Safety

typed-function is **not thread-safe** in the traditional sense, but JavaScript is single-threaded. Considerations:

1. **Type registry mutation** - `addType()`, `clear()` modify shared state; should only be called during initialization
2. **Typed function creation** - Safe to create typed functions concurrently (in async sense)
3. **Typed function invocation** - Completely stateless; safe to call concurrently

## Performance Characteristics

| Operation | Typical Time | Notes |
|-----------|--------------|-------|
| Typed function creation | ~1ms | Depends on signature count |
| Fast path dispatch | ~50ns | First 6 simple signatures |
| Generic dispatch | ~100-200ns | Loop through signatures |
| Type test | ~10ns | Single type |
| Conversion | ~50ns | Plus conversion function time |

## Current Architecture (v5.0)

Version 5.0 represents a complete rewrite with:

1. **TypeScript implementation** - Full type safety with comprehensive type definitions
2. **Modular structure** - Split into 26 modules across 5 directories
3. **WASM foundation** - Type masks and bindings ready for WebAssembly acceleration
4. **Fast-path optimization** - Inlined dispatch for first 6 signatures (~2.5x faster)
5. **Test coverage** - 89% statement coverage with 552 tests

## Future Improvements

Potential enhancements for future versions:

1. **WebAssembly acceleration** - Compile WASM dispatch from AssemblyScript sources
2. **Type test caching** - Cache test results for repeated type checks
3. **Optional arguments** - Syntax like `'[number], array'`
4. **Fallible conversions** - Allow conversions to fail gracefully
5. **Nullable arguments** - Syntax like `'?Object'`

## Related Documentation

- [OVERVIEW.md](./OVERVIEW.md) - Project introduction
- [COMPONENTS.md](./COMPONENTS.md) - Detailed component breakdown
- [DATAFLOW.md](./DATAFLOW.md) - Runtime data flow
