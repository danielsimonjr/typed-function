# typed-function Data Flow

This document describes how data flows through typed-function v5.0 during both creation and execution of typed functions.

## Overview

There are two main data flows:

1. **Creation Flow** - When `typed()` is called to create a new typed function
2. **Execution Flow** - When a typed function is invoked with arguments

```
┌─────────────────────────────────────────────────────────────────────┐
│                      CREATION FLOW                                   │
│  typed({ 'number, string': fn })  ────────────────► TypedFunction   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      EXECUTION FLOW                                  │
│  typedFn(42, 'hello')  ───────────────────────────► result          │
└─────────────────────────────────────────────────────────────────────┘
```

## Creation Flow

When you call `typed()` to create a new typed function, here's the complete data flow:

### Step 1: Input Normalization

```
Input Sources                            Normalized Signatures
─────────────────                        ──────────────────────

{ 'number': fn1 }          ──┐
                             │           {
existingTypedFn            ──┼────►        'number': fn1,
                             │             'string': fn2,
fn with .signature='boolean' ┘             'boolean': fn3
                                         }
```

**Code path**: `typed()` function in `src/factory.ts`

### Step 2: Signature Parsing

Each signature string is parsed into structured `Param[]` objects:

```
Signature String                    Parsed Params
────────────────                    ─────────────

'number, string | boolean'   ─────►  [
                                       {
                                         types: [{ name: 'number', ... }],
                                         name: 'number',
                                         hasAny: false,
                                         hasConversion: false,
                                         restParam: false
                                       },
                                       {
                                         types: [
                                           { name: 'string', ... },
                                           { name: 'boolean', ... }
                                         ],
                                         name: 'string|boolean',
                                         hasAny: false,
                                         hasConversion: false,
                                         restParam: false
                                       }
                                     ]
```

**Code path**: `parseSignature()` in `src/core/signature-parser.ts`

### Step 3: Conflict Detection

Each new signature is checked against existing signatures:

```
Existing Signatures          New Signature
───────────────────          ─────────────

['number']                   ['number']  ──► CONFLICT! (same types, same length)
['number', 'string']         ['string']  ──► OK (different param count)
['any']                      ['number']  ──► OK (different specificity)
```

**Code path**: `conflicting()` in `src/core/signature-comparator.ts`

### Step 4: Conversion Expansion

Parameters are expanded to include types reachable via conversions:

```
Original Param                      Expanded Param
──────────────                      ───────────────

types: [{ name: 'number' }]   ─────►  types: [
hasConversion: false                    { name: 'number', conversion: null },
                                        { name: 'boolean', conversion: {
                                            from: 'boolean',
                                            to: 'number',
                                            convert: x => +x
                                          }
                                        }
                                      ]
                                      hasConversion: true
```

**Code path**: `expandParam()` in `src/core/signature-parser.ts`

### Step 5: Signature Splitting

Union types are split into separate signatures:

```
Single Signature with Union             Split Signatures
───────────────────────────             ────────────────

'number | string, boolean'        ─────►  [
                                           'number, boolean',
                                           'string, boolean'
                                         ]
```

**Code path**: `splitParams()` in `src/core/signature-parser.ts`

### Step 6: Signature Sorting

Signatures are sorted by preference for optimal dispatch:

```
Unsorted                          Sorted (by preference)
────────                          ──────────────────────

'any'                             'number'        (most specific)
'number'                    ─────► 'number|string' (union, but no conversion)
'number|string'                   'any'           (wildcard last)
```

**Sorting criteria** (in order):
1. No `...any` rest param
2. Fewer `any` params
3. No conversion in rest param
4. Fewer conversions
5. No rest param
6. More params (without rest) / fewer params (with rest)
7. Lower type index at each position

**Code path**: `compareSignatures()` in `src/core/signature-comparator.ts`

### Step 7: Reference Resolution

`referTo` and `referToSelf` objects are resolved to actual functions:

```
Before Resolution                 After Resolution
─────────────────                 ────────────────

{                                 {
  'number': fn1,                    'number': fn1,
  'string': referTo('number',       'string': (s) => {
    numFn => s =>                      return fn1(parseFloat(s))
      numFn(parseFloat(s))           }
  )                                }
}
```

**Code path**: `resolveReferences()` in `src/core/reference-resolver.ts`

### Step 8: Test Compilation

Type tests are compiled into optimized functions:

```
Param                              Compiled Test
─────                              ─────────────

Single type:                       (x) => typeof x === 'number'
{ types: ['number'] }

Two types:                         (x) => typeof x === 'number' ||
{ types: ['number', 'string'] }          typeof x === 'string'

Many types:                        (x) => {
{ types: ['a', 'b', 'c', 'd'] }      for (let i = 0; i < tests.length; i++) {
                                        if (tests[i](x)) return true
                                      }
                                      return false
                                    }
```

**Code path**: `compileTest()` in `src/core/signature-compiler.ts`

### Step 9: Implementation Wrapping

Functions are wrapped to handle conversions and rest params:

```
Original Function                  Wrapped Implementation
─────────────────                  ──────────────────────

fn(a, b)                     ─────►  function(a, b) {
(with boolean→number conv)            if (typeof a === 'boolean') {
                                        a = +a
                                      }
                                      return fn(a, b)
                                    }
```

**Code path**: `compileArgsPreprocessing()` in `src/core/signature-compiler.ts`

### Step 10: Dispatcher Creation

The final typed function is created with fast path optimization:

```
                                    theTypedFn(arg0, arg1) {
Compiled Signatures           ─────►  // Fast path (first 6 signatures)
[sig0, sig1, sig2, ...]               if (len0 && test00(arg0) && test01(arg1))
                                        return fn0.apply(this, arguments)
                                      // ...

                                      // Generic fallback
                                      return generic.apply(this, arguments)
                                    }
```

