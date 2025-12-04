# typed-function Components

This document provides detailed documentation of the components and modules within typed-function v5.0.

## Component Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                        typed-function v5.0                          │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────┐    ┌──────────────────────┐             │
│  │    Type Registry     │    │  Conversion Manager  │             │
│  │  ─────────────────   │    │  ──────────────────  │             │
│  │  type-registry.ts    │    │  conversion-manager  │             │
│  │  • TypeRegistry class│    │  .ts                 │             │
│  │  • findType()        │    │  • addConversion()   │             │
│  │  • addTypes()        │    │  • convert()         │             │
│  └──────────┬───────────┘    └──────────┬───────────┘             │
│             │                           │                          │
│             ▼                           ▼                          │
│  ┌──────────────────────────────────────────────────┐             │
│  │              Signature Processing                 │             │
│  │  ────────────────────────────────────────────    │             │
│  │  signature-parser.ts    signature-compiler.ts    │             │
│  │  signature-comparator.ts                         │             │
│  └──────────────────────────┬───────────────────────┘             │
│                             │                                      │
│                             ▼                                      │
│  ┌──────────────────────────────────────────────────┐             │
│  │                Dispatch Engine                    │             │
│  │  ────────────────────────────────────────────    │             │
│  │  dispatcher.ts   fast-path.ts   generic-path.ts  │             │
│  │  • createDispatcher()                            │             │
│  │  • Fast path (6 signatures)                      │             │
│  │  • Generic fallback                              │             │
│  └──────────────────────────┬───────────────────────┘             │
│                             │                                      │
│                             ▼                                      │
│  ┌──────────────────────────────────────────────────┐             │
│  │               Reference Resolver                  │             │
│  │  ────────────────────────────────────────────    │             │
│  │  reference-resolver.ts                           │             │
│  │  • referTo()       • referToSelf()               │             │
│  │  • resolveReferences()                           │             │
│  └──────────────────────────────────────────────────┘             │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

## Type Registry

The type registry manages all known types in a typed universe.

**Location**: `src/core/type-registry.ts`

### TypeRegistry Class

The `TypeRegistry` class encapsulates type storage and lookup:

```typescript
class TypeRegistry {
  private typeMap: Map<string, TypeDef>    // Primary lookup
  private typeList: string[]                // Ordered list
  private anyType: TypeDef                  // Special "any" type

  findType(name: string): TypeDef
  addTypes(types: TypeDef[], before?: string): void
  clear(): void
  findTypeNames(value: unknown): string[]
}
```

### Built-in Types

```typescript
const BUILT_IN_TYPES: TypeDef[] = [
  { name: 'number',    test: (x): x is number => typeof x === 'number' },
  { name: 'string',    test: (x): x is string => typeof x === 'string' },
  { name: 'boolean',   test: (x): x is boolean => typeof x === 'boolean' },
  { name: 'Function',  test: (x): x is Function => typeof x === 'function' },
  { name: 'Array',     test: (x): x is unknown[] => Array.isArray(x) },
  { name: 'Date',      test: (x): x is Date => x instanceof Date },
  { name: 'RegExp',    test: (x): x is RegExp => x instanceof RegExp },
  { name: 'Object',    test: isPlainObject },
  { name: 'null',      test: (x): x is null => x === null },
  { name: 'undefined', test: (x): x is undefined => x === undefined }
]

const ANY_TYPE: TypeDef = { name: 'any', test: () => true, isAny: true }
```

### Functions

#### `findType(typeName: string): TypeDef`
Looks up a type by name. Throws `TypeError` with helpful suggestions if not found.

```typescript
findType('number')  // Returns number TypeDef
findType('Number')  // Throws: 'Unknown type "Number". Did you mean "number"?'
```

#### `addTypes(types: TypeDef[], before?: string): void`
Adds new types to the registry. Types are inserted before the specified type (default: 'any').

```typescript
registry.addTypes([{ name: 'Complex', test: isComplex }], 'Object')
```

