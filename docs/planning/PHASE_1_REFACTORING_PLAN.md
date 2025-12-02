# typed-function: TypeScript + AssemblyScript/WASM Refactoring Plan

> **Mission**: Transform `typed-function` from a 2000-line monolithic JavaScript file into a blazingly fast, type-safe TypeScript library with WebAssembly-accelerated hot paths.

## Executive Summary

This plan refactors `typed-function` to:
1. **TypeScript Core** - Full type safety, better tooling, maintainability
2. **AssemblyScript/WASM Hot Paths** - Near-native performance for dispatch loops
3. **Modular Architecture** - Separate concerns, enable tree-shaking
4. **Zero-cost Abstraction** - WASM for CPU-bound ops, JS for flexibility

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        typed-function v5.0                              │
├─────────────────────────────────────────────────────────────────────────┤
│  PUBLIC API (TypeScript)                                                │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ typed() | typed.create() | typed.addType() | typed.convert()    │   │
│  │ typed.find() | typed.resolve() | typed.addConversion()          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│  CORE ENGINE                                                            │
│  ┌──────────────────────┐  ┌──────────────────────┐                    │
│  │   TypeScript Layer   │  │   WASM Layer         │                    │
│  │   ─────────────────  │  │   ──────────────────  │                    │
│  │   • Type Registry    │  │   • Dispatch Engine  │                    │
│  │   • Signature Parser │  │   • Type Tests       │                    │
│  │   • Conversion Graph │  │   • Signature Match  │                    │
│  │   • Error Handler    │  │   • Fast Compare     │                    │
│  │   • Reference Solver │  │   • Bit-packed Types │                    │
│  └──────────────────────┘  └──────────────────────┘                    │
├─────────────────────────────────────────────────────────────────────────┤
│  SHARED MEMORY (ArrayBuffer)                                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Type IDs │ Signature Masks │ Conversion Table │ Dispatch Cache  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure (Target)

```
typed-function/
├── src/
│   ├── index.ts                    # Main entry, re-exports public API
│   ├── typed.ts                    # Main typed() function
│   ├── factory.ts                  # create() factory function
│   │
│   ├── core/
│   │   ├── types.ts                # TypeScript interfaces & type definitions
│   │   ├── type-registry.ts        # Type storage & lookup (Map-based)
│   │   ├── signature-parser.ts     # Parse "number, string" -> Param[]
│   │   ├── signature-compiler.ts   # Compile signatures to test functions
│   │   ├── signature-comparator.ts # compareSignatures() logic
│   │   ├── conversion-manager.ts   # Conversion registration & lookup
│   │   ├── reference-resolver.ts   # referTo/referToSelf resolution
│   │   └── error-factory.ts        # Detailed error message generation
│   │
│   ├── dispatch/
│   │   ├── dispatcher.ts           # Main dispatch orchestration
│   │   ├── fast-path.ts            # Optimized 6-signature dispatch
│   │   └── generic-path.ts         # Fallback loop dispatch
│   │
│   ├── wasm/
│   │   ├── assembly/               # AssemblyScript source
│   │   │   ├── index.ts            # WASM entry point
│   │   │   ├── dispatch.ts         # Hot dispatch loop
│   │   │   ├── type-test.ts        # Bit-mask type testing
│   │   │   ├── signature-match.ts  # Signature matching engine
│   │   │   └── memory.ts           # Shared memory management
│   │   │
│   │   ├── bindings.ts             # JS<->WASM bridge
│   │   ├── loader.ts               # WASM module loader (async/sync)
│   │   └── fallback.ts             # Pure-JS fallback if WASM unavailable
│   │
│   └── utils/
│       ├── array-helpers.ts        # initial(), last(), slice(), flatMap()
│       └── object-helpers.ts       # isPlainObject(), etc.
│
├── assembly/                       # AssemblyScript config
│   ├── asconfig.json
│   └── tsconfig.json
│
├── build/                          # Build output (generated)
│   ├── typed-function.js           # UMD bundle
│   ├── typed-function.mjs          # ESM bundle
│   ├── typed-function.wasm         # WASM binary
│   └── typed-function.d.ts         # TypeScript declarations
│
├── test/                           # Existing tests (kept, expanded)
├── benchmark/                      # Performance benchmarks (expanded)
└── docs/
    └── planning/
        └── REFACTORING_PLAN.md     # This document
```

---

## Performance Strategy

### Why WASM for Type Dispatch?

The hot path in `typed-function` is the signature dispatch loop:

```javascript
// Current: ~50 cycles per iteration
for (let i = iStart; i < iEnd; i++) {
  if (tests[i](arguments)) {         // JS function call overhead
    return fns[i].apply(this, arguments)
  }
}
```

**WASM Advantages:**
1. **Predictable Performance** - No JIT warmup, no deoptimization
2. **Compact Type Tests** - Bit-mask operations instead of function calls
3. **Linear Memory** - Cache-friendly signature table traversal
4. **SIMD Potential** - Test multiple signatures simultaneously

### Bit-Packed Type System

```
Current: typeMap.get(typeName).test(value)  // Hash lookup + function call

WASM: (typeMask & signatureMask) === signatureMask  // Single AND + CMP
```

**Type ID Assignment:**
```
number    = 0b0000000001 (bit 0)
string    = 0b0000000010 (bit 1)
boolean   = 0b0000000100 (bit 2)
Function  = 0b0000001000 (bit 3)
Array     = 0b0000010000 (bit 4)
Date      = 0b0000100000 (bit 5)
RegExp    = 0b0001000000 (bit 6)
Object    = 0b0010000000 (bit 7)
null      = 0b0100000000 (bit 8)
undefined = 0b1000000000 (bit 9)
any       = 0b1111111111 (all bits)
```

**Signature Mask Example:**
```
Signature: "number | string, boolean"
  Param 0 mask: 0b0000000011  (number OR string)
  Param 1 mask: 0b0000000100  (boolean)

Runtime check:
  arg0TypeMask = getTypeMask(arg0)  // e.g., 0b0000000001 for number
  arg1TypeMask = getTypeMask(arg1)  // e.g., 0b0000000100 for boolean

  match = (arg0TypeMask & param0Mask) && (arg1TypeMask & param1Mask)
         = (0b01 & 0b11) && (0b100 & 0b100)
         = true && true
         = MATCH!
```

### Memory Layout (Shared ArrayBuffer)

