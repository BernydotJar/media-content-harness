import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,rm,writeFile,readFile} from 'node:fs/promises'
import {join} from 'node:path'
import {randomBytes,scryptSync} from 'node:crypto'
import {createService} from '../server/services.mjs'
import {handleApi} from '../server/http.mjs'

async function setup(t){
 const root=await mkdtemp('/tmp/media-onboarding-v8-')
 t.after(()=>rm(root,{recursive:true,force:true}))
 const salt=randomBytes(24).toString('hex'),password='v8 onboarding password',hash=scryptSync(password,Buffer.from(salt,'hex'),64).toString('hex')
 const users=[
  {id:'operator',email:'operator@example.com',name:'New Operator',password:{salt,hash},can_create_tenants:true,memberships:[]},
  {id:'member',email:'member@example.com',name:'New Member',password:{salt,hash},memberships:[]}
 ]
 const identityFile=join(root,'identities.json')
 await writeFile(identityFile,JSON.stringify({users}))
 const service=createService({dataRoot:join(root,'data'),identityFile,publicOrigin:'http://localhost:3000'})
 const operator=(await service.auth.login({email:users[0].email,password})).token
 const member=(await service.auth.login({email:users[1].email,password})).token
 return {service,operator,member,password,users}
}

test('first-run completion persists per authenticated user and cannot target another user',async t=>{
 const f=await setup(t)
 assert.deepEqual(await f.service.userOnboarding(f.operator),{status:'NEW',completed_at:null,dismissed_at:null,can_create_tenants:true,tenant_count:0,tenants:[]})
 await assert.rejects(f.service.updateUserOnboarding(f.operator,{action:'complete',user_id:'member'}),{code:'INVALID_INPUT'})
 const completed=await f.service.updateUserOnboarding(f.operator,{action:'complete'})
 assert.equal(completed.status,'COMPLETED')
 assert.ok(completed.completed_at)
 assert.equal((await f.service.userOnboarding(f.operator)).status,'COMPLETED')
 assert.equal((await f.service.userOnboarding(f.member)).status,'NEW')
 const state=await f.service.repository.read()
 assert.ok(state.user_onboarding.operator.completed_at)
 assert.equal(state.user_onboarding.member,undefined)
})

test('onboarding tenant summary exposes only membership-bound safe brand facts',async t=>{
 const f=await setup(t)
 await f.service.createTenant(f.operator,{organization:'Brand One',tenant_id:'brand-one',territory:'Antigua Guatemala',visual_language:'Warm'})
 const own=await f.service.userOnboarding(f.operator)
 assert.equal(own.tenant_count,1)
 assert.deepEqual(own.tenants,[{tenant_id:'brand-one',organization:'Brand One',territory:'Antigua Guatemala',role:'owner',setup_status:'SOURCE_REQUIRED',material_count:0}])
 assert.doesNotMatch(JSON.stringify(own),/runtime_namespace|browser_context_ref/)
 const other=await f.service.userOnboarding(f.member)
 assert.equal(other.tenant_count,0)
 assert.deepEqual(other.tenants,[])
})

test('dismissed guide persists without changing tenant authority or membership',async t=>{
 const f=await setup(t)
 const before=await f.service.me(f.member)
 assert.equal(before.can_create_tenants,false)
 await f.service.updateUserOnboarding(f.member,{action:'dismiss'})
 const after=await f.service.me(f.member)
 assert.deepEqual(after.memberships,before.memberships)
 assert.equal(after.can_create_tenants,false)
 const guide=await f.service.userOnboarding(f.member)
 assert.equal(guide.status,'DISMISSED')
 assert.ok(guide.dismissed_at)
})

test('repository upgrades older state documents with user_onboarding lazily',async t=>{
 const f=await setup(t)
 const file=join(f.service.repository.root,'state.json')
 const state=JSON.parse(await readFile(file,'utf8'))
 delete state.user_onboarding
 await writeFile(file,JSON.stringify(state))
 const upgraded=await f.service.repository.read()
 assert.deepEqual(upgraded.user_onboarding,{})
})


test('onboarding HTTP remains authenticated and CSRF-protected',async t=>{
 const f=await setup(t)
 const anon=await handleApi(new Request('http://localhost:3000/api/v1/me/onboarding'),f.service)
 assert.equal(anon.status,401)
 const goodHeaders={cookie:'media_factory_session='+f.operator,Origin:'http://localhost:3000','Sec-Fetch-Site':'same-origin'}
 const get=await handleApi(new Request('http://localhost:3000/api/v1/me/onboarding',{headers:goodHeaders}),f.service)
 assert.equal(get.status,200)
 assert.equal((await get.json()).data.status,'NEW')
 const bad=await handleApi(new Request('http://localhost:3000/api/v1/me/onboarding',{method:'POST',headers:{...goodHeaders,Origin:'https://evil.example','Content-Type':'application/json'},body:JSON.stringify({action:'complete'})}),f.service)
 assert.equal(bad.status,403)
 const post=await handleApi(new Request('http://localhost:3000/api/v1/me/onboarding',{method:'POST',headers:{...goodHeaders,'Content-Type':'application/json'},body:JSON.stringify({action:'complete'})}),f.service)
 assert.equal(post.status,200)
 assert.equal((await post.json()).data.status,'COMPLETED')
})


test('legacy active users are recognized as returning instead of being force-onboarded',async t=>{
 const f=await setup(t)
 await f.service.createTenant(f.operator,{organization:'Existing Brand',tenant_id:'existing-brand'})
 const guide=await f.service.userOnboarding(f.operator)
 assert.equal(guide.status,'RETURNING')
 assert.equal(guide.tenant_count,1)
 assert.equal((await f.service.userOnboarding(f.member)).status,'NEW')
})
