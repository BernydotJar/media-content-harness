import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,rm,writeFile,readFile,mkdir} from 'node:fs/promises'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {createHash,generateKeyPairSync,randomBytes,scryptSync,sign as cryptoSign} from 'node:crypto'
import {createService} from '../server/services.mjs'
import {AtomicRepository} from '../server/repository.mjs'
import {handleApi} from '../server/http.mjs'
import {GoogleIdentityVerifier} from '../server/google-identity.mjs'

const b64=value=>Buffer.from(JSON.stringify(value)).toString('base64url')
function jwt({privateKey,kid='kid-v10',claims}){const head=b64({alg:'RS256',kid,typ:'JWT'}),body=b64(claims),input=head+'.'+body,sig=cryptoSign('RSA-SHA256',Buffer.from(input),privateKey).toString('base64url');return input+'.'+sig}
function jsonResponse(value,status=200,headers={}){const text=JSON.stringify(value);return{ok:status>=200&&status<300,status,headers:{get:key=>headers[String(key).toLowerCase()]??(String(key).toLowerCase()==='content-length'?String(Buffer.byteLength(text)):null)},text:async()=>text}}

async function googleFixture(t){
 const root=await mkdtemp(join(tmpdir(),'media-v10-google-'));t.after(()=>rm(root,{recursive:true,force:true}))
 const salt=randomBytes(24).toString('hex'),password='owner-password-v10',hash=scryptSync(password,Buffer.from(salt,'hex'),64).toString('hex'),identityFile=join(root,'identities.json')
 await writeFile(identityFile,JSON.stringify({users:[{id:'owner',email:'owner@example.com',name:'Owner',password:{salt,hash},can_create_tenants:true,system_admin:true,memberships:[]}]}))
 const {publicKey,privateKey}=generateKeyPairSync('rsa',{modulusLength:2048}),jwk=publicKey.export({format:'jwk'});Object.assign(jwk,{kid:'kid-v10',alg:'RS256',use:'sig'})
 const clientId='123456789012-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com',clientSecret='v10-client-secret',publicOrigin='https://media.example.org'
 let nonce='',subject='google-coordinator-12345',email='coordinator@gmail.com',name='Coordinador Demo',tokenCalls=0,jwksCalls=0
 const fetchImpl=async(url,init={})=>{
  if(String(url)==='https://oauth2.googleapis.com/token'){tokenCalls++;const body=new URLSearchParams(init.body);assert.equal(body.get('client_id'),clientId);assert.equal(body.get('client_secret'),clientSecret);assert.equal(body.get('grant_type'),'authorization_code');assert.equal(body.get('redirect_uri'),publicOrigin+'/api/v1/auth/google/callback');assert.ok(body.get('code_verifier')?.length>40);const now=Math.floor(Date.now()/1000);return jsonResponse({id_token:jwt({privateKey,claims:{iss:'https://accounts.google.com',aud:clientId,sub:subject,email,email_verified:true,name,iat:now-2,exp:now+3600,nonce}})})}
  if(String(url)==='https://www.googleapis.com/oauth2/v3/certs'){jwksCalls++;return jsonResponse({keys:[jwk]},200,{'cache-control':'public,max-age=300'})}
  throw new Error('unexpected URL '+url)
 }
 const service=createService({dataRoot:join(root,'data'),identityFile,publicOrigin,googleClientId:clientId,googleClientSecret:clientSecret,googleFetch:fetchImpl}),owner=(await service.auth.login({email:'owner@example.com',password})).token
 await service.createTenant(owner,{organization:'FIRMES Antigua',tenant_id:'firmes-antigua',content_context:'community',visual_language:'documental'})
 async function begin(next='/dashboard'){const start=await service.googleStart(next),url=new URL(start.url);nonce=url.searchParams.get('nonce');const state=url.searchParams.get('state'),stored=(await service.repository.read()).oauth_states[createHash('sha256').update(state).digest('hex')];assert.ok(stored);assert.equal(url.searchParams.get('scope'),'openid email profile');assert.equal(url.searchParams.get('code_challenge_method'),'S256');assert.equal(url.searchParams.get('code_challenge'),createHash('sha256').update(stored.code_verifier).digest('base64url'));return{state,url,flow_token:start.flow_token}}
 return{root,service,owner,begin,setNonce(value){nonce=value},setIdentity(value){subject=value.subject;email=value.email;name=value.name||value.email},stats:()=>({tokenCalls,jwksCalls})}
}

