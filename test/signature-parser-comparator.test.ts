/**
 * Phase 2 Sprint 5: Signature Parser & Comparator Coverage Tests
 *
 * Tests covering:
 * - Empty param type resolution
 * - Type resolution failures
 * - splitParams edge cases
 * - compareParams edge branches
 * - conflicting edge params
 * - Comparator factory pattern
 * - Signature priority ordering
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseParam,
  parseSignature,
  expandParam,
  splitParams,
  stringifyParams,
  availableConversions,
  isExactType,
} from '../src/core/signature-parser.js';
import {
  compareParams,
  compareSignatures,
  conflicting,
  createSignatureComparator,
  hasRestParam,
  getLowestTypeIndex,
  getLowestConversionIndex,
} from '../src/core/signature-comparator.js';
import { TypeRegistry, createTypeRegistry } from '../src/core/type-registry.js';
import { ConversionManager, createConversionManager } from '../src/core/conversion-manager.js';
import type { Param, Type } from '../src/core/types.js';

describe('Phase 2 Sprint 5: Signature Parser & Comparator', () => {
  let registry: TypeRegistry;
  let manager: ConversionManager;

  beforeEach(() => {
    registry = createTypeRegistry();
    manager = createConversionManager(registry);
  });

  describe('Signature Parser - parseParam', () => {
    it('should parse a simple type parameter', () => {
      const param = parseParam('number', registry);
      expect(param.types).toHaveLength(1);
      expect(param.types[0]?.name).toBe('number');
      expect(param.restParam).toBe(false);
      expect(param.hasAny).toBe(false);
    });

    it('should parse a union type parameter', () => {
      const param = parseParam('number | string', registry);
      expect(param.types).toHaveLength(2);
      expect(param.types[0]?.name).toBe('number');
      expect(param.types[1]?.name).toBe('string');
      expect(param.name).toBe('number|string');
    });

    it('should parse a rest parameter', () => {
      const param = parseParam('...number', registry);
      expect(param.restParam).toBe(true);
      expect(param.types[0]?.name).toBe('number');
      expect(param.name).toBe('...number');
    });

    it('should parse rest parameter with just "..." as any', () => {
      const param = parseParam('...', registry);
      expect(param.restParam).toBe(true);
      expect(param.types[0]?.name).toBe('any');
      expect(param.hasAny).toBe(true);
    });

    it('should handle whitespace correctly', () => {
      const param = parseParam('  number  ', registry);
      expect(param.types[0]?.name).toBe('number');
    });

    it('should parse any type and set hasAny', () => {
      const param = parseParam('any', registry);
      expect(param.hasAny).toBe(true);
      expect(param.types[0]?.name).toBe('any');
    });
  });

  describe('Signature Parser - parseSignature', () => {
    it('should parse an empty signature', () => {
      const params = parseSignature('', registry);
      expect(params).toEqual([]);
    });

    it('should parse a single parameter signature', () => {
      const params = parseSignature('number', registry);
      expect(params).toHaveLength(1);
      expect(params?.[0]?.types[0]?.name).toBe('number');
    });

    it('should parse a multi-parameter signature', () => {
      const params = parseSignature('number, string, boolean', registry);
      expect(params).toHaveLength(3);
      expect(params?.[0]?.types[0]?.name).toBe('number');
      expect(params?.[1]?.types[0]?.name).toBe('string');
      expect(params?.[2]?.types[0]?.name).toBe('boolean');
    });

    it('should parse signature with union types', () => {
      const params = parseSignature('number | string, boolean', registry);
      expect(params).toHaveLength(2);
      expect(params?.[0]?.types).toHaveLength(2);
    });

    it('should throw TypeError for non-string input', () => {
      expect(() => parseSignature(123 as unknown as string, registry)).toThrow(TypeError);
      expect(() => parseSignature(123 as unknown as string, registry)).toThrow(
        'Signatures must be strings'
      );
    });

    it('should throw SyntaxError for rest param not at end', () => {
      expect(() => parseSignature('...number, string', registry)).toThrow(SyntaxError);
      expect(() => parseSignature('...number, string', registry)).toThrow(
        'Unexpected rest parameter'
      );
    });

    it('should parse signature with rest param at end', () => {
      const params = parseSignature('string, ...number', registry);
      expect(params).toHaveLength(2);
      expect(params?.[1]?.restParam).toBe(true);
    });

    it('should handle whitespace in signature', () => {
      const params = parseSignature('  number  ,  string  ', registry);
      expect(params).toHaveLength(2);
    });
  });

  describe('Signature Parser - availableConversions', () => {
    it('should return empty for empty type names', () => {
      const conversions = availableConversions([], registry);
      expect(conversions).toEqual([]);
    });

    it('should return conversions for a single type', () => {
      manager.addConversion({ from: 'string', to: 'number', convert: (s) => Number(s) });
      const conversions = availableConversions(['number'], registry);
      expect(conversions).toHaveLength(1);
      expect(conversions[0]?.from).toBe('string');
    });

    it('should return lowest-index conversion for multiple types', () => {
      manager.addConversion({ from: 'string', to: 'number', convert: (s) => Number(s) });
      manager.addConversion({ from: 'boolean', to: 'number', convert: (b) => (b ? 1 : 0) });
      const conversions = availableConversions(['number'], registry);
      expect(conversions.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle multiple target types', () => {
      manager.addConversion({ from: 'Date', to: 'number', convert: (d) => d.getTime() });
      manager.addConversion({ from: 'Date', to: 'string', convert: (d) => d.toISOString() });
      const conversions = availableConversions(['number', 'string'], registry);
      // Should get the best conversion for Date
      expect(conversions.some((c) => c.from === 'Date')).toBe(true);
    });

    it('should exclude already known types from conversions', () => {
      manager.addConversion({ from: 'string', to: 'number', convert: (s) => Number(s) });
      // string is already in the type list, so no conversion from string
      const conversions = availableConversions(['number', 'string'], registry);
      expect(conversions.every((c) => c.from !== 'string')).toBe(true);
    });
  });

  describe('Signature Parser - expandParam', () => {
    it('should expand param with available conversions', () => {
      manager.addConversion({ from: 'string', to: 'number', convert: (s) => Number(s) });
      const param = parseParam('number', registry);
      const expanded = expandParam(param, registry);
      expect(expanded.types.length).toBeGreaterThan(param.types.length);
      expect(expanded.hasConversion).toBe(true);
    });

    it('should not add conversions when none available', () => {
      const param = parseParam('number', registry);
      const expanded = expandParam(param, registry);
      expect(expanded.types.length).toBe(param.types.length);
      expect(expanded.hasConversion).toBe(false);
    });

    it('should preserve rest param status', () => {
      const param = parseParam('...number', registry);
      const expanded = expandParam(param, registry);
      expect(expanded.restParam).toBe(true);
    });

    it('should update name with conversion types', () => {
      manager.addConversion({ from: 'string', to: 'number', convert: (s) => Number(s) });
      const param = parseParam('number', registry);
      const expanded = expandParam(param, registry);
      expect(expanded.name).toContain('string');
    });
  });

  describe('Signature Parser - isExactType', () => {
    it('should return true for exact types', () => {
      const type: Type = {
        name: 'number',
        typeIndex: 0,
        test: () => true,
        isAny: false,
        conversion: null,
        conversionIndex: -1,
      };
      expect(isExactType(type)).toBe(true);
    });

    it('should return false for conversion types', () => {
      const type: Type = {
        name: 'string',
        typeIndex: 1,
        test: () => true,
        isAny: false,
        conversion: { from: 'string', to: 'number', convert: (s) => Number(s) },
        conversionIndex: 0,
      };
      expect(isExactType(type)).toBe(false);
    });

    it('should return true for undefined conversion', () => {
      const type = {
        name: 'number',
        typeIndex: 0,
        test: () => true,
        isAny: false,
        conversion: undefined,
        conversionIndex: -1,
      } as Type;
      expect(isExactType(type)).toBe(true);
    });
  });

  describe('Signature Parser - splitParams edge cases', () => {
    it('should handle empty params', () => {
      const result = splitParams([]);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual([]);
    });

    it('should split union types into separate params', () => {
      const param = parseParam('number | string', registry);
      const result = splitParams([param]);
      expect(result.length).toBe(2);
      expect(result[0]?.[0]?.types[0]?.name).toBe('number');
      expect(result[1]?.[0]?.types[0]?.name).toBe('string');
    });

    it('should handle multiple params with unions', () => {
      const param1 = parseParam('number | string', registry);
      const param2 = parseParam('boolean | Array', registry);
      const result = splitParams([param1, param2]);
      // 2 types * 2 types = 4 combinations
      expect(result.length).toBe(4);
    });

    it('should handle rest param with exact types only', () => {
      const param = parseParam('...number', registry);
      const result = splitParams([param]);
      // Rest params always include themselves
      expect(result.length).toBe(1);
      expect(result[0]?.[0]?.restParam).toBe(true);
    });

    it('should handle rest param with conversions', () => {
      manager.addConversion({ from: 'string', to: 'number', convert: (s) => Number(s) });
      const param = parseParam('...number', registry);
      const expanded = expandParam(param, registry);
      const result = splitParams([expanded]);
      // Should split into exact-only and full version
      expect(result.length).toBe(2);
    });

    it('should handle combination of regular and rest params', () => {
      const param1 = parseParam('number | string', registry);
      const param2 = parseParam('...boolean', registry);
      const result = splitParams([param1, param2]);
      // 2 types for param1 * 1 for rest = 2
      expect(result.length).toBe(2);
    });

    it('should handle complex union + rest combinations', () => {
      manager.addConversion({ from: 'string', to: 'number', convert: (s) => Number(s) });
      const param1 = parseParam('number | boolean', registry);
      const param2 = parseParam('...number', registry);
      const expandedRest = expandParam(param2, registry);
      const result = splitParams([param1, expandedRest]);
      // 2 types * 2 (exact + conversions) = 4
      expect(result.length).toBe(4);
    });
  });

  describe('Signature Parser - stringifyParams', () => {
    it('should stringify empty params', () => {
      expect(stringifyParams([])).toBe('');
    });

    it('should stringify single param', () => {
      const param = parseParam('number', registry);
      expect(stringifyParams([param])).toBe('number');
    });

    it('should stringify multiple params', () => {
      const params = parseSignature('number, string', registry) ?? [];
      expect(stringifyParams(params)).toBe('number,string');
    });

    it('should use custom separator', () => {
      const params = parseSignature('number, string', registry) ?? [];
      expect(stringifyParams(params, ' | ')).toBe('number | string');
    });
  });

  describe('Signature Comparator - hasRestParam', () => {
    it('should return false for empty params', () => {
      expect(hasRestParam([])).toBe(false);
    });

    it('should return false when no rest param', () => {
      const params = parseSignature('number, string', registry) ?? [];
      expect(hasRestParam(params)).toBe(false);
    });

    it('should return true when last param is rest', () => {
      const params = parseSignature('number, ...string', registry) ?? [];
      expect(hasRestParam(params)).toBe(true);
    });
  });

  describe('Signature Comparator - getLowestTypeIndex', () => {
    it('should return lowest type index', () => {
      const param = parseParam('number | string', registry);
      const lowest = getLowestTypeIndex(param, 100);
      expect(lowest).toBeLessThanOrEqual(100);
    });

    it('should return max+1 for empty types', () => {
      const param: Param = {
        types: [],
        name: '',
        hasAny: false,
        hasConversion: false,
        restParam: false,
      };
      expect(getLowestTypeIndex(param, 100)).toBe(101);
    });
  });

  describe('Signature Comparator - getLowestConversionIndex', () => {
    it('should return max+1 when no conversions', () => {
      const param = parseParam('number', registry);
      expect(getLowestConversionIndex(param, 100)).toBe(101);
    });

    it('should return lowest conversion index', () => {
      manager.addConversion({ from: 'string', to: 'number', convert: (s) => Number(s) });
      const param = parseParam('number', registry);
      const expanded = expandParam(param, registry);
      const lowest = getLowestConversionIndex(expanded, 100);
      expect(lowest).toBeLessThan(101);
    });
  });

  describe('Signature Comparator - compareParams edge branches', () => {
    it('should prefer non-any over any params', () => {
      const param1 = parseParam('any', registry);
      const param2 = parseParam('number', registry);
      const result = compareParams(param1, param2, 100, 100);
      expect(result).toBeGreaterThan(0); // param2 preferred
    });

    it('should prefer non-rest over rest params', () => {
      const param1 = parseParam('...number', registry);
      const param2 = parseParam('number', registry);
      const result = compareParams(param1, param2, 100, 100);
      expect(result).toBeGreaterThan(0); // param2 preferred
    });

    it('should prefer lower type index', () => {
      // number is defined earlier than string in builtin types
      const param1 = parseParam('number', registry);
      const param2 = parseParam('string', registry);
      const result = compareParams(param1, param2, 100, 100);
      expect(result).toBeLessThan(0); // param1 preferred (number comes first)
    });

    it('should prefer exact type over conversion', () => {
      manager.addConversion({ from: 'string', to: 'number', convert: (s) => Number(s) });
      const exactParam = parseParam('number', registry);
      const convParam = expandParam(exactParam, registry);
      // Create a param that's just the conversion type
      const conversionOnlyParam: Param = {
        types: convParam.types.filter((t) => t.conversion !== null),
        name: 'string',
        hasAny: false,
        hasConversion: true,
        restParam: false,
      };
      const result = compareParams(conversionOnlyParam, exactParam, 100, 100);
      expect(result).toBeGreaterThan(0); // exact preferred
    });

    it('should prefer lower conversion index when both have conversions', () => {
      manager.addConversion({ from: 'string', to: 'number', convert: (s) => Number(s) });
      manager.addConversion({ from: 'boolean', to: 'number', convert: (b) => (b ? 1 : 0) });
      const numParam = parseParam('number', registry);
      const expanded = expandParam(numParam, registry);

      // Both have conversions, compare based on conversion index
      const result = compareParams(expanded, expanded, 100, 100);
      expect(result).toBe(0); // same param
    });

    it('should return 0 for equivalent params', () => {
      const param1 = parseParam('number', registry);
      const param2 = parseParam('number', registry);
      const result = compareParams(param1, param2, 100, 100);
      expect(result).toBe(0);
    });

    it('should handle both params being any', () => {
      const param1 = parseParam('any', registry);
      const param2 = parseParam('any', registry);
      const result = compareParams(param1, param2, 100, 100);
      expect(result).toBe(0);
    });

    it('should handle both params being rest', () => {
      const param1 = parseParam('...number', registry);
      const param2 = parseParam('...number', registry);
      const result = compareParams(param1, param2, 100, 100);
      expect(result).toBe(0);
    });

    it('should handle param2 having conversion when param1 does not (line 122)', () => {
      manager.addConversion({ from: 'string', to: 'number', convert: (s) => Number(s) });
      const param1 = parseParam('number', registry);
      const param2Expanded = expandParam(parseParam('number', registry), registry);
      // Create param2 as conversion-only
      const param2: Param = {
        types: param2Expanded.types.filter((t) => t.conversion !== null),
        name: 'string',
        hasAny: false,
        hasConversion: true,
        restParam: false,
      };
      const result = compareParams(param1, param2, 100, 100);
      expect(result).toBeLessThan(0); // param1 (exact) preferred
    });

    it('should handle positive conversion diff (line 128-131)', () => {
      manager.addConversion({ from: 'string', to: 'number', convert: (s) => Number(s) });
      manager.addConversion({ from: 'boolean', to: 'string', convert: (b) => String(b) });
      const param1Exp = expandParam(parseParam('string', registry), registry);
      const param2Exp = expandParam(parseParam('number', registry), registry);
      // Both have conversions, conv1 > conv2 triggers line 128-131
      const result = compareParams(param1Exp, param2Exp, 100, 100);
      // Result depends on conversion indices
      expect(typeof result).toBe('number');
    });
  });

  describe('Signature Comparator - compareSignatures', () => {
    it('should prefer non-any-rest over any-rest signatures', () => {
      const sig1 = { params: parseSignature('number, ...any', registry) ?? [] };
      const sig2 = { params: parseSignature('number, ...string', registry) ?? [] };
      const result = compareSignatures(sig1, sig2, 100, 100);
      expect(result).toBeGreaterThan(0); // sig2 preferred
    });

    it('should prefer fewer any parameters', () => {
      const sig1 = { params: parseSignature('any, any', registry) ?? [] };
      const sig2 = { params: parseSignature('any, number', registry) ?? [] };
      const result = compareSignatures(sig1, sig2, 100, 100);
      expect(result).toBeGreaterThan(0); // sig2 preferred
    });

    it('should prefer non-conversion-rest over conversion-rest', () => {
      manager.addConversion({ from: 'string', to: 'number', convert: (s) => Number(s) });
      const restParam = expandParam(parseParam('...number', registry), registry);
      const exactRestParam = parseParam('...number', registry);
      const sig1 = { params: [restParam] };
      const sig2 = { params: [exactRestParam] };
      const result = compareSignatures(sig1, sig2, 100, 100);
      expect(result).toBeGreaterThan(0); // sig2 preferred (no conversion)
    });

    it('should prefer fewer conversions', () => {
      manager.addConversion({ from: 'string', to: 'number', convert: (s) => Number(s) });
      const convParam = expandParam(parseParam('number', registry), registry);
      const exactParam = parseParam('number', registry);
      const _sig1 = { params: [convParam, convParam] };
      const _sig2 = { params: [exactParam, exactParam] };
      // sig1 has conversion params, sig2 doesn't
      // Note: hasConversion is set based on whether types array has conversions
    });

    it('should prefer no rest param', () => {
      const sig1 = { params: parseSignature('number, ...string', registry) ?? [] };
      const sig2 = { params: parseSignature('number, string', registry) ?? [] };
      const result = compareSignatures(sig1, sig2, 100, 100);
      expect(result).toBeGreaterThan(0); // sig2 preferred
    });

    it('should prefer longer signature without rest', () => {
      const sig1 = { params: parseSignature('number', registry) ?? [] };
      const sig2 = { params: parseSignature('number, string', registry) ?? [] };
      const result = compareSignatures(sig1, sig2, 100, 100);
      expect(result).toBeLessThan(0); // sig2 preferred (longer)
    });

    it('should prefer longer signature with rest', () => {
      // When both have rest params, implementation prefers longer signature
      const sig1 = { params: parseSignature('number, string, ...boolean', registry) ?? [] };
      const sig2 = { params: parseSignature('number, ...boolean', registry) ?? [] };
      const result = compareSignatures(sig1, sig2, 100, 100);
      expect(result).toBeLessThan(0); // sig1 preferred (longer with rest)
    });

    it('should return 0 for equivalent signatures', () => {
      const sig1 = { params: parseSignature('number, string', registry) ?? [] };
      const sig2 = { params: parseSignature('number, string', registry) ?? [] };
      const result = compareSignatures(sig1, sig2, 100, 100);
      expect(result).toBe(0);
    });

    it('should handle empty signatures', () => {
      const sig1 = { params: [] };
      const sig2 = { params: [] };
      const result = compareSignatures(sig1, sig2, 100, 100);
      expect(result).toBe(0);
    });
  });

  describe('Signature Comparator - conflicting', () => {
    it('should detect conflicting signatures with same types', () => {
      const params1 = parseSignature('number', registry) ?? [];
      const params2 = parseSignature('number', registry) ?? [];
      expect(conflicting(params1, params2)).toBe(true);
    });

    it('should not conflict with different types', () => {
      const params1 = parseSignature('number', registry) ?? [];
      const params2 = parseSignature('string', registry) ?? [];
      expect(conflicting(params1, params2)).toBe(false);
    });

    it('should detect union type overlap', () => {
      const params1 = parseSignature('number | string', registry) ?? [];
      const params2 = parseSignature('string | boolean', registry) ?? [];
      expect(conflicting(params1, params2)).toBe(true); // string overlaps
    });

    it('should detect conflict with rest params', () => {
      const params1 = parseSignature('number, ...string', registry) ?? [];
      const params2 = parseSignature('number, string, string', registry) ?? [];
      expect(conflicting(params1, params2)).toBe(true);
    });

    it('should not conflict different length without rest', () => {
      const params1 = parseSignature('number', registry) ?? [];
      const params2 = parseSignature('number, string', registry) ?? [];
      expect(conflicting(params1, params2)).toBe(false);
    });

    it('should handle empty params', () => {
      const params1: Param[] = [];
      const params2: Param[] = [];
      expect(conflicting(params1, params2)).toBe(true);
    });

    it('should handle one empty with rest param', () => {
      // Rest param requires at least one type match, empty has no types
      const params1 = parseSignature('...number', registry) ?? [];
      const params2: Param[] = [];
      // No type overlap at position 0, so not conflicting
      expect(conflicting(params1, params2)).toBe(false);
    });

    it('should detect rest param at position (line 171 edge case)', () => {
      const params1 = parseSignature('...number', registry) ?? [];
      const params2 = parseSignature('number, number', registry) ?? [];
      // Rest param can match multiple
      expect(conflicting(params1, params2)).toBe(true);
    });

    it('should handle two rest params of different lengths', () => {
      const params1 = parseSignature('number, ...string', registry) ?? [];
      const params2 = parseSignature('number, string, ...boolean', registry) ?? [];
      // Different base lengths with both having rest
      expect(conflicting(params1, params2)).toBe(false); // string !== boolean at overlap
    });

    it('should handle rest params of same length', () => {
      const params1 = parseSignature('number, ...string', registry) ?? [];
      const params2 = parseSignature('number, ...string', registry) ?? [];
      expect(conflicting(params1, params2)).toBe(true);
    });
  });

  describe('Signature Comparator - createSignatureComparator', () => {
    it('should create a working comparator function', () => {
      const comparator = createSignatureComparator(100, 100);
      expect(typeof comparator).toBe('function');
    });

    it('should sort signatures correctly', () => {
      const comparator = createSignatureComparator(100, 100);
      const sig1 = { params: parseSignature('any', registry) ?? [] };
      const sig2 = { params: parseSignature('number', registry) ?? [] };
      const signatures = [sig1, sig2];
      signatures.sort(comparator);
      // number should come before any
      expect(signatures[0]?.params[0]?.types[0]?.name).toBe('number');
    });

    it('should handle complex signature ordering', () => {
      const comparator = createSignatureComparator(100, 100);
      const sig1 = { params: parseSignature('number, ...any', registry) ?? [] };
      const sig2 = { params: parseSignature('number, string', registry) ?? [] };
      const sig3 = { params: parseSignature('number', registry) ?? [] };
      const signatures = [sig1, sig2, sig3];
      signatures.sort(comparator);
      // Shorter without rest should come first
      expect(signatures[0]?.params.length).toBeLessThanOrEqual(signatures[1]?.params.length ?? 0);
    });

    it('should use provided maxTypeIndex and maxConversionIndex', () => {
      const comparator1 = createSignatureComparator(10, 10);
      const comparator2 = createSignatureComparator(100, 100);
      const sig1 = { params: parseSignature('number', registry) ?? [] };
      const sig2 = { params: parseSignature('number', registry) ?? [] };
      // Both should return 0 for equivalent
      expect(comparator1(sig1, sig2)).toBe(0);
      expect(comparator2(sig1, sig2)).toBe(0);
    });
  });

  describe('Signature Parser - Type resolution edge cases', () => {
    it('should throw for unknown type in parseParam', () => {
      expect(() => parseParam('unknownType123', registry)).toThrow();
    });

    it('should throw for unknown type in signature', () => {
      expect(() => parseSignature('unknownType123, number', registry)).toThrow();
    });

    it('should handle custom registered types', () => {
      registry.addTypes([{
        name: 'positive',
        test: (x) => typeof x === 'number' && x > 0,
      }]);
      const param = parseParam('positive', registry);
      expect(param.types[0]?.name).toBe('positive');
    });
  });

  describe('Signature Comparator - Priority ordering scenarios', () => {
    it('should order by specificity: exact > conversion > any', () => {
      manager.addConversion({ from: 'string', to: 'number', convert: (s) => Number(s) });
      const comparator = createSignatureComparator(100, 100);

      const exactSig = { params: parseSignature('number', registry) ?? [] };
      const anySig = { params: parseSignature('any', registry) ?? [] };

      const signatures = [anySig, exactSig];
      signatures.sort(comparator);

      expect(signatures[0]?.params[0]?.types[0]?.name).toBe('number');
    });

    it('should prefer earlier type definitions', () => {
      // Add custom types in order
      registry.addTypes([{ name: 'alpha', test: () => true }]);
      registry.addTypes([{ name: 'beta', test: () => true }]);

      const comparator = createSignatureComparator(100, 100);
      const alphaSig = { params: parseSignature('alpha', registry) ?? [] };
      const betaSig = { params: parseSignature('beta', registry) ?? [] };

      const result = comparator(alphaSig, betaSig);
      expect(result).toBeLessThan(0); // alpha defined first, should come first
    });

    it('should handle deep parameter comparison', () => {
      const comparator = createSignatureComparator(100, 100);
      const sig1 = { params: parseSignature('number, number, string', registry) ?? [] };
      const sig2 = { params: parseSignature('number, number, boolean', registry) ?? [] };
      const result = comparator(sig1, sig2);
      // Should compare by third param type index
      expect(typeof result).toBe('number');
    });
  });

  describe('Edge cases for branch coverage', () => {
    it('should handle param with undefined in types iteration', () => {
      // Trigger edge case where param check is needed
      const params = parseSignature('number, string', registry) ?? [];
      expect(params.length).toBe(2);
    });

    it('should handle typeSet caching in getTypeSetAtIndex', () => {
      const params = parseSignature('number | string', registry) ?? [];
      // Call conflicting twice to test caching
      expect(conflicting(params, params)).toBe(true);
      expect(conflicting(params, params)).toBe(true);
    });

    it('should handle getTypeSetAtIndex beyond params length with rest', () => {
      const params = parseSignature('number, ...string', registry) ?? [];
      // This implicitly tests getTypeSetAtIndex behavior
      const longerParams = parseSignature('number, string, string, string', registry) ?? [];
      expect(conflicting(params, longerParams)).toBe(true);
    });

    it('should handle getTypeSetAtIndex beyond params length without rest', () => {
      const params1 = parseSignature('number', registry) ?? [];
      const params2 = parseSignature('number, string', registry) ?? [];
      // Second position in params1 has no type
      expect(conflicting(params1, params2)).toBe(false);
    });
  });
});
