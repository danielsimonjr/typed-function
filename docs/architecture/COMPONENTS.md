# typed-function Components

This document provides detailed documentation of the components and modules within typed-function.

## Component Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                        typed-function                               │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────┐    ┌──────────────────────┐             │
│  │    Type Registry     │    │  Conversion Registry │             │
│  │  ─────────────────   │    │  ──────────────────  │             │
│  │  • typeMap (Map)     │    │  • stored on types   │             │
│  │  • typeList (Array)  │    │  • nConversions      │             │
│  │  • anyType           │    │                      │             │
│  └──────────┬───────────┘    └──────────┬───────────┘             │
│             │                           │                          │
│             ▼                           ▼                          │
│  ┌──────────────────────────────────────────────────┐             │
│  │              Signature Processor                  │             │
│  │  ────────────────────────────────────────────    │             │
│  │  • parseSignature()   • expandParam()            │             │
│  │  • splitParams()      • compileTests()           │             │
│  │  • compareSignatures()                           │             │
│  └──────────────────────────┬───────────────────────┘             │
│                             │                                      │
│                             ▼                                      │
│  ┌──────────────────────────────────────────────────┐             │
│  │                Dispatch Engine                    │             │
│  │  ────────────────────────────────────────────    │             │
│  │  • theTypedFn (fast path)                        │             │
│  │  • generic (slow path)                           │             │
│  │  • onMismatch handler                            │             │
│  └──────────────────────────┬───────────────────────┘             │
│                             │                                      │
│                             ▼                                      │
│  ┌──────────────────────────────────────────────────┐             │
│  │               Reference Resolver                  │             │
│  │  ────────────────────────────────────────────    │             │
│  │  • referTo()       • referToSelf()               │             │
│  │  • resolveReferences()                           │             │
│  └──────────────────────────────────────────────────┘             │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

## Type Registry

The type registry manages all known types in a typed universe.

### State

| Variable | Type | Description |
|----------|------|-------------|
| `typeMap` | `Map<string, TypeDef>` | Primary lookup for type definitions |
| `typeList` | `string[]` | Ordered list of type names |
| `anyType` | `TypeDef` | Special "any" type that matches everything |

### Built-in Types

```javascript
const _types = [
  { name: 'number',    test: x => typeof x === 'number' },
  { name: 'string',    test: x => typeof x === 'string' },
  { name: 'boolean',   test: x => typeof x === 'boolean' },
  { name: 'Function',  test: x => typeof x === 'function' },
  { name: 'Array',     test: Array.isArray },
  { name: 'Date',      test: x => x instanceof Date },
  { name: 'RegExp',    test: x => x instanceof RegExp },
  { name: 'Object',    test: isPlainObject },
  { name: 'null',      test: x => x === null },
  { name: 'undefined', test: x => x === undefined }
]

const anyType = { name: 'any', test: ok, isAny: true }
```

### Functions

#### `findType(typeName: string): TypeDef`
Looks up a type by name. Throws `TypeError` with helpful suggestions if not found.

**Location**: `src/typed-function.mjs:106-122`

```javascript
findType('number')  // Returns number TypeDef
findType('Number')  // Throws: 'Unknown type "Number". Did you mean "number"?'
```

#### `addTypes(types: TypeDef[], before?: string): void`
Adds new types to the registry. Types are inserted before the specified type (default: 'any').

**Location**: `src/typed-function.mjs:137-168`

```javascript
addTypes([{ name: 'Complex', test: isComplex }], 'Object')
```

#### `clear(): void`
Resets the type registry to only contain `any`, then adds default types.

**Location**: `src/typed-function.mjs:176-185`

#### `clearConversions(): void`
Removes all registered conversions while keeping types.

**Location**: `src/typed-function.mjs:190-196`

#### `findTypeNames(value: any): string[]`
Returns all type names that match a given value.

**Location**: `src/typed-function.mjs:204-213`

```javascript
findTypeNames(42)      // ['number']
findTypeNames([1,2])   // ['Array']
findTypeNames({a: 1})  // ['Object']
```

## Conversion Registry

