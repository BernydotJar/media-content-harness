import { invariant, safeId } from './errors.mjs'
const HASH=/^[a-f0-9]{64}$/
const publicSource=value=>({source_id:value.source_id,sha256:value.sha256})
export function captureProviderExecution({provider,provenance,estimate,assets,artifactSha,test}) {
  invariant(provenance&&provenance.adapter===provider&&provenance.paid===false&&typeof provenance.synthetic==='boolean'&&(provenance.test===undefined||provenance.test===test),'INVALID_PROVENANCE','The provider must identify the actual media origin',422)
  const used=provenance.used_sources??[]
  invariant(Array.isArray(used)&&used.length<=8&&(test||used.length>0),'INVALID_PROVENANCE','The provider must identify the source media it consumed',422)
  const seen=new Set()
  const sources=used.map(source=>{safeId(source?.source_id);invariant(HASH.test(source?.sha256||'')&&!seen.has(source.source_id)&&assets.some(asset=>asset.source_id===source.source_id&&asset.sha256===source.sha256),'INVALID_PROVENANCE','Provider source provenance does not match the authorized bytes',422);seen.add(source.source_id);return publicSource(source)})
  invariant(test||sources.length===assets.length,'INVALID_PROVENANCE','Provider provenance must account for every selected source',422)
  return {provider,status:'COMPLETED',artifact_sha256:artifactSha,test,estimate:{credits:estimate.credits,cost:estimate.cost??null},provenance:{adapter:provider,used_sources:sources,synthetic:provenance.synthetic,paid:false,test,external_review:provenance.external_review===true}}
}
export function publicProviderExecution(value) {
  if(!value||typeof value!=='object')return null
  const p=value.provenance||{}
  return {provider:value.provider,status:value.status,artifact_sha256:value.artifact_sha256,test:value.test,estimate:{credits:value.estimate?.credits??null,cost:value.estimate?.cost??null},provenance:{adapter:p.adapter,used_sources:Array.isArray(p.used_sources)?p.used_sources.map(publicSource):[],synthetic:p.synthetic,paid:p.paid,test:p.test,external_review:p.external_review}}
}
export function publicSourceAssets(values) {
  return (values||[]).map(value=>({...publicSource(value),mime_type:value.mime_type,size_bytes:value.size_bytes,width:value.width,height:value.height,duration_seconds:value.duration_seconds,has_audio:value.has_audio}))
}
