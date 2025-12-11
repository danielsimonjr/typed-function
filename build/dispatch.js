async function instantiate(module, imports = {}) {
  const { exports } = await WebAssembly.instantiate(module, imports);
  const memory = exports.memory || imports.env.memory;
  const adaptedExports = Object.setPrototypeOf({
    WASM_VERSION: {
      // src/wasm/assembly/index/WASM_VERSION: u32
      valueOf() { return this.value; },
      get value() {
        return exports.WASM_VERSION.value >>> 0;
      }
    },
    TYPE_REGISTRY_OFFSET: {
      // src/wasm/assembly/memory/TYPE_REGISTRY_OFFSET: u32
      valueOf() { return this.value; },
      get value() {
        return exports.TYPE_REGISTRY_OFFSET.value >>> 0;
      }
    },
    SIGNATURE_TABLE_OFFSET: {
      // src/wasm/assembly/memory/SIGNATURE_TABLE_OFFSET: u32
      valueOf() { return this.value; },
      get value() {
        return exports.SIGNATURE_TABLE_OFFSET.value >>> 0;
      }
    },
    DISPATCH_CACHE_OFFSET: {
      // src/wasm/assembly/memory/DISPATCH_CACHE_OFFSET: u32
      valueOf() { return this.value; },
      get value() {
        return exports.DISPATCH_CACHE_OFFSET.value >>> 0;
      }
    },
    MAX_TYPES: {
      // src/wasm/assembly/memory/MAX_TYPES: u32
      valueOf() { return this.value; },
      get value() {
        return exports.MAX_TYPES.value >>> 0;
      }
    },
    MAX_SIGNATURES: {
      // src/wasm/assembly/memory/MAX_SIGNATURES: u32
      valueOf() { return this.value; },
      get value() {
        return exports.MAX_SIGNATURES.value >>> 0;
      }
    },
    MAX_PARAMS: {
      // src/wasm/assembly/memory/MAX_PARAMS: u32
      valueOf() { return this.value; },
      get value() {
        return exports.MAX_PARAMS.value >>> 0;
      }
    },
    CACHE_SLOTS: {
      // src/wasm/assembly/memory/CACHE_SLOTS: u32
      valueOf() { return this.value; },
      get value() {
        return exports.CACHE_SLOTS.value >>> 0;
      }
    },
    getTypeCount() {
      // src/wasm/assembly/memory/getTypeCount() => u32
      return exports.getTypeCount() >>> 0;
    },
    getSignatureCount() {
      // src/wasm/assembly/memory/getSignatureCount() => u32
      return exports.getSignatureCount() >>> 0;
    },
    TYPE_NUMBER: {
      // src/wasm/assembly/type-registry/TYPE_NUMBER: u32
      valueOf() { return this.value; },
      get value() {
        return exports.TYPE_NUMBER.value >>> 0;
      }
    },
    TYPE_STRING: {
      // src/wasm/assembly/type-registry/TYPE_STRING: u32
      valueOf() { return this.value; },
      get value() {
        return exports.TYPE_STRING.value >>> 0;
      }
    },
    TYPE_BOOLEAN: {
      // src/wasm/assembly/type-registry/TYPE_BOOLEAN: u32
      valueOf() { return this.value; },
      get value() {
        return exports.TYPE_BOOLEAN.value >>> 0;
      }
    },
    TYPE_FUNCTION: {
      // src/wasm/assembly/type-registry/TYPE_FUNCTION: u32
      valueOf() { return this.value; },
      get value() {
        return exports.TYPE_FUNCTION.value >>> 0;
      }
    },
    TYPE_ARRAY: {
      // src/wasm/assembly/type-registry/TYPE_ARRAY: u32
      valueOf() { return this.value; },
      get value() {
        return exports.TYPE_ARRAY.value >>> 0;
      }
    },
    TYPE_DATE: {
      // src/wasm/assembly/type-registry/TYPE_DATE: u32
      valueOf() { return this.value; },
      get value() {
        return exports.TYPE_DATE.value >>> 0;
      }
    },
    TYPE_REGEXP: {
      // src/wasm/assembly/type-registry/TYPE_REGEXP: u32
      valueOf() { return this.value; },
      get value() {
        return exports.TYPE_REGEXP.value >>> 0;
      }
    },
    TYPE_OBJECT: {
      // src/wasm/assembly/type-registry/TYPE_OBJECT: u32
      valueOf() { return this.value; },
      get value() {
        return exports.TYPE_OBJECT.value >>> 0;
      }
    },
    TYPE_NULL: {
      // src/wasm/assembly/type-registry/TYPE_NULL: u32
      valueOf() { return this.value; },
      get value() {
        return exports.TYPE_NULL.value >>> 0;
      }
    },
    TYPE_UNDEFINED: {
      // src/wasm/assembly/type-registry/TYPE_UNDEFINED: u32
      valueOf() { return this.value; },
      get value() {
        return exports.TYPE_UNDEFINED.value >>> 0;
      }
    },
    TYPE_ANY: {
      // src/wasm/assembly/type-registry/TYPE_ANY: u32
      valueOf() { return this.value; },
      get value() {
        return exports.TYPE_ANY.value >>> 0;
      }
    },
    registerType(typeId, typeMask) {
      // src/wasm/assembly/type-registry/registerType(u32, u32) => u32
      return exports.registerType(typeId, typeMask) >>> 0;
    },
    getTypeMask(index) {
      // src/wasm/assembly/type-registry/getTypeMask(u32) => u32
      return exports.getTypeMask(index) >>> 0;
    },
    getTypeId(index) {
      // src/wasm/assembly/type-registry/getTypeId(u32) => u32
      return exports.getTypeId(index) >>> 0;
    },
    typeMatches(valueMask, expectedMask) {
      // src/wasm/assembly/type-registry/typeMatches(u32, u32) => bool
      return exports.typeMatches(valueMask, expectedMask) != 0;
    },
    combineMasks(mask1, mask2) {
      // src/wasm/assembly/type-registry/combineMasks(u32, u32) => u32
      return exports.combineMasks(mask1, mask2) >>> 0;
    },
    getBuiltinMask(typeId) {
      // src/wasm/assembly/type-registry/getBuiltinMask(u32) => u32
      return exports.getBuiltinMask(typeId) >>> 0;
    },
    addSignature(fnIndex, paramCount) {
      // src/wasm/assembly/signature-table/addSignature(u32, u32) => u32
      return exports.addSignature(fnIndex, paramCount) >>> 0;
    },
    getFnIndex(sigIndex) {
      // src/wasm/assembly/signature-table/getFnIndex(u32) => u32
      return exports.getFnIndex(sigIndex) >>> 0;
    },
    getParamCount(sigIndex) {
      // src/wasm/assembly/signature-table/getParamCount(u32) => u32
      return exports.getParamCount(sigIndex) >>> 0;
    },
    getParamMask(sigIndex, paramIndex) {
      // src/wasm/assembly/signature-table/getParamMask(u32, u32) => u32
      return exports.getParamMask(sigIndex, paramIndex) >>> 0;
    },
    matchSignature(sigIndex, argCount, arg0Mask, arg1Mask, arg2Mask, arg3Mask) {
      // src/wasm/assembly/signature-table/matchSignature(u32, u32, u32, u32, u32, u32) => bool
      return exports.matchSignature(sigIndex, argCount, arg0Mask, arg1Mask, arg2Mask, arg3Mask) != 0;
    },
    matchSignature0(sigIndex, argCount) {
      // src/wasm/assembly/signature-table/matchSignature0(u32, u32) => bool
      return exports.matchSignature0(sigIndex, argCount) != 0;
    },
    matchSignature1(sigIndex, argCount, arg0Mask) {
      // src/wasm/assembly/signature-table/matchSignature1(u32, u32, u32) => bool
      return exports.matchSignature1(sigIndex, argCount, arg0Mask) != 0;
    },
    matchSignature2(sigIndex, argCount, arg0Mask, arg1Mask) {
      // src/wasm/assembly/signature-table/matchSignature2(u32, u32, u32, u32) => bool
      return exports.matchSignature2(sigIndex, argCount, arg0Mask, arg1Mask) != 0;
    },
    NO_MATCH: {
      // src/wasm/assembly/dispatch/NO_MATCH: u32
      valueOf() { return this.value; },
      get value() {
        return exports.NO_MATCH.value >>> 0;
      }
    },
    dispatchFind(argCount, arg0Mask, arg1Mask, arg2Mask, arg3Mask) {
      // src/wasm/assembly/dispatch/dispatchFind(u32, u32, u32, u32, u32) => u32
      return exports.dispatchFind(argCount, arg0Mask, arg1Mask, arg2Mask, arg3Mask) >>> 0;
    },
    dispatchFind0() {
      // src/wasm/assembly/dispatch/dispatchFind0() => u32
      return exports.dispatchFind0() >>> 0;
    },
    dispatchFind1(arg0Mask) {
      // src/wasm/assembly/dispatch/dispatchFind1(u32) => u32
      return exports.dispatchFind1(arg0Mask) >>> 0;
    },
    dispatchFind2(arg0Mask, arg1Mask) {
      // src/wasm/assembly/dispatch/dispatchFind2(u32, u32) => u32
      return exports.dispatchFind2(arg0Mask, arg1Mask) >>> 0;
    },
    dispatchFindNoCache(argCount, arg0Mask, arg1Mask, arg2Mask, arg3Mask) {
      // src/wasm/assembly/dispatch/dispatchFindNoCache(u32, u32, u32, u32, u32) => u32
      return exports.dispatchFindNoCache(argCount, arg0Mask, arg1Mask, arg2Mask, arg3Mask) >>> 0;
    },
    hasSignatureForArgCount(argCount) {
      // src/wasm/assembly/dispatch/hasSignatureForArgCount(u32) => bool
      return exports.hasSignatureForArgCount(argCount) != 0;
    },
    cacheLookup(argCount, arg0Mask, arg1Mask, arg2Mask, arg3Mask) {
      // src/wasm/assembly/cache/cacheLookup(u32, u32, u32, u32, u32) => u32
      return exports.cacheLookup(argCount, arg0Mask, arg1Mask, arg2Mask, arg3Mask) >>> 0;
    },
    getCacheStats() {
      // src/wasm/assembly/cache/getCacheStats() => u32
      return exports.getCacheStats() >>> 0;
    },
  }, exports);
  return adaptedExports;
}
export const {
  memory,
  WASM_VERSION,
  TYPE_REGISTRY_OFFSET,
  SIGNATURE_TABLE_OFFSET,
  DISPATCH_CACHE_OFFSET,
  MAX_TYPES,
  MAX_SIGNATURES,
  MAX_PARAMS,
  CACHE_SLOTS,
  getTypeCount,
  setTypeCount,
  getSignatureCount,
  setSignatureCount,
  clearMemory,
  TYPE_NUMBER,
  TYPE_STRING,
  TYPE_BOOLEAN,
  TYPE_FUNCTION,
  TYPE_ARRAY,
  TYPE_DATE,
  TYPE_REGEXP,
  TYPE_OBJECT,
  TYPE_NULL,
  TYPE_UNDEFINED,
  TYPE_ANY,
  registerType,
  getTypeMask,
  getTypeId,
  typeMatches,
  combineMasks,
  getBuiltinMask,
  initBuiltinTypes,
  addSignature,
  setParamMask,
  getFnIndex,
  getParamCount,
  getParamMask,
  matchSignature,
  matchSignature0,
  matchSignature1,
  matchSignature2,
  NO_MATCH,
  dispatchFind,
  dispatchFind0,
  dispatchFind1,
  dispatchFind2,
  dispatchFindNoCache,
  hasSignatureForArgCount,
  cacheLookup,
  cacheStore,
  clearCache,
  invalidateCache,
  getCacheStats,
} = await (async url => instantiate(
  await (async () => {
    const isNodeOrBun = typeof process != "undefined" && process.versions != null && (process.versions.node != null || process.versions.bun != null);
    if (isNodeOrBun) { return globalThis.WebAssembly.compile(await (await import("node:fs/promises")).readFile(url)); }
    else { return await globalThis.WebAssembly.compileStreaming(globalThis.fetch(url)); }
  })(), {
  }
))(new URL("dispatch.wasm", import.meta.url));
