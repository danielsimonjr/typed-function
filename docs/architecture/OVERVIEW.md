# typed-function Overview

## What is typed-function?

**typed-function** is a JavaScript library that provides runtime type-checking and multiple dispatch for JavaScript functions. It enables developers to define functions with multiple type signatures and automatically dispatches to the correct implementation based on argument types.

## The Problem It Solves

JavaScript lacks built-in function overloading and provides limited type checking. This leads to several challenges:

1. **No function overloading** - Can't define multiple implementations of the same function for different argument types
2. **Silent type errors** - Type mismatches often fail silently or produce unhelpful error messages
3. **Manual type checking** - Developers must write verbose type-checking code repeatedly
4. **Poor error messages** - When things go wrong, tracking down type-related bugs is difficult

## How typed-function Helps

```javascript
import typed from 'typed-function'

// Define a function with multiple type signatures
const add = typed('add', {
  'number, number': (a, b) => a + b,
  'string, string': (a, b) => a.concat(b),
  'Array, Array': (a, b) => a.concat(b)
})

add(2, 3)           // Returns 5 (uses 'number, number')
add('a', 'b')       // Returns 'ab' (uses 'string, string')
add([1], [2])       // Returns [1, 2] (uses 'Array, Array')
add(2, 'b')         // Throws TypeError with detailed message
```

## Key Features

### 1. Multiple Signatures
Define multiple implementations for different argument types:
```javascript
const fn = typed({
  'number': x => x * 2,
  'string': x => x.toUpperCase(),
  'number, number': (a, b) => a + b
})
```

### 2. Union Types
Accept multiple types for a single parameter:
```javascript
const fn = typed({
  'number | string': x => String(x)
})
```

### 3. Rest Parameters
Handle variable-length arguments:
```javascript
const sum = typed({
  '...number': nums => nums.reduce((a, b) => a + b, 0)
})
sum(1, 2, 3, 4)  // Returns 10
```

### 4. Type Conversions
Automatically convert arguments between types:
```javascript
typed.addConversion({
  from: 'boolean',
  to: 'number',
  convert: x => x ? 1 : 0
})
```

### 5. Custom Types
Register your own types:
```javascript
typed.addType({
  name: 'Point',
  test: x => x && typeof x.x === 'number' && typeof x.y === 'number'
})
```

### 6. Detailed Error Messages
Get helpful error messages when types don't match:
```
TypeError: Unexpected type of argument in function add
(expected: number or string, actual: boolean, index: 0)
```

## Built-in Types

typed-function comes with these built-in types:

| Type | Test |
|------|------|
| `number` | `typeof x === 'number'` |
| `string` | `typeof x === 'string'` |
| `boolean` | `typeof x === 'boolean'` |
| `Function` | `typeof x === 'function'` |
| `Array` | `Array.isArray(x)` |
| `Date` | `x instanceof Date` |
| `RegExp` | `x instanceof RegExp` |
| `Object` | Plain objects (`x.constructor === Object`) |
| `null` | `x === null` |
| `undefined` | `x === undefined` |
| `any` | Matches any value (wildcard) |

## Project Statistics

- **Version**: 4.2.2
- **Bundle Size**: ~8KB (minified + gzip)
- **Runtime Dependencies**: Zero
- **Source**: Single file (~1,988 lines)
- **License**: MIT

## Use Cases

1. **Math Libraries** - Define operations that work with numbers, matrices, complex numbers, etc.
2. **Data Processing** - Handle different input formats uniformly
3. **API Development** - Provide flexible interfaces with strong type guarantees
4. **Domain-Specific Languages** - Build type-safe DSLs in JavaScript

## Related Projects

typed-function is used by [math.js](https://mathjs.org/), a comprehensive mathematics library for JavaScript.

## Quick Links

- [README](../../README.md) - Full API documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design and patterns
- [COMPONENTS.md](./COMPONENTS.md) - Module and component details
- [DATAFLOW.md](./DATAFLOW.md) - Data flow and execution paths
- [HISTORY.md](../../HISTORY.md) - Version changelog