test('repository reads pre-V10 state and adds departmental auth collections lazily',async t=>{const root=await mkdtemp(join(tmpdir(),'media-v10-repo-'));t.after(()=>rm(root,{recursive:true,force:true}));await mkdir(root,{recursive:true});await writeFile(join(root,'state.json'),JSON.stringify({version:1,tenants:{},onboarding:{},dna:{},observations:{},plans:{},jobs:{},releases:{},sessions:{},events:[],memberships:{}}));const state=await new AtomicRepository(root).read();assert.deepEqual(state.external_users,{});assert.deepEqual(state.invitations,{});assert.deepEqual(state.oauth_states,{})})

test('Google ID token verification fails closed on signature and every identity-binding claim',async()=>{
 const {publicKey,privateKey}=generateKeyPairSync('rsa',{modulusLength:2048}),jwk=publicKey.export({format:'jwk'});Object.assign(jwk,{kid:'claims-kid',alg:'RS256',use:'sig'});const clientId='123456789012-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com',now=Math.floor(Date.now()/1000),base={iss:'https://accounts.google.com',aud:clientId,sub:'claims-subject-12345',email:'verified@gmail.com',email_verified:true,name:'Verified User',iat:now-2,exp:now+3600,nonce:'nonce-v10'},fetchImpl=async()=>jsonResponse({keys:[jwk]},200,{'cache-control':'public,max-age=300'}),verifier=()=>new GoogleIdentityVerifier({clientId,fetchImpl,clock:()=>Date.now()}),signed=claims=>jwt({privateKey,kid:'claims-kid',claims});assert.equal((await verifier().verify(signed(base),{nonce:'nonce-v10'})).subject,base.sub)
 for(const [label,claims,nonce] of [['issuer',{...base,iss:'https://evil.example'},'nonce-v10'],['audience',{...base,aud:'other-client'},'nonce-v10'],['authorized-party',{...base,aud:[clientId,'second-client']},'nonce-v10'],['expiry',{...base,exp:now-600},'nonce-v10'],['issued-at',{...base,iat:now+600},'nonce-v10'],['nonce',base,'wrong-nonce'],['verified-email',{...base,email_verified:false},'nonce-v10'],['authoritative-email',{...base,email:'person@example.com',email_verified:true},'nonce-v10']])await assert.rejects(verifier().verify(signed(claims),{nonce}),e=>e.code==='GOOGLE_ID_TOKEN_INVALID'||e.code==='GOOGLE_EMAIL_UNVERIFIED'||e.code==='GOOGLE_EMAIL_NOT_AUTHORITATIVE',label)
 const valid=signed(base),parts=valid.split('.');parts[2]=parts[2].slice(0,-2)+(parts[2].endsWith('aa')?'bb':'aa');await assert.rejects(verifier().verify(parts.join('.'),{nonce:'nonce-v10'}),e=>e.code==='GOOGLE_ID_TOKEN_INVALID')
})

test('owner can persist Google OAuth configuration in the private encrypted vault without another deploy',async t=>{
 const f=await googleFixture(t),root=f.root;const configured=await f.service.updateGoogleAuth(f.owner,{client_id:'987654321098-vaultclientabcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com',client_secret:'vault-secret-value-v10'});assert.equal(configured.configured,true);const team=await f.service.team(f.owner,'firmes-antigua');assert.equal(team.can_configure_google,true);assert.equal(team.google_auth.configured,true);assert.equal(team.google_auth.client_id,'987654321098-vaultclientabcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com');assert.equal(JSON.stringify(team).includes('vault-secret-value-v10'),false);const privateState=await readFile(join(root,'data','private-google-auth','state.json'),'utf8');assert.equal(privateState.includes('vault-secret-value-v10'),false);const restarted=createService({dataRoot:join(root,'data'),identityFile:join(root,'identities.json'),publicOrigin:'https://media.example.org',googleFetch:async()=>{throw new Error('not used')}});assert.deepEqual(await restarted.googleAuthConfig(),{available:true});const start=await restarted.googleStart('/dashboard'),url=new URL(start.url);assert.equal(url.searchParams.get('client_id'),'987654321098-vaultclientabcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com')
})