**Code path**: `createDispatcher()` in `src/dispatch/dispatcher.ts`

## Execution Flow

When a typed function is invoked, here's how arguments flow through the system:

### Step 1: Fast Path Check

```
┌─────────────────────────────────────────────────────────────────┐
│                    theTypedFn(42, 'hello')                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Check: arguments.length === 2?  ──► YES                        │
│  Check: test00(42)?              ──► YES (typeof 42 === 'number')│
│  Check: test01('hello')?         ──► YES (typeof 'hello'...)    │
│                                                                  │
│  ──► fn0.apply(this, [42, 'hello'])                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Step 2: Generic Path (if fast path fails)

```
┌─────────────────────────────────────────────────────────────────┐
│                    generic(42, 'hello')                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  for (let i = 6; i < signatures.length; i++) {                  │
│    if (tests[i]([42, 'hello'])) {                               │
│      return fns[i].apply(this, [42, 'hello'])                   │
│    }                                                             │
│  }                                                               │
│                                                                  │
│  // No match found                                               │
│  return typed.onMismatch('myFn', [42, 'hello'], signatures)     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Step 3: Argument Conversion (if needed)

```
┌─────────────────────────────────────────────────────────────────┐
│              implementation(true, 42)                            │
│                                                                  │
│  // Has boolean→number conversion on first param                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  convertArgs(true, 42) {                                        │
│    args[0] = convert(true)     // → 1                           │
│    args[1] = 42                // no conversion                 │
│    return fn(1, 42)                                             │
│  }                                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Step 4: Rest Parameter Collection (if needed)

```
┌─────────────────────────────────────────────────────────────────┐
│              implementation(1, 2, 3, 4, 5)                       │
│                                                                  │
│  // Signature: 'number, ...number'                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  preprocessRestParams(1, 2, 3, 4, 5) {                          │
│    // Collect rest params into array                            │
│    return fn(1, [2, 3, 4, 5])                                   │
│  }                                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Step 5: Error Generation (on mismatch)

```
┌─────────────────────────────────────────────────────────────────┐
│              onMismatch('add', [1, 'x'], signatures)             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  createError('add', [1, 'x'], signatures)                       │
│                                                                  │
│  1. Find matching signatures for arg[0]                         │
│     ──► [sig1, sig2] match for '1'                              │
│                                                                  │
│  2. Check arg[1] against remaining signatures                   │
│     ──► sig1 expects 'number', got 'string'                     │
│     ──► sig2 expects 'boolean', got 'string'                    │
│                                                                  │
│  3. Generate error message                                       │
│     ──► TypeError: Unexpected type of argument                  │
│         (expected: number or boolean, actual: string, index: 1) │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Type Lookup Flow

When `typed.find()` or `typed.resolve()` is called:

```
┌─────────────────────────────────────────────────────────────────┐
│        typed.find(fn, 'number, string')                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Parse signature: parseSignature('number, string')           │
│     ──► [{ types: ['number'] }, { types: ['string'] }]          │
│                                                                  │
│  2. Stringify: stringifyParams(params)                          │
│     ──► 'number,string'                                         │
│                                                                  │
│  3. Lookup in signatureMap                                       │
│     ──► fn._typedFunctionData.signatureMap.get('number,string') │
│                                                                  │
│  4. Return implementation                                        │
│     ──► signature.implementation                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Conversion Flow

When `typed.convert()` is called:

```
┌─────────────────────────────────────────────────────────────────┐
│        typed.convert(true, 'number')                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Find target type: findType('number')                        │
│     ──► { name: 'number', conversionsTo: [...] }                │
│                                                                  │
│  2. Check if already correct type: type.test(true)              │
│     ──► false (true is not a number)                            │
│                                                                  │
│  3. Find matching conversion                                     │
│     for (conv of type.conversionsTo) {                          │
│       if (findType(conv.from).test(true)) {                     │
│         return conv.convert(true)  // → 1                       │
│       }                                                          │
│     }                                                            │
│                                                                  │
│  4. Return converted value: 1                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## State Changes

### Mutable State During Creation

| State | Location | Mutations |
|-------|----------|-----------|
| `typed.createCount` | Global | Incremented on each typed function creation |
| `typeMap` | Per universe | Modified by `addType()`, `clear()` |
| `typeList` | Per universe | Modified by `addTypes()`, `clear()` |
| `nConversions` | Per universe | Incremented by `addConversion()` |
| `type.conversionsTo` | Per type | Modified by `addConversion()`, `removeConversion()` |

### Immutable During Execution

Once a typed function is created, its internal state is immutable:
- `signatures` array
- `signatureMap`
- Compiled test functions
- Wrapped implementations

This ensures thread-safe (in async sense) execution.

## Memory Layout

```
TypedFunction Instance
─────────────────────────────────────────────────────────
│ theTypedFn (callable)                                  │
│   ├── name: 'add'                                     │
│   ├── signatures: { 'number,number': fn1, ... }       │
│   └── _typedFunctionData: {                           │
│         signatures: [                                  │
│           {                                            │
│             params: [...],                            │
│             fn: [original function],                  │
│             test: [compiled test],                    │
│             implementation: [wrapped function],       │
│             name: 'number,number'                     │
│           },                                           │
│           ...                                          │
│         ],                                             │
│         signatureMap: Map {                           │
│           'number,number' => [signature object],      │
│           ...                                          │
│         }                                              │
│       }                                                │
─────────────────────────────────────────────────────────
```

## Related Documentation

- [OVERVIEW.md](./OVERVIEW.md) - Project introduction
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design and patterns
- [COMPONENTS.md](./COMPONENTS.md) - Detailed component breakdown
