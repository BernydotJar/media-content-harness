import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { createHash, randomBytes, scryptSync } from 'node:crypto'
import { createService } from '../server/services.mjs'
import { handleApi } from '../server/http.mjs'
import { ProductError } from '../server/errors.mjs'

async function fixture(t,bytes=Buffer.from('0123456789')){
 const root=await mkdtemp('/tmp/media-artifact-ranges-');t.after(()=>rm(root,{recursive:true,force:true}))
 const salt=randomBytes(24).toString('hex'),password='isolated range test',hash=scryptSync(password,Buffer.from(salt,'hex'),64).toString('hex')
 const users=[{id:'viewer',email:'viewer@example.com',password:{salt,hash},memberships:[{tenant_id:'studio',role:'viewer'}]},{id:'outside',email:'outside@example.com',password:{salt,hash},memberships:[]}]
 const identityFile=join(root,'identities.json');await writeFile(identityFile,JSON.stringify({users}))
 const sha256=createHash('sha256').update(bytes).digest('hex');let calls=0,failure=null
 const service=createService({dataRoot:join(root,'data'),identityFile,publicOrigin:'http://localhost',execution:{async artifact(actor,id,artifactId){calls++;assert.equal(actor.id,'viewer');assert.equal(id,'job_one');assert.equal(artifactId,'artifact_one');if(failure)throw failure;return {bytes,mime_type:'video/mp4',filename:'safe video.mp4',sha256}}}})
 await service.repository.transact(s=>{s.jobs.job_one={id:'job_one',tenant_id:'studio'};return null})
 const inside=await service.auth.login({email:users[0].email,password,tenant_id:'studio'}),outside=await service.auth.login({email:users[1].email,password})
 const request=(headers={},session=inside.token)=>handleApi(new Request('http://localhost/api/v1/jobs/job_one/artifacts/artifact_one',{headers:{...(session?{cookie:'media_factory_session='+session}:{}),...headers}}),service)
 return {request,bytes,sha256,etag:'"'+sha256+'"',users,identityFile,outside:outside.token,calls:()=>calls,fail(error){failure=error}}
}
async function assertBody(response,expected){assert.deepEqual(Buffer.from(await response.arrayBuffer()),Buffer.from(expected))}
test('artifact download advertises byte ranges and preserves full-file integrity metadata',async t=>{
 const f=await fixture(t),res=await f.request();assert.equal(res.status,200);assert.equal(res.headers.get('accept-ranges'),'bytes');assert.equal(res.headers.get('content-length'),'10');assert.equal(res.headers.get('content-range'),null);assert.equal(res.headers.get('etag'),f.etag);assert.equal(res.headers.get('cache-control'),'private, no-store');assert.equal(res.headers.get('content-type'),'video/mp4');assert.equal(res.headers.get('x-content-type-options'),'nosniff');assert.equal(res.headers.get('content-disposition'),'inline; filename="safe_video.mp4"');await assertBody(res,f.bytes)
})
test('single ranges return exact closed, open-ended and suffix bytes with clamped boundaries',async t=>{
 const f=await fixture(t)
 for(const [range,expected,contentRange] of [['bytes=0-0','0','bytes 0-0/10'],['bytes=2-5','2345','bytes 2-5/10'],['bytes=8-','89','bytes 8-9/10'],['bytes=-3','789','bytes 7-9/10'],['bytes=8-100','89','bytes 8-9/10'],['bytes=-100','0123456789','bytes 0-9/10'],['BYTES=01-002','12','bytes 1-2/10'],['bytes=0-9007199254740999999999999999999999999999','0123456789','bytes 0-9/10'],['bytes=-9007199254740999999999999999999999999999','0123456789','bytes 0-9/10']]){
  const res=await f.request({range});assert.equal(res.status,206,range);assert.equal(res.headers.get('content-range'),contentRange,range);assert.equal(res.headers.get('content-length'),String(expected.length));assert.equal(res.headers.get('etag'),f.etag);await assertBody(res,expected)
 }
})
test('invalid and unsatisfiable single byte ranges return bounded 416 responses',async t=>{
 const f=await fixture(t)
 for(const range of ['bytes=10-','bytes=100-200','bytes=9-1','bytes=-0','bytes=-','bytes=','bytes=one-two','bytes=1.5-2','bytes=+1-2','bytes=1--2','bytes=1-2,invalid','bytes=9007199254740999999999999999999999999999-','bytes='+ '9'.repeat(8200)+'-']){
  const res=await f.request({range});assert.equal(res.status,416,range.slice(0,80));assert.equal(res.headers.get('content-range'),'bytes */10');assert.equal(res.headers.get('content-length'),'0');assert.equal(res.headers.get('etag'),f.etag);await assertBody(res,'')
 }
 const empty=await fixture(t,Buffer.alloc(0)),res=await empty.request({range:'bytes=0-'});assert.equal(res.status,416);assert.equal(res.headers.get('content-range'),'bytes */0');await assertBody(res,'')
})
test('If-Range requires the strong current ETag; unknown units and multipart fall back to full bytes',async t=>{
 const f=await fixture(t)
 const matched=await f.request({range:'bytes=2-3','if-range':f.etag});assert.equal(matched.status,206);await assertBody(matched,'23')
 for(const headers of [{range:'bytes=2-3','if-range':'"old"'},{range:'bytes=2-3','if-range':'W/'+f.etag},{range:'bytes=2-3','if-range':'Sat, 12 Sep 2026 00:00:00 GMT'},{range:'bytes=invalid','if-range':'"old"'},{'if-range':f.etag},{range:'items=0-1'},{range:'bytes=0-1, 4-5'}]){
  const res=await f.request(headers);assert.equal(res.status,200);assert.equal(res.headers.get('content-range'),null);await assertBody(res,f.bytes)
 }
})
test('range requests enforce fresh session and tenant authorization before revealing metadata',async t=>{
 const f=await fixture(t)
 for(const [session,status] of [[null,401],[f.outside,403]]){const res=await f.request({range:'bytes=9999-','if-range':f.etag},session);assert.equal(res.status,status);assert.equal(res.headers.get('content-range'),null);assert.equal(res.headers.get('etag'),null);const text=await res.text();assert.equal(text.includes(f.sha256),false)}
 assert.equal(f.calls(),0)
 f.users[0].disabled=true;await writeFile(f.identityFile,JSON.stringify({users:f.users}));const revoked=await f.request({range:'bytes=0-1'});assert.equal(revoked.status,401);assert.equal(f.calls(),0)
})
test('range processing cannot bypass the artifact integrity gate',async t=>{
 const f=await fixture(t);f.fail(new ProductError('ARTIFACT_CHANGED','Artifact integrity check failed',409))
 for(const range of ['bytes=0-1','bytes=999-']){const res=await f.request({range});assert.equal(res.status,409);assert.equal(res.headers.get('content-range'),null);assert.equal(res.headers.get('etag'),null);assert.equal((await res.json()).error.code,'ARTIFACT_CHANGED')}
})
