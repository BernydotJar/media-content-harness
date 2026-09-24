import { invariant, safeId } from './errors.mjs'
const HASH=/^[a-f0-9]{64}$/
const publicSource=value=>({source_id:value.source_id,sha256:value.sha256})
const publicBrandAsset=value=>({asset_id:value.asset_id,sha256:value.sha256,synthetic:value.synthetic===true})
const publicReferenceAsset=value=>({asset_id:value.asset_id,role:value.role,sha256:value.sha256})
const REFERENCE_ROLES=new Set(['CHARACTER_IDENTITY_ONLY','ENVIRONMENT_ONLY','STYLE_ONLY'])
const GENERATION_KINDS=new Set(['REFERENCE_VIDEO','STICKER_OVERLAY'])
export function captureProviderExecution({provider,provenance,estimate,assets,brandAssets=[],referenceAssets=[],promptSha=null,artifactSha,test,spendApproval=null,generationAttemptId=null}) {
  invariant(provenance&&provenance.adapter===provider&&typeof provenance.paid==='boolean'&&typeof provenance.synthetic==='boolean'&&(provenance.test===undefined||provenance.test===test),'INVALID_PROVENANCE','The provider must identify the actual media origin',422)
  if(provenance.paid)invariant(spendApproval&&typeof spendApproval.id==='string'&&typeof spendApproval.scope_sha==='string'&&typeof spendApproval.approved_by==='string','SPEND_APPROVAL_REQUIRED','Paid provider provenance requires an authenticated spend approval',409)
  const used=provenance.used_sources??[]
  invariant(Array.isArray(used)&&used.length<=8&&(test||used.length>0||(provenance.synthetic===true&&assets.length===0)),'INVALID_PROVENANCE','The provider must identify the source media it consumed',422)
  const seen=new Set()
  const sources=used.map(source=>{safeId(source?.source_id);invariant(HASH.test(source?.sha256||'')&&!seen.has(source.source_id)&&assets.some(asset=>asset.source_id===source.source_id&&asset.sha256===source.sha256),'INVALID_PROVENANCE','Provider source provenance does not match the authorized bytes',422);seen.add(source.source_id);return publicSource(source)})
  invariant(test||sources.length===assets.length,'INVALID_PROVENANCE','Provider provenance must account for every selected source',422)
  invariant(Array.isArray(brandAssets)&&brandAssets.length<=4,'INVALID_PROVENANCE','Authorized brand-asset input is malformed',422)
  const authorizedBrandAssets=brandAssets.map(asset=>{safeId(asset?.asset_id);invariant(HASH.test(asset?.sha256||'')&&asset.synthetic===false,'INVALID_PROVENANCE','Authorized brand-asset input is malformed',422);return publicBrandAsset(asset)})
  const claimed=provenance.brand_assets??[]
  invariant(Array.isArray(claimed)&&claimed.length===authorizedBrandAssets.length,'INVALID_PROVENANCE','Provider brand-asset provenance must account for every authorized brand asset and no others',422)
  const brandSeen=new Set()
  const publicBrandAssets=claimed.map(asset=>{safeId(asset?.asset_id);const authorized=authorizedBrandAssets.find(expected=>expected.asset_id===asset.asset_id&&expected.sha256===asset.sha256&&expected.synthetic===false);invariant(HASH.test(asset?.sha256||'')&&!brandSeen.has(asset.asset_id)&&asset.synthetic===false&&authorized,'INVALID_PROVENANCE','Provider brand-asset provenance does not match the authorized input',422);brandSeen.add(asset.asset_id);return publicBrandAsset(asset)})
  invariant(Array.isArray(referenceAssets)&&referenceAssets.length<=3,'INVALID_PROVENANCE','Authorized provider references are malformed',422)
  const authorizedReferences=referenceAssets.map(asset=>{safeId(asset?.asset_id);invariant(REFERENCE_ROLES.has(asset?.role)&&HASH.test(asset?.sha256||''),'INVALID_PROVENANCE','Authorized provider reference is malformed',422);return publicReferenceAsset(asset)})
  const referenceClaims=provenance.reference_assets??[]
  invariant(Array.isArray(referenceClaims)&&referenceClaims.length===authorizedReferences.length,'INVALID_PROVENANCE','Provider reference provenance must account for every approved reference and no others',422)
  const referenceSeen=new Set(),publicReferences=referenceClaims.map(asset=>{safeId(asset?.asset_id);const key=asset.asset_id+'\0'+asset.role;const authorized=authorizedReferences.find(expected=>expected.asset_id===asset.asset_id&&expected.role===asset.role&&expected.sha256===asset.sha256);invariant(REFERENCE_ROLES.has(asset?.role)&&HASH.test(asset?.sha256||'')&&!referenceSeen.has(key)&&authorized,'INVALID_PROVENANCE','Provider reference provenance does not match the approved input',422);referenceSeen.add(key);return publicReferenceAsset(asset)})
  const generationKind=provenance.generation_kind??null
  invariant(generationKind===null||GENERATION_KINDS.has(generationKind),'INVALID_PROVENANCE','Provider generation kind is invalid',422)
  if(generationKind==='REFERENCE_VIDEO')invariant(provenance.synthetic===true&&publicReferences.some(r=>r.role==='CHARACTER_IDENTITY_ONLY'),'INVALID_PROVENANCE','Reference-video provenance requires a synthetic result and an approved character reference',422)
  if(generationKind==='STICKER_OVERLAY')invariant(provider==='ffmpeg'&&provenance.synthetic===false&&authorizedBrandAssets.length>0&&publicReferences.length===0,'INVALID_PROVENANCE','Sticker provenance must be a deterministic FFmpeg composite over approved brand artwork',422)
  const provenancePrompt=provenance.prompt_sha256??null
  invariant(provenancePrompt===null||HASH.test(provenancePrompt),'INVALID_PROVENANCE','Provider prompt provenance is invalid',422)
  if(promptSha!==null){invariant(HASH.test(promptSha),'INVALID_PROVENANCE','Expected prompt hash is invalid',422);if(provenancePrompt!==null)invariant(provenancePrompt===promptSha,'INVALID_PROVENANCE','Provider prompt provenance does not match the approved prompt',422)}
  return {provider,status:'COMPLETED',artifact_sha256:artifactSha,test,generation_attempt_id:generationAttemptId||null,estimate:{credits:estimate.credits??null,cost:estimate.cost??null,currency:estimate.currency??null,kind:estimate.kind??null,pricing_checked_at:estimate.pricing_checked_at??null},spend_approval:provenance.paid?{id:spendApproval.id,scope_sha:spendApproval.scope_sha,approved_by:spendApproval.approved_by,created_at:spendApproval.created_at,usage_reservation_id:spendApproval.usage_reservation_id||null,budget:spendApproval.budget?structuredClone(spendApproval.budget):null}:null,provenance:{adapter:provider,provider_model:provenance.provider_model??null,generation_kind:generationKind,prompt_sha256:provenancePrompt,used_sources:sources,brand_assets:publicBrandAssets,reference_assets:publicReferences,synthetic:provenance.synthetic,paid:provenance.paid,test,external_review:provenance.external_review===true,automatic_social_publish:provenance.automatic_social_publish===true}}
}
export function publicProviderExecution(value) {
  if(!value||typeof value!=='object')return null
  const p=value.provenance||{}
  return {provider:value.provider,status:value.status,artifact_sha256:value.artifact_sha256,test:value.test,generation_attempt_id:value.generation_attempt_id??null,estimate:{credits:value.estimate?.credits??null,cost:value.estimate?.cost??null,currency:value.estimate?.currency??null,kind:value.estimate?.kind??null,pricing_checked_at:value.estimate?.pricing_checked_at??null},spend_approval:value.spend_approval?{id:value.spend_approval.id,scope_sha:value.spend_approval.scope_sha,approved_by:value.spend_approval.approved_by,created_at:value.spend_approval.created_at,usage_reservation_id:value.spend_approval.usage_reservation_id||null,budget:value.spend_approval.budget?structuredClone(value.spend_approval.budget):null}:null,provenance:{adapter:p.adapter,provider_model:p.provider_model??null,generation_kind:p.generation_kind??null,prompt_sha256:p.prompt_sha256??null,used_sources:Array.isArray(p.used_sources)?p.used_sources.map(publicSource):[],brand_assets:Array.isArray(p.brand_assets)?p.brand_assets.map(publicBrandAsset):[],reference_assets:Array.isArray(p.reference_assets)?p.reference_assets.map(publicReferenceAsset):[],synthetic:p.synthetic,paid:p.paid,test:p.test,external_review:p.external_review,automatic_social_publish:p.automatic_social_publish===true}}
}
export function publicSourceAssets(values) {
  return (values||[]).map(value=>({...publicSource(value),mime_type:value.mime_type,size_bytes:value.size_bytes,width:value.width,height:value.height,duration_seconds:value.duration_seconds,has_audio:value.has_audio}))
}