test('corrupted Google OAuth ciphertext fails closed and cannot be silently overwritten',async t=>{
 const f=await googleFixture(t),path=join(f.root,'data','private-google-auth','state.json');await f.service.updateGoogleAuth(f.owner,{client_id:'987654321098-vaultclientabcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com',client_secret:'vault-secret-value-v10'});const stored=JSON.parse(await readFile(path,'utf8'));stored.google.encrypted_secret.value='AA==';await writeFile(path,JSON.stringify(stored));const before=await readFile(path,'utf8');await assert.rejects(f.service.googleAuthConfig(),e=>e.code==='AUTH_VAULT_UNAVAILABLE');await assert.rejects(f.service.updateGoogleAuth(f.owner,{client_id:'987654321098-replacementabcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com',client_secret:'replacement-secret-v10'}),e=>e.code==='AUTH_VAULT_UNAVAILABLE');assert.equal(await readFile(path,'utf8'),before)
})

test('Google OAuth configuration is system-admin only and can be removed without affecting local break-glass login',async t=>{
 const f=await googleFixture(t);await f.service.inviteTeamMember(f.owner,'firmes-antigua',{email:'coordinator@gmail.com',responsibility:'municipal_coordinator'});const flow=await f.begin(),coordinator=await f.service.googleCallback({state:flow.state,code:'coord-for-config',flow_token:flow.flow_token});await assert.rejects(f.service.updateGoogleAuth(coordinator.token,{client_id:'987654321098-otherabcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com',client_secret:'should-not-save'}),e=>e.code==='FORBIDDEN');await f.service.updateGoogleAuth(f.owner,{client_id:'987654321098-vaultclientabcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com',client_secret:'vault-secret-value-v10'});await f.service.updateGoogleAuth(f.owner,{remove:true});assert.deepEqual(await f.service.googleAuthConfig(),{available:true});const local=await f.service.auth.resolve(f.owner);assert.equal(local.auth_provider,'local')
})

test('Google authorization start uses one-time state, PKCE and nonce and callback admits only an invited email',async t=>{
 const f=await googleFixture(t);assert.deepEqual(await f.service.googleAuthConfig(),{available:true});await f.service.inviteTeamMember(f.owner,'firmes-antigua',{email:'coordinator@gmail.com',responsibility:'municipal_coordinator'});const {state,flow_token}=await f.begin('/onboarding'),result=await f.service.googleCallback({state,code:'authorization-code-v10',flow_token});assert.equal(result.next,'/onboarding');assert.equal(result.user.auth_provider,'google');assert.equal(result.user.memberships[0].role,'reviewer');const resolved=await f.service.auth.resolve(result.token);assert.equal(resolved.email,'coordinator@gmail.com');const team=await f.service.team(f.owner,'firmes-antigua');assert.equal(team.invitations.length,0);assert.equal(team.members.find(m=>m.email==='coordinator@gmail.com').responsibility,'Coordinador municipal');await assert.rejects(f.service.googleCallback({state,code:'replay',flow_token}),e=>e.code==='GOOGLE_AUTH_STATE_INVALID');assert.deepEqual(f.stats(),{tokenCalls:1,jwksCalls:1})
})

