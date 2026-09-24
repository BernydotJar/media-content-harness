import {readFile} from 'node:fs/promises'
import {ProductError,invariant} from './errors.mjs'

const API_ORIGIN='https://generativelanguage.googleapis.com/v1beta'
const MODEL='veo-3.1-fast-generate-preview'
const PRICE_USD_PER_SECOND=0.10
const PRICING_CHECKED_AT='2026-09-24'
const MAX_JSON_BYTES=256*1024
const MAX_MEDIA_BYTES=40*1024*1024
const TIMEOUT_MS=60_000
const OUTPUT_TIMEOUT_MS=120_000

function roundMoney(value){return Math.round(value*10000)/10000}
function credential(value){invariant(typeof value==='string'&&value.length>=8&&value.length<=4096&&!/[\r\n\0]/.test(value),'PROVIDER_CREDENTIAL_MISSING','Configure the Gemini API key before using Veo.',409);return value}
function operationName(value){invariant(typeof value==='string'&&value.length>=8&&value.length<=512&&!value.includes('..')&&/^(?:models\/[a-zA-Z0-9._-]+\/)?operations\/[a-zA-Z0-9._~%-]+$/.test(value),'PROVIDER_RESPONSE_INVALID','Gemini returned an invalid operation ID.',502);return value}
function providerError(status,body=''){
 if(status===400)return new ProductError('PROVIDER_REQUEST_INVALID','Gemini rejected the Veo generation request.',422)
 if(status===401||status===403)return new ProductError('PROVIDER_CREDENTIAL_INVALID','Gemini rejected the configured API credential or project access.',409)
 if(status===429)return new ProductError('PROVIDER_RATE_LIMITED','Gemini Veo is temporarily rate limited. Retry later without changing this job.',503)
 if(status>=500)return new ProductError('PROVIDER_TEMPORARY_UNAVAILABLE','Gemini Veo is temporarily unavailable. Retry this same request later.',503)
 return new ProductError('PROVIDER_REQUEST_FAILED','Gemini Veo request failed'+(body?'.':''),502)
}
async function jsonResponse(response){
 const declared=Number(response.headers?.get?.('content-length')||0);invariant(!declared||declared<=MAX_JSON_BYTES,'PROVIDER_RESPONSE_INVALID','Provider response is unexpectedly large.',502)
 const text=await response.text();invariant(Buffer.byteLength(text)<=MAX_JSON_BYTES,'PROVIDER_RESPONSE_INVALID','Provider response is unexpectedly large.',502)
 if(!response.ok)throw providerError(response.status,text)
 let value;try{value=JSON.parse(text)}catch{throw new ProductError('PROVIDER_RESPONSE_INVALID','Gemini returned malformed JSON.',502)}
 invariant(value&&typeof value==='object'&&!Array.isArray(value),'PROVIDER_RESPONSE_INVALID','Gemini response is malformed.',502)
 return value
}
function outputUri(value){
 let url;try{url=new URL(value)}catch{throw new ProductError('PROVIDER_OUTPUT_INVALID','Gemini returned an invalid video URI.',502)}
 const host=url.hostname.toLowerCase().replace(/\.$/,'')
 invariant(url.protocol==='https:'&&!url.username&&!url.password&&(host==='generativelanguage.googleapis.com'||host.endsWith('.googleapis.com')||host.endsWith('.googleusercontent.com')),'PROVIDER_OUTPUT_INVALID','Gemini returned an untrusted video URI.',502)
 return url.toString()
}
function telemetry(requestId,status,at){return {source:'provider',provider:'gemini',request_id:requestId,status,kind:'status',percent:null,observed_at:at}}
function errorTerminal(value){
 const text=String(value?.error?.message||value?.error?.status||'').toLowerCase()
 return /(safety|policy|blocked|responsible ai)/.test(text)?'nsfw':'failed'
}
async function boundedMedia(response){
 invariant(response.ok,'PROVIDER_OUTPUT_UNAVAILABLE','The completed Gemini video could not be downloaded.',503)
 const declared=Number(response.headers?.get?.('content-length')||0);invariant(!declared||declared<=MAX_MEDIA_BYTES,'INVALID_ARTIFACT','Provider media exceeds the permitted size.',422)
 const bytes=Buffer.from(await response.arrayBuffer());invariant(bytes.length>0&&bytes.length<=MAX_MEDIA_BYTES,'INVALID_ARTIFACT','Provider media exceeds the permitted size.',422)
 const mime=(response.headers?.get?.('content-type')||'video/mp4').split(';')[0].trim().toLowerCase();invariant(['video/mp4','application/octet-stream'].includes(mime),'INVALID_ARTIFACT','Gemini did not return a supported MP4 video.',422)
 return bytes
}

