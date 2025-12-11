/** Exported memory */
export declare const memory: WebAssembly.Memory;
/** src/wasm/assembly/index/WASM_VERSION */
export declare const WASM_VERSION: {
  /** @type `u32` */
  get value(): number
};
/** src/wasm/assembly/memory/TYPE_REGISTRY_OFFSET */
export declare const TYPE_REGISTRY_OFFSET: {
  /** @type `u32` */
  get value(): number
};
/** src/wasm/assembly/memory/SIGNATURE_TABLE_OFFSET */
export declare const SIGNATURE_TABLE_OFFSET: {
  /** @type `u32` */
  get value(): number
};
/** src/wasm/assembly/memory/DISPATCH_CACHE_OFFSET */
export declare const DISPATCH_CACHE_OFFSET: {
  /** @type `u32` */
  get value(): number
};
/** src/wasm/assembly/memory/MAX_TYPES */
export declare const MAX_TYPES: {
  /** @type `u32` */
  get value(): number
};
/** src/wasm/assembly/memory/MAX_SIGNATURES */
export declare const MAX_SIGNATURES: {
  /** @type `u32` */
  get value(): number
};
/** src/wasm/assembly/memory/MAX_PARAMS */
export declare const MAX_PARAMS: {
  /** @type `u32` */
  get value(): number
};
/** src/wasm/assembly/memory/CACHE_SLOTS */
export declare const CACHE_SLOTS: {
  /** @type `u32` */
  get value(): number
};
/**
 * src/wasm/assembly/memory/getTypeCount
 * @returns `u32`
 */
export declare function getTypeCount(): number;
/**
 * src/wasm/assembly/memory/setTypeCount
 * @param count `u32`
 */
export declare function setTypeCount(count: number): void;
/**
 * src/wasm/assembly/memory/getSignatureCount
 * @returns `u32`
 */
export declare function getSignatureCount(): number;
/**
 * src/wasm/assembly/memory/setSignatureCount
 * @param count `u32`
 */
export declare function setSignatureCount(count: number): void;
/**
 * src/wasm/assembly/memory/clearMemory
 */
export declare function clearMemory(): void;
/** src/wasm/assembly/type-registry/TYPE_NUMBER */
export declare const TYPE_NUMBER: {
  /** @type `u32` */
  get value(): number
};
/** src/wasm/assembly/type-registry/TYPE_STRING */
export declare const TYPE_STRING: {
  /** @type `u32` */
  get value(): number
};
/** src/wasm/assembly/type-registry/TYPE_BOOLEAN */
export declare const TYPE_BOOLEAN: {
  /** @type `u32` */
  get value(): number
};
/** src/wasm/assembly/type-registry/TYPE_FUNCTION */
export declare const TYPE_FUNCTION: {
  /** @type `u32` */
  get value(): number
};
/** src/wasm/assembly/type-registry/TYPE_ARRAY */
export declare const TYPE_ARRAY: {
  /** @type `u32` */
  get value(): number
};
/** src/wasm/assembly/type-registry/TYPE_DATE */
export declare const TYPE_DATE: {
  /** @type `u32` */
  get value(): number
};
/** src/wasm/assembly/type-registry/TYPE_REGEXP */
export declare const TYPE_REGEXP: {
  /** @type `u32` */
  get value(): number
};
/** src/wasm/assembly/type-registry/TYPE_OBJECT */
export declare const TYPE_OBJECT: {
  /** @type `u32` */
  get value(): number
};
/** src/wasm/assembly/type-registry/TYPE_NULL */
export declare const TYPE_NULL: {
  /** @type `u32` */
  get value(): number
};
/** src/wasm/assembly/type-registry/TYPE_UNDEFINED */
export declare const TYPE_UNDEFINED: {
  /** @type `u32` */
  get value(): number
};
/** src/wasm/assembly/type-registry/TYPE_ANY */
export declare const TYPE_ANY: {
  /** @type `u32` */
  get value(): number
};
/**
 * src/wasm/assembly/type-registry/registerType
 * @param typeId `u32`
 * @param typeMask `u32`
 * @returns `u32`
 */
export declare function registerType(typeId: number, typeMask: number): number;
/**
 * src/wasm/assembly/type-registry/getTypeMask
 * @param index `u32`
 * @returns `u32`
 */
export declare function getTypeMask(index: number): number;
/**
 * src/wasm/assembly/type-registry/getTypeId
 * @param index `u32`
 * @returns `u32`
 */
export declare function getTypeId(index: number): number;
/**
 * src/wasm/assembly/type-registry/typeMatches
 * @param valueMask `u32`
 * @param expectedMask `u32`
 * @returns `bool`
 */
export declare function typeMatches(valueMask: number, expectedMask: number): boolean;
/**
 * src/wasm/assembly/type-registry/combineMasks
 * @param mask1 `u32`
 * @param mask2 `u32`
 * @returns `u32`
 */
export declare function combineMasks(mask1: number, mask2: number): number;
/**
 * src/wasm/assembly/type-registry/getBuiltinMask
 * @param typeId `u32`
 * @returns `u32`
 */
export declare function getBuiltinMask(typeId: number): number;
/**
 * src/wasm/assembly/type-registry/initBuiltinTypes
 */
export declare function initBuiltinTypes(): void;
/**
 * src/wasm/assembly/signature-table/addSignature
 * @param fnIndex `u32`
 * @param paramCount `u32`
 * @returns `u32`
 */
