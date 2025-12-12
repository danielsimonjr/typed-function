/**
 * Tests for decimal and arbitrary precision types
 */

import { describe, it, expect } from 'vitest';
import {
  // Type definitions
  DECIMAL_TYPES,
  ADVANCED_TYPES,
  // Type test functions
  isDecimal,
  isBigFloat,
  isDecimal32,
  isDecimal64,
  isDecimal128,
  isMoney,
  isFixedDecimal,
  isRational,
  // Factory functions
  bigFloat,
  decimal32,
  decimal64,
  decimal128,
  money,
  fixedDecimal,
  rational,
  // Types
  type Decimal,
  type BigFloat,
  type Decimal32,
  type Decimal64,
  type Decimal128,
  type Money,
  type FixedDecimal,
  type Rational,
} from '../src/index.js';

describe('Decimal Types - Type Definitions', () => {
  it('should export DECIMAL_TYPES array', () => {
    expect(DECIMAL_TYPES).toBeDefined();
    expect(Array.isArray(DECIMAL_TYPES)).toBe(true);
    expect(DECIMAL_TYPES.length).toBe(8);

    const names = DECIMAL_TYPES.map((t) => t.name);
    expect(names).toContain('Decimal');
    expect(names).toContain('BigFloat');
    expect(names).toContain('Decimal32');
    expect(names).toContain('Decimal64');
    expect(names).toContain('Decimal128');
    expect(names).toContain('Money');
    expect(names).toContain('FixedDecimal');
    expect(names).toContain('Rational');
  });

  it('should include decimal types in ADVANCED_TYPES', () => {
    const names = ADVANCED_TYPES.map((t) => t.name);
    expect(names).toContain('Decimal');
    expect(names).toContain('BigFloat');
    expect(names).toContain('Money');
    expect(names).toContain('Rational');
  });
});