test('Google HTTP start/callback keeps the OAuth state server-side and returns the regular secure product session',async t=>{
 const f=await googleFixture(t);await f.service.inviteTeamMember(f.owner,'firmes-antigua',{email:'coordinator@gmail.com',responsibility:'municipal_coordinator'});const start=await handleApi(new Request('https://media.example.org/api/v1/auth/google/start?next=%2Fonboarding',{method:'GET'}),f.service);assert.equal(start.status,302);const authorization=new URL(start.headers.get('location'));assert.equal(authorization.origin,'https://accounts.google.com');const state=authorization.searchParams.get('state');assert.ok(state);const stored=(await f.service.repository.read()).oauth_states[createHash('sha256').update(state).digest('hex')];f.setNonce(stored.nonce);const startCookie=start.headers.get('set-cookie'),flowCookie=startCookie.split(';')[0];assert.match(flowCookie,/^media_factory_google_flow=/);const callback=await handleApi(new Request('https://media.example.org/api/v1/auth/google/callback?state='+encodeURIComponent(state)+'&code=http-code-v10',{method:'GET',headers:{cookie:flowCookie}}),f.service);assert.equal(callback.status,303);assert.equal(callback.headers.get('location'),'/onboarding');assert.match(callback.headers.get('set-cookie'),/media_factory_session=[a-f0-9]{64}; Path=\/; HttpOnly; SameSite=Strict; Max-Age=43200; Secure/);const sessionCookie=callback.headers.get('set-cookie').split(';')[0],me=await handleApi(new Request('https://media.example.org/api/v1/me',{headers:{cookie:sessionCookie}}),f.service);assert.equal(me.status,200);assert.equal((await me.json()).data.email,'coordinator@gmail.com')
})

test('Google OAuth state is bound to the browser flow cookie to prevent login CSRF',async t=>{
 const f=await googleFixture(t);await f.service.inviteTeamMember(f.owner,'firmes-antigua',{email:'coordinator@gmail.com',responsibility:'municipal_coordinator'});const a=await f.begin(),b=await f.begin();f.setNonce(a.url.searchParams.get('nonce'));await assert.rejects(f.service.googleCallback({state:a.state,code:'wrong-browser-flow',flow_token:b.flow_token}),e=>e.code==='GOOGLE_AUTH_STATE_INVALID');const result=await f.service.googleCallback({state:a.state,code:'correct-browser-flow',flow_token:a.flow_token});assert.equal(result.user.email,'coordinator@gmail.com')
})

test('first Google login without a pending invitation fails closed after identity verification',async t=>{const f=await googleFixture(t);f.setIdentity({subject:'uninvited-google-999',email:'uninvited@gmail.com'});const {state,flow_token}=await f.begin();await assert.rejects(f.service.googleCallback({state,code:'uninvited-code',flow_token}),e=>e.code==='ACCESS_NOT_INVITED');const snapshot=await f.service.repository.read();assert.equal(Object.keys(snapshot.external_users).length,0)})

test('Google sign-in is unavailable without complete confidential-client configuration',async t=>{const root=await mkdtemp(join(tmpdir(),'media-v10-config-'));t.after(()=>rm(root,{recursive:true,force:true}));const repo=new AtomicRepository(root),service=createService({repository:repo,googleClientId:'123456789012-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com',publicOrigin:'https://media.example.org'});assert.deepEqual(await service.googleAuthConfig(),{available:false});await assert.rejects(service.googleStart(),e=>e.code==='GOOGLE_AUTH_NOT_CONFIGURED')})

test('owner and IT manage non-owner team access while coordinators stay tenant-scoped and non-admin',async t=>{
 const f=await googleFixture(t);await f.service.createTenant(f.owner,{organization:'Otra marca',tenant_id:'otra-marca',content_context:'community',visual_language:'clean'});await f.service.inviteTeamMember(f.owner,'firmes-antigua',{email:'coordinator@gmail.com',responsibility:'municipal_coordinator'});let flow=await f.begin();const coordinator=await f.service.googleCallback({state:flow.state,code:'coord-code',flow_token:flow.flow_token});await assert.rejects(f.service.inviteTeamMember(coordinator.token,'firmes-antigua',{email:'x@gmail.com',responsibility:'it'}),e=>e.code==='FORBIDDEN');await assert.rejects(f.service.team(coordinator.token,'otra-marca'),e=>e.code==='FORBIDDEN');f.setIdentity({subject:'google-it-123456',email:'it@gmail.com',name:'IT Demo'});await f.service.inviteTeamMember(f.owner,'firmes-antigua',{email:'it@gmail.com',responsibility:'it'});flow=await f.begin();const it=await f.service.googleCallback({state:flow.state,code:'it-code',flow_token:flow.flow_token});const managedInvite=await f.service.inviteTeamMember(it.token,'firmes-antigua',{email:'managed-by-it@gmail.com',responsibility:'municipal_coordinator'});assert.equal(managedInvite.status,'PENDING');await assert.rejects(f.service.inviteTeamMember(it.token,'otra-marca',{email:'cross-tenant@gmail.com',responsibility:'municipal_coordinator'}),e=>e.code==='FORBIDDEN');await f.service.revokeInvitation(it.token,'firmes-antigua',managedInvite.id);let team=await f.service.team(f.owner,'firmes-antigua');const itMember=team.members.find(m=>m.email==='it@gmail.com');assert.equal(itMember.role,'admin');await f.service.updateTeamMember(f.owner,'firmes-antigua',itMember.user_id,{responsibility:'municipal_coordinator'});team=await f.service.team(f.owner,'firmes-antigua');assert.equal(team.members.find(m=>m.email==='it@gmail.com').role,'reviewer');await f.service.removeTeamMember(f.owner,'firmes-antigua',itMember.user_id);await assert.rejects(f.service.team(it.token,'firmes-antigua'),e=>e.code==='FORBIDDEN')
})