```
Offset 0x0000: Type Registry
┌────────────┬────────────┬────────────┬────────────┐
│ Type Count │ Type 0 ID  │ Type 1 ID  │    ...     │
│  (u32)     │  (u32)     │  (u32)     │            │
└────────────┴────────────┴────────────┴────────────┘

Offset 0x1000: Signature Table
┌────────────┬────────────┬────────────┬────────────┬────────────┐
│ Sig Count  │ Sig 0 Len  │ Sig 0 P0   │ Sig 0 P1   │ Sig 0 FnID │
│  (u32)     │  (u8)      │  (u32)     │  (u32)     │  (u16)     │
└────────────┴────────────┴────────────┴────────────┴────────────┘

Offset 0x2000: Conversion Table
┌────────────┬────────────┬────────────┬────────────┐
│ Conv Count │ From Type  │ To Type    │ Priority   │
│  (u32)     │  (u32)     │  (u32)     │  (u8)      │
└────────────┴────────────┴────────────┴────────────┘

Offset 0x3000: Dispatch Cache (LRU)
┌────────────┬────────────┬────────────┐
│ Args Hash  │ Sig Index  │ Hit Count  │
│  (u64)     │  (u16)     │  (u32)     │
└────────────┴────────────┴────────────┘
```

---

## Sprint Breakdown

### SPRINT 1: Foundation & TypeScript Scaffolding (10 Tasks)

**Goal**: Set up build infrastructure and define core TypeScript types

| # | Task | Description | Pseudocode/Details |
|---|------|-------------|-------------------|
| 1.1 | **Initialize TypeScript Project** | Configure `tsconfig.json` for strict mode, ES2020 target, multiple outputs | ```json { "compilerOptions": { "strict": true, "target": "ES2020", "module": "ESNext", "declaration": true, "outDir": "./build", "rootDir": "./src" }} ``` |
| 1.2 | **Define Core Type Interfaces** | Create `src/core/types.ts` with all TypeScript interfaces | ```typescript interface TypeDef { name: string; test: (x: unknown) => boolean; isAny?: boolean; index?: number; conversionsTo?: ConversionDef[]; } interface Param { types: Type[]; name: string; hasAny: boolean; hasConversion: boolean; restParam: boolean; typeSet?: Set<string>; } interface Signature { params: Param[]; fn: SignatureFunction; test: (args: ArrayLike<unknown>) => boolean; implementation: SignatureFunction; name: string; } interface ConversionDef { from: string; to: string; convert: (value: unknown) => unknown; index?: number; } type SignatureFunction = (...args: unknown[]) => unknown; interface TypedFunction { (...args: unknown[]): unknown; signatures: Record<string, SignatureFunction>; _typedFunctionData: { signatures: Signature[]; signatureMap: Map<string, Signature>; }; } ``` |
| 1.3 | **Create Type Registry Class** | Implement `src/core/type-registry.ts` | ```typescript class TypeRegistry { private typeMap: Map<string, TypeDef> = new Map(); private typeList: string[] = []; private typeIdMap: Map<string, number> = new Map(); // For WASM addTypes(types: TypeDef[], before?: string): void { // Insert types at position, update indices } findType(name: string): TypeDef { // Lookup with helpful error on miss } getTypeMask(value: unknown): number { // Return bit-mask for WASM dispatch } clear(): void { /* Reset to defaults */ } } ``` |
| 1.4 | **Configure ESBuild/Rollup Pipeline** | Set up modern build with tree-shaking, source maps | Install: `esbuild`, `rollup`, `@rollup/plugin-typescript`. Config outputs: ESM, CJS, UMD, IIFE. Enable `"sideEffects": false` in package.json |
| 1.5 | **Set Up AssemblyScript Toolchain** | Install and configure AssemblyScript compiler | ```bash npm install --save-dev assemblyscript mkdir -p src/wasm/assembly npx asinit . --yes ``` Create `assembly/asconfig.json` with optimization flags |
| 1.6 | **Create Utility Functions Module** | Port `initial()`, `last()`, `slice()`, `flatMap()` to TypeScript | ```typescript export const last = <T>(arr: ArrayLike<T>): T | undefined => arr[arr.length - 1]; export const initial = <T>(arr: T[]): T[] => arr.slice(0, -1); export const slice = <T>(arr: ArrayLike<T>, start: number, end?: number): T[] => Array.prototype.slice.call(arr, start, end); export function flatMap<T, U>(arr: T[], fn: (item: T) => U[]): U[] { return arr.reduce((acc, item) => acc.concat(fn(item)), [] as U[]); } ``` |
| 1.7 | **Port isPlainObject and Type Tests** | Create `src/utils/object-helpers.ts` | ```typescript export function isPlainObject(x: unknown): x is Record<string, unknown> { return typeof x === 'object' && x !== null && x.constructor === Object; } export const builtinTypeTests: TypeDef[] = [ { name: 'number', test: (x): x is number => typeof x === 'number' }, { name: 'string', test: (x): x is string => typeof x === 'string' }, // ... all 10 built-in types ]; ``` |
| 1.8 | **Create Error Factory Module** | Port `createError()` to `src/core/error-factory.ts` | ```typescript interface TypedError extends TypeError { data: { category: 'wrongType' | 'tooFewArgs' | 'tooManyArgs' | 'mismatch'; fn: string; index?: number; actual?: string[]; expected?: string[]; }; } export function createError( name: string, args: ArrayLike<unknown>, signatures: Signature[] ): TypedError { // Port existing logic with proper typing } ``` |
| 1.9 | **Set Up Test Infrastructure** | Configure Vitest/Jest for TypeScript tests | Install `vitest`, configure `vitest.config.ts`. Create test utilities: `createTestTyped()`, `assertSignatureMatch()` |
| 1.10 | **Create CI/CD Pipeline Update** | Update GitHub Actions for TypeScript + WASM build | Add build steps: `tsc --noEmit` (type check), `npm run build:ts`, `npm run build:wasm`, test matrix for Node 18/20/22 |

---

### SPRINT 2: Signature Parsing & Compilation (8 Tasks)

**Goal**: Port signature handling to TypeScript with performance optimizations