export declare function addSignature(fnIndex: number, paramCount: number): number;
/**
 * src/wasm/assembly/signature-table/setParamMask
 * @param sigIndex `u32`
 * @param paramIndex `u32`
 * @param mask `u32`
 */
export declare function setParamMask(sigIndex: number, paramIndex: number, mask: number): void;
/**
 * src/wasm/assembly/signature-table/getFnIndex
 * @param sigIndex `u32`
 * @returns `u32`
 */
export declare function getFnIndex(sigIndex: number): number;
/**
 * src/wasm/assembly/signature-table/getParamCount
 * @param sigIndex `u32`
 * @returns `u32`
 */
export declare function getParamCount(sigIndex: number): number;
/**
 * src/wasm/assembly/signature-table/getParamMask
 * @param sigIndex `u32`
 * @param paramIndex `u32`
 * @returns `u32`
 */
export declare function getParamMask(sigIndex: number, paramIndex: number): number;
/**
 * src/wasm/assembly/signature-table/matchSignature
 * @param sigIndex `u32`
 * @param argCount `u32`
 * @param arg0Mask `u32`
 * @param arg1Mask `u32`
 * @param arg2Mask `u32`
 * @param arg3Mask `u32`
 * @returns `bool`
 */
export declare function matchSignature(sigIndex: number, argCount: number, arg0Mask: number, arg1Mask: number, arg2Mask: number, arg3Mask: number): boolean;
/**
 * src/wasm/assembly/signature-table/matchSignature0
 * @param sigIndex `u32`
 * @param argCount `u32`
 * @returns `bool`
 */
export declare function matchSignature0(sigIndex: number, argCount: number): boolean;
/**
 * src/wasm/assembly/signature-table/matchSignature1
 * @param sigIndex `u32`
 * @param argCount `u32`
 * @param arg0Mask `u32`
 * @returns `bool`
 */
export declare function matchSignature1(sigIndex: number, argCount: number, arg0Mask: number): boolean;
/**
 * src/wasm/assembly/signature-table/matchSignature2
 * @param sigIndex `u32`
 * @param argCount `u32`
 * @param arg0Mask `u32`
 * @param arg1Mask `u32`
 * @returns `bool`
 */
export declare function matchSignature2(sigIndex: number, argCount: number, arg0Mask: number, arg1Mask: number): boolean;
/** src/wasm/assembly/dispatch/NO_MATCH */
export declare const NO_MATCH: {
  /** @type `u32` */
  get value(): number
};
/**
 * src/wasm/assembly/dispatch/dispatchFind
 * @param argCount `u32`
 * @param arg0Mask `u32`
 * @param arg1Mask `u32`
 * @param arg2Mask `u32`
 * @param arg3Mask `u32`
 * @returns `u32`
 */
export declare function dispatchFind(argCount: number, arg0Mask: number, arg1Mask: number, arg2Mask: number, arg3Mask: number): number;
/**
 * src/wasm/assembly/dispatch/dispatchFind0
 * @returns `u32`
 */
export declare function dispatchFind0(): number;
/**
 * src/wasm/assembly/dispatch/dispatchFind1
 * @param arg0Mask `u32`
 * @returns `u32`
 */
export declare function dispatchFind1(arg0Mask: number): number;
/**
 * src/wasm/assembly/dispatch/dispatchFind2
 * @param arg0Mask `u32`
 * @param arg1Mask `u32`
 * @returns `u32`
 */
export declare function dispatchFind2(arg0Mask: number, arg1Mask: number): number;
/**
 * src/wasm/assembly/dispatch/dispatchFindNoCache
 * @param argCount `u32`
 * @param arg0Mask `u32`
 * @param arg1Mask `u32`
 * @param arg2Mask `u32`
 * @param arg3Mask `u32`
 * @returns `u32`
 */
export declare function dispatchFindNoCache(argCount: number, arg0Mask: number, arg1Mask: number, arg2Mask: number, arg3Mask: number): number;
/**
 * src/wasm/assembly/dispatch/hasSignatureForArgCount
 * @param argCount `u32`
 * @returns `bool`
 */
export declare function hasSignatureForArgCount(argCount: number): boolean;
/**
 * src/wasm/assembly/cache/cacheLookup
 * @param argCount `u32`
 * @param arg0Mask `u32`
 * @param arg1Mask `u32`
 * @param arg2Mask `u32`
 * @param arg3Mask `u32`
 * @returns `u32`
 */
export declare function cacheLookup(argCount: number, arg0Mask: number, arg1Mask: number, arg2Mask: number, arg3Mask: number): number;
/**
 * src/wasm/assembly/cache/cacheStore
 * @param argCount `u32`
 * @param arg0Mask `u32`
 * @param arg1Mask `u32`
 * @param arg2Mask `u32`
 * @param arg3Mask `u32`
 * @param fnIndex `u32`
 */
export declare function cacheStore(argCount: number, arg0Mask: number, arg1Mask: number, arg2Mask: number, arg3Mask: number, fnIndex: number): void;
/**
 * src/wasm/assembly/cache/clearCache
 */
export declare function clearCache(): void;
/**
 * src/wasm/assembly/cache/invalidateCache
 * @param argCount `u32`
 * @param arg0Mask `u32`
 * @param arg1Mask `u32`
 * @param arg2Mask `u32`
 * @param arg3Mask `u32`
 */
export declare function invalidateCache(argCount: number, arg0Mask: number, arg1Mask: number, arg2Mask: number, arg3Mask: number): void;
/**
 * src/wasm/assembly/cache/getCacheStats
 * @returns `u32`
 */
export declare function getCacheStats(): number;