test('all four non-owner departmental roles are invitation-only and activate only after verified Google sign-in',async t=>{
 const f=await googleFixture(t),cases=[
  ['municipal_coordinator','reviewer','coord-four@gmail.com','role-subject-coord'],
  ['it','admin','it-four@gmail.com','role-subject-it'],
  ['editor','editor','editor-four@gmail.com','role-subject-editor'],
  ['viewer','viewer','viewer-four@gmail.com','role-subject-viewer'],
 ];
 for(const [responsibility,role,email,subject] of cases){
  f.setIdentity({subject,email,name:role});
  const invitation=await f.service.inviteTeamMember(f.owner,'firmes-antigua',{email,responsibility});
  assert.equal(invitation.status,'PENDING');assert.equal(invitation.role,role);
  let team=await f.service.team(f.owner,'firmes-antigua');assert.equal(team.invitations.find(i=>i.email===email)?.role,role);
  const flow=await f.begin(),signedIn=await f.service.googleCallback({state:flow.state,code:'role-'+role,flow_token:flow.flow_token});
  assert.equal(signedIn.user.memberships.find(m=>m.tenant_id==='firmes-antigua')?.role,role);
  team=await f.service.team(f.owner,'firmes-antigua');assert.equal(team.members.find(m=>m.email===email)?.role,role);assert.equal(team.invitations.some(i=>i.email===email),false);
 }
})

test('a stored Google email never grants a new tenant until that email is freshly verified again',async t=>{
 const f=await googleFixture(t);
 f.setIdentity({subject:'stable-google-subject',email:'old-address@gmail.com',name:'Original'});
 await f.service.inviteTeamMember(f.owner,'firmes-antigua',{email:'old-address@gmail.com',responsibility:'municipal_coordinator'});
 let flow=await f.begin(),first=await f.service.googleCallback({state:flow.state,code:'first-login',flow_token:flow.flow_token});
 await f.service.createTenant(f.owner,{organization:'Second Brand',tenant_id:'second-brand',content_context:'community',visual_language:'clean'});
 f.setIdentity({subject:'stable-google-subject',email:'renamed-address@gmail.com',name:'Renamed'});
 const pending=await f.service.inviteTeamMember(f.owner,'second-brand',{email:'old-address@gmail.com',responsibility:'editor'});
 assert.equal(pending.status,'PENDING');
 await assert.rejects(f.service.team(first.token,'second-brand'),e=>e.code==='FORBIDDEN');
 flow=await f.begin();const renamed=await f.service.googleCallback({state:flow.state,code:'renamed-login',flow_token:flow.flow_token});
 assert.equal(renamed.user.email,'renamed-address@gmail.com');
 await assert.rejects(f.service.team(renamed.token,'second-brand'),e=>e.code==='FORBIDDEN');
 let ownerView=await f.service.team(f.owner,'second-brand');assert.equal(ownerView.invitations.find(i=>i.email==='old-address@gmail.com')?.role,'editor');
 f.setIdentity({subject:'new-holder-of-old-address',email:'old-address@gmail.com',name:'New Holder'});
 flow=await f.begin();const admitted=await f.service.googleCallback({state:flow.state,code:'fresh-old-address',flow_token:flow.flow_token});
 assert.equal(admitted.user.memberships.find(m=>m.tenant_id==='second-brand')?.role,'editor');
 ownerView=await f.service.team(f.owner,'second-brand');assert.equal(ownerView.invitations.some(i=>i.email==='old-address@gmail.com'),false);
})