#### `clear(): void`
Resets the type registry to built-in types only.

#### `findTypeNames(value: unknown): string[]`
Returns all type names that match a given value.

```typescript
findTypeNames(42)      // ['number']
findTypeNames([1,2])   // ['Array']
findTypeNames({a: 1})  // ['Object']
```

## Conversion Manager

Conversions enable automatic type coercion. They're managed by the `ConversionManager` class.

**Location**: `src/core/conversion-manager.ts`

### ConversionManager Class

```typescript
class ConversionManager {
  private registry: TypeRegistry
  private nConversions: number  // Counter for priority ordering

  addConversion(conversion: ConversionDef, options?: { override?: boolean }): void
  removeConversion(conversion: ConversionDef): void
  clearConversions(): void
  convert(value: unknown, typeName: string): unknown
  getAvailableConversions(typeNames: string[]): ConversionDef[]
}
```

### Functions

#### `addConversion(conversion: ConversionDef, options?): void`
Registers a new type conversion.

```typescript
conversionManager.addConversion({
  from: 'boolean',
  to: 'number',
  convert: (x: boolean) => x ? 1 : 0
})
```

**Options**:
- `override: boolean` - If true, replaces existing conversion (default: false)

#### `removeConversion(conversion: ConversionDef): void`
Removes an existing conversion. The convert function must match exactly.

#### `getAvailableConversions(typeNames: string[]): ConversionDef[]`
Finds all conversions that can convert to any of the given types.

#### `convert(value: unknown, typeName: string): unknown`
Converts a value to the specified type using registered conversions.

```typescript
// Assuming boolean → number conversion exists
typed.convert(true, 'number')  // Returns 1
```

## Signature Processing

Handles parsing, expansion, and compilation of function signatures. Split across three modules.

### Signature Parser

**Location**: `src/core/signature-parser.ts`

#### `parseSignature(rawSignature: string, registry: TypeRegistry): Param[]`
Parses a signature string into an array of parameters.

```typescript
parseSignature('number, string', registry)
// Returns: [
//   { types: [{name: 'number', ...}], name: 'number', restParam: false, ... },
//   { types: [{name: 'string', ...}], name: 'string', restParam: false, ... }
// ]

parseSignature('...number', registry)
// Returns: [
//   { types: [{name: 'number', ...}], name: '...number', restParam: true, ... }
// ]
```

#### `parseParam(param: string, registry: TypeRegistry): Param`
Parses a single parameter string (e.g., "number | string" or "...number").

#### `stringifyParams(params: Param[]): string`
Converts parsed parameters back to a string representation.

#### `expandParam(param: Param, conversions: ConversionDef[]): Param`
Expands a parameter to include types reachable via conversions.

```typescript
// If boolean → number conversion exists:
expandParam({ types: [{name: 'number'}], ... }, conversions)
// Returns: { types: [{name: 'number'}, {name: 'boolean', conversion: ...}], ... }
```

#### `splitParams(params: Param[]): Param[][]`
Splits union types into separate signature permutations.

```typescript
// 'number | string, boolean' becomes:
// [['number', 'boolean'], ['string', 'boolean']]
```

### Signature Comparator

**Location**: `src/core/signature-comparator.ts`

#### `compareSignatures(sig1: Signature, sig2: Signature): number`
Compares two signatures for dispatch ordering. Returns negative if sig1 should come first.

**Comparison criteria (in order of priority)**:
1. No `...any` rest parameter preferred
2. Fewer `any` parameters preferred
3. No conversion rest param preferred
4. Fewer conversions preferred
5. No rest param preferred
6. More parameters (if no rest) / fewer parameters (if rest) preferred
7. Lowest type index at each position

#### `compareParams(param1: Param, param2: Param): number`
Compares individual parameters for ordering.

#### `conflicting(params1: Param[], params2: Param[]): boolean`
Checks if two signatures would conflict (accept same arguments).

