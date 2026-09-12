import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readFile, symlink, access, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { prepareRuntime } from '../scripts/prepare-runtime.mjs'
test('runtime allowlist omits traces and source evidence, protects existing destinations, rejects escaping dependencies',async()=>{
 const previous=process.cwd(),root=await mkdtemp('/tmp/media-runtime-test-');try{
  for(const d of ['.next/standalone/node_modules','.next/standalone/.next/server','.next/standalone/progress','.next/static','schemas','config','examples','scripts'])await mkdir(join(root,d),{recursive:true})
  for(const [p,value] of [['.next/standalone/server.js','// fixture'],['.next/standalone/package.json','{}'],['.next/standalone/.next/BUILD_ID','fixture-build'],['.next/standalone/.next/server/route.js','// fixture'],['.next/standalone/.next/server/route.js.nft.json','{"files":["../../progress/private"]}'],['.next/standalone/progress/private','must never ship'],['scripts/provision-operator.py','# fixture']])await writeFile(join(root,p),value)
  process.chdir(root);const good=join(root,'runtime-good');const report=await prepareRuntime(good);assert.equal(report.forbidden_entries,0);assert.equal(report.external_symlinks,0);assert.equal(await readFile(join(good,'.next/server/route.js'),'utf8'),'// fixture');await assert.rejects(access(join(good,'progress')));await assert.rejects(access(join(good,'.next/server/route.js.nft.json')))
  await assert.rejects(prepareRuntime(good),{code:'EEXIST'});assert.equal(await readFile(join(good,'server.js'),'utf8'),'// fixture')
  await writeFile(join(root,'.next/standalone/.next/server/.env.production'),'fixture only');await assert.rejects(prepareRuntime(join(root,'runtime-env')),/Forbidden runtime content/);await rm(join(root,'.next/standalone/.next/server/.env.production'))
  await writeFile(join(root,'outside-secret'),'fixture only');await symlink(join(root,'outside-secret'),join(root,'.next/standalone/node_modules/escape'));await assert.rejects(prepareRuntime(join(root,'runtime-bad')),/escapes package/)
 }finally{process.chdir(previous);await rm(root,{recursive:true,force:true})}
})
