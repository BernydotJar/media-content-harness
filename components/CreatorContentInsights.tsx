'use client';
import Link from 'next/link';
import {useState,type FormEvent} from 'react';
import {api,useLoad,items,Header,Field,Tag,Loading,Problem,Empty,Status,type Item,type ApiError} from './ui';

const stageLabels:Record<string,string>={
 SIGNAL_CAPTURE:'Señal',
 TOPIC_SYNTHESIS:'Tema',
 CONTENT_GAP_REVIEW:'Oportunidad',
 PLAN_DRAFT:'Plan',
 HUMAN_REVIEW:'Revisión',
 READY_TO_CREATE:'Listo para crear'
};

export function CreatorContentInsights({tenant}:{tenant:Item}){
 const base='/tenants/'+encodeURIComponent(tenant.tenant_id);
 const resource=useLoad(base+'/creator-insights');
 const [busy,setBusy]=useState(false),[error,setError]=useState<ApiError|null>(null);

 async function create(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  setBusy(true);setError(null);
  const form=e.currentTarget,f=new FormData(form);
  try{
   await api(base+'/creator-insights',{
    topic:String(f.get('topic')||''),
    signal_type:String(f.get('signal_type')||'manual'),
    observation:String(f.get('observation')||''),
    source_url:String(f.get('source_url')||'')||undefined,
    content_gap:f.get('content_gap')==='on'
   });
   form.reset();
   resource.reload();
  }catch(err){setError(err as ApiError)}
  finally{setBusy(false)}
 }

 return <>
  <Header
   eyebrow={tenant.organization+' / CREATOR INSIGHT'}
   title="Encuentra una idea y conviértela en plan."
   description="Un flujo de señal → oportunidad → plan, inspirado en herramientas de descubrimiento para creadores. No muestra datos de TikTok en vivo sin un conector autorizado."
  />
  <section className="panel insight-capture">
   <div>
    <p className="eyebrow">NUEVA SEÑAL</p>
    <h2>¿Qué tema estás viendo aparecer?</h2>
    <p className="muted">Registra una búsqueda, comentario, analítica o señal manual. El borrador queda para revisión humana antes de entrar a creación.</p>
   </div>
   <form onSubmit={create}>
    <div className="form-grid">
     <Field label="Tema o búsqueda"><input name="topic" required maxLength={180} placeholder="Ej. cómo cuidar el agua en casa"/></Field>
     <Field label="Tipo de señal">
      <select name="signal_type" defaultValue="search">
       <option value="search">Búsqueda</option>
       <option value="comments">Comentarios</option>
       <option value="analytics">Analítica propia</option>
       <option value="manual">Observación manual</option>
      </select>
     </Field>
    </div>
    <Field label="Qué estás observando"><textarea name="observation" maxLength={1200} rows={3} placeholder="Qué pregunta se repite, qué falta explicar o qué oportunidad detectaste."/></Field>
    <Field label="Enlace de referencia (opcional)" help="Solo se registra como referencia aportada; no implica conexión ni analítica en vivo."><input name="source_url" type="url" maxLength={2048} placeholder="https://..."/></Field>
    <label className="check-line"><input name="content_gap" type="checkbox"/>Hay una pregunta u oportunidad que todavía no está bien cubierta</label>
    <Problem error={error}/>
    <button className="primary" disabled={busy}>{busy?'Creando plan…':'Crear plan de contenido'}</button>
   </form>
  </section>

  <div className="section-title">
   <div><p className="eyebrow">CONTENT PLANS</p><h2>Ideas listas para decidir.</h2></div>
   <button className="text-button" onClick={resource.reload}>Actualizar</button>
  </div>
  {resource.loading?<Loading/>:resource.error?<Problem error={resource.error} retry={resource.reload}/>:items(resource.data).length?
   <div className="insight-grid">{items(resource.data).map(v=><InsightCard key={v.id} insight={v} base={base} reload={resource.reload} tenantId={tenant.tenant_id}/>)}</div>:
   <Empty title="Todavía no hay insights.">Registra una señal y aquí aparecerá su plan de idea, título, descripción y hashtags.</Empty>}
 </>;
}