| # | Task | Description | Pseudocode/Details |
|---|------|-------------|-------------------|
| 2.1 | **Create Signature Parser** | Port `parseSignature()`, `parseParam()` to `src/core/signature-parser.ts` | ```typescript export function parseSignature( rawSignature: string, registry: TypeRegistry ): Param[] | null { if (typeof rawSignature !== 'string') throw new TypeError('Signatures must be strings'); const signature = rawSignature.trim(); if (signature === '') return []; return signature.split(',').map((raw, i, arr) => { const param = parseParam(raw.trim(), registry); if (param.restParam && i !== arr.length - 1) { throw new SyntaxError('Rest param only allowed last'); } return param; }); } function parseParam(raw: string, registry: TypeRegistry): Param { const restParam = raw.startsWith('...'); const typeStr = restParam ? (raw.length > 3 ? raw.slice(3) : 'any') : raw; const types = typeStr.split('|').map(s => { const typeDef = registry.findType(s.trim()); return { name: typeDef.name, typeIndex: typeDef.index!, test: typeDef.test, isAny: typeDef.isAny ?? false, conversion: null, conversionIndex: -1 }; }); return { types, name: (restParam ? '...' : '') + types.map(t => t.name).join('|'), hasAny: types.some(t => t.isAny), hasConversion: false, restParam }; } ``` |
| 2.2 | **Create Param Expander** | Port `expandParam()` for adding conversions | ```typescript export function expandParam( param: Param, conversions: ConversionDef[], registry: TypeRegistry ): Param { const typeNames = param.types.map(t => t.name); const available = getAvailableConversions(typeNames, conversions); const convertibleTypes = available.map(conv => { const type = registry.findType(conv.from); return { name: conv.from, typeIndex: type.index!, test: type.test, isAny: type.isAny ?? false, conversion: conv, conversionIndex: conv.index! }; }); return { ...param, types: [...param.types, ...convertibleTypes], name: param.name + (convertibleTypes.length ? '|' + convertibleTypes.map(t => t.name).join('|') : ''), hasAny: param.hasAny || convertibleTypes.some(t => t.isAny), hasConversion: convertibleTypes.length > 0 }; } ``` |
| 2.3 | **Create Test Compiler** | Port `compileTest()`, `compileTests()` with optimizations | ```typescript export function compileTest(param: Param | undefined, registry: TypeRegistry): TypeTest { if (!param || param.types.length === 0) return () => true; if (param.types.length === 1) { return registry.findType(param.types[0].name).test; } if (param.types.length === 2) { const [t0, t1] = param.types.map(t => registry.findType(t.name).test); return (x: unknown) => t0(x) || t1(x); } // 3+ types: unroll up to 4, then loop const tests = param.types.map(t => registry.findType(t.name).test); return (x: unknown) => { for (let i = 0; i < tests.length; i++) { if (tests[i](x)) return true; } return false; }; } export function compileTests(params: Param[], registry: TypeRegistry): SignatureTest { const hasRest = params.length > 0 && params[params.length - 1].restParam; if (!hasRest) { // Specialize for 0, 1, 2 params (most common) switch (params.length) { case 0: return (args) => args.length === 0; case 1: { const t0 = compileTest(params[0], registry); return (args) => args.length === 1 && t0(args[0]); } case 2: { const t0 = compileTest(params[0], registry); const t1 = compileTest(params[1], registry); return (args) => args.length === 2 && t0(args[0]) && t1(args[1]); } } } // General case with loop // ... } } ``` |
| 2.4 | **Create Signature Comparator** | Port `compareParams()`, `compareSignatures()` | ```typescript export function compareSignatures(sig1: Signature, sig2: Signature): number { // 1. Any rest param is worst if (hasRestParam(sig1.params) && last(sig1.params)!.hasAny) { if (!hasRestParam(sig2.params) || !last(sig2.params)!.hasAny) { return 10_000_000; } } else if (hasRestParam(sig2.params) && last(sig2.params)!.hasAny) { return -10_000_000; } // 2. Count any params let any1 = 0, conv1 = 0; for (const p of sig1.params) { if (p.hasAny) any1++; if (p.hasConversion) conv1++; } // ... continue with rest of comparison logic } ``` |
| 2.5 | **Create Conversion Manager** | Port conversion registration and lookup | ```typescript export class ConversionManager { private conversions: ConversionDef[] = []; private conversionsByTarget: Map<string, ConversionDef[]> = new Map(); addConversion(conv: ConversionDef, options?: { override?: boolean }): void { this.validateConversion(conv); const existing = this.findExisting(conv.from, conv.to); if (existing) { if (options?.override) { this.removeConversion(existing); } else { throw new Error(`Conversion ${conv.from} -> ${conv.to} exists`); } } conv.index = this.conversions.length; this.conversions.push(conv); this.indexConversion(conv); } availableConversions(typeNames: string[]): ConversionDef[] { // Return lowest-index conversion for each convertible type } } ``` |
| 2.6 | **Create splitParams Function** | Port union type splitting logic | ```typescript export function splitParams(params: Param[]): Param[][] { function recurse(index: number, soFar: Param[]): Param[][] { if (index >= params.length) return [soFar]; const param = params[index]; if (param.restParam) { // Split into exact-only and exact+conversions const exact = param.types.filter(t => !t.conversion); const results: Param[][] = []; if (exact.length < param.types.length) { results.push(...recurse(index + 1, [...soFar, { ...param, types: exact, hasConversion: false }])); } results.push(...recurse(index + 1, [...soFar, param])); return results; } // Non-rest: split each type into separate param return param.types.flatMap(type => recurse(index + 1, [...soFar, { types: [type], name: type.name, hasAny: type.isAny, hasConversion: !!type.conversion, restParam: false }]) ); } return recurse(0, []); } ``` |
| 2.7 | **Create Conflict Detector** | Port `conflicting()` function | ```typescript export function conflicting(params1: Param[], params2: Param[]): boolean { const maxLen = Math.max(params1.length, params2.length); for (let i = 0; i < maxLen; i++) { const set1 = getTypeSetAtIndex(params1, i); const set2 = getTypeSetAtIndex(params2, i); let overlap = false; for (const name of set2) { if (set1.has(name)) { overlap = true; break; } } if (!overlap) return false; } // Check length compatibility with rest params const [len1, len2] = [params1.length, params2.length]; const [rest1, rest2] = [hasRestParam(params1), hasRestParam(params2)]; return rest1 ? (rest2 ? len1 === len2 : len2 >= len1) : (rest2 ? len1 >= len2 : len1 === len2); } ``` |
| 2.8 | **Create Args Preprocessor** | Port `compileArgsPreprocessing()`, `compileArgConversion()` | ```typescript export function compileArgConversion(param: Param, registry: TypeRegistry): ArgConverter { const conversions = param.types .filter(t => t.conversion) .map(t => ({ test: registry.findType(t.conversion!.from).test, convert: t.conversion!.convert })); switch (conversions.length) { case 0: return (arg) => arg; case 1: { const { test, convert } = conversions[0]; return (arg) => test(arg) ? convert(arg) : arg; } case 2: { const [c0, c1] = conversions; return (arg) => { if (c0.test(arg)) return c0.convert(arg); if (c1.test(arg)) return c1.convert(arg); return arg; }; } default: return (arg) => { for (const { test, convert } of conversions) { if (test(arg)) return convert(arg); } return arg; }; } } ``` |

