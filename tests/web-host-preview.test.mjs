import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomBytes, scryptSync } from 'node:crypto'
import { createService } from '../server/services.mjs'
import { handlePreview } from '../server/host-preview.mjs'
test('existing host login, forward auth, exact workspace probe, logout and revocation share product session',async()=>{
 const root=await mkdtemp(join(tmpdir(),'media-host-preview-')),password=randomBytes(24).toString('hex'),salt=randomBytes(24).toString('hex'),identityFile=join(root,'identities.json'),origin='https://media-factory.example.com'
 try{await writeFile(identityFile,JSON.stringify({users:[{id:'test',username:'operator',password:{salt,hash:scryptSync(password,Buffer.from(salt,'hex'),64).toString('hex')},memberships:[]}]}));const service=createService({dataRoot:join(root,'data'),identityFile,publicOrigin:origin});let cookie=''
 const send=(path,body,requestOrigin=origin)=>handlePreview(new Request(origin+'/api/preview/'+path,{method:body===undefined?'GET':'POST',headers:{origin:requestOrigin,'content-type':'application/json',cookie},...(body===undefined?{}:{body:JSON.stringify(body)})}),service)
 assert.equal((await send('workspace-status')).status,401);assert.equal((await send('login',{username:'operator',password},'https://evil.example')).status,403)
 assert.equal((await send('login',{username:'operator',password,next:'https://evil.example'})).status,400)
 const login=await send('login',{username:'operator',password,locale:'es',next:'/es'});assert.equal(login.status,200);cookie=login.headers.get('set-cookie').split(';')[0];assert.match(login.headers.get('set-cookie'),/HttpOnly/);assert.match(login.headers.get('set-cookie'),/Secure/)
 assert.equal((await send('session')).status,200);assert.deepEqual(await (await send('workspace-status')).json(),{authorized:true,scope:'controlled_single_operator_preview'});const logout=await send('logout',{});assert.equal(logout.status,303);assert.equal(logout.headers.get('location'),'/login');assert.equal((await send('workspace-status')).status,401)
 }finally{await rm(root,{recursive:true,force:true})}
})
