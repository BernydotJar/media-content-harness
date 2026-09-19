import {isIP} from 'node:net'
import {lookup as dnsLookup} from 'node:dns/promises'
import {ProductError,invariant} from './errors.mjs'

const API_ORIGIN='https://api.higgsfield.ai'
const MODEL='bytedance/seedance-2.5/text-to-video'
const MODEL_ENDPOINT=API_ORIGIN+'/'+MODEL
const TERMINAL=new Set(['completed','failed','nsfw','canceled'])
const ALL_STATUS=new Set(['queued','in_progress','completed','failed','nsfw','canceled'])
const CATALOG_MAX_USD_PER_SECOND=0.3236
const CATALOG_CHECKED_AT='2026-09-18'
const MAX_JSON_BYTES=128*1024
const MAX_MEDIA_BYTES=40*1024*1024
const TIMEOUT_MS=60_000
const OUTPUT_TIMEOUT_MS=120_000

function roundMoney(value){return Math.round(value*10000)/10000}
function providerError(status,body=''){
 if(status===401)return new ProductError('PROVIDER_CREDENTIAL_INVALID','Higgsfield rejected the configured API credential.',409)
 if(status===402||status===403)return new ProductError('PROVIDER_CREDITS_REQUIRED','Higgsfield could not authorize this paid request. Check API access and credits.',409)
 if(status===422)return new ProductError('PROVIDER_REQUEST_INVALID','Higgsfield rejected the generation request.',422)
 if(status===429)return new ProductError('PROVIDER_RATE_LIMITED','Higgsfield is temporarily rate limited. Retry later without changing this job.',503)
 if(status>=500)return new ProductError('PROVIDER_TEMPORARY_UNAVAILABLE','Higgsfield is temporarily unavailable. Retry this same request later.',503)
 return new ProductError('PROVIDER_REQUEST_FAILED','Higgsfield request failed'+(body?'.':''),502)
}
function credentialParts(value){
 invariant(typeof value==='string'&&value.length>=3&&value.length<=4096&&!/[\r\n\0]/.test(value),'PROVIDER_CREDENTIAL_MISSING','Configure the Higgsfield API credential before using this provider.',409)
 const split=value.indexOf(':')
 invariant(split>0&&split<value.length-1,'PROVIDER_CREDENTIAL_INVALID','Higgsfield credentials must use KEY_ID:KEY_SECRET format.',409)
 return value
}
function safeRequestId(value){invariant(typeof value==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9-]{7,127}$/.test(value),'PROVIDER_RESPONSE_INVALID','Higgsfield did not return a valid request ID.',502);return value}
function statusUrl(requestId){return API_ORIGIN+'/requests/'+encodeURIComponent(safeRequestId(requestId))+'/status'}
function publicAddress(address){const host=String(address||'').toLowerCase().replace(/^\[|\]$/g,'');const ip=isIP(host);if(ip===4){const [a,b]=host.split('.').map(Number);return !(a===0||a===10||a===127||a>=224||(a===169&&b===254)||(a===172&&b>=16&&b<=31)||(a===192&&[0,168].includes(b))||(a===100&&b>=64&&b<=127)||a===198)}if(ip===6)return !(/^(::|fc|fd|ff|fe[89ab]|2001:db8)/i.test(host)||host.includes('.'));return false}
function safeOutputUrl(value){
 let url;try{url=new URL(value)}catch{throw new ProductError('PROVIDER_OUTPUT_INVALID','Higgsfield returned an invalid media URL.',502)}
 invariant(url.protocol==='https:'&&!url.username&&!url.password&&url.port!=='9222'&&url.port!=='9223','PROVIDER_OUTPUT_INVALID','Provider media must use a credential-free HTTPS URL.',502)
 const host=url.hostname.toLowerCase().replace(/^\[|\]$/g,'').replace(/\.$/,'');invariant(host&&host!=='localhost'&&!host.endsWith('.localhost')&&!host.endsWith('.local')&&!/(^|\.)(internal|invalid|test)$/.test(host)&&(host.includes('.')||isIP(host)),'PROVIDER_OUTPUT_INVALID','Provider media URL is not public.',502)
 if(isIP(host))invariant(publicAddress(host),'PROVIDER_OUTPUT_INVALID','Provider media URL is not public.',502)
 return url.toString()
}
async function jsonResponse(response){
 const declared=Number(response.headers?.get?.('content-length')||0);invariant(!declared||declared<=MAX_JSON_BYTES,'PROVIDER_RESPONSE_INVALID','Provider response is unexpectedly large.',502)
 const text=await response.text();invariant(Buffer.byteLength(text)<=MAX_JSON_BYTES,'PROVIDER_RESPONSE_INVALID','Provider response is unexpectedly large.',502)
 if(!response.ok)throw providerError(response.status,text)
 let value;try{value=JSON.parse(text)}catch{throw new ProductError('PROVIDER_RESPONSE_INVALID','Higgsfield returned malformed JSON.',502)}
 invariant(value&&typeof value==='object'&&!Array.isArray(value),'PROVIDER_RESPONSE_INVALID','Higgsfield response is malformed.',502)
 return value
}
function mappedStatus(value){invariant(ALL_STATUS.has(value),'PROVIDER_RESPONSE_INVALID','Higgsfield returned an unknown generation status.',502);return value}
function telemetry(response,observedAt){return {source:'provider',provider:'higgsfield',request_id:safeRequestId(response.request_id),status:mappedStatus(response.status),kind:'status',percent:null,observed_at:observedAt}}