---

### SPRINT 3: Dispatcher & Fast Path (8 Tasks)

**Goal**: Implement the typed function dispatch engine with optimizations

| # | Task | Description | Pseudocode/Details |
|---|------|-------------|-------------------|
| 3.1 | **Create Fast-Path Dispatcher** | Implement 6-signature optimized dispatch | ```typescript export function createFastPathDispatcher( signatures: CompiledSignature[], genericDispatch: GenericDispatcher ): TypedDispatcher { // Pre-compile first 6 signatures (if applicable) const ok = signatures.slice(0, 6).map(s => s.params.length <= 2 && !hasRestParam(s.params) ); // Extract tests for each param of each sig const tests = signatures.slice(0, 6).map((s, i) => ok[i] ? [compileTest(s.params[0]), compileTest(s.params[1])] : [() => false, () => false] ); const fns = signatures.slice(0, 6).map((s, i) => ok[i] ? s.implementation : () => undefined ); const lens = signatures.slice(0, 6).map((s, i) => ok[i] ? s.params.length : -1 ); const allOk = ok.every(Boolean); return function dispatch(this: unknown, arg0: unknown, arg1: unknown) { 'use strict'; const argc = arguments.length; if (argc === lens[0] && tests[0][0](arg0) && tests[0][1](arg1)) return fns[0].apply(this, arguments); if (argc === lens[1] && tests[1][0](arg0) && tests[1][1](arg1)) return fns[1].apply(this, arguments); // ... repeat for sigs 2-5 return genericDispatch.apply(this, arguments); }; } ``` |
| 3.2 | **Create Generic Dispatcher** | Implement fallback loop dispatcher | ```typescript export function createGenericDispatcher( signatures: CompiledSignature[], startIndex: number, onMismatch: MismatchHandler, name: string ): GenericDispatcher { const tests = signatures.map(s => s.test); const fns = signatures.map(s => s.implementation); const end = signatures.length; return function generic(this: unknown) { 'use strict'; for (let i = startIndex; i < end; i++) { if (tests[i](arguments)) { return fns[i].apply(this, arguments); } } return onMismatch(name, arguments, signatures); }; } ``` |
| 3.3 | **Create Reference Resolver** | Port `resolveReferences()` for referTo/referToSelf | ```typescript export function resolveReferences( functions: Array<SignatureFunction | ReferTo | ReferToSelf>, signatureMap: Record<string, number>, self: TypedFunction ): SignatureFunction[] { const resolved = clearResolutions(functions); const isResolved = new Array(resolved.length).fill(false); let hasUnresolved = true; while (hasUnresolved) { hasUnresolved = false; let resolvedAny = false; for (let i = 0; i < resolved.length; i++) { if (isResolved[i]) continue; const fn = resolved[i]; if (isReferToSelf(fn)) { resolved[i] = fn.referToSelf.callback(self); (resolved[i] as any).referToSelf = fn.referToSelf; isResolved[i] = true; resolvedAny = true; } else if (isReferTo(fn)) { const refs = collectResolutions(fn.referTo.references, resolved, signatureMap); if (refs) { resolved[i] = fn.referTo.callback(...refs); (resolved[i] as any).referTo = fn.referTo; isResolved[i] = true; resolvedAny = true; } else { hasUnresolved = true; } } } if (!resolvedAny && hasUnresolved) { throw new SyntaxError('Circular reference in typed.referTo'); } } return resolved as SignatureFunction[]; } ``` |
| 3.4 | **Create Main Typed Function Builder** | Port `createTypedFunction()` | ```typescript export function createTypedFunction( name: string, rawSignatures: Record<string, SignatureFunction | ReferTo | ReferToSelf>, context: TypedContext ): TypedFunction { context.createCount++; if (Object.keys(rawSignatures).length === 0) { throw new SyntaxError('No signatures provided'); } // 1. Parse and validate signatures const parsedParams: Param[][] = []; const originalFunctions: Array<SignatureFunction | ReferTo | ReferToSelf> = []; const signaturesMap: Record<string, number> = {}; const preliminary: Array<{ params: Param[]; name: string; fnIndex: number }> = []; for (const [sig, fn] of Object.entries(rawSignatures)) { const params = parseSignature(sig, context.registry); if (!params) continue; // Check conflicts for (const pp of parsedParams) { if (conflicting(pp, params)) { throw new TypeError(`Conflicting: "${stringify(pp)}" and "${stringify(params)}"`); } } parsedParams.push(params); const fnIndex = originalFunctions.length; originalFunctions.push(fn); // Expand with conversions and split const expanded = params.map(p => expandParam(p, context.conversions)); for (const sp of splitParams(expanded)) { const spName = stringify(sp); preliminary.push({ params: sp, name: spName, fnIndex }); if (sp.every(p => !p.hasConversion)) { signaturesMap[spName] = fnIndex; } } } // 2. Sort by preference preliminary.sort((a, b) => compareSignatures( { params: a.params } as Signature, { params: b.params } as Signature )); // 3. Resolve references (forward ref to theTypedFn) let theTypedFn: TypedFunction; const resolved = resolveReferences(originalFunctions, signaturesMap, theTypedFn!); // 4. Build final signature list const signatures: CompiledSignature[] = []; const internalMap = new Map<string, CompiledSignature>(); for (const p of preliminary) { if (!internalMap.has(p.name)) { const sig: CompiledSignature = { params: p.params, name: p.name, fn: resolved[p.fnIndex], test: compileTests(p.params, context.registry), implementation: compileArgsPreprocessing(p.params, resolved[p.fnIndex]) }; signatures.push(sig); internalMap.set(p.name, sig); } } // 5. Create dispatcher const generic = createGenericDispatcher(signatures, 6, context.onMismatch, name); theTypedFn = createFastPathDispatcher(signatures, generic) as TypedFunction; // 6. Attach metadata Object.defineProperty(theTypedFn, 'name', { value: name }); theTypedFn.signatures = Object.fromEntries( Object.entries(signaturesMap).map(([k, v]) => [k, resolved[v]]) ); theTypedFn._typedFunctionData = { signatures, signatureMap: internalMap }; return theTypedFn; } ``` |
| 3.5 | **Create Factory Function** | Implement `create()` that produces isolated typed universes | ```typescript export function create(): TypedInstance { const registry = new TypeRegistry(); const conversionManager = new ConversionManager(); const context: TypedContext = { registry, conversions: conversionManager, createCount: 0, onMismatch: defaultOnMismatch }; // Initialize with built-in types registry.clear(); registry.addTypes(BUILTIN_TYPES); function typed(maybeName: string | object, ...args: unknown[]): TypedFunction { const named = typeof maybeName === 'string'; const name = named ? maybeName : ''; const startIndex = named ? 0 : -1; // Collect all signatures const allSignatures: Record<string, SignatureFunction> = {}; const items = named ? args : [maybeName, ...args]; for (const item of items) { // Handle: TypedFunction, function with .signature, plain object // Merge into allSignatures } return createTypedFunction(name, allSignatures, context); } // Attach all public methods typed.create = create; typed.addType = (type: TypeDef, before?: string) => registry.addTypes([type], before ?? 'Object'); typed.addTypes = registry.addTypes.bind(registry); typed.addConversion = conversionManager.addConversion.bind(conversionManager); // ... etc return typed as TypedInstance; } ``` |
| 3.6 | **Implement typed.find() & typed.findSignature()** | Port signature lookup functions | ```typescript typed.findSignature = function( fn: TypedFunction, signature: string | string[], options?: { exact?: boolean } ): Signature { if (!isTypedFunction(fn)) throw new TypeError(NOT_TYPED_FUNCTION); const exact = options?.exact ?? false; const params = parseSignature( Array.isArray(signature) ? signature.join(',') : signature, registry ); const canonical = stringify(params); // Try exact match first if (!exact || canonical in fn.signatures) { const match = fn._typedFunctionData.signatureMap.get(canonical); if (match) return match; } // Fall back to param-by-param search // Handle any and rest params // ... }; typed.find = function(fn, signature, options) { return typed.findSignature(fn, signature, options).implementation; }; ``` |
| 3.7 | **Implement typed.resolve()** | Port runtime signature resolution | ```typescript typed.resolve = function(tf: TypedFunction, argList: ArrayLike<unknown>): Signature | null { if (!isTypedFunction(tf)) throw new TypeError(NOT_TYPED_FUNCTION); const sigs = tf._typedFunctionData.signatures; for (let i = 0; i < sigs.length; i++) { if (sigs[i].test(argList)) { return sigs[i]; } } return null; }; ``` |
| 3.8 | **Implement typed.convert()** | Port value conversion function | ```typescript typed.convert = function(value: unknown, typeName: string): unknown { const type = registry.findType(typeName); if (type.test(value)) return value; const conversions = type.conversionsTo ?? []; if (conversions.length === 0) { throw new Error(`No conversions to ${typeName} defined`); } for (const conv of conversions) { const fromType = registry.findType(conv.from); if (fromType.test(value)) { return conv.convert(value); } } throw new Error(`Cannot convert ${value} to ${typeName}`); }; ``` |

