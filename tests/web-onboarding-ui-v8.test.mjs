import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {pageInfo} from '../server/site-metadata.mjs'

test('private onboarding and brand start routes are recognized without becoming public',()=>{
 const onboarding=pageInfo(['onboarding'])
 assert.equal(onboarding?.title,'Guía rápida')
 assert.equal(onboarding?.public,false)
 const start=pageInfo(['workspace','brand-one','start'])
 assert.equal(start?.title,'Resumen de marca')
 assert.equal(start?.public,false)
})

test('studio exposes guide, brand summary, and role-aware brand administration',async()=>{
 const studio=await readFile('components/studio.tsx','utf8')
 const workspace=await readFile('components/workspace.tsx','utf8')
 assert.match(studio,/useLoad\(!login && me\.data \? '\/me\/onboarding'/)
 assert.match(studio,/segments\[0\] === 'onboarding'/)
 assert.match(studio,/href="\/onboarding"/)
 assert.match(studio,/Guía rápida/)
 assert.match(studio,/key: 'start', label: 'Resumen'/)
 assert.match(studio,/\/start'}/)
 assert.match(workspace,/const canCreate=user\.can_create_tenants===true/)
 assert.ok(workspace.includes('action={canCreate?<button className="primary"'))
 assert.ok(workspace.includes('>+ Nueva marca</button>:undefined}'))
 assert.match(workspace,/Aún no tienes una marca asignada\./)
 assert.match(workspace,/router\.push\('\/workspace\/' \+ t\.tenant_id \+ '\/start'\)/)
 assert.match(workspace,/roles\[tenant\.role\]/)
})

test('login enters first-run guide only when server says onboarding is new',async()=>{
 const source=await readFile('components/StudioEntry.tsx','utf8')
 assert.match(source,/firstRun=await api\('\/me\/onboarding'\)/)
 assert.match(source,/const needsGuide=firstRun\?\.status==='NEW'/)
 assert.match(source,/router\.replace\(needsGuide\?'\/onboarding':'\/dashboard'\)/)
})

test('V8 guidance stays compact, responsive, and uses human brand vocabulary',async()=>{
 const source=await readFile('components/Onboarding.tsx','utf8')
 const css=await readFile('app/globals.css','utf8')
 const v8=css.slice(css.lastIndexOf('Creative Studio V8'))
 assert.match(source,/Elige tu marca/)
 assert.match(source,/Trae material/)
 assert.match(source,/Define el estilo/)
 assert.match(source,/Crea y revisa/)
 assert.match(source,/espacio de marca/i)
 assert.doesNotMatch(source,/>tenant</i)
 assert.match(source,/journey\.data\?\.next/)
 assert.match(v8,/\.onboarding-steps-v8/)
 assert.match(v8,/\.brand-start-steps/)
 assert.match(v8,/@media\(max-width:600px\)/)
 assert.match(v8,/@media\(prefers-reduced-motion:reduce\)/)
})
