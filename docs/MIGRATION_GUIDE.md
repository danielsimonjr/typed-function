# Migration Guide: v4.x to v5.0

This guide covers upgrading from typed-function v4.x to v5.0. The v5.0 release is a complete TypeScript rewrite with improved performance, but maintains full backward compatibility with the v4.x API.

## Overview of Changes

### What's New in v5.0

1. **TypeScript Support**: Full TypeScript implementation with proper type definitions
2. **Performance Improvements**: Optimized dispatcher with fast-path for common cases
3. **Modular Architecture**: Code split into logical modules for better maintainability
4. **WASM-Ready Foundation**: Type mask system prepared for WebAssembly acceleration

### Breaking Changes

**None!** The v5.0 release maintains complete API compatibility with v4.x.

## Installation

```bash
# npm
npm install typed-function@5

# yarn
yarn add typed-function@5

# pnpm
pnpm add typed-function@5
```

## API Compatibility

All existing code should work without changes:

```javascript
// v4.x code
import typed from 'typed-function';

const add = typed({
  'number, number': (a, b) => a + b,
  'string, string': (a, b) => a + b,
});

// Works identically in v5.0!
console.log(add(1, 2));     // 3
console.log(add('a', 'b')); // 'ab'
```

## TypeScript Usage

v5.0 includes comprehensive TypeScript definitions:

```typescript
import typed, { TypedFunction, TypeDef, ConversionDef } from 'typed-function';

// Create typed functions with type annotations
const multiply: TypedFunction = typed({
  'number, number': (a: number, b: number): number => a * b,
});

// Define custom types with full typing
const positiveType: TypeDef = {
  name: 'positive',
  test: (x: unknown): x is number => typeof x === 'number' && x > 0,
};

// Add conversions with type safety
const stringToNumber: ConversionDef = {
  from: 'string',
  to: 'number',
  convert: (s: string): number => parseFloat(s),
};
```

## New Internal Architecture

While the API remains the same, the internal structure has been completely reorganized:

### Module Structure

```
src/
├── index.ts              # Main entry point
├── factory.ts            # create() factory function
├── core/
│   ├── types.ts          # TypeScript type definitions
│   ├── type-registry.ts  # Type storage & lookup
│   ├── signature-parser.ts
│   ├── signature-compiler.ts
│   ├── signature-comparator.ts
│   ├── conversion-manager.ts
│   ├── reference-resolver.ts
│   └── error-factory.ts
├── dispatch/
│   ├── dispatcher.ts     # Main dispatch orchestration
│   ├── fast-path.ts      # Optimized 6-signature dispatch
│   └── generic-path.ts   # Fallback loop dispatch
├── wasm/
│   ├── type-masks.ts     # Bit-mask type system
│   ├── fallback.ts       # Pure-JS WASM-equivalent dispatch
│   └── bindings.ts       # WASM bridge (future)
└── utils/
    ├── array-helpers.ts
    └── object-helpers.ts
```

## Build Outputs

v5.0 provides multiple build formats:

| Format | File | Usage |
|--------|------|-------|
| ESM | `typed-function.mjs` | Modern bundlers, Node.js ESM |
| CJS | `typed-function.cjs` | Node.js CommonJS |
| UMD | `typed-function.js` | Browser `<script>` tag |
| IIFE (minified) | `typed-function.min.js` | Production browser bundle |

### Package.json Exports

```json
{
  "main": "./build/typed-function.cjs",
  "module": "./build/typed-function.mjs",
  "types": "./build/index.d.ts",
  "exports": {
    ".": {
      "types": "./build/index.d.ts",
      "import": "./build/typed-function.mjs",
      "require": "./build/typed-function.cjs"
    }
  }
}
```

## Performance Improvements

### Fast-Path Dispatch

The new dispatcher uses an optimized fast-path for the first 6 signatures:

- Direct parameter testing without loop overhead
- Inlined type checks for 0-2 parameter signatures
- Fallback to generic loop for complex cases

### Benchmarks

Typical performance improvements compared to v4.x:

| Scenario | v4.x | v5.0 | Improvement |
|----------|------|------|-------------|
| Single signature dispatch | ~50ns | ~25ns | 2x faster |
| 6-signature dispatch | ~100ns | ~40ns | 2.5x faster |
| Function creation | ~1ms | ~0.8ms | 20% faster |

## Compatibility Notes

### Node.js Version

v5.0 requires Node.js 18 or later (matching v4.x requirements).

### Browser Support

Works in all modern browsers with ES2020 support:
- Chrome 80+
- Firefox 74+
- Safari 14+
- Edge 80+

### TypeScript Version

TypeScript 5.0+ recommended for best type inference.

## Troubleshooting

### Issue: "Cannot find module 'typed-function'"

Ensure you have the correct import path:

```javascript
// ESM
import typed from 'typed-function';

// CommonJS
const typed = require('typed-function');
```

### Issue: Type errors in TypeScript

Make sure you're using TypeScript 5.0+ and have proper type annotations:

```typescript
import typed, { TypedFunction } from 'typed-function';

// Explicit type annotation if needed
const fn: TypedFunction = typed({
  number: (x: number) => x,
});
```

### Issue: Bundle size increased

v5.0 is slightly larger due to TypeScript infrastructure, but the minified bundle (`typed-function.min.js`) is still under 30KB.

## Getting Help

- [GitHub Issues](https://github.com/josdejong/typed-function/issues)
- [API Documentation](./API.md)
- [Examples](./examples/)

## Changelog

See [CHANGELOG.md](../CHANGELOG.md) for detailed release notes.
