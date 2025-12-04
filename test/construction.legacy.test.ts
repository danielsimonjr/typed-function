/**
 * Construction tests ported from construction.test.mjs
 * Tests for creating and constructing typed functions
 */

import { describe, it, expect } from 'vitest';
import typed from '../src/index.js';

describe('construction (legacy)', () => {
  it('should throw an error when not providing any arguments', () => {
    expect(() => {
      (typed as unknown as () => unknown)();
    }).toThrow(/not a \(typed\) function.*nor an object with signatures/);
  });

  it('should throw an error when not providing any signatures', () => {
    expect(() => {
      typed({});
    }).toThrow(/Argument.*0.*not/);
  });

  it('should create a named function', () => {
    const fn = typed('myFunction', {
      string: function (_str: string) {
        return 'foo';
      },
    });

    expect(fn('bar')).toBe('foo');
    expect(fn.name).toBe('myFunction');
  });

  it('should create a typed function from a regular function with a signature', () => {
    function myFunction(_str: string) {
      return 'foo';
    }
    (myFunction as unknown as { signature: string }).signature = 'string';

    const fn = typed(myFunction as unknown as Parameters<typeof typed>[0]);

    expect(fn('bar')).toBe('foo');
    expect(fn.name).toBe('myFunction');
    expect(Object.keys(fn.signatures)).toEqual(['string']);
  });

  it('should create an unnamed function', () => {
    const fn = typed({
      string: function (_str: string) {
        return 'foo';
      },
    });

    expect(fn('bar')).toBe('foo');
    expect(fn.name).toBe('');
  });

  it('should inherit the name of typed functions', () => {
    const fn = typed({
      string: typed('fn1', {
        string: function (_str: string) {
          return 'foo';
        },
      }),
    });

    expect(fn('bar')).toBe('foo');
    expect(fn.name).toBe('fn1');
  });

  it('should not inherit the name of the JavaScript functions (only from typed functions)', () => {
    const fn = typed({
      string: function fn1(_str: string) {
        return 'foo';
      },
    });

    expect(fn('bar')).toBe('foo');
    expect(fn.name).toBe('');
  });

  it('should throw if attempting to construct from other types', () => {
    expect(() => typed(1 as unknown as Parameters<typeof typed>[0])).toThrow(TypeError);
    expect(() => typed('myfunc', 'implementation' as unknown as Record<string, unknown>)).toThrow(TypeError);
  });

  it('should compose a function with zero arguments', () => {
    const signatures = {
      '': function () {
        return 'noargs';
      },
    };
    const fn = typed(signatures);

    expect(fn()).toBe('noargs');
    expect(fn.signatures).toBeInstanceOf(Object);
    expect(Object.keys(fn.signatures).length).toBe(1);
    expect(fn.signatures['']).toBe(signatures['']);
  });

  it('should create a typed function with one argument', () => {
    const fn = typed({
      string: function () {
        return 'string';
      },
    });

    expect(fn('hi')).toBe('string');
  });

  it('should ignore whitespace when creating a typed function with one argument', () => {
    const fn = typed({ ' ... string ': (_a: string[]) => 'string' });
    expect(fn('hi')).toBe('string');
  });

  it('should create a typed function with two arguments', () => {
    const fn = typed({
      'string, boolean': function () {
        return 'foo';
      },
    });

    expect(fn('hi', true)).toBe('foo');
  });

  it('should create a named, typed function', () => {
    const fn = typed('myFunction', {
      'string, boolean': function () {
        return 'noargs';
      },
    });

    expect(fn('hi', true)).toBe('noargs');
    expect(fn.name).toBe('myFunction');
  });

  it('should correctly recognize Date from Object (both are an Object)', () => {
    const signatures = {
      Object: function (value: object) {
        expect(value).toBeInstanceOf(Object);
        return 'Object';
      },
      Date: function (value: Date) {
        expect(value).toBeInstanceOf(Date);
        return 'Date';
      },
    };
    const fn = typed(signatures);

    expect(fn({ foo: 'bar' })).toBe('Object');
    expect(fn(new Date())).toBe('Date');
  });

  it('should correctly handle null', () => {
    const fn = typed({
      Object: function (_a: object) {
        return 'Object';
      },
      null: function (_a: null) {
        return 'null';
      },
      undefined: function (_a: undefined) {
        return 'undefined';
      },
    });

    expect(fn({})).toBe('Object');
    expect(fn(null)).toBe('null');
    expect(fn(undefined)).toBe('undefined');
  });

  it('should throw correct error message when passing null from an Object', () => {
    const signatures = {
      Object: function (value: object) {
        expect(value).toBeInstanceOf(Object);
        return 'Object';
      },
    };
    const fn = typed(signatures);

    expect(fn({})).toBe('Object');
    expect(() => fn(null)).toThrow(
      /Unexpected type of argument in function unnamed \(expected: Object, actual: null, index: 0\)/
    );
  });

  it('should create a new, isolated instance of typed-function', () => {
    const typed1 = typed.create();
    const typed2 = typed.create();
    class Person {}

    typed1.addType({
      name: 'Person',
      test: function (x: unknown) {
        return x instanceof Person;
      },
    });

    expect(typed.create).toBe(typed1.create);
    expect(typed.addTypes).not.toBe(typed1.addTypes);
    expect(typed.addConversion).not.toBe(typed1.addConversion);

    expect(typed.create).toBe(typed2.create);
    expect(typed.addTypes).not.toBe(typed2.addTypes);
    expect(typed.addConversion).not.toBe(typed2.addConversion);

    expect(typed1.create).toBe(typed2.create);
    expect(typed1.addTypes).not.toBe(typed2.addTypes);
    expect(typed1.addConversion).not.toBe(typed2.addConversion);

    typed1({
      Person: function (_p: Person) {
        return 'Person';
      },
    });

    expect(() => {
      typed2({
        Person: function (_p: unknown) {
          return 'Person';
        },
      });
    }).toThrow(/Unknown type "Person"/);
  });

  it('should add a type using addType (before object)', () => {
    const typed2 = typed.create();
    class Person {}

    const newType = {
      name: 'Person',
      test: function (x: unknown) {
        return x instanceof Person;
      },
    };

    const objectIndex = typed2._findType('Object').index;
    typed2.addType(newType);
    expect(typed2._findType('Person').index).toBe(objectIndex);
  });

  it('should add a type using addType at the end (after Object)', () => {
    const typed2 = typed.create();
    class Person {}

    const newType = {
      name: 'Person',
      test: function (x: unknown) {
        return x instanceof Person;
      },
    };

    typed2.addType(newType, false);

    expect(typed2._findType('Person').index).toBe(typed2._findType('any').index - 1);
  });

  it('should add a type using addType (no object)', () => {
    const typed3 = typed.create();
    typed3.clear();
    // After clear(), registry is truly empty. Add a type manually.
    typed3.addType({ name: 'number', test: (n: unknown) => typeof n === 'number' });
    expect(typed3._findType('number').index).toBe(0);
  });

  it('should throw an error when passing an invalid type to addType', () => {
    const typed2 = typed.create();
    const errMsg = /Object with properties \{name: string, test: function\} expected/;

    expect(() => typed2.addType({} as Parameters<typeof typed2.addType>[0])).toThrow(errMsg);
    expect(() => typed2.addType({ name: 2, test: function () {} } as unknown as Parameters<typeof typed2.addType>[0])).toThrow(errMsg);
    expect(() => typed2.addType({ name: 'foo', test: 'bar' } as unknown as Parameters<typeof typed2.addType>[0])).toThrow(errMsg);
  });

  it('should throw an error when providing an unsupported type of argument', () => {
    const fn = typed('fn1', {
      number: function (value: number) {
        return 'number:' + value;
      },
    });

    expect(() => fn(new Date())).toThrow(
      /Unexpected type of argument in function fn1 \(expected: number, actual: Date, index: 0\)/
    );
  });

  it('should throw an error when providing a wrong function signature', () => {
    const fn = typed('fn1', {
      number: function (value: number) {
        return 'number:' + value;
      },
    });

    expect(() => fn(1, 2)).toThrow(/Too many arguments in function fn1 \(expected: 1, actual: 2\)/);
  });

  it('should throw an error when composing with an unknown type', () => {
    expect(() => {
      typed({
        foo: function (value: unknown) {
          return 'number:' + value;
        },
      });
    }).toThrow(/Unknown type "foo"/);
  });

  it('should give a hint when composing with a wrongly cased type', () => {
    expect(() => {
      typed({
        array: function (value: unknown) {
          return 'array:' + value;
        },
      });
    }).toThrow(/Unknown type "array". Did you mean "Array"\?/);

    expect(() => {
      typed({
        function: function (value: unknown) {
          return 'Function:' + value;
        },
      });
    }).toThrow(/Unknown type "function". Did you mean "Function"\?/);
  });

  it('should attach signatures to the created typed-function', () => {
    const fn1 = function () {};
    const fn2 = function () {};
    const fn3 = function () {};
    const fn4 = function () {};

    const fn = typed({
      string: fn1,
      'string, boolean': fn2,
      'number | Date, boolean': fn3,
      'Array | Object, string | RegExp': fn3,
      'number, ...string | number': fn4,
    });

    expect(fn.signatures).toEqual({
      string: fn1,
      'string,boolean': fn2,
      'number,boolean': fn3,
      'Date,boolean': fn3,
      'Array,string': fn3,
      'Array,RegExp': fn3,
      'Object,string': fn3,
      'Object,RegExp': fn3,
      'number,...string|number': fn4,
    });
  });

  it('should correctly order signatures', () => {
    const t2 = typed.create();
    t2.clear();
    t2.addTypes([
      { name: 'foo', test: (x: unknown) => (x as number[])[0] === 1 },
      { name: 'bar', test: (x: unknown) => (x as number[])[1] === 1 },
      { name: 'baz', test: (x: unknown) => (x as number[])[2] === 1 },
    ]);
    const fn = t2({
      baz: (_a: unknown) => 'isbaz',
      bar: (_a: unknown) => 'isbar',
      foo: (_a: unknown) => 'isfoo',
    });

    expect(fn([1, 1, 1])).toBe('isfoo');
    expect(fn([0, 1, 1])).toBe('isbar');
    expect(fn([0, 0, 1])).toBe('isbaz');
  });

  it('should increment the count of typed functions', () => {
    const saveCount = typed.createCount;
    typed({ number: () => true });
    expect(typed.createCount - saveCount).toBe(1);
  });

  it('should allow a function refer to itself', () => {
    const fn = typed({
      number: function (value: number) {
        return 'number:' + value;
      },
      string: typed.referToSelf((self) => {
        return function (value: string) {
          expect(self).toBe(fn);
          return self(parseInt(value, 10));
        };
      }),
    });

    expect(fn('2')).toBe('number:2');
  });

  it('should allow to resolve multiple function signatures with referTo', () => {
    const fnNumber = function (value: number) {
      return 'number:' + value;
    };

    const fnBoolean = function (value: boolean) {
      return 'boolean:' + value;
    };

    const fn = typed({
      number: fnNumber,
      boolean: fnBoolean,
      string: typed.referTo('number', 'boolean', (fnNumberResolved, fnBooleanResolved) => {
        expect(fnNumberResolved).toBe(fnNumber);
        expect(fnBooleanResolved).toBe(fnBoolean);

        return function fnString(value: string) {
          return fnNumberResolved(parseInt(value, 10));
        };
      }),
    });

    expect(fn('2')).toBe('number:2');
  });

  it('should resolve referTo signatures on the resolved signatures, not exact matches', () => {
    const fnNumberOrBoolean = function (value: number | boolean) {
      return 'number or boolean:' + value;
    };

    const fn = typed({
      'number|boolean': fnNumberOrBoolean,
      string: typed.referTo('number', (fnNumberResolved) => {
        expect(fnNumberResolved).toBe(fnNumberOrBoolean);

        return function fnString(value: string) {
          return fnNumberResolved(parseInt(value, 10));
        };
      }),
    });

    expect(fn('2')).toBe('number or boolean:2');
  });

  it('should throw an exception when a signature is not found with referTo', () => {
    expect(() => {
      typed({
        string: typed.referTo('number', (fnNumberResolved) => {
          return function fnString(value: string) {
            return fnNumberResolved(parseInt(value, 10));
          };
        }),
      });
    }).toThrow(/reference.*signature "number"/);
  });

  it('should allow forward references with referTo', () => {
    const forward = typed({
      string: typed.referTo('number', (fnNumberResolved) => {
        return function fnString(value: string) {
          return fnNumberResolved(parseInt(value, 10));
        };
      }),
      // Forward reference: we define `number` after we use it in `string`
      number: typed.referTo(() => {
        return (value: number) => 'number:' + value;
      }),
    });
    expect(forward('10')).toBe('number:10');
  });

  it('should throw an exception in case of circular referTo', () => {
    expect(() => {
      typed({
        string: typed.referTo('number', (fN) => (s: string) => fN(s.length)),
        number: typed.referTo('string', (fS) => (n: number) => fS(n.toString())),
      });
    }).toThrow(SyntaxError);
  });

  it('should throw with circular referTo and direct referToSelf', () => {
    expect(() => {
      typed({
        boolean: typed.referToSelf((self) => (b: boolean) => (b ? self(1) : self('false'))),
        string: typed.referTo('number', (fN) => (s: string) => fN(s.length)),
        number: typed.referTo('string', (fS) => (n: number) => fS(n.toString())),
      });
    }).toThrow(SyntaxError);
  });

  it('should throw an exception when a signature in referTo is not a string', () => {
    expect(() => {
      typed.referTo(123 as unknown as string, () => {});
    }).toThrow(/Signatures must be strings/);

    expect(() => {
      typed.referTo('number', 123 as unknown as string, () => {});
    }).toThrow(/Signatures must be strings/);
  });

  it('should throw an exception when the last argument of referTo is not a callback function', () => {
    expect(() => {
      typed.referTo('number');
    }).toThrow(/Callback function expected as last argument/);
  });

  it('should throw an exception when the first argument of referToSelf is not a callback function', () => {
    expect(() => {
      typed.referToSelf(123 as unknown as Parameters<typeof typed.referToSelf>[0]);
    }).toThrow(/Callback function expected as first argument/);
  });

  it('should have correct context `this` when resolving reference function signatures', function () {
    // to make this work, in all functions we must use regular functions and no arrow functions,
    // and we need to use .call or .apply, passing the `this` context along
    const fnNumber = function (this: { value?: number } | undefined, value: number) {
      return 'number:' + value + ', this.value:' + (this && this.value);
    };

    const fn = typed({
      number: typed.referTo(function () {
        // created as a "reference" function just for the unit test...
        return fnNumber;
      }),
      string: typed.referTo('number', function (fnNumberResolved) {
        expect(fnNumberResolved).toBe(fnNumber);

        return function fnString(this: { value?: number } | undefined, value: string) {
          return fnNumberResolved.call(this, parseInt(value, 10));
        };
      }),
    });

    expect(fn('2')).toBe('number:2, this.value:undefined');

    // verify the reference function has the right context
    const obj = {
      value: 42,
      fn,
    };
    expect(obj.fn('2')).toBe('number:2, this.value:42');
  });

  it('should pass this function context', () => {
    const getProperty = typed({
      string: function (this: Record<string, unknown> | undefined, key: string) {
        return this && this[key];
      },
    });

    expect(getProperty('value')).toBe(undefined);

    const obj = {
      value: 42,
      getProperty,
    };

    expect(obj.getProperty('value')).toBe(42);

    const boundGetProperty = getProperty.bind({ otherValue: 123 });
    expect(boundGetProperty('otherValue')).toBe(123);
  });

  it('should throw a deprecation warning when self reference via `this(...)` is used', () => {
    expect(() => {
      typed({
        number: function (value: number) {
          return value * value;
        },
        string: function (this: (arg: number) => number, value: string) {
          return this(parseFloat(value));
        },
      });
    }).toThrow(
      /Using `this` to self-reference a function is deprecated since typed-function@3\. Use typed\.referTo and typed\.referToSelf instead\./
    );
  });

  it('should not throw a deprecation warning on `this(...)` when the warning is turned off', () => {
    const typed2 = typed.create();
    typed2.warnAgainstDeprecatedThis = false;

    const deprecatedSquare = typed2({
      number: function (value: number) {
        return value * value;
      },
      string: function (this: (arg: number) => number, value: string) {
        return this(parseFloat(value));
      },
    });

    expect(deprecatedSquare(3)).toBe(9);

    expect(() => {
      deprecatedSquare('3');
    }).toThrow(/this is not a function/);
  });

  it('should throw a deprecation warning when self reference via `this.signatures` is used', () => {
    expect(() => {
      typed({
        number: function (value: number) {
          return value * value;
        },
        string: function (this: { signatures: { number: (arg: number) => number } }, value: string) {
          return this.signatures.number(parseFloat(value));
        },
      });
    }).toThrow(
      /Using `this` to self-reference a function is deprecated since typed-function@3\. Use typed\.referTo and typed\.referToSelf instead\./
    );
  });
});
