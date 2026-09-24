import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'

test('story editor presents the default brand avatar as one atomic visual character decision',async()=>{
 const source=await readFile('components/planner.tsx','utf8')
 assert.match(source,/brandProfile=useLoad\(base\+'\/brand-profile'\)/)
 assert.match(source,/brandCharacters=useLoad\(base\+'\/brand-characters'\)/)
 assert.match(source,/role="radiogroup" aria-label=\{'Personaje de historia '/)
 assert.match(source,/aria-label=\{'Sin personaje en historia '/)
 assert.match(source,/type="radio" name=\{'story-character-'\+s\.id\}/)
 assert.match(source,/checked=\{defaultSelected\}/)
 assert.match(source,/mascot:true,character_id:principal\?\.id\|\|null/)
 assert.match(source,/mascot:false,character_id:null/)
 assert.ok(source.includes("+'/brand-assets/'+encodeURIComponent(defaultMascotAssetId)"))
 assert.match(source,/Avatar autorizado de /)
 assert.doesNotMatch(source,/Incluir el personaje o mascota de la marca/)
})

test('creative review uses compact human summary and leaves raw candidate data behind a disclosure',async()=>{
 const source=await readFile('components/jobs.tsx','utf8')
 assert.match(source,/function CreativeCandidateSummary/)
 assert.match(source,/candidate-summary-grid/)
 assert.match(source,/Personaje/)
 assert.match(source,/Recursos creativos/)
 assert.match(source,/Material/)
 assert.match(source,/Entrega/)
 assert.match(source,/Ver detalles técnicos/)
 assert.match(source,/deviceLabels\[v\]\|\|v/)
 assert.match(source,/CreativeCandidateSummary candidate=\{j\.review_candidate\}/)
})

test('human review asks for a decision before exposing the change composer',async()=>{
 const source=await readFile('components/jobs.tsx','utf8')
 assert.match(source,/reviewMode,setReviewMode.*'decision'/)
 assert.match(source,/¿Esta versión está bien\?/)
 assert.match(source,/Pedir un cambio/)
 assert.match(source,/reviewMode==='decision'\?/) 
 assert.match(source,/review-change-composer/)
 assert.match(source,/ref=\{changeInput\} aria-label="Comentarios para la revisión"/)
 assert.match(source,/changeSuggestions=j\.creation_mode==='GUIDED_SCENE'\?\['Cambiar personaje','Cambiar acción','Cambiar lugar','Más corto','Más cinematográfico'\]:\['Agregar sticker del Caballito','Cambiar inicio','Usar otro clip','Más corto','Más emocional'\]/)
 assert.match(source,/CriticRubricPanel rubric=\{j\.critic_rubric\} onFinding=\{value=>\{if\(canReviewStage\)openChanges\(value\)\}\}/);assert.match(source,/Abrir Studio/);assert.match(source,/Quién puede aprobar esta etapa/)
 assert.match(source,/disabled=\{busy\|\|!reason\.trim\(\)\}>Enviar cambio/)
})

test('V6 responsive styles support avatar cards, compact summary and progressive review',async()=>{
 const css=await readFile('app/globals.css','utf8')
 const v6=css.slice(css.lastIndexOf('Creative Studio V6'))
 assert.match(v6,/character-choice-grid/)
 assert.match(v6,/candidate-summary-grid/)
 assert.match(v6,/review-primary-actions/)
 assert.match(v6,/review-change-composer/)
 assert.match(v6,/@media\(max-width:800px\)/)
 assert.match(v6,/@media\(max-width:540px\)/)
})