Conversions enable automatic type coercion. They're stored on the destination type's `conversionsTo` array.

### State

| Variable | Type | Description |
|----------|------|-------------|
| `nConversions` | `number` | Counter for conversion priority ordering |

### Functions

#### `typed.addConversion(conversion: ConversionDef, options?): void`
Registers a new type conversion.

**Location**: `src/typed-function.mjs:1899-1921`

```javascript
typed.addConversion({
  from: 'boolean',
  to: 'number',
  convert: x => x ? 1 : 0
})
```

**Options**:
- `override: boolean` - If true, replaces existing conversion (default: false)

#### `typed.removeConversion(conversion: ConversionDef): void`
Removes an existing conversion. The convert function must match exactly.

**Location**: `src/typed-function.mjs:1944-1960`

#### `availableConversions(typeNames: string[]): ConversionDef[]`
Finds all conversions that can convert to any of the given types.

**Location**: `src/typed-function.mjs:1003-1038`

#### `convert(value: any, typeName: string): any`
Converts a value to the specified type using registered conversions.

**Location**: `src/typed-function.mjs:366-385`

```javascript
// Assuming boolean → number conversion exists
typed.convert(true, 'number')  // Returns 1
```

## Signature Processor

Handles parsing, expansion, and compilation of function signatures.

### Signature Parsing

#### `parseSignature(rawSignature: string): Param[]`
Parses a signature string into an array of parameters.

**Location**: `src/typed-function.mjs:496-522`

```javascript
parseSignature('number, string')
// Returns: [
//   { types: [{name: 'number', ...}], name: 'number', restParam: false, ... },
//   { types: [{name: 'string', ...}], name: 'string', restParam: false, ... }
// ]

parseSignature('...number')
// Returns: [
//   { types: [{name: 'number', ...}], name: '...number', restParam: true, ... }
// ]
```

#### `parseParam(param: string): Param`
Parses a single parameter string (e.g., "number | string" or "...number").

**Location**: `src/typed-function.mjs:402-436`

#### `stringifyParams(params: Param[], separator?: string): string`
Converts parsed parameters back to a string representation.

**Location**: `src/typed-function.mjs:393-395`

### Signature Expansion

#### `expandParam(param: Param): Param`
Expands a parameter to include types reachable via conversions.

**Location**: `src/typed-function.mjs:444-472`

```javascript
// If boolean → number conversion exists:
expandParam({ types: [{name: 'number'}], ... })
// Returns: { types: [{name: 'number'}, {name: 'boolean', conversion: ...}], ... }
```

#### `splitParams(params: Param[]): Param[][]`
Splits union types into separate signature permutations.

**Location**: `src/typed-function.mjs:1168-1212`

```javascript
// 'number | string, boolean' becomes:
// [['number', 'boolean'], ['string', 'boolean']]
```

### Signature Comparison

#### `compareSignatures(sig1: Signature, sig2: Signature): number`
Compares two signatures for dispatch ordering. Returns negative if sig1 should come first.

**Location**: `src/typed-function.mjs:897-993`

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

**Location**: `src/typed-function.mjs:830-882`

#### `conflicting(params1: Param[], params2: Param[]): boolean`
Checks if two signatures would conflict (accept same arguments).

**Location**: `src/typed-function.mjs:1220-1247`

### Test Compilation

#### `compileTest(param: Param): (x: any) => boolean`
Creates an optimized type test for a single parameter.

**Location**: `src/typed-function.mjs:540-565`

```javascript
// For single type: direct test function
// For 2 types: (x) => test0(x) || test1(x)
// For 3+ types: loop-based test
```

#### `compileTests(params: Param[]): (args: any[]) => boolean`
Creates a test function for a complete signature.

**Location**: `src/typed-function.mjs:572-626`

## Dispatch Engine

The dispatch engine routes function calls to the correct implementation.

### Core Dispatcher

The main typed function (`theTypedFn`) uses a two-tier dispatch strategy:

**Location**: `src/typed-function.mjs:1529-1540`

