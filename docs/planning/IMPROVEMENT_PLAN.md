# typed-function: Phase 3 Improvement Plan

> **Mission**: Build upon the v5.0 TypeScript rewrite to complete WASM integration, extend type system support, and improve developer experience.

## Executive Summary

Following the successful v5.0 alpha release with TypeScript rewrite and fast-path optimization, Phase 3 focuses on:

1. **WASM Integration Completion** - Fully utilize the compiled WebAssembly dispatch module
2. **Modern Type System** - Add support for BigInt, Symbol, Map/Set, and modern JS primitives
3. **Extended Fast Path** - Increase fast-path capacity from 6 to 10 signatures
4. **Developer Experience** - Enhanced debugging, better error messages, and tooling

---

## Current State Assessment

### Strengths
| Area | Status |
|------|--------|
| TypeScript Core | Complete - Full type safety |
| Fast-path Dispatch | Optimized for 6 signatures, 2 params max |
| Test Coverage | 89% statements, 552+ tests |
| Documentation | Comprehensive API and architecture docs |
| v4.x Compatibility | 100% backward compatible |

### Gaps Identified
| Area | Issue | Priority |
|------|-------|----------|
| WASM Integration | Bindings exist but not used in production dispatch | High |
| Test Coverage | WASM files excluded from coverage | Medium |
| Fast-path Limits | Only 6 signatures, 2 params | Medium |
| Modern Types | Missing BigInt, Symbol, Map/Set | Medium |
| Error Consistency | Mixed error throwing approaches | Low |

---

## Phase 3 Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                    typed-function v5.1 (Phase 3)                      │
├──────────────────────────────────────────────────────────────────────┤
│  ENHANCED TYPE SYSTEM                                                 │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ Built-in: number, string, boolean, Function, Array, Date,      │  │
│  │           RegExp, Object, null, undefined, any                 │  │
│  │ NEW:      BigInt, Symbol, Map, Set, WeakMap, WeakSet,         │  │
│  │           Promise, ArrayBuffer, TypedArray                     │  │
│  └────────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────────┤
│  DISPATCH ENGINE                                                      │
│  ┌─────────────────────────┐  ┌─────────────────────────────────┐   │
│  │   Extended Fast Path    │  │   WASM Dispatch (Optional)      │   │
│  │   ────────────────────  │  │   ─────────────────────────────  │   │
│  │   • 10 signature slots  │  │   • Type mask comparison        │   │
│  │   • 3 param support     │  │   • Cache-based lookup          │   │
│  │   • Inlined type tests  │  │   • Fallback integration        │   │
│  └─────────────────────────┘  └─────────────────────────────────┘   │
├──────────────────────────────────────────────────────────────────────┤
│  DEVELOPER EXPERIENCE                                                 │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ • Structured error classes with codes                          │  │
│  │ • Enhanced debug mode with event streaming                     │  │
│  │ • Signature introspection helpers                              │  │
│  │ • Performance profiling utilities                              │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Sprint Breakdown

### PHASE_3_SPRINT_1: WASM Integration Completion (High Priority)

**Goal**: Complete the WASM dispatch integration that was prepared but not utilized

| Task | Description | Estimated Hours |
|------|-------------|-----------------|
| 1.1 | Create unified dispatcher that routes to WASM when available | 2 |
| 1.2 | Add WASM initialization hook to factory.ts | 1.5 |
| 1.3 | Implement type mask synchronization between JS and WASM | 2 |
| 1.4 | Add WASM tests to coverage (remove exclusions) | 2 |
| 1.5 | Create WASM performance benchmarks | 1.5 |
| 1.6 | Document WASM opt-in usage in README | 1 |

**Expected Outcome**: WASM dispatch working end-to-end with JS fallback

---

### PHASE_3_SPRINT_2: Modern Types & Extended Fast Path (Medium Priority)

**Goal**: Expand type system and increase fast-path capacity

