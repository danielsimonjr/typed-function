/**
 * Find tests ported from find.test.mjs
 * Tests for typed.find() and typed.findSignature() functionality
 */

import { describe, it, expect } from 'vitest';
import typed from '../src/index.js';

describe('find (legacy)', () => {
  function a() {}
  function b() {}
  function c() {}
  function d() {}
  function e() {}

  const fn = typed('fn', {
    number: a,
    'string, ...number': b,
    'number, boolean': c,
    any: d,
    '': e,
  });

  const EXACT = { exact: true };

  it('should findSignature from an array with types', () => {
    expect(typed.findSignature(fn, ['number']).fn).toBe(a);
    expect(typed.findSignature(fn, ['number', 'boolean']).fn).toBe(c);
    expect(typed.findSignature(fn, ['any']).fn).toBe(d);
    expect(typed.findSignature(fn, []).fn).toBe(e);
  });

  it('should find a signature from an array with types', () => {
    expect(typed.find(fn, ['number'])).toBe(a);
    expect(typed.find(fn, ['number', 'boolean'])).toBe(c);
    expect(typed.find(fn, ['any'])).toBe(d);
    expect(typed.find(fn, [])).toBe(e);
  });

  it('should findSignature from a comma separated string with types', () => {
    expect(typed.findSignature(fn, 'number').fn).toBe(a);
    expect(typed.findSignature(fn, 'number,boolean').fn).toBe(c);
    expect(typed.findSignature(fn, ' number, boolean ').fn).toBe(c); // with spaces
    expect(typed.findSignature(fn, 'any').fn).toBe(d);
    expect(typed.findSignature(fn, '').fn).toBe(e);
  });

  it('should find a signature from a comma separated string with types', () => {
    expect(typed.find(fn, 'number')).toBe(a);
    expect(typed.find(fn, 'number,boolean')).toBe(c);
    expect(typed.find(fn, ' number, boolean ')).toBe(c); // with spaces
    expect(typed.find(fn, 'any')).toBe(d);
    expect(typed.find(fn, '')).toBe(e);
  });

  it('should match rest params properly', () => {
    expect(typed.findSignature(fn, 'string, number').fn).toBe(b);
    expect(typed.findSignature(fn, 'string, number, number').fn).toBe(b);
    expect(typed.findSignature(fn, 'string, number, ...number').fn).toBe(b);
  });

  it('should match any params properly', () => {
    expect(typed.find(fn, 'Array')).toBe(d);
    expect(() => typed.find(fn, 'string, ...any')).toThrow(/Signature not found/);
    const fn2 = typed({ '...any': e });
    expect(typed.findSignature(fn2, '...number|string').fn).toBe(e);
  });

  it('should throw an error when not found', () => {
    expect(() => {
      typed.find(fn, 'number, number');
    }).toThrow(/Signature not found \(signature: fn\(number, number\)\)/);
  });

  it('should handle non-exact matches as requested', () => {
    const t2 = typed.create();
    t2.addConversion({
      from: 'number',
      to: 'string',
      convert: (n: number) => '' + n + ' much',
    });
    const greeting = (s: string) => 'Hi ' + s;
    const greet = t2('greet', { string: greeting });
    const greetNumberSignature = t2.findSignature(greet, 'number');
    const greetNumber = t2.find(greet, 'number');
    expect(greetNumberSignature.fn).toBe(greeting);
    expect(greetNumber(42)).toBe('Hi 42 much');
    expect(() => t2.findSignature(greet, 'number', EXACT)).toThrow(/Signature not found/);
    expect(() => t2.find(greet, 'number', EXACT)).toThrow(TypeError);
    expect(t2.find(greet, 'string')).toBe(greeting);
  });

  it('should handle non-exact rest parameter matches', () => {
    const t2 = typed.create();
    t2.addConversion({
      from: 'number',
      to: 'string',
      convert: (n: number) => '' + n + ' much',
    });
    const greetAll = (A: string[]) => 'Hi ' + A.join(' and ');
    const greetRest = t2('greet', { '...string': greetAll });
    const greetNumberSignature = t2.findSignature(greetRest, 'number');
    expect(greetNumberSignature.fn).toBe(greetAll);
    expect(greetNumberSignature.implementation.apply(null, [2])).toBe('Hi 2 much');
    expect(() => t2.find(greetRest, 'number', EXACT)).toThrow(/Signature not found/);
    const greetSN = t2.findSignature(greetRest, 'string,number');
    expect(greetSN.fn).toBe(greetAll);
    expect(greetSN.implementation.apply(null, ['JJ', 2])).toBe('Hi JJ and 2 much');
    expect(() => t2.find(greetRest, 'string,number', EXACT)).toThrow(/Signature not found/);
    const greetNRNS = t2.findSignature(greetRest, 'number,...number|string');
    expect(greetNRNS.fn).toBe(greetAll);
    expect(greetNRNS.implementation.apply(null, [0, 'JJ', 2])).toBe('Hi 0 much and JJ and 2 much');
    expect(() => t2.find(greetRest, 'number,...number|string', EXACT)).toThrow(/Signature not found/);
  });
});