function InsightCard({insight,base,reload,tenantId}:{insight:Item;base:string;reload:()=>void;tenantId:string}){
 const [edit,setEdit]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState<ApiError|null>(null);
 const plan=insight.plan||{};

 async function save(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setError(null);
  const f=new FormData(e.currentTarget);
  try{
   await api(base+'/creator-insights/'+encodeURIComponent(insight.id)+'/plan',{
    idea:String(f.get('idea')||''),
    title:String(f.get('title')||''),
    description:String(f.get('description')||''),
    hashtags:String(f.get('hashtags')||'').split(/[\s,]+/).filter(Boolean)
   });
   setEdit(false);reload();
  }catch(err){setError(err as ApiError)}
  finally{setBusy(false)}
 }

 async function approve(){
  setBusy(true);setError(null);
  try{
   await api(base+'/creator-insights/'+encodeURIComponent(insight.id)+'/approve',{plan_sha:plan.plan_sha});
   reload();
  }catch(err){setError(err as ApiError)}
  finally{setBusy(false)}
 }

 return <article className="panel insight-card">
  <div className="insight-card-head">
   <div>
    <div className="chips"><Tag>{insight.signal?.type||'manual'}</Tag>{insight.content_gap&&<Tag tone="warning">Oportunidad</Tag>}<Status value={insight.status}/></div>
    <h3>{insight.topic}</h3>
   </div>
   <span className="insight-live-state">{insight.signal?.live_platform_data?'Datos conectados':'Señal registrada'}</span>
  </div>

  <div className="insight-graph" aria-label="Graph de Creator Content Insight">
   {(insight.graph?.nodes||[]).map((node:Item)=><div className={'insight-node '+node.status} key={node.id}><span>{node.status==='done'?'✓':'○'}</span><small>{stageLabels[node.id]||node.id}</small></div>)}
  </div>

  {edit?
   <form onSubmit={save} className="insight-plan-editor">
    <Field label="Idea"><textarea name="idea" rows={2} defaultValue={plan.idea} required maxLength={500}/></Field>
    <Field label="Título"><input name="title" defaultValue={plan.title} required maxLength={200}/></Field>
    <Field label="Descripción"><textarea name="description" rows={3} defaultValue={plan.description} required maxLength={1200}/></Field>
    <Field label="Hashtags" help="Sepáralos por espacio o coma."><input name="hashtags" defaultValue={(plan.hashtags||[]).join(' ')} required maxLength={400}/></Field>
    <Problem error={error}/>
    <div className="actions"><button className="primary" disabled={busy}>Guardar cambios</button><button type="button" className="secondary" onClick={()=>setEdit(false)}>Cancelar</button></div>
   </form>:
   <div className="content-plan-card">
    <div><span>IDEA</span><p>{plan.idea}</p></div>
    <div><span>TÍTULO</span><h4>{plan.title}</h4></div>
    <div><span>DESCRIPCIÓN</span><p>{plan.description}</p></div>
    <div><span>HASHTAGS</span><div className="chips">{(plan.hashtags||[]).map((h:string)=><Tag key={h}>{h}</Tag>)}</div></div>
   </div>}

  <Problem error={!edit?error:null}/>
  <div className="actions">
   {insight.status==='DRAFT'&&<><button className="secondary" onClick={()=>setEdit(true)} disabled={busy}>Editar plan</button><button className="primary" onClick={approve} disabled={busy}>{busy?'Aprobando…':'Aprobar plan'}</button></>}
   {insight.status==='APPROVED'&&<Link className="button primary" href={'/workspace/'+encodeURIComponent(tenantId)+'/free?insight='+encodeURIComponent(insight.id)}>Crear con este plan →</Link>}
  </div>
 </article>;
}