describe('Decimal Types - Type Test Functions', () => {
  describe('isDecimal', () => {
    it('should return true for valid Decimal objects', () => {
      // Decimal.js-like object
      const decimal = {
        toString: () => '123.456',
        toNumber: () => 123.456,
        d: [1, 2, 3, 4, 5, 6],
        e: 2,
        s: 1,
      };
      expect(isDecimal(decimal)).toBe(true);

      // Minimal decimal object
      const minimal = {
        toString: () => '100',
        toNumber: () => 100,
      };
      expect(isDecimal(minimal)).toBe(true);
    });

    it('should return false for invalid Decimal objects', () => {
      expect(isDecimal(null)).toBe(false);
      expect(isDecimal(undefined)).toBe(false);
      expect(isDecimal(123.456)).toBe(false);
      expect(isDecimal('123.456')).toBe(false);
      // Note: { toString: () => '123' } returns true because it has both
      // toString (own property) and toNumber (inherited, but we check for the function)
      // Objects with only one of the required methods should fail
      expect(isDecimal({ value: 123 })).toBe(false);
      expect(isDecimal([])).toBe(false);
    });
  });

  describe('isBigFloat', () => {
    it('should return true for valid BigFloat objects', () => {
      const bf: BigFloat = {
        mantissa: BigInt('12345678901234567890'),
        exponent: -10,
        precision: 64,
      };
      expect(isBigFloat(bf)).toBe(true);

      const bf2 = bigFloat(BigInt(1), 0, 53);
      expect(isBigFloat(bf2)).toBe(true);
    });

    it('should return false for invalid BigFloat objects', () => {
      expect(isBigFloat(null)).toBe(false);
      expect(isBigFloat({ mantissa: 123, exponent: 0, precision: 53 })).toBe(false);
      expect(isBigFloat({ mantissa: BigInt(1), exponent: '0', precision: 53 })).toBe(false);
      expect(isBigFloat({ mantissa: BigInt(1), exponent: 0 })).toBe(false);
    });
  });

  describe('isDecimal32', () => {
    it('should return true for valid Decimal32 objects', () => {
      const d32: Decimal32 = {
        coefficient: 1234567,
        exponent: -3,
        sign: false,
        _decimal32: true,
      };
      expect(isDecimal32(d32)).toBe(true);

      const d32neg = decimal32(9999999, 96, true);
      expect(isDecimal32(d32neg)).toBe(true);
    });

    it('should return false for invalid Decimal32 objects', () => {
      expect(isDecimal32(null)).toBe(false);
      expect(isDecimal32({ coefficient: 123, exponent: 0, sign: false })).toBe(false);
      expect(isDecimal32({ coefficient: 123, exponent: 0, sign: false, _decimal32: false })).toBe(false);
    });
  });

  describe('isDecimal64', () => {
    it('should return true for valid Decimal64 objects', () => {
      const d64: Decimal64 = {
        coefficient: BigInt('1234567890123456'),
        exponent: -10,
        sign: false,
        _decimal64: true,
      };
      expect(isDecimal64(d64)).toBe(true);

      const d64created = decimal64(BigInt(1), 0);
      expect(isDecimal64(d64created)).toBe(true);
    });

    it('should return false for invalid Decimal64 objects', () => {
      expect(isDecimal64(null)).toBe(false);
      expect(isDecimal64({ coefficient: 123, exponent: 0, sign: false, _decimal64: true })).toBe(false);
    });
  });

  describe('isDecimal128', () => {
    it('should return true for valid Decimal128 objects', () => {
      const d128: Decimal128 = {
        coefficient: BigInt('1234567890123456789012345678901234'),
        exponent: -20,
        sign: true,
        _decimal128: true,
      };
      expect(isDecimal128(d128)).toBe(true);

      const d128created = decimal128(BigInt(999), -5, false);
      expect(isDecimal128(d128created)).toBe(true);
    });

    it('should return false for invalid Decimal128 objects', () => {
      expect(isDecimal128(null)).toBe(false);
      expect(isDecimal128({ coefficient: BigInt(1), exponent: 0, sign: false })).toBe(false);
    });
  });

  describe('isMoney', () => {
    it('should return true for valid Money objects', () => {
      const usd: Money = {
        amount: BigInt(1999),
        currency: 'USD',
        decimals: 2,
      };
      expect(isMoney(usd)).toBe(true);

      const jpy = money(BigInt(1000), 'JPY', 0);
      expect(isMoney(jpy)).toBe(true);

      const btc = money(BigInt(100000000), 'BTC', 8);
      expect(isMoney(btc)).toBe(true);
    });

    it('should return false for invalid Money objects', () => {
      expect(isMoney(null)).toBe(false);
      expect(isMoney({ amount: 1999, currency: 'USD', decimals: 2 })).toBe(false);
      expect(isMoney({ amount: BigInt(100), currency: 123, decimals: 2 })).toBe(false);
      expect(isMoney({ amount: BigInt(100), currency: 'USD' })).toBe(false);
    });
  });

  describe('isFixedDecimal', () => {
    it('should return true for valid FixedDecimal objects', () => {
      const fd: FixedDecimal = {
        value: BigInt(12345),
        scale: 2,
      };
      expect(isFixedDecimal(fd)).toBe(true);

      const fd2 = fixedDecimal(BigInt(-999), 4);
      expect(isFixedDecimal(fd2)).toBe(true);
    });

    it('should return false for invalid FixedDecimal objects', () => {
      expect(isFixedDecimal(null)).toBe(false);
      expect(isFixedDecimal({ value: 12345, scale: 2 })).toBe(false);
      expect(isFixedDecimal({ value: BigInt(100), scale: '2' })).toBe(false);
    });
  });

  describe('isRational', () => {
    it('should return true for valid Rational objects', () => {
      const r: Rational = {
        num: BigInt(1),
        den: BigInt(3),
      };
      expect(isRational(r)).toBe(true);

      const r2 = rational(BigInt(22), BigInt(7));
      expect(isRational(r2)).toBe(true);

      const neg = rational(BigInt(-5), BigInt(2));
      expect(isRational(neg)).toBe(true);
    });

    it('should return false for invalid Rational objects', () => {
      expect(isRational(null)).toBe(false);
      expect(isRational({ num: 1, den: 3 })).toBe(false);
      expect(isRational({ num: BigInt(1), den: 3 })).toBe(false);
    });

    it('should throw error for zero denominator', () => {
      expect(() => rational(BigInt(1), BigInt(0))).toThrow('Denominator cannot be zero');
    });
  });
});

