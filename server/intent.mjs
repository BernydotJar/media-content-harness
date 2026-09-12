import { invariant, boundedText } from './errors.mjs'
import { assertAudienceSafe } from './contracts.mjs'
const words={uno:1,un:1,una:1,one:1,otro:1,otra:1,another:1,dos:2,two:2,tres:3,three:3,cuatro:4,four:4,cinco:5,five:5,seis:6,six:6,siete:7,seven:7,ocho:8,eight:8,nueve:9,nine:9,diez:10,ten:10,once:11,eleven:11,doce:12,twelve:12}
const numbers=Object.keys(words).join('|')
const countPattern=new RegExp('\\b(\\d+|'+numbers+')\\s+(?:videos?|vídeos?|reels?|clips?)\\b','i')
const quantityPattern=new RegExp('\\b(\\d+|'+numbers+')\\b','gi')
const aiPattern=/\b(?:ia|ai|generativ\w*|synthetic|sint[eé]tic\w*)\b/i
const noAI=text=>/\b(?:no|sin|nunca|without|never|do not|don't)\b[^,.;:]{0,45}\b(?:ia|ai|inteligencia artificial|generaci[oó]n)\b/i.test(text)
function strategyOf(text){if(noAI(text))return 'REAL_FOOTAGE';if(/h[ií]brid|hybrid/i.test(text))return 'HYBRID';if(aiPattern.test(text))return 'GENERATIVE';if(/\breal\b|\bmaterial\b|footage/i.test(text))return 'REAL_FOOTAGE';return 'AUTO'}
export function interpretDraft(input,tenant,dna){
 const text=boundedText(input.text,'Creative request',4000);assertAudienceSafe(text);const clarification=[]
 const sourceIds=input.source_ids??tenant.sources.filter(s=>s.purpose==='source').map(s=>s.id)
 invariant(Array.isArray(sourceIds)&&new Set(sourceIds).size===sourceIds.length&&sourceIds.every(s=>typeof s==='string'&&tenant.sources.some(a=>a.id===s&&a.purpose==='source')),'INVALID_SOURCE','Select authorized production sources')
 if(!sourceIds.length)clarification.push('Add and select an authorized production source.')
 if(!dna)clarification.push('Analyze an authorized reference to create Content DNA first.')
 const match=text.match(countPattern);const count=match?(Number(match[1])||words[match[1].toLowerCase()]):0
 if(!count||count>12)clarification.push('Specify a batch of one to twelve videos.')
 if(!/(crea|haz|make|create|produc|video|vídeo|reel)/i.test(text))clarification.push('Describe the videos you want to create.')
 if(/\b(borra|elimina|delete|bypass|ignora.*(?:regla|aproba)|publica|publish|target|segmenta)\b/i.test(text))clarification.push('This input creates draft video concepts only; clarify the creative request.')
 const mascot=/caballito|mascota|mascot|horse/i.test(text)
 if(mascot&&!tenant.brand.mascot_asset_key)clarification.push('Configure an authorized mascot asset for the character video.')
 const quantities=[...text.matchAll(quantityPattern)]
 const clauses=[]
 for(let i=0;i<quantities.length;i++){
   const q=quantities[i];const amount=Number(q[1])||words[q[1].toLowerCase()]
   const rest=text.slice(q.index+q[0].length,quantities[i+1]?.index??text.length).split(/[.;:]/)[0].slice(0,200)
   const character=/caballito|mascota|mascot|horse/i.test(rest);const strategy=strategyOf(rest)
   if(strategy!=='AUTO'||character)clauses.push({amount,strategy,mascot:character})
 }
 let assignments=[]
 if(clauses.length&&clauses.reduce((n,c)=>n+c.amount,0)===count&&count<=12){for(const clause of clauses)for(let i=0;i<clause.amount;i++)assignments.push({strategy:clause.strategy,mascot:clause.mascot})}
 else if(clauses.length>1||clauses.some(c=>c.amount!==count)){clarification.push('The per-video strategy counts are ambiguous; edit each concept or specify a complete distribution.');assignments=Array.from({length:count>0&&count<=12?count:0},()=>({strategy:'AUTO',mascot:false}))}
 else assignments=Array.from({length:count>0&&count<=12?count:0},(_,i)=>({strategy:strategyOf(text),mascot:mascot&&i===count-1}))
 const stories=assignments.map((assignment,index)=>{
   const {strategy,mascot:useMascot}=assignment;const available=dna?.story_devices||[]
   const selected=useMascot&&available.includes('recurring-character-bridge')?['recurring-character-bridge']:available.slice(0,2)
   return {id:'story-'+String(index+1).padStart(2,'0'),title:useMascot?'Historia con el caballito':strategy==='GENERATIVE'?'Exploración creativa con IA':'Historia '+(index+1),objective:useMascot?'Incorporar el personaje autorizado como recurso narrativo.':strategy==='GENERATIVE'?'Crear una pieza estilizada con IA y procedencia sintética explícita.':strategy==='HYBRID'?'Combinar las fuentes autorizadas con una ampliación sintética explícita.':'Contar una historia con las fuentes seleccionadas, conservando la procedencia documental.',source_ids:[...sourceIds],story_devices:selected,strategy,preferred_provider:'AUTO',mascot:useMascot}
 })
 return {mode:'free',week_of:input.week_of,text,stories,clarifications:clarification,ready_to_save:clarification.length===0,interpretation:'Deterministic draft; review and edit each concept before approval.'}
}
