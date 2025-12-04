/**
 * Conversion Manager Module for typed-function
 *
 * This module handles registration, removal, and lookup of type conversions.
 */

import type { ConversionDef, AddConversionOptions } from './types.js';
import type { TypeRegistry } from './type-registry.js';
import { findInArray } from '../utils/array-helpers.js';

/**
 * Conversion Manager class for managing type conversions
 */
export class ConversionManager {
  /** Reference to the type registry */
  private registry: TypeRegistry;

  /** Counter for conversion indices */
  private nConversions = 0;

  /**
   * Create a new ConversionManager
   *
   * @param registry - The type registry to use
   */
  constructor(registry: TypeRegistry) {
    this.registry = registry;
  }

  /**
   * Get the current number of registered conversions
   */
  get conversionCount(): number {
    return this.nConversions;
  }

  /**
   * Validate a conversion definition
   *
   * @param conversion - The conversion to validate
   * @throws TypeError if the conversion is invalid
   * @throws SyntaxError if converting to self
   */
  private validateConversion(conversion: ConversionDef): void {
    if (
      !conversion ||
      typeof conversion.from !== 'string' ||
      typeof conversion.to !== 'string' ||
      typeof conversion.convert !== 'function'
    ) {
      throw new TypeError(
        'Object with properties {from: string, to: string, convert: function} expected'
      );
    }

    if (conversion.to === conversion.from) {
      throw new SyntaxError(
        `Illegal to define conversion from "${conversion.from}" to itself.`
      );
    }
  }

  /**
   * Add a type conversion
   *
   * @param conversion - The conversion to add
   * @param options - Options (override: boolean)
   * @throws TypeError if the conversion is invalid
   * @throws Error if a conversion already exists (unless override is true)
   */
  addConversion(conversion: ConversionDef, options: AddConversionOptions = { override: false }): void {
    this.validateConversion(conversion);

    // Verify types exist
    this.registry.findType(conversion.from);
    const toType = this.registry.findType(conversion.to);

    // Check for existing conversion
    const existing = toType.conversionsTo.find((other) => other.from === conversion.from);

    if (existing) {
      if (options.override) {
        this.removeConversion({
          from: existing.from,
          to: conversion.to,
          convert: existing.convert,
        });
      } else {
        throw new Error(
          `There is already a conversion from "${conversion.from}" to "${toType.name}"`
        );
      }
    }

    // Add the conversion
    toType.conversionsTo.push({
      from: conversion.from,
      to: toType.name,
      convert: conversion.convert,
      index: this.nConversions++,
    });
  }

  /**
   * Add multiple conversions
   *
   * @param conversions - Array of conversions to add
   * @param options - Options (override: boolean)
   */
  addConversions(conversions: ConversionDef[], options?: AddConversionOptions): void {
    for (const conversion of conversions) {
      this.addConversion(conversion, options);
    }
  }

  /**
   * Remove a conversion
   *
   * The convert function must match the existing conversion.
   *
   * @param conversion - The conversion to remove
   * @throws Error if the conversion doesn't exist or doesn't match
   */
  removeConversion(conversion: ConversionDef): void {
    this.validateConversion(conversion);

    const toType = this.registry.findType(conversion.to);
    const existingConversion = findInArray(
      toType.conversionsTo,
      (c) => c.from === conversion.from
    );

    if (!existingConversion) {
      throw new Error(
        `Attempt to remove nonexistent conversion from ${conversion.from} to ${conversion.to}`
      );
    }

    if (existingConversion.convert !== conversion.convert) {
      throw new Error('Conversion to remove does not match existing conversion');
    }

    const index = toType.conversionsTo.indexOf(existingConversion);
    toType.conversionsTo.splice(index, 1);
  }

  /**
   * Clear all conversions
   */
  clearConversions(): void {
    this.registry.clearConversions();
    this.nConversions = 0;
  }

  /**
   * Get all conversions to a specific type
   *
   * @param typeName - The target type name
   * @returns Array of conversions to this type
   */
  getConversionsTo(typeName: string): ConversionDef[] {
    const type = this.registry.findType(typeName);
    return [...type.conversionsTo];
  }

  /**
   * Get conversions available to convert to any of the given types
   *
   * Returns the lowest-index conversion for each source type.
   *
   * @param typeNames - Target type names
   * @returns Array of available conversions
   */
  availableConversions(typeNames: string[]): ConversionDef[] {
    if (typeNames.length === 0) {
      return [];
    }

    const types = typeNames.map((name) => this.registry.findType(name));

    if (typeNames.length === 1) {
      const type = types[0];
      return type ? [...type.conversionsTo] : [];
    }

    // For multiple types, find the lowest-index conversion for each source type
    const knownTypes = new Set(typeNames);
    const convertibleTypes = new Set<string>();

    for (const type of types) {
      if (!type) continue;
      for (const match of type.conversionsTo) {
        if (!knownTypes.has(match.from)) {
          convertibleTypes.add(match.from);
        }
      }
    }

    // Get the lowest-index conversion for each convertible type
    const matches: ConversionDef[] = [];

    for (const typeName of convertibleTypes) {
      let bestIndex = this.nConversions + 1;
      let bestConversion: ConversionDef | null = null;

      for (const type of types) {
        if (!type) continue;
        for (const match of type.conversionsTo) {
          if (match.from === typeName && match.index !== undefined && match.index < bestIndex) {
            bestIndex = match.index;
            bestConversion = match;
          }
        }
      }

      if (bestConversion) {
        matches.push(bestConversion);
      }
    }

    return matches;
  }

  /**
   * Convert a value to a specified type
   *
   * @param value - The value to convert
   * @param typeName - The target type name
   * @returns The converted value
   * @throws Error if no conversion is available
   */
  convert(value: unknown, typeName: string): unknown {
    const type = this.registry.findType(typeName);

    // Check if value already matches
    if (type.test(value)) {
      return value;
    }

    const conversions = type.conversionsTo;

    if (conversions.length === 0) {
      throw new Error(`There are no conversions to ${typeName} defined.`);
    }

    // Find a matching conversion
    for (const conversion of conversions) {
      const fromType = this.registry.findType(conversion.from);
      if (fromType.test(value)) {
        return conversion.convert(value);
      }
    }

    throw new Error(`Cannot convert ${value} to ${typeName}`);
  }
}

/**
 * Create a new ConversionManager
 *
 * @param registry - The type registry to use
 * @returns A new ConversionManager instance
 */
export function createConversionManager(registry: TypeRegistry): ConversionManager {
  return new ConversionManager(registry);
}