### Signature Compiler

**Location**: `src/core/signature-compiler.ts`

#### `compileTest(param: Param): (x: unknown) => boolean`
Creates an optimized type test for a single parameter.

```typescript
// For single type: direct test function
// For 2 types: (x) => test0(x) || test1(x)
// For 3+ types: loop-based test
```

#### `compileTests(params: Param[]): (args: unknown[]) => boolean`
Creates a test function for a complete signature.

#### `compileArgsPreprocessing(params: Param[], fn: Function): Function`
Wraps a function to handle conversions and rest parameters.

## Dispatch Engine

The dispatch engine routes function calls to the correct implementation. Split across three modules.

**Location**: `src/dispatch/`

### Dispatcher

**Location**: `src/dispatch/dispatcher.ts`

The main dispatcher orchestrates fast-path and generic-path selection:

```typescript
function createDispatcher(
  signatures: Signature[],
  onMismatch: MismatchHandler
): TypedFunction
```

### Fast-Path Dispatcher

**Location**: `src/dispatch/fast-path.ts`

Optimized dispatch for the first 6 signatures with inlined type checks:

```typescript
function theTypedFn(arg0, arg1) {
  // Fast path: inline checks for first 6 signatures
  if (arguments.length === len0 && test00(arg0) && test01(arg1)) {
    return fn0.apply(this, arguments)
  }
  // ... up to 5 more fast checks ...

  // Fall back to generic path
  return generic.apply(this, arguments)
}
```

Key functions:
- `isFastPathEligible(signature)` - Check if signature qualifies (≤2 params, no rest)
- `createFastPathSlot(signature)` - Create inlined test slot
- `createFastPathDispatcher(slots, generic)` - Build optimized dispatcher

### Generic-Path Dispatcher

**Location**: `src/dispatch/generic-path.ts`

Loop-based fallback for complex cases (rest params, many signatures):

```typescript
function generic() {
  for (let i = iStart; i < iEnd; i++) {
    if (tests[i](arguments)) {
      return fns[i].apply(this, arguments)
    }
  }
  return onMismatch(name, arguments, signatures)
}
```

Key functions:
- `createGenericDispatcher(signatures, onMismatch)` - Build fallback dispatcher
- `createSimpleDispatcher(signature)` - Single-signature optimized dispatch

## Reference Resolver

Handles `typed.referTo()` and `typed.referToSelf()` for cross-referencing signatures.

**Location**: `src/core/reference-resolver.ts`

### Functions

#### `referTo(...signatures: string[], callback: Function): ReferTo`
Creates a reference to other signatures within the same typed function.

```typescript
const fn = typed({
  'number': x => x,
  'string': typed.referTo('number', (numImpl) => {
    return (s: string) => numImpl(parseFloat(s))
  })
})
```

#### `referToSelf(callback: Function): ReferToSelf`
Creates a self-reference for recursive calls.

```typescript
const factorial = typed({
  'number': typed.referToSelf((self) => {
    return (n: number) => n <= 1 ? 1 : n * self(n - 1)
  })
})
```

#### `resolveReferences(functionList, signatureMap, self): Function[]`
Resolves all referTo/referToSelf objects to actual functions.

#### `isReferTo(value: unknown): value is ReferTo`
Type guard to check if a value is a ReferTo marker.

#### `isReferToSelf(value: unknown): value is ReferToSelf`
Type guard to check if a value is a ReferToSelf marker.

## Error Factory

Creates detailed error messages for type mismatches.

**Location**: `src/core/error-factory.ts`

### Functions

#### `createError(name: string, args: unknown[], signatures: Signature[]): TypeError`
Creates a TypeError with detailed mismatch information.

**Error categories**:
- `wrongType` - Argument has wrong type at index
- `tooFewArgs` - Not enough arguments provided
- `tooManyArgs` - Too many arguments provided
- `mismatch` - Generic mismatch (no specific cause)

