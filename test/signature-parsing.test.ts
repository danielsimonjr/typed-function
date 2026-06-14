/**
 * Sprint 2 Tests - Signature Parsing & Compilation
 *
 * Tests for the modules created in Sprint 2:
 * - Signature Parser
 * - Signature Compiler
 * - Signature Comparator
 * - Conversion Manager
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createTypeRegistry, TypeRegistry } from '../src/core/type-registry.js';
import {
  parseParam,
  parseSignature,
  expandParam,
  splitParams,
  stringifyParams,
} from '../src/core/signature-parser.js';
import {
  compileTest,
  compileTests,
  compileArgsPreprocessing,
} from '../src/core/signature-compiler.js';
import {
  hasRestParam,
  compareSignatures,
  conflicting,
} from '../src/core/signature-comparator.js';
import {
  ConversionManager,
  createConversionManager,
} from '../src/core/conversion-manager.js';

describe('Signature Parser', () => {
  let registry: TypeRegistry;

  beforeEach(() => {
    registry = createTypeRegistry();
  });

  describe('parseParam', () => {
    it('should parse a simple type', () => {
      const param = parseParam('number', registry);
      expect(param.name).toBe('number');
      expect(param.types.length).toBe(1);
      expect(param.types[0]?.name).toBe('number');
      expect(param.restParam).toBe(false);
      expect(param.hasAny).toBe(false);
    });

    it('should parse a union type', () => {
      const param = parseParam('number | string', registry);
      expect(param.name).toBe('number|string');
      expect(param.types.length).toBe(2);
      expect(param.types[0]?.name).toBe('number');
      expect(param.types[1]?.name).toBe('string');
    });

    it('should parse a rest parameter', () => {
      const param = parseParam('...number', registry);
      expect(param.name).toBe('...number');
      expect(param.restParam).toBe(true);
      expect(param.types[0]?.name).toBe('number');
    });

    it('should parse bare rest as any', () => {
      const param = parseParam('...', registry);
      expect(param.restParam).toBe(true);
      expect(param.types[0]?.name).toBe('any');
      expect(param.hasAny).toBe(true);
    });

    it('should recognize any type', () => {
      const param = parseParam('any', registry);
      expect(param.hasAny).toBe(true);
      expect(param.types[0]?.isAny).toBe(true);
    });

    it('should throw for unknown type', () => {
      expect(() => parseParam('unknown', registry)).toThrow(TypeError);
    });
  });

  describe('parseSignature', () => {
    it('should parse empty signature', () => {
      const params = parseSignature('', registry);
      expect(params).toEqual([]);
    });

    it('should parse single param', () => {
      const params = parseSignature('number', registry);
      expect(params?.length).toBe(1);
      expect(params?.[0]?.name).toBe('number');
    });

    it('should parse multiple params', () => {
      const params = parseSignature('number, string', registry);
      expect(params?.length).toBe(2);
      expect(params?.[0]?.name).toBe('number');
      expect(params?.[1]?.name).toBe('string');
    });

    it('should parse complex signature', () => {
      const params = parseSignature('number | boolean, string, ...any', registry);
      expect(params?.length).toBe(3);
      expect(params?.[0]?.name).toBe('number|boolean');
      expect(params?.[1]?.name).toBe('string');
      expect(params?.[2]?.restParam).toBe(true);
    });

    it('should throw for non-string input', () => {
      expect(() => parseSignature(123 as any, registry)).toThrow(TypeError);
    });

    it('should throw for rest param not at end', () => {
      expect(() => parseSignature('...number, string', registry)).toThrow(SyntaxError);
    });
  });

  describe('splitParams', () => {
    it('should split single type params', () => {
      const params = parseSignature('number | string, boolean', registry);
      if (!params) throw new Error('Failed to parse');

      const split = splitParams(params);
      expect(split.length).toBe(2); // number,boolean and string,boolean
    });

    it('should handle single type per param', () => {
      const params = parseSignature('number, string', registry);
      if (!params) throw new Error('Failed to parse');

      const split = splitParams(params);
      expect(split.length).toBe(1);
    });

    it('should handle empty params', () => {
      const split = splitParams([]);
      expect(split.length).toBe(1);
      expect(split[0]).toEqual([]);
    });
  });

  describe('stringifyParams', () => {
    it('should stringify params', () => {
      const params = parseSignature('number, string', registry);
      if (!params) throw new Error('Failed to parse');

      expect(stringifyParams(params)).toBe('number,string');
      expect(stringifyParams(params, ', ')).toBe('number, string');
    });
  });

  describe('expandParam', () => {
    it('should return same param when no conversions', () => {
      const param = parseParam('number', registry);
      const expanded = expandParam(param, registry);
      expect(expanded.types.length).toBe(1);
      expect(expanded.hasConversion).toBe(false);
    });
  });
});

describe('Signature Compiler', () => {
  let registry: TypeRegistry;

  beforeEach(() => {
    registry = createTypeRegistry();
  });

  describe('compileTest', () => {
    it('should compile test for single type', () => {
      const param = parseParam('number', registry);
      const test = compileTest(param, registry);

      expect(test(42)).toBe(true);
      expect(test('hello')).toBe(false);
    });

    it('should compile test for union type', () => {
      const param = parseParam('number | string', registry);
      const test = compileTest(param, registry);

      expect(test(42)).toBe(true);
      expect(test('hello')).toBe(true);
      expect(test(true)).toBe(false);
    });

    it('should return true for undefined param', () => {
      const test = compileTest(undefined, registry);
      expect(test(42)).toBe(true);
      expect(test('anything')).toBe(true);
    });
  });

  describe('compileTests', () => {
    it('should compile tests for empty signature', () => {
      const test = compileTests([], registry);
      expect(test([])).toBe(true);
      expect(test([1])).toBe(false);
    });

    it('should compile tests for single param', () => {
      const params = parseSignature('number', registry);
      if (!params) throw new Error('Failed to parse');

      const test = compileTests(params, registry);
      expect(test([42])).toBe(true);
      expect(test(['hello'])).toBe(false);
      expect(test([42, 43])).toBe(false);
    });

    it('should compile tests for two params', () => {
      const params = parseSignature('number, string', registry);
      if (!params) throw new Error('Failed to parse');

      const test = compileTests(params, registry);
      expect(test([42, 'hello'])).toBe(true);
      expect(test([42])).toBe(false);
      expect(test([42, 'hello', true])).toBe(false);
    });

    it('should compile tests for rest param', () => {
      const params = parseSignature('string, ...number', registry);
      if (!params) throw new Error('Failed to parse');

      const test = compileTests(params, registry);
      expect(test(['a', 1])).toBe(true);
      expect(test(['a', 1, 2, 3])).toBe(true);
      expect(test(['a'])).toBe(false); // Need at least one rest arg
      expect(test(['a', 'b'])).toBe(false);
    });
  });

  describe('compileArgsPreprocessing', () => {
    it('should return original function when no preprocessing needed', () => {
      const params = parseSignature('number', registry);
      if (!params) throw new Error('Failed to parse');

      const fn = (a: unknown) => a;
      const wrapped = compileArgsPreprocessing(params, fn, registry);

      expect(wrapped(42)).toBe(42);
    });

    it('should collect rest params into array', () => {
      const params = parseSignature('string, ...number', registry);
      if (!params) throw new Error('Failed to parse');

      let capturedArgs: unknown[] = [];
      const fn = (...args: unknown[]) => {
        capturedArgs = args;
        return args;
      };

      const wrapped = compileArgsPreprocessing(params, fn, registry);
      wrapped('a', 1, 2, 3);

      expect(capturedArgs.length).toBe(2);
      expect(capturedArgs[0]).toBe('a');
      expect(capturedArgs[1]).toEqual([1, 2, 3]);
    });
  });
});

describe('Signature Comparator', () => {
  let registry: TypeRegistry;

  beforeEach(() => {
    registry = createTypeRegistry();
  });

  describe('hasRestParam', () => {
    it('should detect rest param', () => {
      const params = parseSignature('number, ...string', registry);
      expect(hasRestParam(params || [])).toBe(true);
    });

    it('should return false without rest param', () => {
      const params = parseSignature('number, string', registry);
      expect(hasRestParam(params || [])).toBe(false);
    });
  });

  describe('compareSignatures', () => {
    it('should prefer fewer any params', () => {
      const sig1 = { params: parseSignature('number, any', registry) || [] };
      const sig2 = { params: parseSignature('number, string', registry) || [] };

      const result = compareSignatures(sig1, sig2, 20, 10);
      expect(result).toBeGreaterThan(0); // sig2 (no any) should come first
    });

    it('should prefer no rest param', () => {
      const sig1 = { params: parseSignature('number, ...string', registry) || [] };
      const sig2 = { params: parseSignature('number, string', registry) || [] };

      const result = compareSignatures(sig1, sig2, 20, 10);
      expect(result).toBeGreaterThan(0); // sig2 (no rest) should come first
    });

    it('should prefer exact matches', () => {
      const sig1 = { params: parseSignature('number', registry) || [] };
      const sig2 = { params: parseSignature('number', registry) || [] };

      const result = compareSignatures(sig1, sig2, 20, 10);
      expect(result).toBe(0); // Identical signatures
    });
  });

  describe('conflicting', () => {
    it('should detect identical signatures as conflicting', () => {
      const params1 = parseSignature('number, string', registry) || [];
      const params2 = parseSignature('number, string', registry) || [];

      expect(conflicting(params1, params2)).toBe(true);
    });

    it('should not detect different signatures as conflicting', () => {
      const params1 = parseSignature('number', registry) || [];
      const params2 = parseSignature('string', registry) || [];

      expect(conflicting(params1, params2)).toBe(false);
    });

    it('should detect overlap as conflicting', () => {
      const params1 = parseSignature('number | string', registry) || [];
      const params2 = parseSignature('number', registry) || [];

      expect(conflicting(params1, params2)).toBe(true);
    });

    it('should handle different lengths', () => {
      const params1 = parseSignature('number', registry) || [];
      const params2 = parseSignature('number, string', registry) || [];

      expect(conflicting(params1, params2)).toBe(false);
    });

    it('should handle rest params', () => {
      const params1 = parseSignature('number, ...string', registry) || [];
      const params2 = parseSignature('number, string, string', registry) || [];

      expect(conflicting(params1, params2)).toBe(true);
    });
  });
});

describe('Conversion Manager', () => {
  let registry: TypeRegistry;
  let manager: ConversionManager;

  beforeEach(() => {
    registry = createTypeRegistry();
    manager = createConversionManager(registry);
  });

  describe('addConversion', () => {
    it('should add a conversion', () => {
      manager.addConversion({
        from: 'string',
        to: 'number',
        convert: (s) => Number(s),
      });

      const conversions = manager.getConversionsTo('number');
      expect(conversions.length).toBe(1);
      expect(conversions[0]?.from).toBe('string');
    });

    it('should throw for invalid conversion', () => {
      expect(() => manager.addConversion({} as any)).toThrow(TypeError);
    });

    it('should throw for self conversion', () => {
      expect(() =>
        manager.addConversion({
          from: 'number',
          to: 'number',
          convert: (x) => x,
        })
      ).toThrow(SyntaxError);
    });

    it('should throw for duplicate conversion', () => {
      manager.addConversion({
        from: 'string',
        to: 'number',
        convert: (s) => Number(s),
      });

      expect(() =>
        manager.addConversion({
          from: 'string',
          to: 'number',
          convert: (s) => parseInt(s as string, 10),
        })
      ).toThrow(Error);
    });

    it('should allow override with option', () => {
      const convert1 = (s: unknown) => Number(s);
      const convert2 = (s: unknown) => parseInt(s as string, 10);

      manager.addConversion({
        from: 'string',
        to: 'number',
        convert: convert1,
      });

      manager.addConversion(
        {
          from: 'string',
          to: 'number',
          convert: convert2,
        },
        { override: true }
      );

      const conversions = manager.getConversionsTo('number');
      expect(conversions.length).toBe(1);
      expect(conversions[0]?.convert).toBe(convert2);
    });
  });

  describe('removeConversion', () => {
    it('should remove a conversion', () => {
      const convert = (s: unknown) => Number(s);

      manager.addConversion({
        from: 'string',
        to: 'number',
        convert,
      });

      manager.removeConversion({
        from: 'string',
        to: 'number',
        convert,
      });

      const conversions = manager.getConversionsTo('number');
      expect(conversions.length).toBe(0);
    });

    it('should throw for nonexistent conversion', () => {
      expect(() =>
        manager.removeConversion({
          from: 'string',
          to: 'number',
          convert: () => 0,
        })
      ).toThrow(Error);
    });

    it('should throw for mismatched convert function', () => {
      const convert1 = (s: unknown) => Number(s);
      const convert2 = (s: unknown) => parseInt(s as string, 10);

      manager.addConversion({
        from: 'string',
        to: 'number',
        convert: convert1,
      });

      expect(() =>
        manager.removeConversion({
          from: 'string',
          to: 'number',
          convert: convert2,
        })
      ).toThrow(/does not match/);
    });
  });

  describe('convert', () => {
    it('should return value if already correct type', () => {
      const result = manager.convert(42, 'number');
      expect(result).toBe(42);
    });

    it('should convert using registered conversion', () => {
      manager.addConversion({
        from: 'string',
        to: 'number',
        convert: (s) => Number(s),
      });

      const result = manager.convert('42', 'number');
      expect(result).toBe(42);
    });

    it('should throw if no conversion available', () => {
      expect(() => manager.convert('hello', 'number')).toThrow();
    });
  });

  describe('availableConversions', () => {
    it('should return empty for no types', () => {
      const conversions = manager.availableConversions([]);
      expect(conversions).toEqual([]);
    });

    it('should return conversions for single type', () => {
      manager.addConversion({
        from: 'string',
        to: 'number',
        convert: (s) => Number(s),
      });

      const conversions = manager.availableConversions(['number']);
      expect(conversions.length).toBe(1);
      expect(conversions[0]?.from).toBe('string');
    });

    it('should return unique conversions for multiple types', () => {
      manager.addConversion({
        from: 'string',
        to: 'number',
        convert: (s) => Number(s),
      });
      manager.addConversion({
        from: 'boolean',
        to: 'number',
        convert: (b) => (b ? 1 : 0),
      });

      const conversions = manager.availableConversions(['number']);
      expect(conversions.length).toBe(2);
    });
  });
});

describe('Module Exports', () => {
  it('should export all Sprint 2 functions', async () => {
    const module = await import('../src/index.js');

    // Signature parser
    expect(module.parseParam).toBeDefined();
    expect(module.parseSignature).toBeDefined();
    expect(module.expandParam).toBeDefined();
    expect(module.splitParams).toBeDefined();
    expect(module.stringifyParams).toBeDefined();

    // Signature compiler
    expect(module.compileTest).toBeDefined();
    expect(module.compileTests).toBeDefined();
    expect(module.compileArgsPreprocessing).toBeDefined();

    // Signature comparator
    expect(module.hasRestParam).toBeDefined();
    expect(module.compareParams).toBeDefined();
    expect(module.compareSignatures).toBeDefined();
    expect(module.conflicting).toBeDefined();

    // Conversion manager
    expect(module.ConversionManager).toBeDefined();
    expect(module.createConversionManager).toBeDefined();
  });
});