test('pending invitations cannot overwrite memberships and role changes or removals revoke stale invitations',async t=>{
 const f=await googleFixture(t);
 f.setIdentity({subject:'membership-preserve-subject',email:'preserve@gmail.com',name:'Preserve'});
 await f.service.inviteTeamMember(f.owner,'firmes-antigua',{email:'preserve@gmail.com',responsibility:'municipal_coordinator'});
 let flow=await f.begin(),member=await f.service.googleCallback({state:flow.state,code:'preserve-first',flow_token:flow.flow_token});
 const userId=member.user.id;
 let invitation=await f.service.inviteTeamMember(f.owner,'firmes-antigua',{email:'preserve@gmail.com',responsibility:'editor'});
 assert.equal(invitation.status,'PENDING');
 flow=await f.begin();member=await f.service.googleCallback({state:flow.state,code:'preserve-existing',flow_token:flow.flow_token});
 assert.equal(member.user.memberships.find(m=>m.tenant_id==='firmes-antigua')?.role,'reviewer');
 invitation=await f.service.inviteTeamMember(f.owner,'firmes-antigua',{email:'preserve@gmail.com',responsibility:'editor'});assert.equal(invitation.status,'PENDING');
 await f.service.updateTeamMember(f.owner,'firmes-antigua',userId,{responsibility:'viewer'});
 let team=await f.service.team(f.owner,'firmes-antigua');assert.equal(team.members.find(m=>m.user_id===userId)?.role,'viewer');assert.equal(team.invitations.some(i=>i.email==='preserve@gmail.com'),false);
 invitation=await f.service.inviteTeamMember(f.owner,'firmes-antigua',{email:'preserve@gmail.com',responsibility:'editor'});assert.equal(invitation.status,'PENDING');
 await f.service.removeTeamMember(f.owner,'firmes-antigua',userId);
 team=await f.service.team(f.owner,'firmes-antigua');assert.equal(team.members.some(m=>m.user_id===userId),false);assert.equal(team.invitations.some(i=>i.email==='preserve@gmail.com'),false);
 await assert.rejects(f.service.team(member.token,'firmes-antigua'),e=>e.code==='FORBIDDEN');
})

test('team mutation authority is rechecked inside the transaction after an admin is revoked',async t=>{
 const f=await googleFixture(t);
 f.setIdentity({subject:'race-admin-subject',email:'race-admin@gmail.com',name:'Race Admin'});
 await f.service.inviteTeamMember(f.owner,'firmes-antigua',{email:'race-admin@gmail.com',responsibility:'it'});
 let flow=await f.begin(),admin=await f.service.googleCallback({state:flow.state,code:'race-admin-login',flow_token:flow.flow_token});
 const originalTransact=f.service.repository.transact.bind(f.service.repository);let injected=false;
 f.service.repository.transact=async fn=>originalTransact(async state=>{
  if(!injected){injected=true;state.memberships[admin.user.id]=(state.memberships[admin.user.id]||[]).filter(m=>m.tenant_id!=='firmes-antigua')}
  return fn(state)
 });
 await assert.rejects(f.service.inviteTeamMember(admin.token,'firmes-antigua',{email:'must-not-be-invited@gmail.com',responsibility:'viewer'}),e=>e.code==='FORBIDDEN');
 f.service.repository.transact=originalTransact;
 const team=await f.service.team(f.owner,'firmes-antigua');assert.equal(team.invitations.some(i=>i.email==='must-not-be-invited@gmail.com'),false);
})

