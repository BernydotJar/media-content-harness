import { fields, invariant } from './errors.mjs'
export const STRATEGIES = Object.freeze(['AUTO','REAL_FOOTAGE','HYBRID','GENERATIVE'])
const declarations = [
  {id:'seedance',name:'Seedance',strategies:['HYBRID','GENERATIVE'],capabilities:['stylized-generation'],credit_bearing:true},
  {id:'higgsfield',name:'Higgsfield',strategies:['HYBRID','GENERATIVE'],capabilities:['stylized-generation'],credit_bearing:true},
  {id:'capcut',name:'CapCut',strategies:['REAL_FOOTAGE','HYBRID'],capabilities:['editing','finishing'],credit_bearing:false},
  {id:'gemini',name:'Gemini',strategies:['AUTO','REAL_FOOTAGE','HYBRID','GENERATIVE'],capabilities:['creative-direction','analysis'],credit_bearing:true},
  {id:'ffmpeg',name:'FFmpeg',strategies:['REAL_FOOTAGE','HYBRID'],capabilities:['editing','technical-qa'],credit_bearing:false},
]
export class ProviderRegistry {
  constructor({ adapters = {}, testMode = false } = {}) { this.adapters = new Map(); for (const [id,adapter] of Object.entries(adapters)) { invariant(declarations.some(d=>d.id===id) || (testMode && id==='deterministic-test'), 'INVALID_PROVIDER', 'Unknown provider adapter'); for (const method of ['capabilities','estimate','prepare','generate','poll','collect','provenance']) invariant(typeof adapter[method]==='function','INVALID_PROVIDER','Provider adapter contract is incomplete'); this.adapters.set(id,adapter) }; this.testMode=testMode }
  list() { const list = declarations.map(d=>({...d,available:this.adapters.has(d.id),availability:this.adapters.has(d.id)?'CONFIGURED':'INTEGRATION_REQUIRED',estimate:null})); if(this.testMode && this.adapters.has('deterministic-test')) list.push({id:'deterministic-test',name:'Deterministic test adapter',strategies:STRATEGIES,capabilities:['test-fixture'],credit_bearing:false,available:true,availability:'TEST_ONLY',estimate:0}); return list }
  validate(strategy='AUTO', preferred='AUTO') { invariant(STRATEGIES.includes(strategy),'INVALID_STRATEGY','Choose a supported production strategy'); invariant(preferred==='AUTO' || this.list().some(p=>p.id===preferred),'INVALID_PROVIDER','Choose a known provider'); if(preferred!=='AUTO') { const provider=this.list().find(p=>p.id===preferred); invariant(strategy==='AUTO'||provider.strategies.includes(strategy),'PROVIDER_CAPABILITY','Preferred provider does not support this production strategy') }; return {strategy,preferred_provider:preferred} }
  get(id) { invariant(this.adapters.has(id),'PROVIDER_UNAVAILABLE','Provider integration is not configured',503); return this.adapters.get(id) }
}
