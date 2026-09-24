import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'

test('V19 keeps Create focused on one composer while weekly usage stays visible',async()=>{
 const [planner,card,css]=await Promise.all([
  readFile('components/planner.tsx','utf8'),
  readFile('components/UsageBudgetCard.tsx','utf8'),
  readFile('app/globals.css','utf8')
 ])
 assert.match(planner,/free-create-focus-v19/)
 assert.match(planner,/title=\{free \? '¿Qué quieres crear\?'/)
 assert.match(planner,/UsageBudgetCard data=\{usageBudget\.data\} focus=\{free\}/)
 assert.match(planner,/ai-prompt-bar-v7/)
 assert.match(planner,/creation-shortcuts creation-shortcuts-focus/)
 assert.ok(planner.indexOf('ai-prompt-bar-v7') < planner.indexOf('creation-shortcuts creation-shortcuts-focus'),'secondary character/place shortcut follows the composer')
 for(const token of ['usage-budget-focus','Q{included.toFixed(0)} incluidos esta semana','1 video IA disponible hoy','Q{remaining.toFixed(2)} disponibles','Ver uso','Ajustes protegidos','Regla diaria','Los días no usados no se acumulan como videos extra','Audio Finishing no consumen este presupuesto']) assert.ok(card.includes(token),token)
 for(const token of ['.free-create-focus-v19>.page-header','.usage-budget-focus','.free-create-focus-v19>.ai-prompt-bar-v7','.creation-shortcuts-focus','@media(prefers-reduced-motion:reduce)']) assert.ok(css.includes(token),token)
})

test('V19 preserves Dashboard/Create decision surfaces without adding budget chrome to brand start',async()=>{
 const [workspace,planner]=await Promise.all([
  readFile('components/workspace.tsx','utf8'),
  readFile('components/planner.tsx','utf8')
 ])
 assert.match(workspace,/d\.usage_budget&&<UsageBudgetCard data=\{d\.usage_budget\} compact\/>/)
 assert.match(workspace,/view === 'start'\) content=<BrandStart tenant=\{tenant\.data\}\/>/)
 assert.match(workspace,/view === 'weekly' \|\| view === 'free'/)
 assert.match(planner,/usageBudget=useLoad\(base\+'\/usage-budget'\)/)
})

test('V19 uses the existing CSS media depth and does not add a WebGL UI runtime dependency',async()=>{
 const [css,pkg]=await Promise.all([readFile('app/globals.css','utf8'),readFile('package.json','utf8')])
 assert.match(css,/\.media-poster-card\{/)
 assert.match(css,/\.media-gradient-art\{/)
 assert.match(css,/\.dashboard-media-shelf\{/)
 assert.doesNotMatch(pkg,/@cruxgarden\/plasma-ui/)
})
