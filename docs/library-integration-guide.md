# Library Integration Guide

This guide covers patterns for integrating typed-function into your own libraries, creating domain-specific type registries, and optimizing for different use cases.

## Table of Contents

- [Quick Start](#quick-start)
- [Creating Isolated Instances](#creating-isolated-instances)
- [Domain-Specific Type Registries](#domain-specific-type-registries)
- [Wrapping typed-function](#wrapping-typed-function)
- [WASM Integration](#wasm-integration)
- [Bundle Size Optimization](#bundle-size-optimization)
- [Error Handling](#error-handling)
- [Debug Mode](#debug-mode)
- [Performance Tips](#performance-tips)

## Quick Start

### Basic Library Setup

```typescript
import typed, { create, TypedInstance } from 'typed-function';

// Option 1: Use the default instance
export const myTypedAdd = typed('add', {
  'number, number': (a, b) => a + b,
  'string, string': (a, b) => a + b,
});

// Option 2: Create an isolated instance for your library
const myTyped = create();
export { myTyped };
```

## Creating Isolated Instances

Each `create()` call returns an independent typed-function instance with its own type registry and conversions. This prevents conflicts between libraries.

```typescript
import { create, TypedInstance } from 'typed-function';

// Create an isolated instance for your library
const mathTyped: TypedInstance = create();

// Add custom types specific to your domain
mathTyped.addType({
  name: 'Complex',
  test: (x): x is Complex => x instanceof Complex,
});

mathTyped.addType({
  name: 'Matrix',
  test: (x): x is Matrix => x instanceof Matrix,
});

// Add conversions between types
mathTyped.addConversion({
  from: 'number',
  to: 'Complex',
  convert: (n) => new Complex(n, 0),
});

// Export your configured instance
export { mathTyped as typed };
```

## Domain-Specific Type Registries

### Math Library Example

```typescript
import { create } from 'typed-function';

class Complex {
  constructor(public re: number, public im: number) {}
}

class Matrix {
  constructor(public data: number[][]) {}
}

// Create math-specific typed instance
const math = create();

// Register domain types
math.addTypes([
  { name: 'Complex', test: (x) => x instanceof Complex },
  { name: 'Matrix', test: (x) => x instanceof Matrix },
  { name: 'Vector', test: (x) => Array.isArray(x) && x.every(n => typeof n === 'number') },
]);

// Register conversions
math.addConversions([
  { from: 'number', to: 'Complex', convert: (n) => new Complex(n, 0) },
  { from: 'Array', to: 'Matrix', convert: (arr) => new Matrix(arr) },
]);

// Create typed functions
export const add = math('add', {
  'number, number': (a, b) => a + b,
  'Complex, Complex': (a, b) => new Complex(a.re + b.re, a.im + b.im),
  'Matrix, Matrix': (a, b) => {
    // Matrix addition logic
    return new Matrix(a.data.map((row, i) =>
      row.map((val, j) => val + b.data[i][j])
    ));
  },
});

export const multiply = math('multiply', {
  'number, number': (a, b) => a * b,
  'Complex, Complex': (a, b) => new Complex(
    a.re * b.re - a.im * b.im,
    a.re * b.im + a.im * b.re
  ),
});
```

### Validation Library Example

```typescript
import { create } from 'typed-function';

// Create validation-specific instance
const validate = create();

// Add validation-related types
validate.addTypes([
  { name: 'Email', test: (x) => typeof x === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x) },
  { name: 'URL', test: (x) => { try { new URL(x); return true; } catch { return false; } } },
  { name: 'UUID', test: (x) => typeof x === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x) },
  { name: 'PhoneNumber', test: (x) => typeof x === 'string' && /^\+?[\d\s\-()]+$/.test(x) },
]);

// Create typed validators
export const sanitize = validate('sanitize', {
  'Email': (email) => email.toLowerCase().trim(),
  'URL': (url) => new URL(url).href,
  'PhoneNumber': (phone) => phone.replace(/[^\d+]/g, ''),
});
```

## Wrapping typed-function

### Creating a Library Facade

```typescript
import { create, TypedInstance, TypedFunction, TypeDef } from 'typed-function';

interface MyLibraryOptions {
  enableWasm?: boolean;
  debug?: boolean;
  customTypes?: TypeDef[];
}

class MyMathLibrary {
  private typed: TypedInstance;
  private initialized = false;

  constructor() {
    this.typed = create();
  }

  async init(options: MyLibraryOptions = {}): Promise<void> {
    if (this.initialized) return;

    // Initialize WASM if requested
    if (options.enableWasm !== false) {
      await this.typed.init({ preferWasm: true });
    }

    // Add custom types
    if (options.customTypes) {
      this.typed.addTypes(options.customTypes);
    }

    // Add default types
    this.setupDefaultTypes();
    this.setupDefaultConversions();

    this.initialized = true;
  }

  private setupDefaultTypes(): void {
    this.typed.addTypes([
      { name: 'PositiveNumber', test: (x) => typeof x === 'number' && x > 0 },
      { name: 'Integer', test: (x) => Number.isInteger(x) },
    ]);
  }

  private setupDefaultConversions(): void {
    this.typed.addConversion({
      from: 'string',
      to: 'number',
      convert: (s) => parseFloat(s),
    });
  }

  // Factory method for creating typed functions
  createFunction<T extends TypedFunction>(
    name: string,
    signatures: Record<string, (...args: unknown[]) => unknown>
  ): T {
    return this.typed(name, signatures) as T;
  }

  // Expose type registration
  addType(type: TypeDef): void {
    this.typed.addType(type);
  }
}

export const mathLib = new MyMathLibrary();
```

## WASM Integration

### Initializing with WASM

```typescript
import typed from 'typed-function';

async function initializeLibrary() {
  // Initialize with WASM support
  const wasmLoaded = await typed.init({ preferWasm: true });

  if (wasmLoaded) {
    console.log('WASM dispatch enabled for faster performance');
  } else {
    console.log('Falling back to JavaScript dispatch');
  }

  return wasmLoaded;
}

// Check if WASM is active
function checkWasmStatus() {
  return typed.isWasmEnabled();
}
```

### Using Pre-built Type Masks

```typescript
import { TypeMasks, createMask, optionalMask } from 'typed-function';

// Use pre-built masks for common patterns
const numericMask = TypeMasks.NUMERIC_OR_STRING;  // number | string
const nullishMask = TypeMasks.NULLISH;            // null | undefined
const arrayLikeMask = TypeMasks.ARRAY_LIKE;       // Array | Object

// Create custom masks
const myMask = createMask(['number', 'string', 'boolean']);

// Make a type optional (add null | undefined)
const optionalNumber = optionalMask(TypeMasks.NUMBER);
```

## Bundle Size Optimization

### Using the Minimal Build

For smaller bundle sizes when you don't need WASM acceleration:

```typescript
// ~5KB instead of ~15KB
import typed from 'typed-function/minimal';

const add = typed('add', {
  'number, number': (a, b) => a + b,
});
```

### Tree-Shaking Imports

```typescript
// Import only what you need
import { create, TypeMismatchError } from 'typed-function';

// Don't import the entire module if you only need specific parts
// BAD: import typed from 'typed-function';
// GOOD: import { create } from 'typed-function';
```

## Error Handling

### Using Specific Error Classes

```typescript
import typed, {
  TypeMismatchError,
  TooFewArgumentsError,
  TooManyArgumentsError,
  isTypeMismatchError,
} from 'typed-function';

const divide = typed('divide', {
  'number, number': (a, b) => {
    if (b === 0) throw new Error('Division by zero');
    return a / b;
  },
});

try {
  divide('not a number', 2);
} catch (error) {
  if (isTypeMismatchError(error)) {
    console.log(`Type error at index ${error.index}`);
    console.log(`Expected: ${error.expectedTypes.join(' | ')}`);
    console.log(`Got: ${error.actualTypes.join(' | ')}`);
  } else if (error instanceof TooFewArgumentsError) {
    console.log(`Missing arguments, got ${error.providedCount}`);
  } else if (error instanceof TooManyArgumentsError) {
    console.log(`Too many arguments: ${error.providedCount} > ${error.expectedCount}`);
  }
}
```

### Custom Error Handling

```typescript
import typed from 'typed-function';

// Override the default error handler
typed.onMismatch = (name, args, signatures) => {
  // Log to your error tracking service
  console.error(`Type mismatch in ${name}`, { args, signatures });

  // Throw a custom error
  throw new MyCustomError(`Invalid arguments for ${name}`);
};
```

## Debug Mode

### Enabling Debug Logging

```typescript
import typed, { enableDebug, configureDebug, addDebugHandler } from 'typed-function';

// Simple enable
enableDebug('debug');

// Or with configuration
configureDebug({
  enabled: true,
  level: 'trace',
  timing: true,      // Include performance timing
  stackTraces: true, // Include stack traces
});

// Add custom debug handler
addDebugHandler((event) => {
  // Send to your logging service
  myLogger.log(event.type, event.data);
});
```

### Wrapping Functions for Debugging

```typescript
import { wrapWithDebug } from 'typed-function';

const add = typed('add', {
  'number, number': (a, b) => a + b,
});

// Wrap for debugging
const debugAdd = wrapWithDebug(add);

// Calls will now be logged
debugAdd(1, 2); // Logs: [typed-function:function:call] add called with 2 arguments
```

## Performance Tips

### 1. Prefer Specific Types Over `any`

```typescript
// Good: Specific types enable fast-path dispatch
const add = typed('add', {
  'number, number': (a, b) => a + b,
  'string, string': (a, b) => a + b,
});

// Less optimal: `any` type bypasses optimizations
const addAny = typed('addAny', {
  'any, any': (a, b) => a + b,
});
```

### 2. Limit Number of Signatures

```typescript
// Good: 6 or fewer signatures use fast-path dispatch
const process = typed('process', {
  'number': (n) => n * 2,
  'string': (s) => s.toUpperCase(),
  'Array': (arr) => arr.length,
});

// More signatures will use generic dispatch (still fast, but slightly slower)
```

### 3. Initialize WASM Early

```typescript
// Initialize at app startup
async function main() {
  // Do this once at startup
  await typed.init({ preferWasm: true });

  // Now all typed functions benefit from WASM dispatch
  const app = createApp();
  app.start();
}
```

### 4. Reuse Typed Functions

```typescript
// Good: Create once, reuse many times
const add = typed('add', { 'number, number': (a, b) => a + b });

function calculate(values: number[]) {
  return values.reduce((sum, val) => add(sum, val), 0);
}

// Bad: Creating new typed functions in hot paths
function calculateBad(values: number[]) {
  const add = typed('add', { 'number, number': (a, b) => a + b }); // Don't do this!
  return values.reduce((sum, val) => add(sum, val), 0);
}
```

### 5. Use Type Conversions Judiciously

```typescript
// Conversions are powerful but have overhead
// Only add conversions that provide real value

typed.addConversion({
  from: 'string',
  to: 'number',
  convert: parseFloat,
});

// Now this works but has conversion overhead
const add = typed('add', {
  'number, number': (a, b) => a + b,
});

add('1', '2'); // Works via conversion, but slower than add(1, 2)
```

## Complete Library Example

```typescript
// my-math-lib/index.ts
import { create, TypedInstance, TypedFunction } from 'typed-function';
import { TypeMismatchError, isTypeMismatchError } from 'typed-function';

// Types
class Complex {
  constructor(public re: number, public im: number) {}
  toString() { return `${this.re} + ${this.im}i`; }
}

class Fraction {
  constructor(public num: number, public den: number) {}
  toNumber() { return this.num / this.den; }
}

// Create library instance
const math: TypedInstance = create();

// Initialize function
export async function init(options: { wasm?: boolean } = {}) {
  // Setup WASM
  if (options.wasm !== false) {
    await math.init({ preferWasm: true });
  }

  // Register types
  math.addTypes([
    { name: 'Complex', test: (x): x is Complex => x instanceof Complex },
    { name: 'Fraction', test: (x): x is Fraction => x instanceof Fraction },
  ]);

  // Register conversions
  math.addConversions([
    { from: 'number', to: 'Complex', convert: (n) => new Complex(n, 0) },
    { from: 'Fraction', to: 'number', convert: (f: Fraction) => f.toNumber() },
  ]);
}

// Exported functions
export const add = math('add', {
  'number, number': (a, b) => a + b,
  'Complex, Complex': (a, b) => new Complex(a.re + b.re, a.im + b.im),
  'Fraction, Fraction': (a, b) => new Fraction(
    a.num * b.den + b.num * a.den,
    a.den * b.den
  ),
});

export const multiply = math('multiply', {
  'number, number': (a, b) => a * b,
  'Complex, Complex': (a, b) => new Complex(
    a.re * b.re - a.im * b.im,
    a.re * b.im + a.im * b.re
  ),
});

// Re-export types and utilities
export { Complex, Fraction };
export { math as typed };
export { TypeMismatchError, isTypeMismatchError };
```

Usage:

```typescript
import { init, add, multiply, Complex } from 'my-math-lib';

async function main() {
  await init({ wasm: true });

  console.log(add(1, 2));                    // 3
  console.log(add(new Complex(1, 2), new Complex(3, 4)));  // 4 + 6i
  console.log(multiply(new Complex(1, 1), new Complex(1, -1))); // 2 + 0i
}
```