export class GeminiVeoAdapter {
 constructor({credentialResolver,fetchImpl=globalThis.fetch,clock=()=>Date.now()}={}){this.credentialResolver=credentialResolver;this.fetch=fetchImpl;this.clock=clock}
 capabilities(){return {strategies:['GENERATIVE'],paid:true,automatic_social_publish:false,async:true,provider:'gemini',model:MODEL,text_to_video:false,image_to_video:true,reference_to_video:true,multi_reference:true,character_reference:true,environment_reference:true,negative_constraints:true,authoritative_numeric_progress:false}}
 estimate(input){
  const duration=Number(input.job?.scene_request?.output?.duration_seconds??0)
  invariant(duration===8,'PROVIDER_DURATION_UNSUPPORTED','Veo 3.1 reference-image video requires an 8-second output.',409)
  return {credits:null,cost:roundMoney(duration*PRICE_USD_PER_SECOND),currency:'USD',kind:'CATALOG_REFERENCE',pricing_checked_at:PRICING_CHECKED_AT,rate_usd_per_second:PRICE_USD_PER_SECOND,note:'Veo 3.1 Fast 720p reference-video estimate; final provider billing may differ.'}
 }
 async prepare(input){
  invariant(input?.job?.creation_mode==='GUIDED_SCENE','PROVIDER_CAPABILITY','Gemini Veo currently supports structured Scene Builder video jobs only.',409)
  invariant(input.job.scene_request?.output?.medium==='video','PROVIDER_CAPABILITY','Gemini Veo adapter currently supports video output only.',409)
  const duration=Number(input.job.scene_request.output.duration_seconds),aspectRatio=input.job.scene_request.output.aspect_ratio
  invariant(duration===8,'PROVIDER_DURATION_UNSUPPORTED','Veo 3.1 reference-image video requires exactly 8 seconds.',409)
  invariant(['9:16','16:9'].includes(aspectRatio),'PROVIDER_CAPABILITY','Veo 3.1 reference-image video supports 9:16 or 16:9 in Media Factory.',409)
  const prompt=input.job.prompt_compilation?.final_prompt
  invariant(typeof prompt==='string'&&prompt.length>0&&prompt.length<=12000,'PROVIDER_REQUEST_INVALID','The compiled scene prompt is missing or too long for Veo.',422)
  const refs=[]
  for(const ref of input.referenceAssets||[]){
   invariant(ref&&typeof ref.path==='string'&&typeof ref.sha256==='string','PROVIDER_REFERENCE_REQUIRED','A prepared provider reference is invalid.',409)
   const bytes=await readFile(ref.path);invariant(bytes.length>0&&bytes.length<=8*1024*1024,'PROVIDER_REFERENCE_REQUIRED','A provider reference is unavailable or too large.',409)
   const mime=ref.mime_type||'image/png';invariant(['image/png','image/jpeg'].includes(mime),'PROVIDER_REFERENCE_REQUIRED','Veo reference images must be PNG or JPEG.',415)
   refs.push({asset_id:ref.asset_id||ref.id,role:ref.role,sha256:ref.sha256,mime_type:mime,bytes})
  }
  invariant(refs.length>=1&&refs.length<=3,'PROVIDER_REFERENCE_REQUIRED','Character video requires one to three approved reference images.',409)
  invariant(refs.some(r=>r.role==='CHARACTER_IDENTITY_ONLY'),'PROVIDER_REFERENCE_REQUIRED','Character video requires the approved character identity reference.',409)
  return {...input,provider_request:{instances:[{prompt,referenceImages:refs.map(r=>({image:{inlineData:{mimeType:r.mime_type,data:r.bytes.toString('base64')}},referenceType:'asset'}))}],parameters:{aspectRatio,durationSeconds:8,resolution:'720p'}},provider_references:refs.map(({bytes,...r})=>r),provider_model:MODEL}
 }
 async apiKey(){return credential(await this.credentialResolver?.())}
 async ready(){await this.apiKey();return true}
 async request(path,{method='GET',body}={}){
  const key=await this.apiKey();let response
  try{response=await this.fetch(API_ORIGIN+'/'+path,{method,headers:{'x-goog-api-key':key,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(TIMEOUT_MS),redirect:'error'})}
  catch(error){if(error instanceof ProductError)throw error;throw new ProductError(method==='POST'?'PROVIDER_SUBMISSION_UNKNOWN':'PROVIDER_STATUS_UNAVAILABLE',method==='POST'?'The Gemini submission outcome is unknown. Media Factory will not submit again automatically to avoid duplicate spend.':'Gemini operation status is temporarily unavailable.',503)}
  return jsonResponse(response)
 }
 async generate(input){
  const value=await this.request('models/'+MODEL+':predictLongRunning',{method:'POST',body:input.provider_request}),requestId=operationName(value.name)
  return {provider:'gemini',provider_model:MODEL,request_id:requestId,status:'queued',telemetry:telemetry(requestId,'queued',new Date(this.clock()).toISOString())}
 }
 async poll(value){
  const requestId=operationName(value.request_id),body=await this.request(requestId)
  const status=body.done===true?(body.error?errorTerminal(body):'completed'):'in_progress'
  let video_uri=null
  if(status==='completed'){
   video_uri=body.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri||body.response?.generatedVideos?.[0]?.video?.uri||null
   invariant(video_uri,'PROVIDER_RESPONSE_INVALID','Gemini completed without a downloadable video URI.',502)
   video_uri=outputUri(video_uri)
  }
  return {...value,status,terminal:body.done===true,video_uri,error:body.error||null,telemetry:telemetry(requestId,status,new Date(this.clock()).toISOString())}
 }
 async collect(value){
  invariant(value.status==='completed'&&value.video_uri,'PROVIDER_PENDING','Gemini Veo generation is not complete.',409)
  const key=await this.apiKey();let current=outputUri(value.video_uri),response=null
  for(let redirects=0;redirects<=3;redirects++){
   const url=new URL(current),headers=url.hostname==='generativelanguage.googleapis.com'?{'x-goog-api-key':key}:{}
   try{response=await this.fetch(current,{method:'GET',headers,signal:AbortSignal.timeout(OUTPUT_TIMEOUT_MS),redirect:'manual'})}
   catch{throw new ProductError('PROVIDER_OUTPUT_UNAVAILABLE','The completed Gemini video could not be downloaded.',503)}
   if(response.status>=300&&response.status<400){const location=response.headers?.get?.('location');invariant(location,'PROVIDER_OUTPUT_INVALID','Gemini media redirect is missing its destination.',502);current=outputUri(new URL(location,current).toString());continue}
   break
  }
  invariant(response&&!(response.status>=300&&response.status<400),'PROVIDER_OUTPUT_INVALID','Gemini media redirected too many times.',502)
  const bytes=await boundedMedia(response)
  return {...value,bytes,mime_type:'video/mp4',production_note:'Synthetic character video generated by Gemini Veo 3.1 Fast from the exact approved character reference after explicit Media Factory spend approval. No sticker fallback and no automatic publication.'}
 }
 provenance(input){return {adapter:'gemini',provider:'gemini',provider_model:MODEL,generation_kind:'REFERENCE_VIDEO',synthetic:true,used_sources:[],brand_assets:(input.provider_references||[]).filter(r=>r.role==='CHARACTER_IDENTITY_ONLY').map(r=>({asset_id:r.asset_id,sha256:r.sha256,synthetic:false})),reference_assets:(input.provider_references||[]).map(r=>({asset_id:r.asset_id,role:r.role,sha256:r.sha256})),paid:true,external_review:false,automatic_social_publish:false,prompt_sha256:input.job?.prompt_compilation?.final_prompt_sha256||null}}
}

export const GEMINI_VEO_MODEL=MODEL
export const GEMINI_VEO_PRICING={usd_per_second:PRICE_USD_PER_SECOND,checked_at:PRICING_CHECKED_AT,kind:'CATALOG_REFERENCE'}