---

### SPRINT 4: AssemblyScript WASM Core (10 Tasks)

**Goal**: Implement high-performance WASM dispatch engine

| # | Task | Description | Pseudocode/Details |
|---|------|-------------|-------------------|
| 4.1 | **Set Up AssemblyScript Memory** | Configure shared memory layout | ```typescript // src/wasm/assembly/memory.ts export const HEAP_BASE: usize = 0x10000; export const TYPE_REGISTRY_OFFSET: usize = 0; export const SIGNATURE_TABLE_OFFSET: usize = 0x1000; export const CONVERSION_TABLE_OFFSET: usize = 0x2000; export const DISPATCH_CACHE_OFFSET: usize = 0x3000; @inline export function readU32(offset: usize): u32 { return load<u32>(offset); } @inline export function writeU32(offset: usize, value: u32): void { store<u32>(offset, value); } ``` |
| 4.2 | **Implement Type ID Registry in WASM** | Store type IDs and bit masks | ```typescript // src/wasm/assembly/type-registry.ts let typeCount: u32 = 0; let typeMasks: StaticArray<u32> = new StaticArray<u32>(64); // Max 64 types // Called from JS to register a type @external("env", "logType") declare function logType(id: u32, name: ArrayBuffer): void; export function registerType(typeId: u32, bitPosition: u32): void { typeMasks[typeId] = 1 << bitPosition; typeCount++; } export function getTypeMask(typeId: u32): u32 { return typeMasks[typeId]; } // Fast type check: does value's type mask match param's accepted mask? @inline export function typeMatches(valueMask: u32, paramMask: u32): bool { return (valueMask & paramMask) != 0; } ``` |
| 4.3 | **Implement Signature Table** | Store signature metadata for WASM dispatch | ```typescript // src/wasm/assembly/signature-table.ts const MAX_SIGNATURES: i32 = 256; const MAX_PARAMS: i32 = 8; // Per signature // Packed format: [paramCount, param0Mask, param1Mask, ..., fnIndex] let signatureTable: StaticArray<u32> = new StaticArray<u32>(MAX_SIGNATURES * (MAX_PARAMS + 2)); let signatureCount: i32 = 0; export function addSignature( paramCount: u32, paramMasks: StaticArray<u32>, fnIndex: u32 ): i32 { const idx = signatureCount; const base = idx * (MAX_PARAMS + 2); signatureTable[base] = paramCount; for (let i: u32 = 0; i < paramCount; i++) { signatureTable[base + 1 + i] = paramMasks[i]; } signatureTable[base + MAX_PARAMS + 1] = fnIndex; signatureCount++; return idx; } @inline export function getParamCount(sigIdx: i32): u32 { return signatureTable[sigIdx * (MAX_PARAMS + 2)]; } @inline export function getParamMask(sigIdx: i32, paramIdx: i32): u32 { return signatureTable[sigIdx * (MAX_PARAMS + 2) + 1 + paramIdx]; } @inline export function getFnIndex(sigIdx: i32): u32 { return signatureTable[sigIdx * (MAX_PARAMS + 2) + MAX_PARAMS + 1]; } ``` |
| 4.4 | **Implement WASM Dispatch Loop** | Core hot-path dispatch in AssemblyScript | ```typescript // src/wasm/assembly/dispatch.ts import { signatureCount, getParamCount, getParamMask, getFnIndex } from './signature-table'; import { typeMatches } from './type-registry'; // Args passed as type masks from JS export function dispatchFind( argCount: u32, arg0Mask: u32, arg1Mask: u32, arg2Mask: u32, arg3Mask: u32 ): i32 { // Returns signature index, or -1 if no match const argMasks: StaticArray<u32> = [arg0Mask, arg1Mask, arg2Mask, arg3Mask]; for (let i: i32 = 0; i < signatureCount; i++) { const paramCount = getParamCount(i); if (paramCount != argCount) continue; let match: bool = true; for (let p: u32 = 0; p < paramCount; p++) { if (!typeMatches(argMasks[p], getParamMask(i, p))) { match = false; break; } } if (match) { return i; } } return -1; // No match } // Optimized 2-param version (most common) @inline export function dispatchFind2( arg0Mask: u32, arg1Mask: u32 ): i32 { for (let i: i32 = 0; i < signatureCount; i++) { if (getParamCount(i) != 2) continue; if (typeMatches(arg0Mask, getParamMask(i, 0)) && typeMatches(arg1Mask, getParamMask(i, 1))) { return i; } } return -1; } ``` |
| 4.5 | **Implement Dispatch Cache** | LRU cache for hot argument patterns | ```typescript // src/wasm/assembly/cache.ts const CACHE_SIZE: i32 = 64; const CACHE_MASK: i32 = 63; // For fast modulo // Cache entry: [hash_lo, hash_hi, sigIndex, hitCount] let cache: StaticArray<u64> = new StaticArray<u64>(CACHE_SIZE * 2); let cacheHits: StaticArray<u32> = new StaticArray<u32>(CACHE_SIZE); @inline function hashArgs(a0: u32, a1: u32, a2: u32, a3: u32): u64 { // FNV-1a inspired hash let h: u64 = 0xcbf29ce484222325; h = (h ^ (a0 as u64)) * 0x100000001b3; h = (h ^ (a1 as u64)) * 0x100000001b3; h = (h ^ (a2 as u64)) * 0x100000001b3; h = (h ^ (a3 as u64)) * 0x100000001b3; return h; } export function cacheLookup(a0: u32, a1: u32, a2: u32, a3: u32): i32 { const hash = hashArgs(a0, a1, a2, a3); const slot = (hash as i32) & CACHE_MASK; if (cache[slot * 2] == hash) { cacheHits[slot]++; return cache[slot * 2 + 1] as i32; } return -1; // Cache miss } export function cacheStore(a0: u32, a1: u32, a2: u32, a3: u32, sigIdx: i32): void { const hash = hashArgs(a0, a1, a2, a3); const slot = (hash as i32) & CACHE_MASK; cache[slot * 2] = hash; cache[slot * 2 + 1] = sigIdx as u64; cacheHits[slot] = 1; } ``` |
| 4.6 | **Create JS-WASM Bridge** | TypeScript bindings for WASM functions | ```typescript // src/wasm/bindings.ts import type { WasmExports } from './types'; let wasmInstance: WebAssembly.Instance | null = null; let exports: WasmExports | null = null; export async function initWasm(): Promise<void> { const wasmBinary = await loadWasmBinary(); const importObject = { env: { logType: (id: number, namePtr: number) => { console.debug(`Registered type ${id}`); }, abort: (msg: number, file: number, line: number, col: number) => { throw new Error(`WASM abort at ${line}:${col}`); } } }; const result = await WebAssembly.instantiate(wasmBinary, importObject); wasmInstance = result.instance; exports = wasmInstance.exports as WasmExports; } export function wasmDispatchFind( argCount: number, masks: number[] ): number { if (!exports) return -1; return exports.dispatchFind( argCount, masks[0] ?? 0, masks[1] ?? 0, masks[2] ?? 0, masks[3] ?? 0 ); } export function wasmAddSignature( paramMasks: number[], fnIndex: number ): number { if (!exports) return -1; // Copy masks to WASM memory and call return exports.addSignature(paramMasks.length, /* ptr */, fnIndex); } ``` |
| 4.7 | **Create WASM Loader** | Handle sync/async loading, fallback | ```typescript // src/wasm/loader.ts let wasmReady = false; let wasmPromise: Promise<void> | null = null; export function isWasmAvailable(): boolean { return wasmReady; } export async function ensureWasm(): Promise<boolean> { if (wasmReady) return true; if (wasmPromise) { await wasmPromise; return wasmReady; } wasmPromise = (async () => { try { if (typeof WebAssembly === 'undefined') { console.warn('WebAssembly not available, using JS fallback'); return; } await initWasm(); wasmReady = true; } catch (e) { console.warn('WASM init failed, using JS fallback:', e); } })(); await wasmPromise; return wasmReady; } // Sync version for Node.js export function ensureWasmSync(): boolean { if (wasmReady) return true; try { const binary = loadWasmBinarySync(); const module = new WebAssembly.Module(binary); const instance = new WebAssembly.Instance(module, importObject); // ... setup wasmReady = true; } catch (e) { console.warn('WASM sync init failed:', e); } return wasmReady; } ``` |
| 4.8 | **Implement Pure-JS Fallback** | Mirror WASM dispatch in JS for non-WASM envs | ```typescript // src/wasm/fallback.ts // Exact same interface as WASM, but pure JS const signatureTable: Array<{ paramMasks: number[]; fnIndex: number; }> = []; export function fallbackAddSignature( paramMasks: number[], fnIndex: number ): number { const idx = signatureTable.length; signatureTable.push({ paramMasks: [...paramMasks], fnIndex }); return idx; } export function fallbackDispatchFind( argCount: number, argMasks: number[] ): number { for (let i = 0; i < signatureTable.length; i++) { const sig = signatureTable[i]; if (sig.paramMasks.length !== argCount) continue; let match = true; for (let p = 0; p < argCount; p++) { if ((argMasks[p] & sig.paramMasks[p]) === 0) { match = false; break; } } if (match) return i; } return -1; } ``` |
| 4.9 | **Implement Type Mask Assignment** | Map JS type checks to bit masks | ```typescript // src/wasm/type-masks.ts const TYPE_BITS: Record<string, number> = { number: 0, string: 1, boolean: 2, Function: 3, Array: 4, Date: 5, RegExp: 6, Object: 7, null: 8, undefined: 9, any: -1 // Special: all bits set }; let nextTypeBit = 10; // For custom types export function getTypeBit(typeName: string): number { if (typeName in TYPE_BITS) return TYPE_BITS[typeName]; TYPE_BITS[typeName] = nextTypeBit; return nextTypeBit++; } export function getTypeMaskForValue(value: unknown): number { if (value === null) return 1 << TYPE_BITS.null; if (value === undefined) return 1 << TYPE_BITS.undefined; switch (typeof value) { case 'number': return 1 << TYPE_BITS.number; case 'string': return 1 << TYPE_BITS.string; case 'boolean': return 1 << TYPE_BITS.boolean; case 'function': return 1 << TYPE_BITS.Function; case 'object': if (Array.isArray(value)) return 1 << TYPE_BITS.Array; if (value instanceof Date) return 1 << TYPE_BITS.Date; if (value instanceof RegExp) return 1 << TYPE_BITS.RegExp; return 1 << TYPE_BITS.Object; } return 0; } export function getParamMask(param: Param): number { if (param.hasAny) return 0xFFFFFFFF; // Match anything let mask = 0; for (const type of param.types) { if (type.isAny) return 0xFFFFFFFF; mask |= 1 << getTypeBit(type.name); } return mask; } ``` |
| 4.10 | **Integrate WASM with Dispatcher** | Wire WASM dispatch into fast path | ```typescript // src/dispatch/dispatcher.ts import { isWasmAvailable, wasmDispatchFind } from '../wasm/bindings'; import { fallbackDispatchFind } from '../wasm/fallback'; import { getTypeMaskForValue, getParamMask } from '../wasm/type-masks'; export function createHybridDispatcher( signatures: CompiledSignature[], context: TypedContext ): TypedDispatcher { // Register signatures with WASM/fallback for (let i = 0; i < signatures.length; i++) { const paramMasks = signatures[i].params.map(getParamMask); if (isWasmAvailable()) { wasmAddSignature(paramMasks, i); } else { fallbackAddSignature(paramMasks, i); } } const fns = signatures.map(s => s.implementation); const jsFallback = createGenericDispatcher(signatures, 0, context.onMismatch, ''); return function hybridDispatch(this: unknown, ...args: unknown[]) { 'use strict'; // Get type masks for arguments const argMasks = args.map(getTypeMaskForValue); // Try WASM dispatch first const sigIdx = isWasmAvailable() ? wasmDispatchFind(args.length, argMasks) : fallbackDispatchFind(args.length, argMasks); if (sigIdx >= 0) { return fns[sigIdx].apply(this, args); } // Fall back to JS for conversions and error handling return jsFallback.apply(this, arguments); }; } ``` |

