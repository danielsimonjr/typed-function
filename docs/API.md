# API Documentation

Complete API reference for typed-function v5.0.

## Table of Contents

- [Creating Typed Functions](#creating-typed-functions)
- [TypedFunction Properties](#typedfunction-properties)
- [Instance Methods](#instance-methods)
- [Instance Properties](#instance-properties)
- [Type Definitions](#type-definitions)
- [Error Handling](#error-handling)

---

## Creating Typed Functions

### `typed(signatures)`

Create a typed function from signature definitions.

```typescript
const fn = typed({
  'number, number': (a, b) => a + b,
  'string, string': (a, b) => a + b,
});
```

### `typed(name, signatures)`

Create a named typed function.

```typescript
const add = typed('add', {
  'number, number': (a, b) => a + b,
});

console.log(add.name); // 'add'
```

### `typed(...typedFunctions)`

Merge multiple typed functions into one.

```typescript
const addNumbers = typed({
  'number, number': (a, b) => a + b,
});

const addStrings = typed({
  'string, string': (a, b) => a + b,
});

const add = typed(addNumbers, addStrings);
```

### `typed(plainFunction)`

Create from a plain function with a `signature` property.

```typescript
function multiply(a, b) {
  return a * b;
}
multiply.signature = 'number, number';

const fn = typed(multiply);
```

---

## TypedFunction Properties

### `fn.name`

The name of the typed function (empty string if unnamed).

```typescript
const add = typed('add', { number: x => x });
console.log(add.name); // 'add'
```

### `fn.signatures`

Object mapping signature strings to implementation functions.

```typescript
const fn = typed({
  'number': x => x * 2,
  'string': x => x.toUpperCase(),
});

console.log(Object.keys(fn.signatures)); // ['number', 'string']
```

### `fn.toString()`

Returns a human-readable representation of the typed function.

---

## Instance Methods

### `typed.create()`

Create a new isolated typed-function instance.

```typescript
const typed2 = typed.create();

// typed2 has its own type registry and conversions
typed2.addType({ name: 'MyType', test: x => x instanceof MyClass });
```

### `typed.addType(type, beforeObjectTest?)`

Add a custom type to the registry.

**Parameters:**
- `type: TypeDef` - Type definition object
- `beforeObjectTest?: boolean` - If true (default), insert before the Object type test

```typescript
typed.addType({
  name: 'positive',
  test: x => typeof x === 'number' && x > 0,
});

const fn = typed({
  'positive': x => `${x} is positive`,
});
```

### `typed.addTypes(types, before?)`

Add multiple types at once.

**Parameters:**
- `types: TypeDef[]` - Array of type definitions
- `before?: string | boolean` - Type name to insert before, or boolean

```typescript
typed.addTypes([
  { name: 'even', test: x => typeof x === 'number' && x % 2 === 0 },
  { name: 'odd', test: x => typeof x === 'number' && x % 2 !== 0 },
], 'number');
```

### `typed.addConversion(conversion, options?)`

Add a type conversion.

**Parameters:**
- `conversion: ConversionDef` - Conversion definition
- `options?: { override?: boolean }` - Override existing conversion if true

```typescript
typed.addConversion({
  from: 'string',
  to: 'number',
  convert: x => parseFloat(x),
});

const double = typed({
  'number': x => x * 2,
});

console.log(double('3.14')); // 6.28 (string converted to number)
```

### `typed.addConversions(conversions, options?)`

Add multiple conversions at once.

```typescript
typed.addConversions([
  { from: 'string', to: 'number', convert: x => parseFloat(x) },
  { from: 'boolean', to: 'number', convert: x => x ? 1 : 0 },
]);
```

### `typed.removeConversion(conversion)`

Remove an existing conversion.

```typescript
const conv = {
  from: 'string',
  to: 'number',
  convert: x => parseFloat(x),
};

typed.addConversion(conv);
typed.removeConversion(conv); // Must use same convert function reference
```

### `typed.clear()`

Remove all types and conversions.

```typescript
typed.clear();
// Registry is now empty - add your own types
typed.addType({ name: 'number', test: x => typeof x === 'number' });
```

### `typed.clearConversions()`

Remove all conversions (keeping types).

```typescript
typed.clearConversions();
```

### `typed.convert(value, typeName)`

Manually convert a value to a type.

```typescript
typed.addConversion({
  from: 'string',
  to: 'number',
  convert: x => parseFloat(x),
});

const num = typed.convert('42', 'number'); // 42
```

### `typed.find(fn, signature, options?)`

Find the implementation function for a signature.

**Parameters:**
- `fn: TypedFunction` - The typed function to search
- `signature: string | string[]` - Signature to find
- `options?: { exact?: boolean }` - If exact, no type coercion allowed

```typescript
const fn = typed({
  'number, number': (a, b) => a + b,
  'string': x => x.length,
});

const impl = typed.find(fn, 'number, number');
console.log(impl(3, 4)); // 7

const impl2 = typed.find(fn, ['string']);
console.log(impl2('hello')); // 5
```

### `typed.findSignature(fn, signature, options?)`

Find the full signature object.

```typescript
const sig = typed.findSignature(fn, 'number, number');
console.log(sig.params); // Array of Param objects
console.log(sig.fn);     // Original implementation
```

### `typed.resolve(fn, args)`

Resolve which signature matches given arguments.

```typescript
const fn = typed({
  'number': x => x * 2,
  'string': x => x.toUpperCase(),
});

const sig = typed.resolve(fn, [42]);
console.log(sig.params[0].name); // 'number'

const sig2 = typed.resolve(fn, ['hello']);
console.log(sig2.params[0].name); // 'string'
```

### `typed.isTypedFunction(entity)`

Check if a value is a typed function.

```typescript
const fn = typed({ number: x => x });

console.log(typed.isTypedFunction(fn));         // true
console.log(typed.isTypedFunction(() => {}));   // false
```

### `typed.referTo(...signatures, callback)`

Reference other signatures within a typed function.

```typescript
const fn = typed({
  'number': x => x * 2,
  'string': typed.referTo('number', (fnNumber) => {
    return x => fnNumber(parseFloat(x));
  }),
});

console.log(fn(5));     // 10
console.log(fn('5'));   // 10
```

### `typed.referToSelf(callback)`

Reference the typed function itself for recursion.

```typescript
const factorial = typed({
  'number': typed.referToSelf(self => {
    return n => n <= 1 ? 1 : n * self(n - 1);
  }),
});

console.log(factorial(5)); // 120
```

### `typed.createError(name, args, signatures)`

Create a type error for mismatched arguments.

```typescript
const err = typed.createError('myFunc', [1, 'two'], signatures);
// Returns TypeError with detailed message and data property
```

---

## Instance Properties

### `typed.onMismatch`

Handler called when no signature matches. Default throws a TypeError.

```typescript
// Custom handler that returns null instead of throwing
typed.onMismatch = (name, args, signatures) => {
  console.warn(`No match for ${name} with args:`, args);
  return null;
};
```

### `typed.throwMismatchError`

Reference to the default mismatch handler. Use to restore default behavior.

```typescript
typed.onMismatch = typed.throwMismatchError;
```

### `typed.createCount`

Number of typed functions created by this instance.

```typescript
console.log(typed.createCount); // e.g., 5
```

### `typed.warnAgainstDeprecatedThis`

Whether to warn about deprecated `this` usage (default: true).

```typescript
typed.warnAgainstDeprecatedThis = false; // Disable warning
```

---

## Type Definitions

### TypeDef

```typescript
interface TypeDef {
  /** The name of the type (e.g., 'number', 'string') */
  name: string;

  /** Function that tests whether a value belongs to this type */
  test: (x: unknown) => boolean;

  /** Whether this type matches any value (only for 'any' type) */
  isAny?: boolean;
}
```

### ConversionDef

```typescript
interface ConversionDef {
  /** Source type name */
  from: string;

  /** Target type name */
  to: string;

  /** Function that performs the conversion */
  convert: (value: unknown) => unknown;
}
```

### Signature

```typescript
interface Signature {
  /** The parameters of this signature */
  params: Param[];

  /** The original function provided for this signature */
  fn: SignatureFunction | null;

  /** Function to test if arguments match this signature */
  test: ((args: ArrayLike<unknown>) => boolean) | null;

  /** Ready-to-call implementation with conversions applied */
  implementation: SignatureFunction | null;
}
```

### Param

```typescript
interface Param {
  /** Array of types this parameter accepts */
  types: Type[];

  /** Canonical name (e.g., 'number|string') */
  name: string;

  /** Whether any type is 'any' */
  hasAny: boolean;

  /** Whether any type requires conversion */
  hasConversion: boolean;

  /** Whether this is a rest parameter (...) */
  restParam: boolean;
}
```

### TypedFunction

```typescript
interface TypedFunction {
  /** Call the typed function */
  (...args: unknown[]): unknown;

  /** Mapping from signature strings to implementations */
  signatures: Record<string, SignatureFunction>;

  /** The function name */
  name: string;
}
```

### TypedInstance

```typescript
interface TypedInstance {
  // Factory
  (signatures: Record<string, SignatureFunction>): TypedFunction;
  (name: string, signatures: Record<string, SignatureFunction>): TypedFunction;

  // Methods
  create(): TypedInstance;
  addType(type: TypeDef, beforeObjectTest?: boolean): void;
  addTypes(types: TypeDef[], before?: string | boolean): void;
  addConversion(conversion: ConversionDef, options?: AddConversionOptions): void;
  addConversions(conversions: ConversionDef[], options?: AddConversionOptions): void;
  removeConversion(conversion: ConversionDef): void;
  clear(): void;
  clearConversions(): void;
  convert(value: unknown, typeName: string): unknown;
  find(fn: TypedFunction, signature: string | string[], options?: FindSignatureOptions): SignatureFunction;
  findSignature(fn: TypedFunction, signature: string | string[], options?: FindSignatureOptions): Signature;
  resolve(fn: TypedFunction, args: ArrayLike<unknown>): Signature | null;
  isTypedFunction(entity: unknown): entity is TypedFunction;
  referTo(...args: [...string[], (...fns: SignatureFunction[]) => SignatureFunction]): ReferTo;
  referToSelf(callback: (self: TypedFunction) => SignatureFunction): ReferToSelf;
  createError(name: string, args: ArrayLike<unknown>, signatures: Signature[]): TypeError;

  // Properties
  onMismatch: MismatchHandler;
  throwMismatchError: MismatchHandler;
  createCount: number;
  warnAgainstDeprecatedThis: boolean;
}
```

---

## Error Handling

### Error Types

typed-function throws `TypeError` with an additional `data` property:

```typescript
interface TypedErrorData {
  /** Category of the error */
  category: 'wrongType' | 'tooFewArgs' | 'tooManyArgs' | 'mismatch';

  /** Name of the function that was called */
  fn: string;

  /** Argument index where error occurred */
  index?: number;

  /** Actual type names of the argument(s) */
  actual?: string[];

  /** Expected type names */
  expected?: string[];
}
```

### Error Examples

**Wrong Type:**
```typescript
const fn = typed({ 'number': x => x });

try {
  fn('hello');
} catch (e) {
  console.log(e.message);
  // "Unexpected type of argument in function unnamed (expected: number, actual: string, index: 0)"
  console.log(e.data);
  // { category: 'wrongType', fn: 'unnamed', index: 0, actual: ['string'], expected: ['number'] }
}
```

**Too Few Arguments:**
```typescript
const fn = typed({ 'number, number': (a, b) => a + b });

try {
  fn(1);
} catch (e) {
  console.log(e.data.category); // 'tooFewArgs'
}
```

**Too Many Arguments:**
```typescript
const fn = typed({ 'number': x => x });

try {
  fn(1, 2, 3);
} catch (e) {
  console.log(e.data.category); // 'tooManyArgs'
}
```

### Custom Error Handling

```typescript
// Handle mismatches globally
typed.onMismatch = (name, args, signatures) => {
  console.error(`Type mismatch in ${name}`);
  // Return a default value instead of throwing
  return undefined;
};

// Or create and throw a custom error
typed.onMismatch = (name, args, signatures) => {
  const err = typed.createError(name, args, signatures);
  // Add custom properties
  err.customField = 'additional info';
  throw err;
};

// Restore default behavior
typed.onMismatch = typed.throwMismatchError;
```

---

## Signature Syntax

### Basic Types

```typescript
'number'          // Single number argument
'string'          // Single string argument
'number, string'  // Two arguments: number and string
```

### Union Types

```typescript
'number | string'              // Either number or string
'number, string | boolean'     // number, then string or boolean
```

### Any Type

```typescript
'any'             // Any single value
'number, any'     // number, then any value
```

### Rest Parameters

```typescript
'...number'           // Zero or more numbers
'string, ...number'   // String followed by zero or more numbers
'...any'              // Any number of any arguments
```

### Built-in Types

- `null`
- `boolean`
- `number`
- `string`
- `Function`
- `Array`
- `Date`
- `RegExp`
- `Object`
- `any`

---

## Performance Tips

1. **Order signatures by frequency**: Put most commonly used signatures first.

2. **Avoid `any` when possible**: Specific types are faster to match.

3. **Use `find()` for known signatures**: Direct calls bypass dispatch.

```typescript
const fn = typed({
  'number, number': (a, b) => a + b,
});

// Faster for hot paths:
const addNumbers = typed.find(fn, 'number, number');
addNumbers(1, 2);
```

4. **Limit conversions**: Each conversion adds overhead during dispatch.

5. **Use `referTo` over `referToSelf`**: Direct references avoid full re-dispatch.