async function approvalFixture(t){
 const root=await mkdtemp(join(tmpdir(),'media-v10-roles-'));t.after(()=>rm(root,{recursive:true,force:true}));const salt=randomBytes(24).toString('hex'),password='roles-password',hash=scryptSync(password,Buffer.from(salt,'hex'),64).toString('hex'),tenant='roles-tenant',users=[['owner','owner@example.com','owner'],['coord','coord@example.com','reviewer'],['it','it@example.com','admin'],['editor','editor@example.com','editor']].map(([id,email,role])=>({id,email,name:id,password:{salt,hash},memberships:[{tenant_id:tenant,role}]})),identityFile=join(root,'identities.json');await writeFile(identityFile,JSON.stringify({users}));const execution={approve:async(_actor,id)=> (await service.repository.read()).jobs[id],requestChanges:async(_actor,id)=> (await service.repository.read()).jobs[id],reject:async(_actor,id)=> (await service.repository.read()).jobs[id]};const service=createService({dataRoot:join(root,'data'),identityFile,execution}),tokens={};for(const user of users)tokens[user.id]=(await service.auth.login({email:user.email,password})).token;await service.repository.transact(state=>{state.tenants[tenant]={schema_version:'tenant-media-profile.v1',tenant_id:tenant,organization:'Roles',territory:null,runtime_namespace:tenant,browser_context_ref:tenant+'-browser',content_context:'community',audience_policy:{mode:'general-audience',sensitive_trait_targeting:false,voter_microtargeting:false},brand:{display_name:'Roles',visual_language:'clean'},sources:[],production_defaults:{aspect_ratio:'9:16',cadence:'weekly',duration_seconds:[8,25]}};return null});return{service,tokens,tenant}
}

test('role input is an explicit allowlist and local administrative identities stay protected',async t=>{
 const f=await googleFixture(t),before=await f.service.repository.read();
 for(const responsibility of ['owner','__proto__','constructor','toString','hasOwnProperty',{},['it'],null]){
  await assert.rejects(f.service.inviteTeamMember(f.owner,'firmes-antigua',{email:'attacker@gmail.com',responsibility}),e=>e.code==='INVALID_ROLE');
 }
 assert.deepEqual(await f.service.repository.read(),before);
 await assert.rejects(f.service.inviteTeamMember(f.owner,'firmes-antigua',{email:'OWNER@example.com',responsibility:'it'}),e=>e.code==='CONFIGURED_MEMBERSHIP_IMMUTABLE');
 await assert.rejects(f.service.removeTeamMember(f.owner,'firmes-antigua','owner'),e=>e.code==='CONFIGURED_MEMBERSHIP_IMMUTABLE');
 assert.equal((await f.service.auth.resolve(f.owner)).manage_integrations,true);
})

test('Google signing-key rotation refreshes a cached JWKS after the bounded refresh interval',async()=>{
 const one=generateKeyPairSync('rsa',{modulusLength:2048}),two=generateKeyPairSync('rsa',{modulusLength:2048});
 const jwk1=one.publicKey.export({format:'jwk'}),jwk2=two.publicKey.export({format:'jwk'});Object.assign(jwk1,{kid:'rotation-one',alg:'RS256',use:'sig'});Object.assign(jwk2,{kid:'rotation-two',alg:'RS256',use:'sig'});
 const clientId='123456789012-rotationabcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com';let nowMs=Date.now(),keys=[jwk1],calls=0;
 const fetchImpl=async()=>{calls++;return jsonResponse({keys},200,{'cache-control':'public,max-age=300'})};
 const verifier=new GoogleIdentityVerifier({clientId,fetchImpl,clock:()=>nowMs});
 const claims=()=>({iss:'https://accounts.google.com',aud:clientId,sub:'rotation-subject-123',email:'rotation@gmail.com',email_verified:true,iat:Math.floor(nowMs/1000)-2,exp:Math.floor(nowMs/1000)+3600,nonce:'rotation-nonce'});
 assert.equal((await verifier.verify(jwt({privateKey:one.privateKey,kid:'rotation-one',claims:claims()}),{nonce:'rotation-nonce'})).subject,'rotation-subject-123');assert.equal(calls,1);
 keys=[jwk2];await assert.rejects(verifier.verify(jwt({privateKey:two.privateKey,kid:'rotation-two',claims:claims()}),{nonce:'rotation-nonce'}),e=>e.code==='GOOGLE_ID_TOKEN_INVALID');assert.equal(calls,1);
 nowMs+=61_000;assert.equal((await verifier.verify(jwt({privateKey:two.privateKey,kid:'rotation-two',claims:claims()}),{nonce:'rotation-nonce'})).subject,'rotation-subject-123');assert.equal(calls,2);
})