```typescript
const err = createError('add', [1, 'x'], signatures)
// TypeError: Unexpected type of argument in function add
// (expected: number, actual: string, index: 1)
// err.data = { category: 'wrongType', fn: 'add', index: 1, ... }
```

#### `typed.onMismatch: MismatchHandler`
Configurable handler called when no signature matches.

```typescript
typed.onMismatch = function(name, args, signatures) {
  // Default: throw createError(name, args, signatures)
  // Can be customized for special handling
}
```

## Public API

### Main Function

#### `typed(name?: string, ...sources): TypedFunction`
Creates a new typed function from signature sources.

**Location**: `src/factory.ts`

**Parameters**:
- `name` - Optional function name
- `sources` - Objects with signatures, typed functions, or functions with `.signature`

**Returns**: A callable typed function with `.signatures` property

### Factory Method

#### `typed.create(): TypedInstance`
Creates a new, isolated typed-function instance.

**Location**: `src/factory.ts`

### Type Management

| Method | Description |
|--------|-------------|
| `typed.addType(type, beforeObjectTest?)` | Add a single type |
| `typed.addTypes(types, before?)` | Add multiple types |
| `typed.clear()` | Reset to default types |

### Conversion Management

| Method | Description |
|--------|-------------|
| `typed.addConversion(conv, options?)` | Add a conversion |
| `typed.addConversions(convs, options?)` | Add multiple conversions |
| `typed.removeConversion(conv)` | Remove a conversion |
| `typed.clearConversions()` | Remove all conversions |
| `typed.convert(value, type)` | Convert a value |

### Signature Lookup

| Method | Description |
|--------|-------------|
| `typed.find(fn, signature, options?)` | Get implementation for signature |
| `typed.findSignature(fn, signature, options?)` | Get full signature object |
| `typed.resolve(fn, args)` | Find matching signature for args |

### Utilities

| Method | Description |
|--------|-------------|
| `typed.isTypedFunction(x)` | Check if x is a typed function |
| `typed.createError(name, args, sigs)` | Create mismatch error |
| `typed.referTo(...sigs, cb)` | Reference other signatures |
| `typed.referToSelf(cb)` | Self-reference |

### Configuration

| Property | Default | Description |
|----------|---------|-------------|
| `typed.onMismatch` | throws error | Mismatch handler |
| `typed.warnAgainstDeprecatedThis` | `true` | Warn about deprecated `this` usage |

## Utility Functions

Internal helper functions used throughout the codebase.

### Array Helpers

**Location**: `src/utils/array-helpers.ts`

| Function | Description |
|----------|-------------|
| `last(arr)` | Get last element |
| `initial(arr)` | Get all but last element |
| `slice(arr, start, end?)` | Slice array-like |
| `flatMap(arr, callback)` | Map and flatten results |
| `findInArray(arr, test)` | Find first matching element |
| `hasItem(arr, item)` | Check if item exists |
| `createArray(length)` | Create array of length |
| `arraysEqual(a, b)` | Compare arrays for equality |

### Object Helpers

**Location**: `src/utils/object-helpers.ts`

| Function | Description |
|----------|-------------|
| `isPlainObject(x)` | Check if plain object |
| `hasOwnProperty(obj, prop)` | Safe hasOwnProperty check |
| `getProperty(obj, prop)` | Safe property access |
| `shallowCopy(obj)` | Create shallow copy |
| `mapObject(obj, fn)` | Map over object values |
| `objectSize(obj)` | Count own properties |
| `isEmptyObject(obj)` | Check if empty object |
| `mergeObjects(...objs)` | Merge multiple objects |
| `pick(obj, keys)` | Pick specific keys |
| `omit(obj, keys)` | Omit specific keys |

## Related Documentation

- [OVERVIEW.md](./OVERVIEW.md) - Project introduction
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design and patterns
- [DATAFLOW.md](./DATAFLOW.md) - Runtime data flow
