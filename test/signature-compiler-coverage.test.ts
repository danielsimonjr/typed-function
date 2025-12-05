/**
 * Coverage tests for Signature Compiler
 * Sprint 4: Signature Compiler Complete Coverage
 *
 * Target: 100% coverage for src/core/signature-compiler.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  compileTest,
  compileTests,
  compileArgConversion,
  compileArgsPreprocessing,
} from '../src/core/signature-compiler.js';
import { createTypeRegistry, TypeRegistry } from '../src/core/type-registry.js';
import type { Param } from '../src/core/types.js';
import { create } from '../src/index.js';

describe('Signature Compiler Coverage (Sprint 4)', () => {
  let registry: TypeRegistry;

  beforeEach(() => {
    registry = createTypeRegistry();
  });

  describe('Task 4.1: Empty conversion array (line 186)', () => {
    it('should return identity function when no conversions', () => {
      const param: Param = {
        name: 'x',
        types: [{ name: 'number', conversion: null, test: undefined }],
        hasAny: false,
        restParam: false,
        hasConversion: false,
      };

      const converter = compileArgConversion(param, registry);

      expect(converter(42)).toBe(42);
      expect(converter('hello')).toBe('hello');
      expect(converter.name).toBe('pass');
    });

    it('should handle param with hasConversion but no actual conversions', () => {
      const param: Param = {
        name: 'x',
        types: [{ name: 'number', conversion: null, test: undefined }],
        hasAny: false,
        restParam: false,
        hasConversion: true, // hasConversion is true but no actual conversions
      };

      const converter = compileArgConversion(param, registry);

      // Should still return identity since no conversion.convert defined
      expect(converter(42)).toBe(42);
      expect(converter.name).toBe('pass');
    });
  });

  describe('Task 4.2: Case 1 conversion (lines 189-202)', () => {
    it('should handle single conversion correctly', () => {
      const param: Param = {
        name: 'x',
        types: [
          { name: 'number', conversion: null, test: undefined },
          {
            name: 'number',
            conversion: {
              from: 'string',
              to: 'number',
              convert: (x: unknown) => parseFloat(x as string),
            },
            test: undefined,
          },
        ],
        hasAny: false,
        restParam: false,
        hasConversion: true,
      };

      const converter = compileArgConversion(param, registry);

      // String should be converted
      expect(converter('42')).toBe(42);
      // Number should pass through
      expect(converter(42)).toBe(42);
      // Name should reflect conversion
      expect(converter.name).toContain('string');
      expect(converter.name).toContain('number');
    });

    it('should return identity when single conv is undefined', () => {
      // This shouldn't happen normally but tests the edge case
      const param: Param = {
        name: 'x',
        types: [],
        hasAny: false,
        restParam: false,
        hasConversion: false,
      };

      const converter = compileArgConversion(param, registry);
      expect(converter(42)).toBe(42);
    });
  });

  describe('Task 4.3: Case 2 conversions (lines 205-223)', () => {
    it('should handle two valid conversions', () => {
      const param: Param = {
        name: 'x',
        types: [
          { name: 'number', conversion: null, test: undefined },
          {
            name: 'number',
            conversion: {
              from: 'string',
              to: 'number',
              convert: (x: unknown) => parseFloat(x as string),
            },
            test: undefined,
          },
          {
            name: 'number',
            conversion: {
              from: 'boolean',
              to: 'number',
              convert: (x: unknown) => (x ? 1 : 0),
            },
            test: undefined,
          },
        ],
        hasAny: false,
        restParam: false,
        hasConversion: true,
      };

      const converter = compileArgConversion(param, registry);

      // String should be converted
      expect(converter('42')).toBe(42);
      // Boolean should be converted
      expect(converter(true)).toBe(1);
      expect(converter(false)).toBe(0);
      // Number should pass through
      expect(converter(42)).toBe(42);
    });

    it('should apply first matching conversion in case 2', () => {
      const param: Param = {
        name: 'x',
        types: [
          {
            name: 'string',
            conversion: {
              from: 'number',
              to: 'string',
              convert: (x: unknown) => `first:${x}`,
            },
            test: undefined,
          },
          {
            name: 'string',
            conversion: {
              from: 'boolean',
              to: 'string',
              convert: (x: unknown) => `second:${x}`,
            },
            test: undefined,
          },
        ],
        hasAny: false,
        restParam: false,
        hasConversion: true,
      };

      const converter = compileArgConversion(param, registry);

      expect(converter(42)).toBe('first:42');
      expect(converter(true)).toBe('second:true');
    });
  });

  describe('Task 4.4: 3+ conversions default case (lines 226-236)', () => {
    it('should handle 3+ conversions using loop', () => {
      const param: Param = {
        name: 'x',
        types: [
          { name: 'string', conversion: null, test: undefined },
          {
            name: 'string',
            conversion: {
              from: 'number',
              to: 'string',
              convert: (x: unknown) => String(x),
            },
            test: undefined,
          },
          {
            name: 'string',
            conversion: {
              from: 'boolean',
              to: 'string',
              convert: (x: unknown) => (x ? 'true' : 'false'),
            },
            test: undefined,
          },
          {
            name: 'string',
            conversion: {
              from: 'Array',
              to: 'string',
              convert: (x: unknown) => JSON.stringify(x),
            },
            test: undefined,
          },
        ],
        hasAny: false,
        restParam: false,
        hasConversion: true,
      };

      const converter = compileArgConversion(param, registry);

      expect(converter(42)).toBe('42');
      expect(converter(true)).toBe('true');
      expect(converter([1, 2, 3])).toBe('[1,2,3]');
      // Already string passes through
      expect(converter('hello')).toBe('hello');
    });

    it('should iterate through all conversions in default case', () => {
      const conversionLog: string[] = [];

      const param: Param = {
        name: 'x',
        types: [
          {
            name: 'Object',
            conversion: {
              from: 'number',
              to: 'Object',
              convert: (x: unknown) => {
                conversionLog.push('number');
                return { value: x };
              },
            },
            test: undefined,
          },
          {
            name: 'Object',
            conversion: {
              from: 'string',
              to: 'Object',
              convert: (x: unknown) => {
                conversionLog.push('string');
                return { text: x };
              },
            },
            test: undefined,
          },
          {
            name: 'Object',
            conversion: {
              from: 'boolean',
              to: 'Object',
              convert: (x: unknown) => {
                conversionLog.push('boolean');
                return { bool: x };
              },
            },
            test: undefined,
          },
        ],
        hasAny: false,
        restParam: false,
        hasConversion: true,
      };

      const converter = compileArgConversion(param, registry);

      conversionLog.length = 0;
      converter(42);
      expect(conversionLog).toEqual(['number']);

      conversionLog.length = 0;
      converter('test');
      expect(conversionLog).toEqual(['string']);

      conversionLog.length = 0;
      converter(true);
      expect(conversionLog).toEqual(['boolean']);
    });
  });

  describe('Task 4.5: Conversion function naming (line 239)', () => {
    it('should set function name via Object.defineProperty', () => {
      const param: Param = {
        name: 'x',
        types: [
          {
            name: 'number',
            conversion: {
              from: 'string',
              to: 'number',
              convert: (x: unknown) => Number(x),
            },
            test: undefined,
          },
        ],
        hasAny: false,
        restParam: false,
        hasConversion: true,
      };

      const converter = compileArgConversion(param, registry);

      expect(converter.name).toBe('string~>number');
    });

    it('should concatenate multiple conversion names', () => {
      const param: Param = {
        name: 'x',
        types: [
          {
            name: 'number',
            conversion: {
              from: 'string',
              to: 'number',
              convert: (x: unknown) => Number(x),
            },
            test: undefined,
          },
          {
            name: 'number',
            conversion: {
              from: 'boolean',
              to: 'number',
              convert: (x: unknown) => (x ? 1 : 0),
            },
            test: undefined,
          },
        ],
        hasAny: false,
        restParam: false,
        hasConversion: true,
      };

      const converter = compileArgConversion(param, registry);

      expect(converter.name).toContain('string~>number');
      expect(converter.name).toContain('boolean~>number');
    });
  });

  describe('Task 4.6: compileTest function', () => {
    it('should return true for undefined param', () => {
      const test = compileTest(undefined, registry);
      expect(test(42)).toBe(true);
      expect(test('anything')).toBe(true);
    });

    it('should return true for empty types array', () => {
      const param: Param = {
        name: 'x',
        types: [],
        hasAny: false,
        restParam: false,
        hasConversion: false,
      };

      const test = compileTest(param, registry);
      expect(test(42)).toBe(true);
    });

    it('should handle single type', () => {
      const param: Param = {
        name: 'x',
        types: [{ name: 'number', conversion: null, test: undefined }],
        hasAny: false,
        restParam: false,
        hasConversion: false,
      };

      const test = compileTest(param, registry);
      expect(test(42)).toBe(true);
      expect(test('string')).toBe(false);
    });

    it('should handle single undefined type', () => {
      const param: Param = {
        name: 'x',
        types: [undefined as any],
        hasAny: false,
        restParam: false,
        hasConversion: false,
      };

      const test = compileTest(param, registry);
      expect(test(42)).toBe(true);
    });

    it('should handle two types with or logic', () => {
      const param: Param = {
        name: 'x',
        types: [
          { name: 'number', conversion: null, test: undefined },
          { name: 'string', conversion: null, test: undefined },
        ],
        hasAny: false,
        restParam: false,
        hasConversion: false,
      };

      const test = compileTest(param, registry);
      expect(test(42)).toBe(true);
      expect(test('hello')).toBe(true);
      expect(test(true)).toBe(false);
    });

    it('should handle two types with undefined first', () => {
      const param: Param = {
        name: 'x',
        types: [undefined as any, { name: 'string', conversion: null, test: undefined }],
        hasAny: false,
        restParam: false,
        hasConversion: false,
      };

      const test = compileTest(param, registry);
      expect(test(42)).toBe(true); // Returns () => true when types undefined
    });

    it('should handle 3+ types', () => {
      const param: Param = {
        name: 'x',
        types: [
          { name: 'number', conversion: null, test: undefined },
          { name: 'string', conversion: null, test: undefined },
          { name: 'boolean', conversion: null, test: undefined },
        ],
        hasAny: false,
        restParam: false,
        hasConversion: false,
      };

      const test = compileTest(param, registry);
      expect(test(42)).toBe(true);
      expect(test('hello')).toBe(true);
      expect(test(true)).toBe(true);
      expect(test([])).toBe(false);
    });
  });

  describe('Task 4.7: compileTests with restParam', () => {
    it('should compile tests for rest parameter', () => {
      const param: Param = {
        name: '...nums',
        types: [{ name: 'number', conversion: null, test: undefined }],
        hasAny: false,
        restParam: true,
        hasConversion: false,
      };

      const test = compileTests([param], registry);

      expect(test([42])).toBe(true);
      expect(test([1, 2, 3])).toBe(true);
      expect(test(['string'])).toBe(false);
      expect(test([])).toBe(false); // Rest param needs at least one arg
    });

    it('should compile tests for regular + rest params', () => {
      const param1: Param = {
        name: 'first',
        types: [{ name: 'string', conversion: null, test: undefined }],
        hasAny: false,
        restParam: false,
        hasConversion: false,
      };
      const param2: Param = {
        name: '...nums',
        types: [{ name: 'number', conversion: null, test: undefined }],
        hasAny: false,
        restParam: true,
        hasConversion: false,
      };

      const test = compileTests([param1, param2], registry);

      expect(test(['hello', 1])).toBe(true);
      expect(test(['hello', 1, 2, 3])).toBe(true);
      expect(test(['hello'])).toBe(false); // Rest needs at least one
      expect(test([42, 1])).toBe(false); // First param wrong type
    });
  });

  describe('Task 4.8: compileTests for different param counts', () => {
    it('should handle 0 params', () => {
      const test = compileTests([], registry);
      expect(test([])).toBe(true);
      expect(test([1])).toBe(false);
    });

    it('should handle 1 param', () => {
      const param: Param = {
        name: 'x',
        types: [{ name: 'number', conversion: null, test: undefined }],
        hasAny: false,
        restParam: false,
        hasConversion: false,
      };

      const test = compileTests([param], registry);
      expect(test([42])).toBe(true);
      expect(test(['string'])).toBe(false);
      expect(test([42, 1])).toBe(false);
    });

    it('should handle 2 params', () => {
      const param1: Param = {
        name: 'x',
        types: [{ name: 'number', conversion: null, test: undefined }],
        hasAny: false,
        restParam: false,
        hasConversion: false,
      };
      const param2: Param = {
        name: 'y',
        types: [{ name: 'string', conversion: null, test: undefined }],
        hasAny: false,
        restParam: false,
        hasConversion: false,
      };

      const test = compileTests([param1, param2], registry);
      expect(test([42, 'hello'])).toBe(true);
      expect(test([42])).toBe(false);
      expect(test(['string', 'hello'])).toBe(false);
    });

    it('should handle 3+ params', () => {
      const params: Param[] = [
        {
          name: 'a',
          types: [{ name: 'number', conversion: null, test: undefined }],
          hasAny: false,
          restParam: false,
          hasConversion: false,
        },
        {
          name: 'b',
          types: [{ name: 'string', conversion: null, test: undefined }],
          hasAny: false,
          restParam: false,
          hasConversion: false,
        },
        {
          name: 'c',
          types: [{ name: 'boolean', conversion: null, test: undefined }],
          hasAny: false,
          restParam: false,
          hasConversion: false,
        },
      ];

      const test = compileTests(params, registry);
      expect(test([42, 'hello', true])).toBe(true);
      expect(test([42, 'hello'])).toBe(false);
      expect(test([42, 'hello', 'not boolean'])).toBe(false);
    });
  });

  describe('compileArgsPreprocessing', () => {
    it('should handle functions without conversions', () => {
      const params: Param[] = [
        {
          name: 'x',
          types: [{ name: 'number', conversion: null, test: undefined }],
          hasAny: false,
          restParam: false,
          hasConversion: false,
        },
      ];

      const fn = (x: number) => x * 2;
      const preprocessed = compileArgsPreprocessing(params, fn, registry);

      expect(preprocessed(21)).toBe(42);
    });

    it('should handle functions with conversions', () => {
      const params: Param[] = [
        {
          name: 'x',
          types: [
            { name: 'number', conversion: null, test: undefined },
            {
              name: 'number',
              conversion: {
                from: 'string',
                to: 'number',
                convert: (x: unknown) => parseFloat(x as string),
              },
              test: undefined,
            },
          ],
          hasAny: false,
          restParam: false,
          hasConversion: true,
        },
      ];

      const fn = (x: number) => x * 2;
      const preprocessed = compileArgsPreprocessing(params, fn, registry);

      expect(preprocessed(21)).toBe(42);
      expect(preprocessed('21')).toBe(42);
    });

    it('should handle rest parameters in preprocessing', () => {
      const params: Param[] = [
        {
          name: '...nums',
          types: [{ name: 'number', conversion: null, test: undefined }],
          hasAny: false,
          restParam: true,
          hasConversion: false,
        },
      ];

      // Rest params are collected into an array and passed as single argument
      const fn = (nums: number[]) => nums.reduce((a, b) => a + b, 0);
      const preprocessed = compileArgsPreprocessing(params, fn, registry);

      expect(preprocessed(1, 2, 3)).toBe(6);
    });

    it('should handle conversions with rest parameters', () => {
      const params: Param[] = [
        {
          name: 'prefix',
          types: [{ name: 'string', conversion: null, test: undefined }],
          hasAny: false,
          restParam: false,
          hasConversion: false,
        },
        {
          name: '...nums',
          types: [
            { name: 'number', conversion: null, test: undefined },
            {
              name: 'number',
              conversion: {
                from: 'string',
                to: 'number',
                convert: (x: unknown) => parseInt(x as string, 10),
              },
              test: undefined,
            },
          ],
          hasAny: false,
          restParam: true,
          hasConversion: true,
        },
      ];

      const fn = (prefix: string, nums: number[]) => `${prefix}:${nums.join(',')}`;
      const preprocessed = compileArgsPreprocessing(params, fn, registry);

      expect(preprocessed('test', 1, 2)).toBe('test:1,2');
    });
  });

  describe('Integration tests', () => {
    it('should work with typed function conversions', () => {
      const typed = create();

      typed.addConversion({
        from: 'string',
        to: 'number',
        convert: (s: string) => parseFloat(s),
      });

      typed.addConversion({
        from: 'boolean',
        to: 'number',
        convert: (b: boolean) => (b ? 1 : 0),
      });

      const fn = typed('multi', {
        'number': (x: number) => x * 2,
      });

      expect(fn(21)).toBe(42);
      expect(fn('21')).toBe(42);
      expect(fn(true)).toBe(2);
    });

    it('should work with rest parameters and conversions', () => {
      const typed = create();

      typed.addConversion({
        from: 'string',
        to: 'number',
        convert: (s: string) => parseFloat(s),
      });

      // Rest params receive the collected array as a single parameter
      const fn = typed('sum', {
        '...number': (nums: number[]) => nums.reduce((a, b) => a + b, 0),
      });

      expect(fn(1, 2, 3)).toBe(6);
      expect(fn('1', '2', '3')).toBe(6);
    });
  });
});