test('departmental review roles are stage-specific and owner remains an authorized boundary actor',async t=>{
 const f=await approvalFixture(t),candidate='a'.repeat(64);async function stage(name){await f.service.repository.transact(s=>{s.jobs.job={id:'job',tenant_id:f.tenant,status:'AWAITING_REVIEW',stage:name,review_state:'AWAITING_REVIEW',candidate_sha:candidate,created_by:'producer',graph:{nodes:[]},artifacts:[],evidence:[],approvals:[],blockers:[]};return null})}
 await stage('CRITIC');await f.service.jobAction(f.tokens.coord,'job','approve',{candidate_sha:candidate,review_stage:'CRITIC'});await assert.rejects(f.service.jobAction(f.tokens.it,'job','approve',{candidate_sha:candidate,review_stage:'CRITIC'}),e=>e.code==='APPROVAL_ROLE_REQUIRED');await assert.rejects(f.service.jobAction(f.tokens.editor,'job','approve',{candidate_sha:candidate,review_stage:'CRITIC'}),e=>e.code==='FORBIDDEN');await f.service.jobAction(f.tokens.owner,'job','approve',{candidate_sha:candidate,review_stage:'CRITIC'});
 await stage('INDEPENDENT_VERIFIER');await f.service.jobAction(f.tokens.it,'job','approve',{candidate_sha:candidate,review_stage:'INDEPENDENT_VERIFIER'});await assert.rejects(f.service.jobAction(f.tokens.coord,'job','approve',{candidate_sha:candidate,review_stage:'INDEPENDENT_VERIFIER'}),e=>e.code==='APPROVAL_ROLE_REQUIRED');await f.service.jobAction(f.tokens.owner,'job','approve',{candidate_sha:candidate,review_stage:'INDEPENDENT_VERIFIER'});
 await stage('RELEASE');await f.service.jobAction(f.tokens.it,'job','approve',{candidate_sha:candidate,review_stage:'RELEASE'});await assert.rejects(f.service.jobAction(f.tokens.coord,'job','approve',{candidate_sha:candidate,review_stage:'RELEASE'}),e=>e.code==='APPROVAL_ROLE_REQUIRED');await f.service.jobAction(f.tokens.owner,'job','approve',{candidate_sha:candidate,review_stage:'RELEASE'})
})

test('V10 interface keeps Google primary, local break-glass, simple team roles and stage-specific review copy',async()=>{const login=await readFile('components/StudioEntry.tsx','utf8'),team=await readFile('components/Team.tsx','utf8'),jobs=await readFile('components/jobs.tsx','utf8'),nav=await readFile('components/studio.tsx','utf8'),page=await readFile('app/[[...segments]]/page.tsx','utf8');assert.match(page,/getService\(\)\.googleAuthConfig\(\)/);assert.match(page,/googleAvailable=\(await getService\(\)\.googleAuthConfig\(\)\)\.available===true/);assert.doesNotMatch(login,/api\('\/auth\/google\/config'/);assert.match(login,/Continuar con Google/);assert.match(login,/acceso administrativo/);assert.match(login,/api\/v1\/auth\/google\/start/);assert.match(team,/Coordinador municipal/);assert.match(team,/IT \/ Aprobación técnica/);assert.match(team,/value=\"editor\"/);assert.match(team,/value=\"viewer\"/);assert.match(team,/Invita por correo/);assert.match(team,/No se envió un correo/);assert.match(team,/Enlace para compartir/);assert.match(team,/Copiar enlace/);assert.match(nav,/label: 'Equipo'/);assert.match(jobs,/Aprobación de contenido · Coordinación municipal/);assert.match(jobs,/Verificación técnica · IT/);assert.match(jobs,/Aprobación final · Propietario \/ IT/)})
