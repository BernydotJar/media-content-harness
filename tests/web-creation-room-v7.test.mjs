import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'

test('running production lands in a truthful celebratory creation room',async()=>{
 const source=await readFile('components/jobs.tsx','utf8')
 assert.match(source,/function CreationRoom/)
 assert.match(source,/¡Listo! Tu video ya se está creando\./)
 assert.match(source,/Aquí verás el video apenas esté listo para revisar\./)
 assert.match(source,/Math\.round\(\(completedStages\/totalStages\)\*100\)/)
 assert.match(source,/del flujo verificado/)
 assert.match(source,/No inventamos un porcentaje de render/)
 assert.match(source,/aria-label="Lugar donde aparecerá el video"/)
 assert.match(source,/creatingNow=.*\['RUNNING','QUEUED'\]\.includes\(j\.status\)/)
 assert.match(source,/creatingNow\?<CreationRoom/)
})

test('desktop top utility row cannot overlap creative content',async()=>{
 const css=await readFile('app/globals.css','utf8')
 const v7=css.slice(css.lastIndexOf('Creative Studio V7'))
 assert.match(v7,/\.liquid-glass-topline\{[\s\S]*position:relative!important;[\s\S]*top:auto!important;/)
 assert.match(v7,/\.creation-room-v7\{/)
 assert.match(v7,/\.creation-video-card\{/)
 assert.match(v7,/aspect-ratio:9\/16/)
 assert.match(v7,/@media\(max-width:900px\)/)
 assert.match(v7,/@media\(prefers-reduced-motion:reduce\)/)
})

test('source upload uses a glowing file card while preserving the native file input contract',async()=>{
 const source=await readFile('components/library.tsx','utf8')
 assert.match(source,/file-upload-card-v7/)
 assert.match(source,/aria-label="Subir video autorizado"/)
 assert.match(source,/onDragOver=\{e=>e\.preventDefault\(\)\}/)
 assert.match(source,/e\.dataTransfer\.files\?\.\[0\]/)
 assert.match(source,/Suelta o elige tu video/)
})

test('free creation uses the warm prompt bar and liquid-metal creation actions',async()=>{
 const source=await readFile('components/planner.tsx','utf8')
 const css=await readFile('app/globals.css','utf8')
 assert.match(source,/ai-prompt-bar-v7/)
 assert.match(source,/ai-prompt-orb/)
 assert.match(source,/Cuéntanos la idea\. Nosotros le damos forma\./)
 assert.match(source,/primary liquid-metal-cta[^>]*>.*Solicitar producción/)
 assert.match(source,/primary liquid-metal-cta[^>]*>\{busy \? 'Dando forma a tu idea…' : 'Crear borrador'\}/)
 assert.match(css,/\.liquid-metal-cta\{/)
 assert.match(css,/\.file-upload-card-v7\{/)
})

test('review summary protects long resource chips from collisions',async()=>{
 const css=await readFile('app/globals.css','utf8')
 const v7=css.slice(css.lastIndexOf('Creative Studio V7'))
 assert.match(v7,/\.candidate-summary-card \.summary-chips \.tag\{[^}]*white-space:normal[^}]*overflow-wrap:anywhere/)
})


test('action feedback remains visible when a requested change immediately re-enters Creation Room',async()=>{
 const source=await readFile('components/jobs.tsx','utf8')
 const feedback=source.indexOf('global-action-feedback')
 const branch=source.indexOf("creatingNow?<CreationRoom")
 assert.ok(feedback>0&&branch>feedback,'success feedback must render outside and before the Creation Room branch')
 assert.equal((source.match(/global-action-feedback/g)||[]).length,1)
})
