(module
 (type $0 (func (param i32) (result i32)))
 (type $1 (func (param i32 i32) (result i32)))
 (type $2 (func (result i32)))
 (type $3 (func (param i32 i32 i32 i32 i32) (result i32)))
 (type $4 (func))
 (type $5 (func (param i32)))
 (type $6 (func (param i32 i32 i32)))
 (type $7 (func (param i32 i32 i32 i32 i32 i32) (result i32)))
 (type $8 (func (param i32 i32 i32) (result i32)))
 (type $9 (func (param i32 i32 i32 i32) (result i32)))
 (type $10 (func (param i32 i32 i32 i32 i32 i32)))
 (type $11 (func (param i32 i32 i32 i32 i32)))
 (global $src/wasm/assembly/index/WASM_VERSION i32 (i32.const 1))
 (global $src/wasm/assembly/memory/TYPE_REGISTRY_OFFSET i32 (i32.const 0))
 (global $src/wasm/assembly/memory/MAX_TYPES i32 (i32.const 256))
 (global $src/wasm/assembly/memory/SIGNATURE_TABLE_OFFSET i32 (i32.const 2048))
 (global $src/wasm/assembly/memory/MAX_SIGNATURES i32 (i32.const 1024))
 (global $src/wasm/assembly/memory/MAX_PARAMS i32 (i32.const 8))
 (global $src/wasm/assembly/memory/DISPATCH_CACHE_OFFSET i32 (i32.const 43008))
 (global $src/wasm/assembly/memory/CACHE_SLOTS i32 (i32.const 256))
 (global $src/wasm/assembly/memory/typeCount (mut i32) (i32.const 0))
 (global $src/wasm/assembly/memory/signatureCount (mut i32) (i32.const 0))
 (global $src/wasm/assembly/type-registry/TYPE_NUMBER i32 (i32.const 0))
 (global $src/wasm/assembly/type-registry/TYPE_STRING i32 (i32.const 1))
 (global $src/wasm/assembly/type-registry/TYPE_BOOLEAN i32 (i32.const 2))
 (global $src/wasm/assembly/type-registry/TYPE_FUNCTION i32 (i32.const 3))
 (global $src/wasm/assembly/type-registry/TYPE_ARRAY i32 (i32.const 4))
 (global $src/wasm/assembly/type-registry/TYPE_DATE i32 (i32.const 5))
 (global $src/wasm/assembly/type-registry/TYPE_REGEXP i32 (i32.const 6))
 (global $src/wasm/assembly/type-registry/TYPE_OBJECT i32 (i32.const 7))
 (global $src/wasm/assembly/type-registry/TYPE_NULL i32 (i32.const 8))
 (global $src/wasm/assembly/type-registry/TYPE_UNDEFINED i32 (i32.const 9))
 (global $src/wasm/assembly/type-registry/TYPE_ANY i32 (i32.const -1))
 (global $src/wasm/assembly/dispatch/NO_MATCH i32 (i32.const -1))
 (memory $0 1 16)
 (export "WASM_VERSION" (global $src/wasm/assembly/index/WASM_VERSION))
 (export "TYPE_REGISTRY_OFFSET" (global $src/wasm/assembly/memory/TYPE_REGISTRY_OFFSET))
 (export "SIGNATURE_TABLE_OFFSET" (global $src/wasm/assembly/memory/SIGNATURE_TABLE_OFFSET))
 (export "DISPATCH_CACHE_OFFSET" (global $src/wasm/assembly/memory/DISPATCH_CACHE_OFFSET))
 (export "MAX_TYPES" (global $src/wasm/assembly/memory/MAX_TYPES))
 (export "MAX_SIGNATURES" (global $src/wasm/assembly/memory/MAX_SIGNATURES))
 (export "MAX_PARAMS" (global $src/wasm/assembly/memory/MAX_PARAMS))
 (export "CACHE_SLOTS" (global $src/wasm/assembly/memory/CACHE_SLOTS))
 (export "getTypeCount" (func $src/wasm/assembly/memory/getTypeCount))
 (export "setTypeCount" (func $src/wasm/assembly/memory/setTypeCount))
 (export "getSignatureCount" (func $src/wasm/assembly/memory/getSignatureCount))
 (export "setSignatureCount" (func $src/wasm/assembly/memory/setSignatureCount))
 (export "clearMemory" (func $src/wasm/assembly/memory/clearMemory))
 (export "TYPE_NUMBER" (global $src/wasm/assembly/type-registry/TYPE_NUMBER))
 (export "TYPE_STRING" (global $src/wasm/assembly/type-registry/TYPE_STRING))
 (export "TYPE_BOOLEAN" (global $src/wasm/assembly/type-registry/TYPE_BOOLEAN))
 (export "TYPE_FUNCTION" (global $src/wasm/assembly/type-registry/TYPE_FUNCTION))
 (export "TYPE_ARRAY" (global $src/wasm/assembly/type-registry/TYPE_ARRAY))
 (export "TYPE_DATE" (global $src/wasm/assembly/type-registry/TYPE_DATE))
 (export "TYPE_REGEXP" (global $src/wasm/assembly/type-registry/TYPE_REGEXP))
 (export "TYPE_OBJECT" (global $src/wasm/assembly/type-registry/TYPE_OBJECT))
 (export "TYPE_NULL" (global $src/wasm/assembly/type-registry/TYPE_NULL))
 (export "TYPE_UNDEFINED" (global $src/wasm/assembly/type-registry/TYPE_UNDEFINED))
 (export "TYPE_ANY" (global $src/wasm/assembly/type-registry/TYPE_ANY))
 (export "registerType" (func $src/wasm/assembly/type-registry/registerType))
 (export "getTypeMask" (func $src/wasm/assembly/type-registry/getTypeMask))
 (export "getTypeId" (func $src/wasm/assembly/type-registry/getTypeId))
 (export "typeMatches" (func $src/wasm/assembly/type-registry/typeMatches))
 (export "combineMasks" (func $src/wasm/assembly/type-registry/combineMasks))
 (export "getBuiltinMask" (func $src/wasm/assembly/type-registry/getBuiltinMask))
 (export "initBuiltinTypes" (func $src/wasm/assembly/type-registry/initBuiltinTypes))
 (export "addSignature" (func $src/wasm/assembly/signature-table/addSignature))
 (export "setParamMask" (func $src/wasm/assembly/signature-table/setParamMask))
 (export "getFnIndex" (func $src/wasm/assembly/signature-table/getFnIndex))
 (export "getParamCount" (func $src/wasm/assembly/signature-table/getParamCount))
 (export "getParamMask" (func $src/wasm/assembly/signature-table/getParamMask))
 (export "matchSignature" (func $src/wasm/assembly/signature-table/matchSignature))
 (export "matchSignature0" (func $src/wasm/assembly/signature-table/matchSignature0))
 (export "matchSignature1" (func $src/wasm/assembly/signature-table/matchSignature1))
 (export "matchSignature2" (func $src/wasm/assembly/signature-table/matchSignature2))
 (export "NO_MATCH" (global $src/wasm/assembly/dispatch/NO_MATCH))
 (export "dispatchFind" (func $src/wasm/assembly/dispatch/dispatchFind))
 (export "dispatchFind0" (func $src/wasm/assembly/dispatch/dispatchFind0))
 (export "dispatchFind1" (func $src/wasm/assembly/dispatch/dispatchFind1))
 (export "dispatchFind2" (func $src/wasm/assembly/dispatch/dispatchFind2))
 (export "dispatchFindNoCache" (func $src/wasm/assembly/dispatch/dispatchFindNoCache))
 (export "hasSignatureForArgCount" (func $src/wasm/assembly/dispatch/hasSignatureForArgCount))
 (export "cacheLookup" (func $src/wasm/assembly/cache/cacheLookup))
 (export "cacheStore" (func $src/wasm/assembly/cache/cacheStore))
 (export "clearCache" (func $src/wasm/assembly/cache/clearCache))
 (export "invalidateCache" (func $src/wasm/assembly/cache/invalidateCache))
 (export "getCacheStats" (func $src/wasm/assembly/cache/getCacheStats))
 (export "memory" (memory $0))
 (func $src/wasm/assembly/memory/getTypeCount (result i32)
  global.get $src/wasm/assembly/memory/typeCount
 )
 (func $src/wasm/assembly/memory/setTypeCount (param $0 i32)
  local.get $0
  global.set $src/wasm/assembly/memory/typeCount
 )
 (func $src/wasm/assembly/memory/getSignatureCount (result i32)
  global.get $src/wasm/assembly/memory/signatureCount
 )
 (func $src/wasm/assembly/memory/setSignatureCount (param $0 i32)
  local.get $0
  global.set $src/wasm/assembly/memory/signatureCount
 )
 (func $src/wasm/assembly/memory/clearMemory
  (local $0 i32)
  i32.const 0
  global.set $src/wasm/assembly/memory/typeCount
  i32.const 0
  global.set $src/wasm/assembly/memory/signatureCount
  loop $for-loop|0
   local.get $0
   i32.const 2048
   i32.lt_u
   if
    local.get $0
    i32.const 0
    i32.store
    local.get $0
    i32.const 4
    i32.add
    local.set $0
    br $for-loop|0
   end
  end
  i32.const 0
  local.set $0
  loop $for-loop|1
   local.get $0
   i32.const 40960
   i32.lt_u
   if
    local.get $0
    i32.const 2048
    i32.add
    i32.const 0
    i32.store
    local.get $0
    i32.const 4
    i32.add
    local.set $0
    br $for-loop|1
   end
  end
  i32.const 0
  local.set $0
  loop $for-loop|2
   local.get $0
   i32.const 10240
   i32.lt_u
   if
    local.get $0
    i32.const 43008
    i32.add
    i32.const 0
    i32.store
    local.get $0
    i32.const 4
    i32.add
    local.set $0
    br $for-loop|2
   end
  end
 )
 (func $src/wasm/assembly/memory/getTypeOffset (param $0 i32) (result i32)
  local.get $0
  i32.const 3
  i32.shl
 )
 (func $src/wasm/assembly/type-registry/registerType (param $0 i32) (param $1 i32) (result i32)
  (local $2 i32)
  (local $3 i32)
  global.get $src/wasm/assembly/memory/typeCount
  local.tee $2
  i32.const 256
  i32.ge_u
  if
   i32.const -1
   return
  end
  local.get $2
  call $src/wasm/assembly/memory/getTypeOffset
  local.tee $3
  local.get $0
  i32.store
  local.get $3
  local.get $1
  i32.store offset=4
  local.get $2
  i32.const 1
  i32.add
  global.set $src/wasm/assembly/memory/typeCount
  local.get $2
 )
 (func $src/wasm/assembly/type-registry/getTypeMask (param $0 i32) (result i32)
  local.get $0
  global.get $src/wasm/assembly/memory/typeCount
  i32.ge_u
  if
   i32.const 0
   return
  end
  local.get $0
  call $src/wasm/assembly/memory/getTypeOffset
  i32.load offset=4
 )
 (func $src/wasm/assembly/type-registry/getTypeId (param $0 i32) (result i32)
  local.get $0
  global.get $src/wasm/assembly/memory/typeCount
  i32.ge_u
  if
   i32.const -1
   return
  end
  local.get $0
  call $src/wasm/assembly/memory/getTypeOffset
  i32.load
 )
 (func $src/wasm/assembly/type-registry/typeMatches (param $0 i32) (param $1 i32) (result i32)
  local.get $1
  i32.const -1
  i32.eq
  if
   i32.const 1
   return
  end
  local.get $0
  local.get $1
  i32.and
  i32.const 0
  i32.ne
 )
 (func $src/wasm/assembly/type-registry/combineMasks (param $0 i32) (param $1 i32) (result i32)
  local.get $0
  local.get $1
  i32.or
 )
 (func $src/wasm/assembly/type-registry/getBuiltinMask (param $0 i32) (result i32)
  local.get $0
  i32.const 32
  i32.ge_u
  if
   i32.const 0
   return
  end
  i32.const 1
  local.get $0
  i32.shl
 )
 (func $src/wasm/assembly/type-registry/initBuiltinTypes
  i32.const 0
  i32.const 1
  call $src/wasm/assembly/type-registry/registerType
  drop
  i32.const 1
  i32.const 2
  call $src/wasm/assembly/type-registry/registerType
  drop
  i32.const 2
  i32.const 4
  call $src/wasm/assembly/type-registry/registerType
  drop
  i32.const 3
  i32.const 8
  call $src/wasm/assembly/type-registry/registerType
  drop
  i32.const 4
  i32.const 16
  call $src/wasm/assembly/type-registry/registerType
  drop
  i32.const 5
  i32.const 32
  call $src/wasm/assembly/type-registry/registerType
  drop
  i32.const 6
  i32.const 64
  call $src/wasm/assembly/type-registry/registerType
  drop
  i32.const 7
  i32.const 128
  call $src/wasm/assembly/type-registry/registerType
  drop
  i32.const 8
  i32.const 256
  call $src/wasm/assembly/type-registry/registerType
  drop
  i32.const 9
  i32.const 512
  call $src/wasm/assembly/type-registry/registerType
  drop
 )
 (func $src/wasm/assembly/memory/getSignatureOffset (param $0 i32) (result i32)
  local.get $0
  i32.const 40
  i32.mul
  i32.const 2048
  i32.add
 )
 (func $src/wasm/assembly/signature-table/addSignature (param $0 i32) (param $1 i32) (result i32)
  (local $2 i32)
  (local $3 i32)
  global.get $src/wasm/assembly/memory/signatureCount
  local.tee $2
  i32.const 1024
  i32.ge_u
  if
   i32.const -1
   return
  end
  local.get $1
  i32.const 8
  i32.gt_u
  if
   i32.const -1
   return
  end
  local.get $2
  call $src/wasm/assembly/memory/getSignatureOffset
  local.tee $3
  local.get $0
  i32.store
  local.get $3
  local.get $1
  i32.store offset=4
  i32.const 0
  local.set $0
  loop $for-loop|0
   local.get $0
   i32.const 8
   i32.lt_u
   if
    local.get $3
    i32.const 8
    i32.add
    local.get $0
    i32.const 2
    i32.shl
    i32.add
    i32.const 0
    i32.store
    local.get $0
    i32.const 1
    i32.add
    local.set $0
    br $for-loop|0
   end
  end
  local.get $2
  i32.const 1
  i32.add
  global.set $src/wasm/assembly/memory/signatureCount
  local.get $2
 )
 (func $src/wasm/assembly/signature-table/setParamMask (param $0 i32) (param $1 i32) (param $2 i32)
  local.get $0
  global.get $src/wasm/assembly/memory/signatureCount
  i32.ge_u
  local.get $1
  i32.const 8
  i32.ge_u
  i32.or
  if
   return
  end
  local.get $0
  call $src/wasm/assembly/memory/getSignatureOffset
  i32.const 8
  i32.add
  local.get $1
  i32.const 2
  i32.shl
  i32.add
  local.get $2
  i32.store
 )
 (func $src/wasm/assembly/signature-table/getFnIndex (param $0 i32) (result i32)
  local.get $0
  global.get $src/wasm/assembly/memory/signatureCount
  i32.ge_u
  if
   i32.const -1
   return
  end
  local.get $0
  call $src/wasm/assembly/memory/getSignatureOffset
  i32.load
 )
 (func $src/wasm/assembly/signature-table/getParamCount (param $0 i32) (result i32)
  local.get $0
  global.get $src/wasm/assembly/memory/signatureCount
  i32.ge_u
  if
   i32.const 0
   return
  end
  local.get $0
  call $src/wasm/assembly/memory/getSignatureOffset
  i32.load offset=4
 )
 (func $src/wasm/assembly/signature-table/getParamMask (param $0 i32) (param $1 i32) (result i32)
  local.get $0
  global.get $src/wasm/assembly/memory/signatureCount
  i32.ge_u
  local.get $1
  i32.const 8
  i32.ge_u
  i32.or
  if
   i32.const 0
   return
  end
  local.get $0
  call $src/wasm/assembly/memory/getSignatureOffset
  i32.const 8
  i32.add
  local.get $1
  i32.const 2
  i32.shl
  i32.add
  i32.load
 )
 (func $src/wasm/assembly/signature-table/matchSignature (param $0 i32) (param $1 i32) (param $2 i32) (param $3 i32) (param $4 i32) (param $5 i32) (result i32)
  (local $6 i32)
  local.get $0
  call $src/wasm/assembly/signature-table/getParamCount
  local.tee $6
  local.get $1
  i32.ne
  if
   i32.const 0
   return
  end
  local.get $0
  call $src/wasm/assembly/memory/getSignatureOffset
  local.set $0
  local.get $6
  if
   local.get $0
   i32.load offset=8
   local.tee $1
   local.get $2
   i32.and
   i32.eqz
   local.get $1
   i32.const -1
   i32.ne
   i32.and
   if
    i32.const 0
    return
   end
  end
  local.get $6
  i32.const 2
  i32.ge_u
  if
   local.get $0
   i32.load offset=12
   local.tee $1
   local.get $3
   i32.and
   i32.eqz
   local.get $1
   i32.const -1
   i32.ne
   i32.and
   if
    i32.const 0
    return
   end
  end
  local.get $6
  i32.const 3
  i32.ge_u
  if
   local.get $0
   i32.load offset=16
   local.tee $1
   local.get $4
   i32.and
   i32.eqz
   local.get $1
   i32.const -1
   i32.ne
   i32.and
   if
    i32.const 0
    return
   end
  end
  local.get $6
  i32.const 4
  i32.ge_u
  if
   local.get $0
   i32.load offset=20
   local.tee $0
   local.get $5
   i32.and
   i32.eqz
   local.get $0
   i32.const -1
   i32.ne
   i32.and
   if
    i32.const 0
    return
   end
  end
  i32.const 1
 )
 (func $src/wasm/assembly/signature-table/matchSignature0 (param $0 i32) (param $1 i32) (result i32)
  local.get $1
  if (result i32)
   i32.const 1
  else
   local.get $0
   call $src/wasm/assembly/signature-table/getParamCount
  end
  i32.eqz
 )
 (func $src/wasm/assembly/signature-table/matchSignature1 (param $0 i32) (param $1 i32) (param $2 i32) (result i32)
  local.get $1
  i32.const 1
  i32.ne
  if (result i32)
   i32.const 1
  else
   local.get $0
   call $src/wasm/assembly/signature-table/getParamCount
   i32.const 1
   i32.ne
  end
  if
   i32.const 0
   return
  end
  local.get $0
  call $src/wasm/assembly/memory/getSignatureOffset
  i32.load offset=8
  local.tee $0
  i32.const -1
  i32.eq
  local.get $0
  local.get $2
  i32.and
  i32.const 0
  i32.ne
  i32.or
 )
 (func $src/wasm/assembly/signature-table/matchSignature2 (param $0 i32) (param $1 i32) (param $2 i32) (param $3 i32) (result i32)
  local.get $1
  i32.const 2
  i32.ne
  if (result i32)
   i32.const 1
  else
   local.get $0
   call $src/wasm/assembly/signature-table/getParamCount
   i32.const 2
   i32.ne
  end
  if
   i32.const 0
   return
  end
  local.get $0
  call $src/wasm/assembly/memory/getSignatureOffset
  local.tee $0
  i32.load offset=8
  local.set $1
  local.get $0
  i32.load offset=12
  local.set $0
  local.get $1
  local.get $2
  i32.and
  i32.eqz
  local.get $1
  i32.const -1
  i32.ne
  i32.and
  if
   i32.const 0
   return
  end
  local.get $0
  local.get $3
  i32.and
  i32.eqz
  local.get $0
  i32.const -1
  i32.ne
  i32.and
  if
   i32.const 0
   return
  end
  i32.const 1
 )
 (func $src/wasm/assembly/cache/computeHash (param $0 i32) (param $1 i32) (param $2 i32) (param $3 i32) (param $4 i32) (result i32)
  local.get $0
  i32.const 255
  i32.and
  i32.const -2128831035
  i32.xor
  i32.const 16777619
  i32.mul
  local.get $1
  i32.const 255
  i32.and
  i32.xor
  i32.const 16777619
  i32.mul
  local.get $1
  i32.const 8
  i32.shr_u
  i32.const 255
  i32.and
  i32.xor
  i32.const 16777619
  i32.mul
  local.get $1
  i32.const 16
  i32.shr_u
  i32.const 255
  i32.and
  i32.xor
  i32.const 16777619
  i32.mul
  local.get $1
  i32.const 24
  i32.shr_u
  i32.xor
  i32.const 16777619
  i32.mul
  local.get $2
  i32.const 255
  i32.and
  i32.xor
  i32.const 16777619
  i32.mul
  local.get $2
  i32.const 8
  i32.shr_u
  i32.const 255
  i32.and
  i32.xor
  i32.const 16777619
  i32.mul
  local.get $2
  i32.const 16
  i32.shr_u
  i32.const 255
  i32.and
  i32.xor
  i32.const 16777619
  i32.mul
  local.get $2
  i32.const 24
  i32.shr_u
  i32.xor
  i32.const 16777619
  i32.mul
  local.get $3
  i32.const 255
  i32.and
  i32.xor
  i32.const 16777619
  i32.mul
  local.get $3
  i32.const 8
  i32.shr_u
  i32.const 255
  i32.and
  i32.xor
  i32.const 16777619
  i32.mul
  local.get $3
  i32.const 16
  i32.shr_u
  i32.const 255
  i32.and
  i32.xor
  i32.const 16777619
  i32.mul
  local.get $3
  i32.const 24
  i32.shr_u
  i32.xor
  i32.const 16777619
  i32.mul
  local.get $4
  i32.const 255
  i32.and
  i32.xor
  i32.const 16777619
  i32.mul
  local.get $4
  i32.const 8
  i32.shr_u
  i32.const 255
  i32.and
  i32.xor
  i32.const 16777619
  i32.mul
  local.get $4
  i32.const 16
  i32.shr_u
  i32.const 255
  i32.and
  i32.xor
  i32.const 16777619
  i32.mul
  local.get $4
  i32.const 24
  i32.shr_u
  i32.xor
  i32.const 16777619
  i32.mul
 )
 (func $src/wasm/assembly/cache/getSlot (param $0 i32) (result i32)
  local.get $0
  i32.const 255
  i32.and
 )
 (func $src/wasm/assembly/memory/getCacheOffset (param $0 i32) (result i32)
  local.get $0
  i32.const 40
  i32.mul
  i32.const 43008
  i32.add
 )
 (func $src/wasm/assembly/cache/cacheLookup (param $0 i32) (param $1 i32) (param $2 i32) (param $3 i32) (param $4 i32) (result i32)
  (local $5 i32)
  (local $6 i32)
  block $folding-inner0
   local.get $0
   local.get $1
   local.get $2
   local.get $3
   local.get $4
   call $src/wasm/assembly/cache/computeHash
   local.tee $6
   call $src/wasm/assembly/cache/getSlot
   call $src/wasm/assembly/memory/getCacheOffset
   local.tee $5
   i32.load offset=28
   i32.const 1
   i32.ne
   br_if $folding-inner0
   local.get $5
   i32.load
   local.get $6
   i32.ne
   br_if $folding-inner0
   local.get $5
   i32.load offset=8
   local.get $0
   i32.ne
   br_if $folding-inner0
   local.get $5
   i32.load offset=12
   local.get $1
   i32.ne
   br_if $folding-inner0
   local.get $5
   i32.load offset=16
   local.get $2
   i32.ne
   br_if $folding-inner0
   local.get $5
   i32.load offset=20
   local.get $3
   i32.ne
   br_if $folding-inner0
   local.get $5
   i32.load offset=24
   local.get $4
   i32.ne
   br_if $folding-inner0
   local.get $5
   i32.load offset=4
   return
  end
  i32.const -1
 )
 (func $src/wasm/assembly/cache/cacheStore (param $0 i32) (param $1 i32) (param $2 i32) (param $3 i32) (param $4 i32) (param $5 i32)
  (local $6 i32)
  (local $7 i32)
  local.get $0
  local.get $1
  local.get $2
  local.get $3
  local.get $4
  call $src/wasm/assembly/cache/computeHash
  local.tee $7
  call $src/wasm/assembly/cache/getSlot
  call $src/wasm/assembly/memory/getCacheOffset
  local.tee $6
  local.get $7
  i32.store
  local.get $6
  local.get $5
  i32.store offset=4
  local.get $6
  local.get $0
  i32.store offset=8
  local.get $6
  local.get $1
  i32.store offset=12
  local.get $6
  local.get $2
  i32.store offset=16
  local.get $6
  local.get $3
  i32.store offset=20
  local.get $6
  local.get $4
  i32.store offset=24
  local.get $6
  i32.const 1
  i32.store offset=28
 )
 (func $src/wasm/assembly/dispatch/dispatchFind (param $0 i32) (param $1 i32) (param $2 i32) (param $3 i32) (param $4 i32) (result i32)
  (local $5 i32)
  (local $6 i32)
  local.get $0
  local.get $1
  local.get $2
  local.get $3
  local.get $4
  call $src/wasm/assembly/cache/cacheLookup
  local.tee $6
  i32.const -1
  i32.ne
  if
   local.get $6
   return
  end
  global.get $src/wasm/assembly/memory/signatureCount
  local.set $6
  loop $for-loop|0
   local.get $5
   local.get $6
   i32.lt_u
   if
    local.get $5
    local.get $0
    local.get $1
    local.get $2
    local.get $3
    local.get $4
    call $src/wasm/assembly/signature-table/matchSignature
    if
     local.get $0
     local.get $1
     local.get $2
     local.get $3
     local.get $4
     local.get $5
     call $src/wasm/assembly/signature-table/getFnIndex
     local.tee $0
     call $src/wasm/assembly/cache/cacheStore
     local.get $0
     return
    end
    local.get $5
    i32.const 1
    i32.add
    local.set $5
    br $for-loop|0
   end
  end
  i32.const -1
 )
 (func $src/wasm/assembly/dispatch/dispatchFind0 (result i32)
  (local $0 i32)
  (local $1 i32)
  i32.const 0
  i32.const 0
  i32.const 0
  i32.const 0
  i32.const 0
  call $src/wasm/assembly/cache/cacheLookup
  local.tee $1
  i32.const -1
  i32.ne
  if
   local.get $1
   return
  end
  global.get $src/wasm/assembly/memory/signatureCount
  local.set $1
  loop $for-loop|0
   local.get $0
   local.get $1
   i32.lt_u
   if
    local.get $0
    i32.const 0
    call $src/wasm/assembly/signature-table/matchSignature0
    if
     i32.const 0
     i32.const 0
     i32.const 0
     i32.const 0
     i32.const 0
     local.get $0
     call $src/wasm/assembly/signature-table/getFnIndex
     local.tee $0
     call $src/wasm/assembly/cache/cacheStore
     local.get $0
     return
    end
    local.get $0
    i32.const 1
    i32.add
    local.set $0
    br $for-loop|0
   end
  end
  i32.const -1
 )
 (func $src/wasm/assembly/dispatch/dispatchFind1 (param $0 i32) (result i32)
  (local $1 i32)
  (local $2 i32)
  i32.const 1
  local.get $0
  i32.const 0
  i32.const 0
  i32.const 0
  call $src/wasm/assembly/cache/cacheLookup
  local.tee $2
  i32.const -1
  i32.ne
  if
   local.get $2
   return
  end
  global.get $src/wasm/assembly/memory/signatureCount
  local.set $2
  loop $for-loop|0
   local.get $1
   local.get $2
   i32.lt_u
   if
    local.get $1
    i32.const 1
    local.get $0
    call $src/wasm/assembly/signature-table/matchSignature1
    if
     i32.const 1
     local.get $0
     i32.const 0
     i32.const 0
     i32.const 0
     local.get $1
     call $src/wasm/assembly/signature-table/getFnIndex
     local.tee $0
     call $src/wasm/assembly/cache/cacheStore
     local.get $0
     return
    end
    local.get $1
    i32.const 1
    i32.add
    local.set $1
    br $for-loop|0
   end
  end
  i32.const -1
 )
 (func $src/wasm/assembly/dispatch/dispatchFind2 (param $0 i32) (param $1 i32) (result i32)
  (local $2 i32)
  (local $3 i32)
  i32.const 2
  local.get $0
  local.get $1
  i32.const 0
  i32.const 0
  call $src/wasm/assembly/cache/cacheLookup
  local.tee $3
  i32.const -1
  i32.ne
  if
   local.get $3
   return
  end
  global.get $src/wasm/assembly/memory/signatureCount
  local.set $3
  loop $for-loop|0
   local.get $2
   local.get $3
   i32.lt_u
   if
    local.get $2
    i32.const 2
    local.get $0
    local.get $1
    call $src/wasm/assembly/signature-table/matchSignature2
    if
     i32.const 2
     local.get $0
     local.get $1
     i32.const 0
     i32.const 0
     local.get $2
     call $src/wasm/assembly/signature-table/getFnIndex
     local.tee $0
     call $src/wasm/assembly/cache/cacheStore
     local.get $0
     return
    end
    local.get $2
    i32.const 1
    i32.add
    local.set $2
    br $for-loop|0
   end
  end
  i32.const -1
 )
 (func $src/wasm/assembly/dispatch/dispatchFindNoCache (param $0 i32) (param $1 i32) (param $2 i32) (param $3 i32) (param $4 i32) (result i32)
  (local $5 i32)
  (local $6 i32)
  global.get $src/wasm/assembly/memory/signatureCount
  local.set $6
  loop $for-loop|0
   local.get $5
   local.get $6
   i32.lt_u
   if
    local.get $5
    local.get $0
    local.get $1
    local.get $2
    local.get $3
    local.get $4
    call $src/wasm/assembly/signature-table/matchSignature
    if
     local.get $5
     call $src/wasm/assembly/signature-table/getFnIndex
     return
    end
    local.get $5
    i32.const 1
    i32.add
    local.set $5
    br $for-loop|0
   end
  end
  i32.const -1
 )
 (func $src/wasm/assembly/dispatch/hasSignatureForArgCount (param $0 i32) (result i32)
  (local $1 i32)
  (local $2 i32)
  global.get $src/wasm/assembly/memory/signatureCount
  local.set $2
  loop $for-loop|0
   local.get $1
   local.get $2
   i32.lt_u
   if
    local.get $1
    call $src/wasm/assembly/signature-table/getParamCount
    local.get $0
    i32.eq
    if
     i32.const 1
     return
    end
    local.get $1
    i32.const 1
    i32.add
    local.set $1
    br $for-loop|0
   end
  end
  i32.const 0
 )
 (func $src/wasm/assembly/cache/clearCache
  (local $0 i32)
  loop $for-loop|0
   local.get $0
   i32.const 256
   i32.lt_u
   if
    local.get $0
    call $src/wasm/assembly/memory/getCacheOffset
    i32.const 0
    i32.store offset=28
    local.get $0
    i32.const 1
    i32.add
    local.set $0
    br $for-loop|0
   end
  end
 )
 (func $src/wasm/assembly/cache/invalidateCache (param $0 i32) (param $1 i32) (param $2 i32) (param $3 i32) (param $4 i32)
  local.get $0
  local.get $1
  local.get $2
  local.get $3
  local.get $4
  call $src/wasm/assembly/cache/computeHash
  call $src/wasm/assembly/cache/getSlot
  call $src/wasm/assembly/memory/getCacheOffset
  i32.const 0
  i32.store offset=28
 )
 (func $src/wasm/assembly/cache/getCacheStats (result i32)
  (local $0 i32)
  (local $1 i32)
  loop $for-loop|0
   local.get $0
   i32.const 256
   i32.lt_u
   if
    local.get $1
    i32.const 1
    i32.add
    local.get $1
    local.get $0
    call $src/wasm/assembly/memory/getCacheOffset
    i32.load offset=28
    i32.const 1
    i32.eq
    select
    local.set $1
    local.get $0
    i32.const 1
    i32.add
    local.set $0
    br $for-loop|0
   end
  end
  local.get $1
 )
)
