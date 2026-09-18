import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'

test('V4 guided flow auto-persists before preview and keeps approval explicit', async()=>{
 const planner=await readFile('components/planner.tsx','utf8')
 assert.match(planner,/if\(step===4&&!saved\)/)
 assert.match(planner,/saveDraft\(\{automatic:true\}\)/)
 assert.match(planner,/go\(5\);return/)
 assert.match(planner,/free && !saved/)
 assert.doesNotMatch(planner,/SAVE_REQUIRED/)
 assert.doesNotMatch(planner,/Guarda el borrador antes/)
 assert.match(planner,/Tu semana ya está guardada\./)
 assert.match(planner,/Aprobar estos \{stories\.length\} conceptos/)
})

test('V4 makes authorized media the primary review and dashboard surface', async()=>{
 const jobs=await readFile('components/jobs.tsx','utf8')
 const workspace=await readFile('components/workspace.tsx','utf8')
 assert.match(jobs,/media-gallery-v4/)
 assert.match(jobs,/media-poster-shell/)
 assert.match(jobs,/artifact\?\.download_url/)
 assert.match(jobs,/<video controls=\{released\}/)
 assert.match(workspace,/deckArtifact/)
 assert.match(workspace,/deck-card-real/)
 assert.match(workspace,/heroFeed\.data\?\.jobs/)
 assert.match(workspace,/studio-pulse/)
})

test('V4 liquid glass and 3D motion remain reduced-motion safe', async()=>{
 const css=await readFile('app/globals.css','utf8')
 assert.match(css,/Creative Studio V4/)
 assert.match(css,/backdrop-filter:blur\(34px\) saturate\(165%\)/)
 assert.match(css,/media-poster-card:hover \.media-poster-shell/)
 assert.match(css,/simple-plan-phases/)
 assert.match(css,/autosave-confirmation/)
 const v4=css.slice(css.indexOf('Creative Studio V4'),css.indexOf('Creative Studio V5'))
 const reduced=v4.slice(v4.lastIndexOf('@media(prefers-reduced-motion:reduce)'))
 assert.match(reduced,/\.deck-card/)
 assert.match(reduced,/\.media-poster-shell/)
 assert.match(reduced,/transform:none!important/)
})
