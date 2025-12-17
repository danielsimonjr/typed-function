/**
 * Tests for bundler compatibility features
 *
 * These tests verify that typed-function works correctly when classes
 * are compiled by bundlers like esbuild, webpack, or rollup.
 *
 * @see docs/TYPED_FUNCTION_IMPROVEMENTS.md
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import typed from '../src/index.js';
import {
  TYPE_SYMBOL,
  BRAND_SYMBOL,
  registerConstructor,
  unregisterConstructor,
  getTypeByConstructor,
  isRegisteredType,
  registerInstance,
  isRegisteredInstance,
  clearInstanceRegistry,
  clearAllInstanceRegistries,
  getTypeFromSymbol,
  getBrandFromSymbol,
  createBundlerSafeTest,
  createTypedClass,
  addTypeIdentification,
  identifyType,
} from '../src/core/bundler-compat.js';

describe('Bundler Compatibility', () => {
  let typedInstance: typeof typed;

  beforeEach(() => {
    typedInstance = typed.create();
  });

  describe('TYPE_SYMBOL', () => {
    it('should be a well-known symbol', () => {
      expect(typeof TYPE_SYMBOL).toBe('symbol');
      expect(Symbol.keyFor(TYPE_SYMBOL)).toBe('typed-function:type');
    });

    it('should allow classes to identify themselves', () => {
      class DenseMatrix {
        [TYPE_SYMBOL] = 'DenseMatrix';
        data: number[][];

        constructor(data: number[][]) {
          this.data = data;
        }
      }

      const m = new DenseMatrix([[1, 2], [3, 4]]);
      expect((m as unknown as Record<symbol, unknown>)[TYPE_SYMBOL]).toBe('DenseMatrix');
    });

    it('should work with typed-function type tests', () => {
      class Complex {
        [TYPE_SYMBOL] = 'Complex';
        re: number;
        im: number;

        constructor(re: number, im: number) {
          this.re = re;
          this.im = im;
        }
      }

      typedInstance.addType({
        name: 'Complex',
        test: (x: unknown) => {
          return x !== null && typeof x === 'object' &&
            (x as Record<symbol, unknown>)[TYPE_SYMBOL] === 'Complex';
        },
      });

      const add = typedInstance({
        'Complex, Complex': (a: Complex, b: Complex) => new Complex(a.re + b.re, a.im + b.im),
      });

      const c1 = new Complex(1, 2);
      const c2 = new Complex(3, 4);
      const result = add(c1, c2) as Complex;

      expect(result.re).toBe(4);
      expect(result.im).toBe(6);
    });
  });

  describe('BRAND_SYMBOL', () => {
    it('should be a well-known symbol', () => {
      expect(typeof BRAND_SYMBOL).toBe('symbol');
      expect(Symbol.keyFor(BRAND_SYMBOL)).toBe('typed-function:brand');
    });

    it('should work for branded types', () => {
      class PositiveNumber {
        [BRAND_SYMBOL] = 'PositiveNumber' as const;
        value: number;

        constructor(value: number) {
          if (value <= 0) throw new Error('Must be positive');
          this.value = value;
        }
      }

      const p = new PositiveNumber(5);
      expect((p as unknown as Record<symbol, unknown>)[BRAND_SYMBOL]).toBe('PositiveNumber');
    });
  });

  describe('Constructor Registry', () => {
    class TestClass {
      value: number;
      constructor(value: number) {
        this.value = value;
      }
    }

    afterEach(() => {
      unregisterConstructor(TestClass);
    });

    it('should register and retrieve constructors', () => {
      registerConstructor(TestClass, 'TestClass');
      expect(getTypeByConstructor(TestClass)).toBe('TestClass');
    });

    it('should return undefined for unregistered constructors', () => {
      expect(getTypeByConstructor(TestClass)).toBeUndefined();
    });

    it('should unregister constructors', () => {
      registerConstructor(TestClass, 'TestClass');
      expect(unregisterConstructor(TestClass)).toBe(true);
      expect(getTypeByConstructor(TestClass)).toBeUndefined();
    });

    it('should return false when unregistering non-existent constructor', () => {
      expect(unregisterConstructor(TestClass)).toBe(false);
    });

    it('should identify instances by registered constructor', () => {
      registerConstructor(TestClass, 'TestClass');
      const instance = new TestClass(42);
      expect(isRegisteredType(instance, 'TestClass')).toBe(true);
      expect(isRegisteredType(instance, 'OtherType')).toBe(false);
    });

    it('should handle null and undefined', () => {
      expect(getTypeByConstructor(null)).toBeUndefined();
      expect(getTypeByConstructor(undefined)).toBeUndefined();
      expect(isRegisteredType(null, 'TestClass')).toBe(false);
      expect(isRegisteredType(undefined, 'TestClass')).toBe(false);
    });
  });

  describe('Instance Registry (WeakSet)', () => {
    class Matrix {
      data: number[][];
      constructor(data: number[][]) {
        this.data = data;
        registerInstance(this, 'Matrix');
      }
    }

    afterEach(() => {
      clearInstanceRegistry('Matrix');
    });

    it('should register and identify instances', () => {
      const m = new Matrix([[1, 2]]);
      expect(isRegisteredInstance(m, 'Matrix')).toBe(true);
    });

    it('should not identify unregistered instances', () => {
      const obj = { data: [[1, 2]] };
      expect(isRegisteredInstance(obj, 'Matrix')).toBe(false);
    });

    it('should clear instance registry', () => {
      const m = new Matrix([[1, 2]]);
      expect(isRegisteredInstance(m, 'Matrix')).toBe(true);
      clearInstanceRegistry('Matrix');
      expect(isRegisteredInstance(m, 'Matrix')).toBe(false);
    });

    it('should clear all instance registries', () => {
      const m = new Matrix([[1, 2]]);
      registerInstance({} as object, 'OtherType');
      clearAllInstanceRegistries();
      expect(isRegisteredInstance(m, 'Matrix')).toBe(false);
    });

    it('should handle null and undefined', () => {
      expect(isRegisteredInstance(null, 'Matrix')).toBe(false);
      expect(isRegisteredInstance(undefined, 'Matrix')).toBe(false);
    });
  });

  describe('getTypeFromSymbol / getBrandFromSymbol', () => {
    it('should extract type from TYPE_SYMBOL', () => {
      const obj = { [TYPE_SYMBOL]: 'MyType' };
      expect(getTypeFromSymbol(obj)).toBe('MyType');
    });

    it('should extract brand from BRAND_SYMBOL', () => {
      const obj = { [BRAND_SYMBOL]: 'MyBrand' };
      expect(getBrandFromSymbol(obj)).toBe('MyBrand');
    });

    it('should return undefined for non-string values', () => {
      const obj1 = { [TYPE_SYMBOL]: 123 };
      const obj2 = { [BRAND_SYMBOL]: null };
      expect(getTypeFromSymbol(obj1)).toBeUndefined();
      expect(getBrandFromSymbol(obj2)).toBeUndefined();
    });

    it('should handle null/undefined/primitives', () => {
      expect(getTypeFromSymbol(null)).toBeUndefined();
      expect(getTypeFromSymbol(undefined)).toBeUndefined();
      expect(getTypeFromSymbol(42)).toBeUndefined();
      expect(getTypeFromSymbol('string')).toBeUndefined();
    });
  });

  describe('createBundlerSafeTest', () => {
    class SafeMatrix {
      [TYPE_SYMBOL] = 'SafeMatrix';
      data: number[][];

      constructor(data: number[][]) {
        this.data = data;
        registerInstance(this, 'SafeMatrix');
      }
    }

    beforeEach(() => {
      registerConstructor(SafeMatrix, 'SafeMatrix');
    });

    afterEach(() => {
      unregisterConstructor(SafeMatrix);
      clearInstanceRegistry('SafeMatrix');
    });

    it('should identify by TYPE_SYMBOL', () => {
      const test = createBundlerSafeTest('SafeMatrix');
      const m = new SafeMatrix([[1]]);
      expect(test(m)).toBe(true);
    });

    it('should identify by constructor registry', () => {
      const test = createBundlerSafeTest('SafeMatrix', { checkSymbols: false });
      const m = new SafeMatrix([[1]]);
      expect(test(m)).toBe(true);
    });

    it('should identify by instance registry', () => {
      const test = createBundlerSafeTest('SafeMatrix', {
        checkSymbols: false,
        checkConstructor: false,
      });
      const m = new SafeMatrix([[1]]);
      expect(test(m)).toBe(true);
    });

    it('should use fallback function', () => {
      const test = createBundlerSafeTest('UnknownType', {
        fallback: (x) => typeof x === 'object' && x !== null && 'specialProp' in x,
      });
      expect(test({ specialProp: true })).toBe(true);
      expect(test({ otherProp: true })).toBe(false);
    });

    it('should return false for null/undefined', () => {
      const test = createBundlerSafeTest('SafeMatrix');
      expect(test(null)).toBe(false);
      expect(test(undefined)).toBe(false);
    });
  });

  describe('createTypedClass', () => {
    it('should create a class with TYPE_SYMBOL', () => {
      const BaseClass = class {
        value: number;
        constructor(value: number) {
          this.value = value;
        }
      };

      const TypedClass = createTypedClass('TypedNumber', BaseClass);
      const instance = new TypedClass(42);

      expect((instance as unknown as Record<symbol, unknown>)[TYPE_SYMBOL]).toBe('TypedNumber');
      expect(instance.value).toBe(42);
    });

    it('should register the constructor', () => {
      const BaseClass = class {
        data: string;
        constructor(data: string) {
          this.data = data;
        }
      };

      const TypedClass = createTypedClass('TypedString', BaseClass);
      expect(getTypeByConstructor(TypedClass)).toBe('TypedString');

      // Cleanup
      unregisterConstructor(TypedClass);
    });

    it('should register instances', () => {
      const BaseClass = class {
        id: number;
        constructor(id: number) {
          this.id = id;
        }
      };

      const TypedClass = createTypedClass('TypedId', BaseClass);
      const instance = new TypedClass(1);

      expect(isRegisteredInstance(instance, 'TypedId')).toBe(true);

      // Cleanup
      unregisterConstructor(TypedClass);
      clearInstanceRegistry('TypedId');
    });
  });

  describe('addTypeIdentification', () => {
    it('should add TYPE_SYMBOL to existing class prototype', () => {
      class ExistingClass {
        value: number;
        constructor(value: number) {
          this.value = value;
        }
      }

      addTypeIdentification(ExistingClass, 'ExistingType');

      const instance = new ExistingClass(42);
      expect((instance as unknown as Record<symbol, unknown>)[TYPE_SYMBOL]).toBe('ExistingType');
      expect(getTypeByConstructor(ExistingClass)).toBe('ExistingType');

      // Cleanup
      unregisterConstructor(ExistingClass);
    });
  });

  describe('identifyType', () => {
    class IdentifiableClass {
      [TYPE_SYMBOL] = 'Identifiable';
    }

    beforeEach(() => {
      registerConstructor(IdentifiableClass, 'Identifiable');
    });

    afterEach(() => {
      unregisterConstructor(IdentifiableClass);
    });

    it('should identify by symbol', () => {
      const obj = new IdentifiableClass();
      const result = identifyType(obj);
      expect(result.typeName).toBe('Identifiable');
      expect(result.method).toBe('symbol');
    });

    it('should identify by brand', () => {
      const obj = { [BRAND_SYMBOL]: 'BrandedType' };
      const result = identifyType(obj);
      expect(result.typeName).toBe('BrandedType');
      expect(result.method).toBe('brand');
    });

    it('should identify by constructor', () => {
      class PlainClass {}
      registerConstructor(PlainClass, 'PlainType');

      const obj = new PlainClass();
      const result = identifyType(obj);
      expect(result.typeName).toBe('PlainType');
      expect(result.method).toBe('constructor');

      unregisterConstructor(PlainClass);
    });

    it('should return none for unidentifiable values', () => {
      // Use a plain object without any registration
      class UnregisteredClass {}
      const instance = new UnregisteredClass();
      const result = identifyType(instance);
      expect(result.typeName).toBeNull();
      expect(result.method).toBe('none');
    });

    it('should handle null and undefined', () => {
      expect(identifyType(null).method).toBe('none');
      expect(identifyType(undefined).method).toBe('none');
    });
  });

  describe('Integration with typed-function', () => {
    it('should work with typed.registerConstructor', () => {
      class Vector {
        values: number[];
        constructor(values: number[]) {
          this.values = values;
        }
      }

      typedInstance.registerConstructor(Vector, 'Vector');

      typedInstance.addType({
        name: 'Vector',
        test: (x) => isRegisteredType(x, 'Vector'),
        constructor: Vector,
      });

      const dot = typedInstance({
        'Vector, Vector': (a: Vector, b: Vector) => {
          return a.values.reduce((sum, v, i) => sum + v * (b.values[i] ?? 0), 0);
        },
      });

      const v1 = new Vector([1, 2, 3]);
      const v2 = new Vector([4, 5, 6]);
      expect(dot(v1, v2)).toBe(32);

      typedInstance.unregisterConstructor(Vector);
    });

    it('should work with typed.createBundlerSafeTest', () => {
      class Quaternion {
        [TYPE_SYMBOL] = 'Quaternion';
        w: number;
        x: number;
        y: number;
        z: number;

        constructor(w: number, x: number, y: number, z: number) {
          this.w = w;
          this.x = x;
          this.y = y;
          this.z = z;
        }
      }

      typedInstance.addType({
        name: 'Quaternion',
        test: typedInstance.createBundlerSafeTest('Quaternion', {
          fallback: (x) => {
            const q = x as Quaternion;
            return q !== null && typeof q === 'object' &&
              typeof q.w === 'number' && typeof q.x === 'number' &&
              typeof q.y === 'number' && typeof q.z === 'number';
          },
        }),
      });

      const conjugate = typedInstance({
        Quaternion: (q: Quaternion) => new Quaternion(q.w, -q.x, -q.y, -q.z),
      });

      const q = new Quaternion(1, 2, 3, 4);
      const result = conjugate(q) as Quaternion;

      expect(result.w).toBe(1);
      expect(result.x).toBe(-2);
      expect(result.y).toBe(-3);
      expect(result.z).toBe(-4);
    });
  });
});

describe('Configuration API', () => {
  let typedInstance: typeof typed;

  beforeEach(() => {
    typedInstance = typed.create();
  });

  describe('typed.config', () => {
    it('should set warnOnBigIntCoercion', () => {
      typedInstance.config({ warnOnBigIntCoercion: true });
      expect(typedInstance.getConfig().warnOnBigIntCoercion).toBe(true);
    });

    it('should set enableTypeCache', () => {
      typedInstance.config({ enableTypeCache: false });
      expect(typedInstance.getConfig().enableTypeCache).toBe(false);
    });

    it('should set bundlerSafeMode', () => {
      typedInstance.config({ bundlerSafeMode: false });
      expect(typedInstance.getConfig().bundlerSafeMode).toBe(false);
    });

    it('should set custom warnHandler', () => {
      const customHandler = vi.fn();
      typedInstance.config({ warnHandler: customHandler });
      expect(typedInstance.getConfig().warnHandler).toBe(customHandler);
    });

    it('should set maxWarnings', () => {
      typedInstance.config({ maxWarnings: 5 });
      expect(typedInstance.getConfig().maxWarnings).toBe(5);
    });

    it('should allow partial configuration updates', () => {
      typedInstance.config({ warnOnBigIntCoercion: true });
      typedInstance.config({ enableTypeCache: false });

      const config = typedInstance.getConfig();
      expect(config.warnOnBigIntCoercion).toBe(true);
      expect(config.enableTypeCache).toBe(false);
    });
  });

  describe('typed.getConfig', () => {
    it('should return a copy of the configuration', () => {
      const config1 = typedInstance.getConfig();
      const config2 = typedInstance.getConfig();
      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });

    it('should have default values', () => {
      const config = typedInstance.getConfig();
      expect(config.warnOnBigIntCoercion).toBe(false);
      expect(config.enableTypeCache).toBe(true);
      expect(config.bundlerSafeMode).toBe(true);
      expect(config.maxWarnings).toBe(10);
      expect(config.warningCount).toBe(0);
    });
  });
});

describe('Factory Function Pattern', () => {
  let typedInstance: typeof typed;

  beforeEach(() => {
    typedInstance = typed.create();
  });

  it('should accept factory function in type definition', () => {
    class Complex {
      re: number;
      im: number;
      constructor(re: number, im: number) {
        this.re = re;
        this.im = im;
      }
    }

    typedInstance.addType({
      name: 'Complex',
      test: (x): x is Complex => x instanceof Complex,
      factory: (re: number, im: number) => new Complex(re, im),
      constructor: Complex,
    });

    // Verify the type was registered
    expect(typedInstance._findType('Complex')).toBeDefined();
    expect(typedInstance._findType('Complex').factory).toBeDefined();
  });

  it('should store factory function in type registry', () => {
    class Fraction {
      num: number;
      den: number;
      constructor(num: number, den: number) {
        this.num = num;
        this.den = den;
      }
    }

    const factoryFn = (num: number, den: number) => new Fraction(num, den);

    typedInstance.addType({
      name: 'Fraction',
      test: (x): x is Fraction => x instanceof Fraction,
      factory: factoryFn,
    });

    const type = typedInstance._findType('Fraction');
    expect(type.factory).toBe(factoryFn);
  });
});