---

### SPRINT 5: Testing & Compatibility (7 Tasks)

**Goal**: Ensure 100% backward compatibility and comprehensive test coverage

| # | Task | Description | Pseudocode/Details |
|---|------|-------------|-------------------|
| 5.1 | **Port Existing Tests to TypeScript** | Convert all 14 test files | Rename `.mjs` → `.test.ts`, add type annotations, use Vitest assertions. Keep test logic identical to ensure behavioral parity. |
| 5.2 | **Add WASM-Specific Tests** | Test WASM dispatch paths | ```typescript describe('WASM Dispatch', () => { it('should match exact types via WASM', async () => { await ensureWasm(); const fn = typed('add', { 'number, number': (a, b) => a + b }); expect(fn(2, 3)).toBe(5); }); it('should fall back to JS for conversions', () => { const fn = typed('convert', { 'string': (s) => s.length }); typed.addConversion({ from: 'number', to: 'string', convert: String }); expect(fn(42)).toBe(2); }); it('should handle cache hits', () => { const fn = typed('cached', { 'number': (n) => n * 2 }); // First call: cache miss fn(5); // Second call: cache hit const start = performance.now(); for (let i = 0; i < 100000; i++) fn(5); const elapsed = performance.now() - start; expect(elapsed).toBeLessThan(50); // Should be very fast }); }); ``` |
| 5.3 | **Add Property-Based Tests** | Use fast-check for edge case discovery | ```typescript import fc from 'fast-check'; describe('Signature Parsing', () => { it('should round-trip any valid signature', () => { fc.assert(fc.property( fc.array(fc.constantFrom('number', 'string', 'boolean', 'any'), { minLength: 0, maxLength: 5 }), (types) => { const sig = types.join(', '); const parsed = parseSignature(sig, registry); const stringified = stringify(parsed); expect(parseSignature(stringified, registry)).toEqual(parsed); } )); }); }); ``` |
| 5.4 | **Create Compatibility Test Suite** | Test against v4.x behavior | Create `test/compat/` with tests ensuring exact behavior match: error messages, conversion order, signature resolution priority. Import v4.x as baseline. |
| 5.5 | **Add Performance Regression Tests** | Benchmark guards in CI | ```typescript describe('Performance', () => { it('should dispatch 1M calls in under 500ms', () => { const fn = typed('perf', { 'number, number': (a, b) => a + b }); const start = performance.now(); for (let i = 0; i < 1_000_000; i++) { fn(i, i); } const elapsed = performance.now() - start; expect(elapsed).toBeLessThan(500); }); it('should create typed function in under 1ms', () => { const start = performance.now(); for (let i = 0; i < 100; i++) { typed(`fn${i}`, { 'number': n => n }); } const elapsed = performance.now() - start; expect(elapsed / 100).toBeLessThan(1); }); }); ``` |
| 5.6 | **Add TypeScript Type Tests** | Ensure types work correctly | ```typescript // test/types.test-d.ts import { expectType, expectError } from 'tsd'; import typed from '../src'; const add = typed('add', { 'number, number': (a: number, b: number) => a + b }); // Should accept correct types expectType<number>(add(1, 2)); // Type tests for API expectType<boolean>(typed.isTypedFunction(add)); expectType<Function>(typed.find(add, 'number, number')); // Should have signatures property expectType<Record<string, Function>>(add.signatures); ``` |
| 5.7 | **Integration Tests with math.js** | Test real-world usage | ```typescript describe('math.js Integration', () => { it('should handle complex number operations', () => { typed.addType({ name: 'Complex', test: (x) => x && typeof x === 'object' && 'real' in x && 'imag' in x }); const add = typed('add', { 'Complex, Complex': (a, b) => ({ real: a.real + b.real, imag: a.imag + b.imag }), 'Complex, number': (a, b) => ({ real: a.real + b, imag: a.imag }), 'number, Complex': (a, b) => ({ real: a + b.real, imag: b.imag }), 'number, number': (a, b) => a + b }); expect(add({ real: 1, imag: 2 }, { real: 3, imag: 4 })) .toEqual({ real: 4, imag: 6 }); }); }); ``` |