```javascript
function theTypedFn(arg0, arg1) {
  // Fast path: inline checks for first 6 signatures
  if (arguments.length === len0 && test00(arg0) && test01(arg1)) {
    return fn0.apply(this, arguments)
  }
  // ... 5 more fast checks ...

  // Slow path: generic loop
  return generic.apply(this, arguments)
}
```

### Generic Dispatcher

Falls back for complex cases (rest params, many signatures).

**Location**: `src/typed-function.mjs:1515-1525`

```javascript
function generic() {
  for (let i = iStart; i < iEnd; i++) {
    if (tests[i](arguments)) {
      return fns[i].apply(this, arguments)
    }
  }
  return typed.onMismatch(name, arguments, signatures)
}
```

### Argument Preprocessing

#### `compileArgsPreprocessing(params: Param[], fn: Function): Function`
Wraps a function to handle conversions and rest parameters.

**Location**: `src/typed-function.mjs:1050-1085`

#### `compileArgConversion(param: Param): (arg: any) => any`
Creates a converter function for a single parameter.

**Location**: `src/typed-function.mjs:1093-1149`

## Reference Resolver

Handles `typed.referTo()` and `typed.referToSelf()` for cross-referencing signatures.

### Functions

#### `referTo(...signatures: string[], callback: Function): ReferToObject`
Creates a reference to other signatures within the same typed function.

**Location**: `src/typed-function.mjs:1643-1653`

```javascript
const fn = typed({
  'number': x => x,
  'string': typed.referTo('number', numImpl => {
    return s => numImpl(parseFloat(s))
  })
})
```

#### `referToSelf(callback: Function): ReferToSelfObject`
Creates a self-reference for recursive calls.

**Location**: `src/typed-function.mjs:1665-1671`

```javascript
const factorial = typed({
  'number': typed.referToSelf(self => {
    return n => n <= 1 ? 1 : n * self(n - 1)
  })
})
```

#### `resolveReferences(functionList, signatureMap, self): Function[]`
Resolves all referTo/referToSelf objects to actual functions.

**Location**: `src/typed-function.mjs:1309-1349`

## Error Factory

Creates detailed error messages for type mismatches.

### Functions

#### `createError(name: string, args: any[], signatures: Signature[]): TypeError`
Creates a TypeError with detailed mismatch information.

**Location**: `src/typed-function.mjs:693-781`

**Error categories**:
- `wrongType` - Argument has wrong type at index
- `tooFewArgs` - Not enough arguments provided
- `tooManyArgs` - Too many arguments provided
- `mismatch` - Generic mismatch (no specific cause)

```javascript
const err = createError('add', [1, 'x'], signatures)
// TypeError: Unexpected type of argument in function add
// (expected: number, actual: string, index: 1)
// err.data = { category: 'wrongType', fn: 'add', index: 1, ... }
```

#### `typed.onMismatch: Function`
Configurable handler called when no signature matches.

**Location**: `src/typed-function.mjs:1839`

```javascript
typed.onMismatch = function(name, args, signatures) {
  // Default: throw createError(name, args, signatures)
  // Can be customized for special handling
}
```

## Public API

### Main Function

#### `typed(name?: string, ...sources): TypedFunction`
Creates a new typed function from signature sources.

**Location**: `src/typed-function.mjs:1794-1835`

**Parameters**:
- `name` - Optional function name
- `sources` - Objects with signatures, typed functions, or functions with `.signature`

**Returns**: A callable typed function with `.signatures` property

### Factory Method

#### `typed.create(): typed`
Creates a new, isolated typed-function instance.

**Location**: `src/typed-function.mjs:1837`

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

**Location**: `src/typed-function.mjs:1576-1630`

| Function | Description |
|----------|-------------|
| `initial(arr)` | Get all but last element |
| `last(arr)` | Get last element |
| `slice(arr, start, end?)` | Slice array-like |
| `findInArray(arr, test)` | Find first matching element |
| `flatMap(arr, callback)` | Map and flatten results |

## Related Documentation

- [OVERVIEW.md](./OVERVIEW.md) - Project introduction
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design and patterns
- [DATAFLOW.md](./DATAFLOW.md) - Runtime data flow
