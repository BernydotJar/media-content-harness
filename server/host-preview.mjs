// Adapter for the existing host reconciler's form-session protocol.
// Product authentication and membership remain in the shared versioned API.
import { handleApi } from './http.mjs'
import { ProductError, fields, invariant } from './errors.mjs'
function mapped(request,path,body){const url=new URL(request.url);url.pathname='/api/v1/'+path;const headers=new Headers(request.headers);headers.delete('content-length');if(body!==undefined)headers.set('content-type','application/json');return new Request(url,{method:body===undefined?'GET':'POST',headers,...(body===undefined?{}:{body:JSON.stringify(body)})})}
async function boundedLogin(request){invariant(request.headers.get('content-type')?.split(';')[0]==='application/json','UNSUPPORTED_MEDIA_TYPE','Send JSON input',415);const reader=request.body?.getReader();let size=0;const chunks=[];if(reader)try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;invariant(size<=2048,'BODY_TOO_LARGE','Login input is too large',413);chunks.push(value)}}catch(e){await reader.cancel().catch(()=>{});throw e}let body;try{body=JSON.parse(Buffer.concat(chunks).toString())}catch{throw new ProductError('INVALID_JSON','Send valid login input')};fields(body,['identifier','email','username','dpi','password','tenant_id','locale','next']);invariant(body.locale===undefined||['en','es'].includes(body.locale),'INVALID_INPUT','Unsupported locale');invariant(body.next===undefined||['/es','/en','/dashboard','/'].includes(body.next),'INVALID_INPUT','Unsupported entry path');return Object.fromEntries(['identifier','email','username','dpi','password','tenant_id'].filter(k=>body[k]!==undefined).map(k=>[k,body[k]]))}
export async function handlePreview(request,service){
 const path=new URL(request.url).pathname
 try{
  if(path==='/api/preview/login'&&request.method==='POST')return await handleApi(mapped(request,'auth/login',await boundedLogin(request)),service)
  if(path==='/api/preview/logout'&&request.method==='POST'){const response=await handleApi(mapped(request,'auth/logout',{}),service);if(!response.ok)return response;const headers=new Headers(response.headers);headers.set('location','/login');headers.delete('content-type');return new Response(null,{status:303,headers})}
  if(['/api/preview/session','/api/preview/workspace-status'].includes(path)&&request.method==='GET'){
   const response=await handleApi(mapped(request,'me'),service)
   if(!response.ok){if(path.endsWith('/session')&&request.headers.get('accept')?.includes('text/html')&&response.status===401)return new Response(null,{status:303,headers:{location:'/login','cache-control':'no-store'}});return response}
   return Response.json(path.endsWith('/workspace-status')?{authorized:true,scope:'controlled_single_operator_preview'}:{authorized:true},{headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}})
  }
  return Response.json({error:{code:'NOT_FOUND',message:'Route not found'}},{status:404})
 }catch(error){return Response.json({error:{code:error instanceof ProductError?error.code:'INTERNAL_ERROR',message:error instanceof ProductError?error.message:'The request could not be completed'}},{status:error instanceof ProductError?error.status:500,headers:{'cache-control':'no-store'}})}
}