---

### SPRINT 6: Build, Bundle & Documentation (7 Tasks)

**Goal**: Production-ready builds and documentation

| # | Task | Description | Pseudocode/Details |
|---|------|-------------|-------------------|
| 6.1 | **Configure Multi-Format Output** | ESM, CJS, UMD, IIFE bundles | ```javascript // rollup.config.js export default [ { input: 'src/index.ts', output: [ { file: 'build/typed-function.mjs', format: 'esm', sourcemap: true }, { file: 'build/typed-function.cjs', format: 'cjs', sourcemap: true }, { file: 'build/typed-function.js', format: 'umd', name: 'typed', sourcemap: true }, { file: 'build/typed-function.min.js', format: 'iife', name: 'typed', plugins: [terser()] } ], plugins: [typescript(), nodeResolve(), commonjs()] }, // WASM-enabled bundle { input: 'src/index.ts', output: { file: 'build/typed-function.wasm.mjs', format: 'esm' }, plugins: [typescript(), wasmPlugin()] } ]; ``` |
| 6.2 | **Create WASM Build Pipeline** | AssemblyScript → .wasm + glue code | ```json // assembly/asconfig.json { "targets": { "release": { "outFile": "build/dispatch.wasm", "optimizeLevel": 3, "shrinkLevel": 2, "converge": true, "noAssert": true }, "debug": { "outFile": "build/dispatch.debug.wasm", "debug": true } }, "options": { "runtime": "stub", "exportRuntime": false, "initialMemory": 1, "maximumMemory": 16 } } ``` |
| 6.3 | **Generate TypeScript Declarations** | .d.ts files for consumers | Ensure `tsconfig.json` has `declaration: true`, `declarationMap: true`. Create `build/typed-function.d.ts` with full API types. |
| 6.4 | **Update package.json Exports** | Modern exports field | ```json { "name": "typed-function", "version": "5.0.0", "type": "module", "main": "./build/typed-function.cjs", "module": "./build/typed-function.mjs", "types": "./build/typed-function.d.ts", "exports": { ".": { "import": "./build/typed-function.mjs", "require": "./build/typed-function.cjs", "types": "./build/typed-function.d.ts" }, "./wasm": { "import": "./build/typed-function.wasm.mjs", "types": "./build/typed-function.d.ts" } }, "files": ["build/", "src/"], "sideEffects": false } ``` |
| 6.5 | **Create Migration Guide** | v4 → v5 upgrade documentation | Document: new import paths, WASM opt-in, any breaking changes (none expected), performance improvements, new TypeScript types. |
| 6.6 | **Update README** | New features, usage, benchmarks | Add sections: TypeScript usage, WASM performance, bundle size comparison, new API surface (same as v4). |
| 6.7 | **Create API Documentation** | TypeDoc or similar | Configure TypeDoc to generate API docs from TSDoc comments. Host on GitHub Pages or include in repo. |

