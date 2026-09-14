import { randomUUID } from 'node:crypto'
import { ProductError, invariant, fields } from './errors.mjs'
import { getService } from './singleton.mjs'
const COOKIE='media_factory_session'
const encoder=new TextEncoder()
function token(request){const cookie=request.headers.get('cookie')||'';const parts=cookie.split(';').map(v=>v.trim()).filter(v=>v.startsWith(COOKIE+'='));return parts.length===1?parts[0].slice(COOKIE.length+1):null}
function response(data,status=200,headers={}){return Response.json({data},{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff',...headers}})}
function cookie(value,secure,clear=false){return COOKIE+'='+value+'; Path=/; HttpOnly; SameSite=Strict; Max-Age='+(clear?'0':'43200')+(secure?'; Secure':'')}
async function bodyBytes(request,max){const declared=request.headers.get('content-length');invariant(!declared||(/^\d+$/.test(declared)&&Number(declared)<=max),'BODY_TOO_LARGE','Request body is too large',413);const reader=request.body?.getReader();if(!reader)return Buffer.alloc(0);let length=0;const chunks=[];try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;invariant(length<=max,'BODY_TOO_LARGE','Request body is too large',413);chunks.push(value)}}catch(e){await reader.cancel().catch(()=>{});throw e}return Buffer.concat(chunks)}
async function jsonBody(request){invariant(request.headers.get('content-type')?.split(';')[0]==='application/json','UNSUPPORTED_MEDIA_TYPE','Send JSON input',415);const bytes=await bodyBytes(request,256*1024);let value;try{value=JSON.parse(bytes.toString('utf8'))}catch{throw new ProductError('INVALID_JSON','Request body must contain valid JSON')};invariant(value&&typeof value==='object'&&!Array.isArray(value),'INVALID_INPUT','Expected a JSON object');return value}
function csrf(request,publicOrigin){if(['GET','HEAD','OPTIONS'].includes(request.method))return;const origin=request.headers.get('origin');const expected=publicOrigin||new URL(request.url).origin;invariant(origin===expected&&request.headers.get('sec-fetch-site')!=='cross-site','CSRF_REJECTED','Request must come from this application',403)}
// RFC 9110: unsupported units/multipart requests fall back to the full representation.
// Parse decimal offsets without rounding even when a client exceeds JS safe integers.
function singleByteRange(value,size){
 if(value===null)return null
 const unit=value.match(/^([^=]+)=/)
 if(unit&&unit[1].toLowerCase()!=='bytes')return null
 if(value.length>8192)return false
 const spec=value.match(/^bytes=(.*)$/i)
 if(!spec)return false
 const ranges=spec[1].split(',').map(part=>part.trim())
 const parsed=[]
 for(const range of ranges){
  const match=range.match(/^(\d*)-(\d*)$/)
  if(!match||(!match[1]&&!match[2]))return false
  const first=match[1]?BigInt(match[1]):null,last=match[2]?BigInt(match[2]):null
  if(first!==null&&last!==null&&first>last)return false
  parsed.push({first,last})
 }
 if(parsed.length!==1)return null
 const {first,last}=parsed[0],length=BigInt(size)
 if(length===0n)return false
 if(first===null){if(last===0n)return false;return {start:Number(last>=length?0n:length-last),end:size-1}}
 if(first>=length)return false
 return {start:Number(first),end:Number(last===null||last>=length?length-1n:last)}
}
function artifactResponse(request,artifact){
 const bytes=artifact.bytes,size=bytes.byteLength,etag='"'+artifact.sha256+'"'
 const headers={'content-type':artifact.mime_type,'content-disposition':'inline; filename="'+String(artifact.filename||'video.mp4').replace(/[^a-zA-Z0-9._-]/g,'_')+'"','cache-control':'private, no-store','x-content-type-options':'nosniff','etag':etag,'accept-ranges':'bytes','content-length':String(size)}
 // No Last-Modified validator is published; dates and weak/mismatched tags cannot match.
 const ifRange=request.headers.get('if-range')
 const range=ifRange!==null&&ifRange!==etag?null:singleByteRange(request.headers.get('range'),size)
 if(range===false)return new Response(null,{status:416,headers:{...headers,'content-range':'bytes */'+size,'content-length':'0'}})
 if(range){const {start,end}=range;return new Response(bytes.subarray(start,end+1),{status:206,headers:{...headers,'content-range':'bytes '+start+'-'+end+'/'+size,'content-length':String(end-start+1)}})}
 return new Response(bytes,{headers})
}
export async function handleApi(request,service){
 const requestId=randomUUID();const url=new URL(request.url);const session=token(request)
 try{
 service ||= getService(); const secure=(service.options.publicOrigin||url.origin).startsWith('https:')
 csrf(request,service.options.publicOrigin)
 let route;try{route=decodeURIComponent(url.pathname)}catch{throw new ProductError('INVALID_PATH','Request path is invalid')};invariant(!route.includes('..')&&!route.includes('\\')&&!route.includes('\0'),'INVALID_PATH','Request path is invalid');const path=route.replace(/^\/api\/v1\/?/,'').split('/').filter(Boolean);const method=request.method
 if((route==='/health'||route==='/api/v1/health')&&method==='GET'){const health=await service.health();return response(health,health.status==='ready'?200:503)}
 invariant(route.startsWith('/api/v1/'),'NOT_FOUND','API route was not found',404)
 if(path.join('/')==='auth/login'&&method==='POST'){const input=await jsonBody(request);fields(input,['email','username','password']);const result=await service.auth.login(input);return response(result.user,200,{'set-cookie':cookie(result.token,secure),'x-request-id':requestId})}
 if(path.join('/')==='auth/logout'&&method==='POST'){fields(await jsonBody(request),[]);await service.auth.logout(session);return response({signed_out:true},200,{'set-cookie':cookie('',secure,true)})}
 if(path[0]==='me'&&path.length===1&&method==='GET')return response(await service.me(session))
 if(path[0]==='providers'&&path.length===1&&method==='GET')return response(await service.providerList(session))
 if(path[0]==='admin'&&path[1]==='integrations'){if(path.length===2&&method==='GET')return response(await service.integrations(session));if(path.length===3&&method==='POST')return response(await service.updateIntegration(session,path[2],await jsonBody(request)))}
 if(path[0]==='tenants'){
   if(path.length===1){if(method==='GET')return response(await service.listTenants(session));if(method==='POST')return response(await service.createTenant(session,await jsonBody(request)),201)}
   const id=path[1]
   if(path.length===2&&method==='GET')return response(await service.getTenant(session,id))
   if(path[2]==='brand-profile'&&path.length===3&&method==='GET')return response(await service.brandProfile(session,id))
   if(path[2]==='brand-characters'&&path.length===3&&method==='GET')return response(await service.brandCharacters(session,id))
   if(path[2]==='brand-assets'&&path.length===4&&method==='GET'){const asset=await service.brandAsset(session,id,path[3]);return artifactResponse(request,{...asset,filename:asset.asset_id+'.png'})}
   if(path[2]==='scene-presets'&&path.length===3&&method==='GET')return response(await service.scenePresets(session,id))
   if(path[2]==='scenes'&&path.length===3&&method==='POST')return response(await service.createScene(session,id,await jsonBody(request)),202)
   if(path[2]==='scenes'&&path[3]==='preview'&&path.length===4&&method==='POST')return response(await service.previewScene(session,id,await jsonBody(request)))
   if(path[2]==='scene-references'&&path.length===4&&method==='POST'){const bytes=await bodyBytes(request,8*1024*1024);return response(await service.uploadSceneReference(session,id,path[3],{bytes,mime_type:request.headers.get('content-type')?.split(';')[0]}),201)}
   if(path[2]==='scene-references'&&path.length===4&&method==='GET'){const asset=await service.sceneReference(session,id,path[3]);return artifactResponse(request,{...asset,filename:asset.asset_id+(asset.mime_type==='image/jpeg'?'.jpg':'.png')})}
   if(path[2]==='journey'&&path.length===3&&method==='GET')return response(await service.journey(session,id))
   if(path[2]==='creative-profiles'&&path.length===3){if(method==='GET')return response(await service.creativeProfiles(session,id));if(method==='POST')return response(await service.saveCreativeProfile(session,id,await jsonBody(request)),201)}
   if(path[2]==='dashboard'&&path.length===3&&method==='GET')return response(await service.dashboard(session,id))
   if(path[2]==='mascot'&&path.length===3&&method==='POST')return response(await service.setMascot(session,id,await jsonBody(request)))
   if(path[2]==='sources'){
     if(path.length===3){if(method==='GET')return response(await service.sources(session,id));if(method==='POST')return response(await service.addSource(session,id,await jsonBody(request)),201)}
     if(path[4]==='evidence'&&path.length===5&&method==='POST'){await service.getTenant(session,id);const bytes=await bodyBytes(request,8*1024*1024);return response(await service.uploadReferenceEvidence(session,id,path[3],{bytes,mime_type:request.headers.get('content-type')?.split(';')[0]}),201)}
     if(path[4]==='upload'&&path.length===5&&method==='POST'){await service.getTenant(session,id);const bytes=await bodyBytes(request,40*1024*1024);return response(await service.uploadSource(session,id,path[3],{bytes,mime_type:request.headers.get('content-type')?.split(';')[0]}),201)}
   }
   if(path[2]==='content-dna'){if(path.length===3&&method==='GET')return response(await service.contentDNA(session,id));if(path[3]==='analyze'&&path.length===4&&method==='POST')return response(await service.analyzeDNA(session,id,await jsonBody(request)),201)}
   if(path[2]==='free-draft'&&path.length===3&&method==='POST')return response(await service.freeDraft(session,id,await jsonBody(request)))
   if(path[2]==='weekly-plans'){
     if(path.length===3){if(method==='GET')return response(await service.plans(session,id));if(method==='POST')return response(await service.createPlan(session,id,await jsonBody(request)),201)}
     if(path.length===5&&method==='POST'){if(path[4]==='approve')return response(await service.approvePlan(session,id,path[3],await jsonBody(request)));if(path[4]==='launch'){fields(await jsonBody(request),[]);return response(await service.launchPlan(session,id,path[3]),202)}}
   }
 }
 if(path[0]==='jobs'){
   if(path.length===1&&method==='GET')return response(await service.jobs(session,url.searchParams.get('tenant_id')||undefined))
   const id=path[1]
   if(path.length===2&&method==='GET')return response(await service.job(session,id))
   if(path[2]==='external-package'&&path.length===3&&method==='GET')return response(await service.externalPackage(session,id))
   if(path[2]==='external-result'&&path.length===3&&method==='POST'){const bytes=await bodyBytes(request,40*1024*1024);return response(await service.uploadExternalResult(session,id,{bytes,mime_type:request.headers.get('content-type')?.split(';')[0]}),202)}
   if(path.length===3&&method==='POST'&&['approve','request-changes','start','reject'].includes(path[2]))return response(await service.jobAction(session,id,path[2]==='request-changes'?'requestChanges':path[2],await jsonBody(request)),path[2]==='start'?202:200)
   if(path.length===3&&method==='POST'&&path[2]==='repair')return response(await service.repairJob(session,id,await jsonBody(request)),202)
   if(path[2]==='evidence'&&path.length===3&&method==='GET')return response(await service.evidence(session,id))
   if(path[2]==='events'&&path.length===3&&method==='GET')return await eventStream(request,service,session,id)
   if(path[2]==='artifacts'&&path.length===4&&method==='GET'){const artifact=await service.artifact(session,id,path[3]);return artifactResponse(request,artifact)}
 }
 if(path[0]==='releases'&&method==='GET'){if(path.length===1)return response(await service.releases(session,url.searchParams.get('tenant_id')||undefined));if(path.length===2)return response(await service.release(session,path[1]))}
 throw new ProductError('NOT_FOUND','API route was not found',404)
 }catch(error){const known=error instanceof ProductError;if(!known||error.status>=500)console.error(JSON.stringify({service:'media-factory-web',request_id:requestId,error_class:error?.name||'UnknownError',code:known?error.code:'INTERNAL_ERROR'}));return Response.json({error:{code:known?error.code:'INTERNAL_ERROR',message:known?error.message:'The request could not be completed',request_id:requestId}},{status:known?error.status:500,headers:{'cache-control':'no-store','x-request-id':requestId,'x-content-type-options':'nosniff'}})}
}
async function eventStream(request,service,session,id){
 await service.job(session,id);let close=()=>{};const stream=new ReadableStream({start(controller){let done=false;let active=false;let pending=false;let signature='';const send=async()=>{if(done)return;if(active){pending=true;return}active=true;try{const job=await service.job(session,id);const events=await service.events(session,id);const payload=JSON.stringify({job,events});if(payload!==signature){signature=payload;controller.enqueue(encoder.encode('event: product-state\ndata: '+payload+'\n\n'))}else controller.enqueue(encoder.encode(': heartbeat\n\n'))}catch{close()}finally{active=false;if(pending&&!done){pending=false;void send()}}};const unsubscribe=service.repository.subscribe(()=>void send());const timer=setInterval(()=>void send(),15000);close=()=>{if(done)return;done=true;clearInterval(timer);unsubscribe();try{controller.close()}catch{}};request.signal.addEventListener('abort',close,{once:true});void send()},cancel(){close()}});return new Response(stream,{headers:{'content-type':'text/event-stream','cache-control':'no-cache, no-transform','connection':'keep-alive','x-accel-buffering':'no'}})
}
