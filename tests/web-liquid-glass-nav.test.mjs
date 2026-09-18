import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'

test('single-brand quick create bypasses redundant brand submenu', async()=>{
 const source=await readFile('components/QuickCreate.tsx','utf8')
 assert.match(source,/const singleTenant=tenants\.length===1\?tenants\[0\]:null/)
 assert.match(source,/singleTenant \? modes\.map/)
 assert.match(source,/encodeURIComponent\(singleTenant\.tenant_id\)/)
 assert.match(source,/directArrow/)
 assert.match(source,/: tenants\.length \? modes\.map\(mode => <DropdownMenu\.Sub/)
})

test('desktop navigation exposes four primary actions and collapses brand setup', async()=>{
 const source=await readFile('components/studio.tsx','utf8')
 for(const label of ['Inicio','Crear','Revisar','Entregas'])assert.match(source,new RegExp("label: '"+label+"'"))
 assert.match(source,/className="nav-setup"/)
 assert.match(source,/Configurar marca/)
 assert.match(source,/Material/)
 assert.match(source,/Estilo/)
 assert.match(source,/Personajes y lugares/)
 assert.match(source,/const showBrands = tenantList\.length > 1/)
 assert.match(source,/topline-context/)
 assert.match(source,/approval-assurance/)
})

test('liquid-glass menus use layered blur, rim, highlight and reduced-motion safety', async()=>{
 const quick=await readFile('components/QuickCreate.module.css','utf8')
 const global=await readFile('app/globals.css','utf8')
 assert.match(quick,/backdrop-filter: blur\(38px\) saturate\(185%\)/)
 assert.match(quick,/\.content::before/)
 assert.match(quick,/\.content::after/)
 assert.match(quick,/radial-gradient/)
 assert.match(quick,/@media \(prefers-reduced-motion: reduce\)/)
 const v5=global.slice(global.lastIndexOf('Creative Studio V5'))
 assert.match(v5,/sidebar\.liquid-glass-nav/)
 assert.match(v5,/backdrop-filter:blur\(38px\) saturate\(180%\)/)
 assert.match(v5,/glass-brand-chip/)
 assert.match(v5,/nav-setup/)
 assert.match(v5,/liquid-glass-topline/)
 assert.match(v5,/background:transparent!important/)
 assert.match(v5,/@media\(prefers-reduced-motion:reduce\)/)
})
