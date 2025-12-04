/**
 * Conversion Manager Module for typed-function
 *
 * This module handles registration, removal, and lookup of type conversions.
 */
import type { ConversionDef, AddConversionOptions } from './types.js';
import type { TypeRegistry } from './type-registry.js';
/**
 * Conversion Manager class for managing type conversions
 */
export declare class ConversionManager {
    /** Reference to the type registry */
    private registry;
    /** Counter for conversion indices */
    private nConversions;
    /**
     * Create a new ConversionManager
     *
     * @param registry - The type registry to use
     */
    constructor(registry: TypeRegistry);
    /**
     * Get the current number of registered conversions
     */
    get conversionCount(): number;
    /**
     * Validate a conversion definition
     *
     * @param conversion - The conversion to validate
     * @throws TypeError if the conversion is invalid
     * @throws SyntaxError if converting to self
     */
    private validateConversion;
    /**
     * Add a type conversion
     *
     * @param conversion - The conversion to add
     * @param options - Options (override: boolean)
     * @throws TypeError if the conversion is invalid
     * @throws Error if a conversion already exists (unless override is true)
     */
    addConversion(conversion: ConversionDef, options?: AddConversionOptions): void;
    /**
     * Add multiple conversions
     *
     * @param conversions - Array of conversions to add
     * @param options - Options (override: boolean)
     */
    addConversions(conversions: ConversionDef[], options?: AddConversionOptions): void;
    /**
     * Remove a conversion
     *
     * The convert function must match the existing conversion.
     *
     * @param conversion - The conversion to remove
     * @throws Error if the conversion doesn't exist or doesn't match
     */
    removeConversion(conversion: ConversionDef): void;
    /**
     * Clear all conversions
     */
    clearConversions(): void;
    /**
     * Get all conversions to a specific type
     *
     * @param typeName - The target type name
     * @returns Array of conversions to this type
     */
    getConversionsTo(typeName: string): ConversionDef[];
    /**
     * Get conversions available to convert to any of the given types
     *
     * Returns the lowest-index conversion for each source type.
     *
     * @param typeNames - Target type names
     * @returns Array of available conversions
     */
    availableConversions(typeNames: string[]): ConversionDef[];
    /**
     * Convert a value to a specified type
     *
     * @param value - The value to convert
     * @param typeName - The target type name
     * @returns The converted value
     * @throws Error if no conversion is available
     */
    convert(value: unknown, typeName: string): unknown;
}
/**
 * Create a new ConversionManager
 *
 * @param registry - The type registry to use
 * @returns A new ConversionManager instance
 */
export declare function createConversionManager(registry: TypeRegistry): ConversionManager;
//# sourceMappingURL=conversion-manager.d.ts.map