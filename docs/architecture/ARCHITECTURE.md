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

Currently, typed-function is implemented as a monolithic single file (~1,988 lines). The logical organization within `src/typed-function.mjs`:

```
src/typed-function.mjs
├── Helper Functions (lines 1-13)
│   ├── ok()           - Returns true
│   ├── notOk()        - Returns false
│   └── undef()        - Returns undefined
│
├── Constants (line 13)
│   └── NOT_TYPED_FUNCTION error message
│
├── JSDoc Type Definitions (lines 15-50)
│
└── create() Factory (lines 55-1988)
    │
    ├── Type System (lines 56-196)
    │   ├── isPlainObject()
    │   ├── _types[] (built-in type definitions)
    │   ├── anyType
    │   ├── typeMap, typeList, nConversions (state)
    │   ├── findType()
    │   ├── addTypes()
    │   ├── clear()
    │   └── clearConversions()
    │
    ├── Type Discovery (lines 198-223)
    │   ├── findTypeNames()
    │   └── isTypedFunction()
    │
    ├── Signature Lookup (lines 225-385)
    │   ├── findSignature()
    │   ├── find()
    │   └── convert()
    │
    ├── Signature Parsing (lines 387-532)
    │   ├── stringifyParams()
    │   ├── parseParam()
    │   ├── expandParam()
    │   ├── paramTypeSet()
    │   ├── parseSignature()
    │   └── hasRestParam()
    │
    ├── Test Compilation (lines 534-626)
    │   ├── compileTest()
    │   └── compileTests()
    │
    ├── Signature Utilities (lines 628-782)
    │   ├── getParamAtIndex()
    │   ├── getTypeSetAtIndex()
    │   ├── isExactType()
    │   ├── mergeExpectedParams()
    │   └── createError()
    │
    ├── Signature Comparison (lines 784-993)
    │   ├── getLowestTypeIndex()
    │   ├── getLowestConversionIndex()
    │   ├── compareParams()
    │   ├── compareSignatures()
    │   └── availableConversions()
    │
    ├── Argument Processing (lines 1040-1149)
    │   ├── compileArgsPreprocessing()
    │   └── compileArgConversion()
    │
    ├── Signature Splitting (lines 1151-1247)
    │   ├── splitParams()
    │   └── conflicting()
    │
    ├── Reference Resolution (lines 1249-1373)
    │   ├── clearResolutions()
    │   ├── collectResolutions()
    │   ├── resolveReferences()
    │   └── validateDeprecatedThis()
    │
    ├── Core Function Creation (lines 1375-1574)
    │   ├── createTypedFunction()
    │   └── _onMismatch()
    │
    ├── Array Utilities (lines 1576-1630)
    │   ├── initial()
    │   ├── last()
    │   ├── slice()
    │   ├── findInArray()
    │   └── flatMap()
    │
    ├── Reference API (lines 1632-1698)
    │   ├── referTo()
    │   ├── makeReferTo()
    │   ├── referToSelf()
    │   ├── isReferTo()
    │   └── isReferToSelf()
    │
    ├── Name Handling (lines 1700-1767)
    │   ├── checkName()
    │   ├── getObjectName()
    │   └── mergeSignatures()
    │
    └── Public API (lines 1769-1985)
        ├── typed() main function
        └── All exported methods
```

## Build System

### Source to Distribution

```
src/typed-function.mjs
         │
         ▼
┌─────────────────────┐
│   Babel (ESM)       │
│   babel.config.json │
└─────────┬───────────┘
          │
          ▼
lib/esm/typed-function.mjs (ES Modules)
          │
          ▼
┌─────────────────────┐
│   Rollup (UMD)      │
│   --format umd      │
└─────────┬───────────┘
          │
          ▼
lib/umd/typed-function.js (UMD Bundle)
```

### Output Formats

| Format | File | Usage |
|--------|------|-------|
| ESM | `lib/esm/typed-function.mjs` | Modern bundlers, ES6+ environments |
| UMD | `lib/umd/typed-function.js` | Node.js (CommonJS), browsers, AMD |

### Package.json Entry Points

```json
{
  "type": "module",
  "main": "lib/umd/typed-function.js",    // CommonJS/Node.js
  "module": "lib/esm/typed-function.mjs", // ES Modules
  "browser": "lib/umd/typed-function.js"  // Browsers
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

## Future Architecture (v5.0)

The planned v5.0 architecture introduces:

1. **TypeScript rewrite** - Full type safety
2. **Modular structure** - Split into ~20 modules
3. **WASM hot paths** - AssemblyScript for dispatch
4. **Improved caching** - Type test result caching

See [PHASE_1_REFACTORING_PLAN.md](../planning/PHASE_1_REFACTORING_PLAN.md) for details.

## Related Documentation

- [OVERVIEW.md](./OVERVIEW.md) - Project introduction
- [COMPONENTS.md](./COMPONENTS.md) - Detailed component breakdown
- [DATAFLOW.md](./DATAFLOW.md) - Runtime data flow
