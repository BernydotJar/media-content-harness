'use client';
import Link from 'next/link';
import {useMemo,useState,type FormEvent} from 'react';
import {api,useLoad,items,Header,Field,Tag,Loading,Problem,Empty,Status,type Item,type ApiError} from './ui';

const stageLabels:Record<string,string>={
 SIGNAL_CAPTURE:'Señal',
 TOPIC_SYNTHESIS:'Tema',
 CONTENT_GAP_REVIEW:'Oportunidad',
 PLAN_DRAFT:'Plan',
 HUMAN_REVIEW:'Revisión',
 READY_TO_CREATE:'Listo para crear'
};
const signalLabels:Record<string,string>={search:'Búsqueda',comments:'Comentarios',analytics:'Analítica propia',manual:'Observación manual'};

export function CreatorContentInsights({tenant}:{tenant:Item}){
 const base='/tenants/'+encodeURIComponent(tenant.tenant_id);
 const resource=useLoad(base+'/creator-insights');
 const discovery=useLoad(base+'/creator-insights/discovery');
 const [busy,setBusy]=useState(false),[error,setError]=useState<ApiError|null>(null);
 const [query,setQuery]=useState(''),[view,setView]=useState('all'),[signal,setSignal]=useState('all');
 const insightList=items(resource.data);
 const visible=useMemo(()=>{
  const needle=query.trim().toLocaleLowerCase();
  return insightList.filter(insight=>{
   if(view==='gap'&&!insight.content_gap)return false;
   if(view==='draft'&&insight.status!=='DRAFT')return false;
   if(view==='approved'&&insight.status!=='APPROVED')return false;
   if(signal!=='all'&&insight.signal?.type!==signal)return false;
   if(!needle)return true;
   const plan=insight.plan||{};
   const haystack=[insight.topic,insight.signal?.observation,plan.idea,plan.title,plan.description,...(plan.hashtags||[])].filter(Boolean).join(' ').toLocaleLowerCase();
   return haystack.includes(needle);
  });
 },[insightList,query,view,signal]);
 const overview=discovery.data?.overview||{total_signals:insightList.length,content_gaps:insightList.filter(v=>v.content_gap).length,draft_plans:insightList.filter(v=>v.status==='DRAFT').length,approved_plans:insightList.filter(v=>v.status==='APPROVED').length};
 const signalTypes=discovery.data?.signal_types||{search:insightList.filter(v=>v.signal?.type==='search').length,comments:insightList.filter(v=>v.signal?.type==='comments').length,analytics:insightList.filter(v=>v.signal?.type==='analytics').length,manual:insightList.filter(v=>v.signal?.type==='manual').length};

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
   resource.reload();discovery.reload();
  }catch(err){setError(err as ApiError)}
  finally{setBusy(false)}
 }

 const reload=()=>{resource.reload();discovery.reload()};

 return <>
  <Header
   eyebrow={tenant.organization+' / CREATOR INSIGHT'}
   title="Convierte señales en un plan de contenido."
   description="Explora señales de tu propio espacio, identifica oportunidades marcadas por tu equipo y transforma cada tema en idea, título, descripción y hashtags. No inventamos métricas externas ni datos de TikTok."
  />

  <section className="insight-overview" aria-label="Resumen de Creator Content Insight">
   <InsightMetric label="Señales registradas" value={overview.total_signals||0} detail="Dentro de este espacio"/>
   <InsightMetric label="Oportunidades" value={overview.content_gaps||0} detail="Marcadas por el equipo"/>
   <InsightMetric label="Planes en borrador" value={overview.draft_plans||0} detail="Aún editables"/>
   <InsightMetric label="Planes aprobados" value={overview.approved_plans||0} detail="Listos para crear"/>
  </section>

  <div className="panel insight-signal-summary" aria-label="Analítica de señales registradas">
   <div><span className="eyebrow">ORIGEN DE SEÑALES</span><strong>Analítica interna</strong><small>Solo datos registrados en este espacio.</small></div>
   <div className="insight-signal-counts">
    <span>Búsqueda <b>{signalTypes.search||0}</b></span>
    <span>Comentarios <b>{signalTypes.comments||0}</b></span>
    <span>Analítica propia <b>{signalTypes.analytics||0}</b></span>
    <span>Observación <b>{signalTypes.manual||0}</b></span>
   </div>
  </div>

  <section className="panel insight-capture">
   <div>
    <p className="eyebrow">NUEVA SEÑAL</p>
    <h2>¿Qué tema estás viendo aparecer?</h2>
    <p className="muted">Registra una búsqueda, comentario, analítica propia u observación. La señal conserva su procedencia y el plan requiere revisión humana.</p>
   </div>
   <form onSubmit={create}>
    <div className="form-grid">
     <Field label="Tema o búsqueda"><input name="topic" required maxLength={180} placeholder="Ej. cómo iluminar un video con una sola luz"/></Field>
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
    <Field label="Enlace de referencia (opcional)" help="Se registra como referencia aportada. No implica acceso a métricas de la plataforma."><input name="source_url" type="url" maxLength={2048} placeholder="https://..."/></Field>
    <label className="check-line"><input name="content_gap" type="checkbox"/>Marcar como oportunidad de contenido</label>
    <Problem error={error}/>
    <button className="primary" disabled={busy}>{busy?'Creando plan…':'Crear plan de contenido'}</button>
   </form>
  </section>

  <section className="insight-discovery">
   <div className="section-title">
    <div>
     <p className="eyebrow">DESCUBRIR</p>
     <h2>Señales y planes de tu espacio.</h2>
     <p className="muted">Vista cronológica del material registrado por tu equipo; no es un ranking ni una recomendación de plataforma.</p>
    </div>
    <button className="text-button" onClick={reload}>Actualizar</button>
   </div>
   <div className="panel insight-toolbar">
    <label className="insight-search">
     <span>Buscar</span>
     <input aria-label="Buscar insights" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Tema, título, descripción o hashtag"/>
    </label>
    <label>
     <span>Vista</span>
     <select aria-label="Filtrar insights" value={view} onChange={e=>setView(e.target.value)}>
      <option value="all">Todos</option>
      <option value="gap">Oportunidades</option>
      <option value="draft">Borradores</option>
      <option value="approved">Aprobados</option>
     </select>
    </label>
    <label>
     <span>Señal</span>
     <select aria-label="Filtrar por señal" value={signal} onChange={e=>setSignal(e.target.value)}>
      <option value="all">Todas</option>
      <option value="search">Búsqueda</option>
      <option value="comments">Comentarios</option>
      <option value="analytics">Analítica propia</option>
      <option value="manual">Observación manual</option>
     </select>
    </label>
   </div>
  </section>

  {resource.loading?<Loading/>:resource.error?<Problem error={resource.error} retry={reload}/>:visible.length?
   <div className="insight-grid">{visible.map(v=><InsightCard key={v.id} insight={v} base={base} reload={reload} tenantId={tenant.tenant_id}/>)}</div>:
   insightList.length?<Empty title="No hay coincidencias.">Cambia la búsqueda o los filtros para volver a mostrar tus señales.</Empty>:
   <Empty title="Todavía no hay insights.">Registra una señal y aquí aparecerá su plan de idea, título, descripción y hashtags.</Empty>}
 </>;
}

function InsightMetric({label,value,detail}:{label:string;value:number;detail:string}){
 return <article className="panel insight-metric"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>;
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
    <div className="chips"><Tag>{signalLabels[insight.signal?.type]||'Señal'}</Tag>{insight.content_gap&&<Tag tone="warning">Oportunidad</Tag>}<Status value={insight.status}/></div>
    <h3>{insight.topic}</h3>
   </div>
   <span className="insight-live-state">{insight.signal?.live_platform_data?'Datos conectados':'Datos del espacio'}</span>
  </div>

  {insight.signal?.observation&&<p className="insight-observation">{insight.signal.observation}</p>}

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
