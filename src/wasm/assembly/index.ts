/**
 * AssemblyScript Entry Point for typed-function WASM dispatch
 *
 * Exports all WASM functions for use by the JavaScript bridge.
 */

// Export version for verification
export const WASM_VERSION: u32 = 1;

// Export memory management
export {
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
} from './memory';

// Export type registry functions
export {
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
} from './type-registry';

// Export signature table functions
export {
  addSignature,
  setParamMask,
  getFnIndex,
  getParamCount,
  getParamMask,
  matchSignature,
  matchSignature0,
  matchSignature1,
  matchSignature2,
} from './signature-table';

// Export dispatch functions
export {
  NO_MATCH,
  dispatchFind,
  dispatchFind0,
  dispatchFind1,
  dispatchFind2,
  dispatchFindNoCache,
  hasSignatureForArgCount,
} from './dispatch';

// Export cache functions
export {
  cacheLookup,
  cacheStore,
  clearCache,
  invalidateCache,
  getCacheStats,
} from './cache';
