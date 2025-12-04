/**
 * Errors tests ported from errors.test.mjs
 * Tests for error handling in typed functions
 */

import { describe, it, expect } from 'vitest';
import typed from '../src/index.js';

describe('errors (legacy)', () => {
  it('should give correct error in case of too few arguments (named function)', () => {
    const fn = typed('fn1', { 'string, boolean': function () {} });

    expect(() => fn()).toThrow(/Too few arguments in function fn1 \(expected: string, index: 0\)/);
    expect(() => fn('foo')).toThrow(/Too few arguments in function fn1 \(expected: boolean, index: 1\)/);
  });

  it('should give correct error in case of too few arguments (unnamed function)', () => {
    const fn = typed({ 'string, boolean': function () {} });

    expect(() => fn()).toThrow(/Too few arguments in function unnamed \(expected: string, index: 0\)/);
    expect(() => fn('foo')).toThrow(/Too few arguments in function unnamed \(expected: boolean, index: 1\)/);
  });

  it('should give correct error in case of too few arguments (rest params)', () => {
    const fn = typed({ '...string': function () {} });

    expect(() => fn()).toThrow(/Too few arguments in function unnamed \(expected: string, index: 0\)/);
  });

  it('should give correct error in case of too few arguments (rest params) (2)', () => {
    const fn = typed({ 'boolean, ...string': function () {} });

    expect(() => fn()).toThrow(/Too few arguments in function unnamed \(expected: boolean, index: 0\)/);
    expect(() => fn(true)).toThrow(/Too few arguments in function unnamed \(expected: string, index: 1\)/);
  });

  it('should give correct error in case of too many arguments (unnamed function)', () => {
    const fn = typed({ 'string, boolean': function () {} });

    expect(() => fn('foo', true, 2)).toThrow(/Too many arguments in function unnamed \(expected: 2, actual: 3\)/);
    expect(() => fn('foo', true, 2, 1)).toThrow(/Too many arguments in function unnamed \(expected: 2, actual: 4\)/);
  });

  it('should give correct error in case of too many arguments (named function)', () => {
    const fn = typed('fn2', { 'string, boolean': function () {} });

    expect(() => fn('foo', true, 2)).toThrow(/Too many arguments in function fn2 \(expected: 2, actual: 3\)/);
    expect(() => fn('foo', true, 2, 1)).toThrow(/Too many arguments in function fn2 \(expected: 2, actual: 4\)/);
  });

  it('should give correct error in case of wrong type of argument (unnamed function)', () => {
    const fn = typed({ boolean: function () {} });

    expect(() => fn('foo')).toThrow(
      /Unexpected type of argument in function unnamed \(expected: boolean, actual: string, index: 0\)/
    );
  });

  it('should give correct error in case of wrong type of argument (named function)', () => {
    const fn = typed('fn3', { boolean: function () {} });

    expect(() => fn('foo')).toThrow(
      /Unexpected type of argument in function fn3 \(expected: boolean, actual: string, index: 0\)/
    );
  });

  it('should give correct error in case of wrong type of argument (union args)', () => {
    const fn = typed({ 'boolean | string | Date': function () {} });

    expect(() => fn(2)).toThrow(
      /Unexpected type of argument in function unnamed \(expected: string or boolean or Date, actual: number, index: 0\)/
    );
  });

  it('should give correct error in case of conflicting union arguments', () => {
    expect(() => {
      typed({
        'string | number': function () {},
        string: function () {},
      });
    }).toThrow(/Conflicting signatures "string\|number" and "string"/);
  });

  it('should give correct error in case of conflicting union arguments (2)', () => {
    expect(() => {
      typed({
        '...string | number': function () {},
        '...string': function () {},
      });
    }).toThrow(/Conflicting signatures "...string\|number" and "...string"/);
  });

  it('should give correct error in case of conflicting rest params (1)', () => {
    expect(() => {
      typed({
        '...string': function () {},
        string: function () {},
      });
    }).toThrow(/Conflicting signatures "...string" and "string"/);
  });

  it('should give correct error in case of conflicting rest params (2)', () => {
    // should not throw
    typed({
      '...string': function () {},
      'string, number': function () {},
    });

    expect(() => {
      typed({
        '...string': function () {},
        'string, string': function () {},
      });
    }).toThrow(/Conflicting signatures "...string" and "string,string"/);
  });

  it('should give correct error in case of conflicting rest params (3)', () => {
    expect(() => {
      typed({
        '...number|string': function () {},
        'number, string': function () {},
      });
    }).toThrow(/Conflicting signatures "...number\|string" and "number,string"/);
  });

  it('should give correct error in case of wrong type of argument (rest params)', () => {
    const fn = typed({ '...number': function () {} });

    expect(() => fn(true)).toThrow(
      /Unexpected type of argument in function unnamed \(expected: number, actual: boolean, index: 0\)/
    );
    expect(() => fn(2, true)).toThrow(
      /Unexpected type of argument in function unnamed \(expected: number, actual: boolean, index: 1\)/
    );
    expect(() => fn(2, 3, true)).toThrow(
      /Unexpected type of argument in function unnamed \(expected: number, actual: boolean, index: 2\)/
    );
  });

  it('should give correct error in case of wrong type of argument (nested rest params)', () => {
    const fn = typed({ 'string, ...number': function () {} });

    expect(() => fn(true)).toThrow(
      /Unexpected type of argument in function unnamed \(expected: string, actual: boolean, index: 0\)/
    );
    expect(() => fn('foo', true)).toThrow(
      /Unexpected type of argument in function unnamed \(expected: number, actual: boolean, index: 1\)/
    );
    expect(() => fn('foo', 2, true)).toThrow(
      /Unexpected type of argument in function unnamed \(expected: number, actual: boolean, index: 2\)/
    );
    expect(() => fn('foo', 2, 3, true)).toThrow(
      /Unexpected type of argument in function unnamed \(expected: number, actual: boolean, index: 3\)/
    );
  });

  it('should give correct error in case of wrong type of argument (union and rest params)', () => {
    const fn = typed({ '...number|boolean': function () {} });

    expect(() => fn('foo')).toThrow(
      /Unexpected type of argument in function unnamed \(expected: number or boolean, actual: string, index: 0\)/
    );
    expect(() => fn(2, 'foo')).toThrow(
      /Unexpected type of argument in function unnamed \(expected: number or boolean, actual: string, index: 1\)/
    );
    expect(() => fn(2, true, 'foo')).toThrow(
      /Unexpected type of argument in function unnamed \(expected: number or boolean, actual: string, index: 2\)/
    );
  });

  it('should only list matches of exact and convertable types', () => {
    const typed2 = typed.create();
    typed2.addConversion({
      from: 'number',
      to: 'string',
      convert: function (x: number) {
        return +x;
      },
    });

    const fn1 = typed2({ string: function () {} });
    const fn2 = typed2({ '...string': function () {} });

    expect(() => fn1(true)).toThrow(
      /Unexpected type of argument in function unnamed \(expected: string or number, actual: boolean, index: 0\)/
    );
    expect(() => fn2(true)).toThrow(
      /Unexpected type of argument in function unnamed \(expected: string or number, actual: boolean, index: 0\)/
    );
    expect(() => fn2(2, true)).toThrow(
      /Unexpected type of argument in function unnamed \(expected: string or number, actual: boolean, index: 1\)/
    );
  });
});