---

## Performance Targets

| Metric | Current v4.x | Target v5.0 | Method |
|--------|-------------|-------------|--------|
| Dispatch (hot path) | ~50ns | <20ns | WASM dispatch + cache |
| Dispatch (cold) | ~200ns | ~100ns | Optimized JS fast-path |
| Function creation | ~1ms | ~0.5ms | Lazy compilation |
| Bundle size (min+gz) | ~8KB | <12KB | Tree-shaking, minimal WASM |
| WASM binary | N/A | <4KB | Aggressive optimization |

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| WASM slower than JS for small dispatches | Medium | High | Hybrid approach: JS fast-path for <6 sigs, WASM for larger |
| Browser WASM loading delay | Medium | Medium | Lazy load WASM, instant JS fallback |
| Custom type performance regression | Low | Medium | Keep JS type tests, only use WASM for built-ins |
| Breaking changes | Low | High | Extensive compatibility test suite |
| AssemblyScript limitations | Medium | Low | Pure JS fallback always available |

---

## Success Criteria

1. **All existing tests pass** - Zero behavioral regression
2. **Performance improvement** - At least 2x dispatch speedup on benchmarks
3. **TypeScript support** - Full type safety, excellent IDE experience
4. **Bundle size** - No more than 50% increase (WASM included)
5. **Browser compatibility** - Works in all evergreen browsers + Node 18+
6. **Graceful degradation** - Full functionality without WASM

---

## Timeline Recommendation

| Sprint | Duration | Dependencies |
|--------|----------|--------------|
| Sprint 1 | 1 sprint | None |
| Sprint 2 | 1 sprint | Sprint 1 |
| Sprint 3 | 1-2 sprints | Sprint 2 |
| Sprint 4 | 2 sprints | Sprint 3 |
| Sprint 5 | 1 sprint | Sprint 4 |
| Sprint 6 | 1 sprint | Sprint 5 |

**Total: 7-9 sprints**

---

## Appendix A: File-by-File Migration Map

| Original (v4) | Target (v5) | Notes |
|---------------|-------------|-------|
| `src/typed-function.mjs` (lines 1-54) | `src/utils/helpers.ts` | ok(), notOk(), undef(), constants |
| `src/typed-function.mjs` (lines 55-196) | `src/core/type-registry.ts` | Type management |
| `src/typed-function.mjs` (lines 393-626) | `src/core/signature-parser.ts`, `src/core/signature-compiler.ts` | Parsing + compilation |
| `src/typed-function.mjs` (lines 693-781) | `src/core/error-factory.ts` | Error generation |
| `src/typed-function.mjs` (lines 783-993) | `src/core/signature-comparator.ts` | Comparison logic |
| `src/typed-function.mjs` (lines 996-1149) | `src/core/conversion-manager.ts` | Conversions |
| `src/typed-function.mjs` (lines 1151-1349) | `src/core/reference-resolver.ts` | referTo/referToSelf |
| `src/typed-function.mjs` (lines 1385-1563) | `src/dispatch/dispatcher.ts` | Main dispatch |
| `src/typed-function.mjs` (lines 1577-1630) | `src/utils/array-helpers.ts` | Utility functions |
| `src/typed-function.mjs` (lines 1643-1983) | `src/typed.ts`, `src/factory.ts` | Public API |
| N/A | `src/wasm/assembly/*.ts` | NEW: AssemblyScript |
| N/A | `src/wasm/bindings.ts` | NEW: WASM bridge |

---

## Appendix B: Benchmark Comparison Template

```typescript
// benchmark/comparison.ts
import Benchmark from 'benchmark';
import typedV4 from 'typed-function'; // v4.x
import typedV5 from '../src';          // v5.x

const suite = new Benchmark.Suite('v4 vs v5');

const v4Add = typedV4('add', { 'number, number': (a, b) => a + b });
const v5Add = typedV5('add', { 'number, number': (a, b) => a + b });

suite
  .add('v4: dispatch (number, number)', () => v4Add(1, 2))
  .add('v5: dispatch (number, number)', () => v5Add(1, 2))
  .add('v4: create function', () => typedV4('fn', { 'number': n => n }))
  .add('v5: create function', () => typedV5('fn', { 'number': n => n }))
  .on('cycle', (e) => console.log(String(e.target)))
  .on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .run();
```

---

*Plan authored for typed-function refactoring initiative. May the bits be ever in your favor.*