| Task | Description | Estimated Hours |
|------|-------------|-----------------|
| 2.1 | Add BigInt type with proper bit mask | 1.5 |
| 2.2 | Add Symbol type support | 1 |
| 2.3 | Add Map and Set types | 1.5 |
| 2.4 | Add WeakMap and WeakSet types | 1 |
| 2.5 | Extend fast-path from 6 to 10 signature slots | 2 |
| 2.6 | Support 3 parameters in fast-path | 2 |
| 2.7 | Add tests for all new types | 2 |
| 2.8 | Update type-masks.ts with new type bits | 1 |

**Expected Outcome**: Full modern JavaScript type support

---

### PHASE_3_SPRINT_3: Developer Experience (Medium Priority)

**Goal**: Improve debugging, error handling, and tooling

| Task | Description | Estimated Hours |
|------|-------------|-----------------|
| 3.1 | Create TypedFunctionError base class with error codes | 1.5 |
| 3.2 | Standardize all error throwing to use error factory | 2 |
| 3.3 | Add error codes enum for programmatic handling | 1 |
| 3.4 | Enhance debug mode with structured event emitter | 2 |
| 3.5 | Create signature introspection helper (formatted output) | 1.5 |
| 3.6 | Add performance timing utilities | 1.5 |
| 3.7 | Update JSDoc with @example tags throughout | 2 |

**Expected Outcome**: Professional-grade debugging and error handling

---

## Implementation Guidelines

### Code Standards

1. **Type Safety**: All new code must be fully typed TypeScript
2. **Test Coverage**: Maintain 70%+ coverage thresholds
3. **Documentation**: JSDoc for all public APIs
4. **Backward Compatibility**: No breaking changes to v5.0 API

### Testing Requirements

- Unit tests for each new type
- Integration tests for WASM dispatch
- Performance regression tests
- Edge case coverage

### File Naming Convention

```
src/core/builtin-types.ts      # Type constants and definitions
src/core/modern-types.ts       # New ES6+ type support
src/dispatch/extended-fast-path.ts  # 10-slot dispatcher
src/errors/index.ts            # Error classes and codes
```

---

## Success Criteria

| Metric | Current | Target |
|--------|---------|--------|
| Test Coverage (statements) | 89% | 85%+ (with WASM) |
| Fast-path Signatures | 6 | 10 |
| Fast-path Parameters | 2 | 3 |
| Built-in Types | 11 | 17+ |
| Error Codes | 0 | 10+ |
| WASM Dispatch | Unused | Production-ready |

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| WASM slower than JS for small cases | Medium | Low | Hybrid approach with threshold |
| New types break existing code | Low | High | Extensive compatibility tests |
| Extended fast-path code bloat | Medium | Low | Code generation, lazy loading |
| Browser compatibility issues | Low | Medium | Feature detection, graceful fallback |

---

## Timeline

| Sprint | Focus | Dependencies |
|--------|-------|--------------|
| Phase 3 Sprint 1 | WASM Integration | None |
| Phase 3 Sprint 2 | Modern Types + Fast Path | Sprint 1 |
| Phase 3 Sprint 3 | Developer Experience | Sprint 2 |

**Total Estimated Effort**: 30-35 hours across 3 sprints

---

## Appendix: New Type Bit Assignments

```
Existing (bits 0-9):
  number    = 0b0000000001  (bit 0)
  string    = 0b0000000010  (bit 1)
  boolean   = 0b0000000100  (bit 2)
  Function  = 0b0000001000  (bit 3)
  Array     = 0b0000010000  (bit 4)
  Date      = 0b0000100000  (bit 5)
  RegExp    = 0b0001000000  (bit 6)
  Object    = 0b0010000000  (bit 7)
  null      = 0b0100000000  (bit 8)
  undefined = 0b1000000000  (bit 9)

New (bits 10-16):
  BigInt    = bit 10
  Symbol    = bit 11
  Map       = bit 12
  Set       = bit 13
  WeakMap   = bit 14
  WeakSet   = bit 15
  Promise   = bit 16
```

---

*Phase 3 Improvement Plan - typed-function v5.1*