export class HiggsfieldSeedanceAdapter {
 constructor({credentialResolver,fetchImpl=globalThis.fetch,lookupImpl=dnsLookup,clock=()=>Date.now()}={}){this.credentialResolver=credentialResolver;this.fetch=fetchImpl;this.lookup=lookupImpl;this.clock=clock}
 capabilities(){return {strategies:['GENERATIVE'],paid:true,automatic_social_publish:false,async:true,provider:'higgsfield',model:MODEL,text_to_video:true,reference_to_video:false,authoritative_numeric_progress:false}}
 estimate(input){
  const duration=Number(input.job?.scene_request?.output?.duration_seconds??input.job?.target?.duration_seconds?.[0]??0)
  invariant(Number.isFinite(duration)&&duration>=4&&duration<=30,'PROVIDER_DURATION_UNSUPPORTED','Seedance 2.5 video duration must be between 4 and 30 seconds.',409)
  return {credits:null,cost:roundMoney(duration*CATALOG_MAX_USD_PER_SECOND),currency:'USD',kind:'CATALOG_UPPER_BOUND',pricing_checked_at:CATALOG_CHECKED_AT,rate_usd_per_second:CATALOG_MAX_USD_PER_SECOND,note:'Conservative upper-bound estimate from the Higgsfield Seedance 2.5 catalog; final provider billing may differ.'}
 }
 async prepare(input){
  invariant(input?.job?.creation_mode==='GUIDED_SCENE','PROVIDER_CAPABILITY','Higgsfield V9 currently supports structured Scene Builder video jobs only.',409)
  invariant(input.job.scene_request?.output?.medium==='video','PROVIDER_CAPABILITY','Higgsfield V9 currently supports video output only.',409)
  invariant(input.job.mascot!==true&&!input.mascotAsset,'PROVIDER_REFERENCE_UPLOAD_REQUIRED','This scene requires a character reference. Use reviewed external generation until provider media upload is implemented.',409)
  invariant((input.job.prompt_compilation?.reference_roles||[]).length===0,'PROVIDER_REFERENCE_UPLOAD_REQUIRED','This scene contains reference media. Use reviewed external generation until provider media upload is implemented.',409)
  const prompt=input.job.prompt_compilation?.final_prompt
  invariant(typeof prompt==='string'&&prompt.length>0&&prompt.length<=12000,'PROVIDER_REQUEST_INVALID','The compiled prompt is missing or too long for provider execution.',422)
  const duration=Number(input.job.scene_request.output.duration_seconds),aspect_ratio=input.job.scene_request.output.aspect_ratio
  invariant(Number.isInteger(duration)&&duration>=4&&duration<=30,'PROVIDER_DURATION_UNSUPPORTED','Seedance 2.5 video duration must be between 4 and 30 seconds.',409)
  invariant(['9:16','16:9','1:1'].includes(aspect_ratio),'PROVIDER_CAPABILITY','This output aspect ratio is not enabled for Seedance 2.5 in Media Factory.',409)
  return {...input,provider_request:{prompt,duration,resolution:'720p',aspect_ratio,output_format:'mp4',generate_audio:true},provider_model:MODEL}
 }
 async credential(){return credentialParts(await this.credentialResolver?.())}
 async ready(){await this.credential();return true}
 async generate(input){
  const credential=await this.credential(),headers={Authorization:'Key '+credential,'Content-Type':'application/json'}
  let response
  try{response=await this.fetch(MODEL_ENDPOINT,{method:'POST',headers,body:JSON.stringify(input.provider_request),signal:AbortSignal.timeout(TIMEOUT_MS),redirect:'error'})}
  catch(error){if(error instanceof ProductError)throw error;const failure=new ProductError('PROVIDER_SUBMISSION_UNKNOWN','The Higgsfield submission outcome is unknown. Media Factory will not submit again automatically to avoid duplicate spend.',503);failure.submission_unknown=true;throw failure}
  const value=await jsonResponse(response),requestId=safeRequestId(value.request_id),status=mappedStatus(value.status)
  if(value.status_url)invariant(new URL(value.status_url).toString()===statusUrl(requestId),'PROVIDER_RESPONSE_INVALID','Higgsfield returned an unexpected status URL.',502)
  return {provider:'higgsfield',provider_model:MODEL,request_id:requestId,status,status_url:statusUrl(requestId),telemetry:telemetry({...value,request_id:requestId,status},new Date(this.clock()).toISOString())}
 }
 async poll(value){
  const requestId=safeRequestId(value.request_id),credential=await this.credential()
  let response;try{response=await this.fetch(statusUrl(requestId),{method:'GET',headers:{Authorization:'Key '+credential},signal:AbortSignal.timeout(TIMEOUT_MS),redirect:'error'})}catch(error){if(error instanceof ProductError)throw error;throw new ProductError('PROVIDER_STATUS_UNAVAILABLE','Higgsfield status is temporarily unavailable. The existing request will be checked again.',503)}
  const body=await jsonResponse(response);invariant(safeRequestId(body.request_id)===requestId,'PROVIDER_RESPONSE_INVALID','Provider status does not match the submitted request.',502)
  const status=mappedStatus(body.status)
  return {...value,...body,request_id:requestId,status,status_url:statusUrl(requestId),terminal:TERMINAL.has(status),telemetry:telemetry({...body,request_id:requestId,status},new Date(this.clock()).toISOString())}
 }
 async assertPublicOutput(value){const url=safeOutputUrl(value),host=new URL(url).hostname;let addresses;try{addresses=await this.lookup(host,{all:true,verbatim:true})}catch{throw new ProductError('PROVIDER_OUTPUT_UNAVAILABLE','The provider media host could not be resolved safely.',503)}invariant(Array.isArray(addresses)&&addresses.length>0&&addresses.every(v=>publicAddress(v.address)),'PROVIDER_OUTPUT_INVALID','Provider media resolved to a private or reserved address.',502);return url}
 async outputResponse(value){let current=await this.assertPublicOutput(value);for(let redirects=0;redirects<=3;redirects++){let response;try{response=await this.fetch(current,{method:'GET',signal:AbortSignal.timeout(OUTPUT_TIMEOUT_MS),redirect:'manual'})}catch{throw new ProductError('PROVIDER_OUTPUT_UNAVAILABLE','The completed provider video could not be downloaded.',503)}if(response.status>=300&&response.status<400){const location=response.headers?.get?.('location');invariant(location,'PROVIDER_OUTPUT_INVALID','Provider media redirect is missing its destination.',502);current=await this.assertPublicOutput(new URL(location,current).toString());continue}invariant(response.ok,'PROVIDER_OUTPUT_UNAVAILABLE','The completed provider video could not be downloaded.',503);return response}throw new ProductError('PROVIDER_OUTPUT_INVALID','Provider media redirected too many times.',502)}
 async collect(value){
  invariant(value.status==='completed','PROVIDER_PENDING','Provider generation is not complete.',409)
  const response=await this.outputResponse(value.video?.url),declared=Number(response.headers?.get?.('content-length')||0);invariant(!declared||declared<=MAX_MEDIA_BYTES,'INVALID_ARTIFACT','Provider media exceeds the permitted size.',422)
  let bytes;if(response.body?.getReader){const chunks=[];let size=0,reader=response.body.getReader();while(true){const {done,value:chunk}=await reader.read();if(done)break;size+=chunk.byteLength;invariant(size<=MAX_MEDIA_BYTES,'INVALID_ARTIFACT','Provider media exceeds the permitted size.',422);chunks.push(Buffer.from(chunk))}bytes=Buffer.concat(chunks,size)}else bytes=Buffer.from(await response.arrayBuffer())
  invariant(bytes.length>0&&bytes.length<=MAX_MEDIA_BYTES,'INVALID_ARTIFACT','Provider media exceeds the permitted size.',422)
  const mime=(response.headers?.get?.('content-type')||'video/mp4').split(';')[0].trim().toLowerCase();invariant(['video/mp4','video/quicktime'].includes(mime),'INVALID_ARTIFACT','Provider did not return a supported video.',422)
  return {...value,bytes,mime_type:mime,production_note:'Synthetic video generated by Higgsfield Seedance 2.5 after explicit Media Factory spend approval. No automatic publication.'}
 }
 provenance(input){return {adapter:'higgsfield',provider:'higgsfield',provider_model:MODEL,synthetic:true,used_sources:[],brand_assets:[],paid:true,external_review:false,automatic_social_publish:false,prompt_sha256:input.job?.prompt_compilation?.final_prompt_sha256||null}}
}

export const HIGGSFIELD_SEEDANCE_MODEL=MODEL
export const HIGGSFIELD_CATALOG_RATE={max_usd_per_second:CATALOG_MAX_USD_PER_SECOND,checked_at:CATALOG_CHECKED_AT,kind:'CATALOG_UPPER_BOUND'}