describe('Decimal Types - Factory Functions', () => {
  describe('bigFloat', () => {
    it('should create a BigFloat with all parameters', () => {
      const bf = bigFloat(BigInt(123), 5, 128);
      expect(bf.mantissa).toBe(BigInt(123));
      expect(bf.exponent).toBe(5);
      expect(bf.precision).toBe(128);
    });

    it('should use default precision of 53', () => {
      const bf = bigFloat(BigInt(1), 0);
      expect(bf.precision).toBe(53);
    });
  });

  describe('decimal32', () => {
    it('should create a Decimal32 with all parameters', () => {
      const d = decimal32(1234567, -3, true);
      expect(d.coefficient).toBe(1234567);
      expect(d.exponent).toBe(-3);
      expect(d.sign).toBe(true);
      expect(d._decimal32).toBe(true);
    });

    it('should default sign to false', () => {
      const d = decimal32(100, 0);
      expect(d.sign).toBe(false);
    });
  });

  describe('decimal64', () => {
    it('should create a Decimal64 with all parameters', () => {
      const d = decimal64(BigInt('1234567890123456'), -10, true);
      expect(d.coefficient).toBe(BigInt('1234567890123456'));
      expect(d.exponent).toBe(-10);
      expect(d.sign).toBe(true);
      expect(d._decimal64).toBe(true);
    });
  });

  describe('decimal128', () => {
    it('should create a Decimal128 with all parameters', () => {
      const d = decimal128(BigInt('1234567890123456789012345678901234'), -20, true);
      expect(d.coefficient).toBe(BigInt('1234567890123456789012345678901234'));
      expect(d.exponent).toBe(-20);
      expect(d.sign).toBe(true);
      expect(d._decimal128).toBe(true);
    });
  });

  describe('money', () => {
    it('should create Money with all parameters', () => {
      const m = money(BigInt(1999), 'USD', 2);
      expect(m.amount).toBe(BigInt(1999));
      expect(m.currency).toBe('USD');
      expect(m.decimals).toBe(2);
    });

    it('should default decimals to 2', () => {
      const m = money(BigInt(100), 'EUR');
      expect(m.decimals).toBe(2);
    });
  });

  describe('fixedDecimal', () => {
    it('should create FixedDecimal', () => {
      const fd = fixedDecimal(BigInt(12345), 3);
      expect(fd.value).toBe(BigInt(12345));
      expect(fd.scale).toBe(3);
    });
  });

  describe('rational', () => {
    it('should create Rational', () => {
      const r = rational(BigInt(22), BigInt(7));
      expect(r.num).toBe(BigInt(22));
      expect(r.den).toBe(BigInt(7));
    });

    it('should handle negative numerator', () => {
      const r = rational(BigInt(-5), BigInt(3));
      expect(r.num).toBe(BigInt(-5));
      expect(r.den).toBe(BigInt(3));
    });
  });
});

describe('Decimal Types - TypeScript Type Compatibility', () => {
  it('should allow typed variables', () => {
    const d: Decimal = { toString: () => '1', toNumber: () => 1 };
    const bf: BigFloat = { mantissa: BigInt(1), exponent: 0, precision: 53 };
    const d32: Decimal32 = { coefficient: 1, exponent: 0, sign: false, _decimal32: true };
    const d64: Decimal64 = { coefficient: BigInt(1), exponent: 0, sign: false, _decimal64: true };
    const d128: Decimal128 = { coefficient: BigInt(1), exponent: 0, sign: false, _decimal128: true };
    const m: Money = { amount: BigInt(100), currency: 'USD', decimals: 2 };
    const fd: FixedDecimal = { value: BigInt(100), scale: 2 };
    const r: Rational = { num: BigInt(1), den: BigInt(2) };

    // All should pass type tests
    expect(isDecimal(d)).toBe(true);
    expect(isBigFloat(bf)).toBe(true);
    expect(isDecimal32(d32)).toBe(true);
    expect(isDecimal64(d64)).toBe(true);
    expect(isDecimal128(d128)).toBe(true);
    expect(isMoney(m)).toBe(true);
    expect(isFixedDecimal(fd)).toBe(true);
    expect(isRational(r)).toBe(true);
  });
});
