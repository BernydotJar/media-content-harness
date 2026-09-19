'use client';

import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useEffect,useState} from 'react';
import {api,useLoad,items,Header,Icon,Tag,Loading,Problem,type Item,type Resource,type ApiError} from './ui';

const roleLabels:Record<string,string>={
 owner:'Propietario',
 admin:'IT / Aprobación técnica',
 editor:'Editor',
 reviewer:'Coordinador municipal',
 viewer:'Consulta'
};

function RoleTag({role}:{role?:string}){return <Tag>{roleLabels[role||'']||'Miembro'}</Tag>}

export function Onboarding({user,tenants,state}:{user:Item;tenants:Resource;state:Resource}){
 const router=useRouter(),list=items(tenants.data);
 const [selected,setSelected]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState<ApiError|null>(null);
 useEffect(()=>{if(!selected&&list.length)setSelected(list[0].tenant_id);else if(selected&&!list.some(t=>t.tenant_id===selected))setSelected(list[0]?.tenant_id||'')},[selected,tenants.data]);
 const journey=useLoad(selected?'/tenants/'+encodeURIComponent(selected)+'/journey':null);
 const current=list.find(t=>t.tenant_id===selected);
 async function finish(action:'complete'|'dismiss'){
  setBusy(true);setError(null);
  try{await api('/me/onboarding',{action});state.reload();router.replace('/dashboard');router.refresh()}
  catch(err){setError(err as ApiError)}
  finally{setBusy(false)}
 }
 const nextHref=current?(journey.data?.next?.href||'/workspace/'+encodeURIComponent(current.tenant_id)+'/start'):'/workspaces';
 const nextLabel=current?(journey.data?.next?.label||'Abrir esta marca'):user.can_create_tenants?'Crear mi primera marca':'Ver mis marcas';
 return <div className="onboarding-v8">
  <Header eyebrow="BIENVENIDO AL ESTUDIO" title={'Hola, '+(user.name?.split(' ')[0]||'creador')+'.'} description="En dos minutos sabrás dónde estás, qué pertenece a cada marca y cuál es tu siguiente paso." />
  <section className="onboarding-hero-v8">
   <div className="onboarding-hero-copy">
    <p className="eyebrow">UNA RUTA SIMPLE</p>
    <h2>De una marca a una pieza lista para revisar.</h2>
    <p>Media Factory separa cada marca en su propio espacio. Su material, estilo, personajes y producciones se mantienen aislados de las demás.</p>
   </div>
   <div className="onboarding-hero-mark" aria-hidden="true"><span>01</span><i/><b/><em/></div>
  </section>

  <ol className="onboarding-steps-v8" aria-label="Cómo empezar en Media Factory">
   <li><span className="onboarding-step-icon"><Icon name="grid"/></span><div><small>01</small><strong>Elige tu marca</strong><p>Trabaja siempre dentro del espacio correcto.</p></div></li>
   <li><span className="onboarding-step-icon"><Icon name="sources"/></span><div><small>02</small><strong>Trae material</strong><p>Sube videos, fotos o referencias autorizadas.</p></div></li>
   <li><span className="onboarding-step-icon"><Icon name="dna"/></span><div><small>03</small><strong>Define el estilo</strong><p>Construye una identidad creativa reutilizable.</p></div></li>
   <li><span className="onboarding-step-icon"><Icon name="review"/></span><div><small>04</small><strong>Crea y revisa</strong><p>Tú decides qué versión se aprueba o cambia.</p></div></li>
  </ol>

  <section className="panel onboarding-tenant-v8">
   <div className="onboarding-tenant-head">
    <div><p className="eyebrow">TU ESPACIO DE MARCA</p><h2>{list.length?list.length===1?'Ya tienes una marca asignada.':'Elige dónde quieres empezar.':'Primero necesitamos una marca.'}</h2></div>
    {list.length>1&&<label className="compact-select"><span>Marca</span><select value={selected} onChange={e=>setSelected(e.target.value)}>{list.map(t=><option value={t.tenant_id} key={t.tenant_id}>{t.organization}</option>)}</select></label>}
   </div>
   {tenants.loading?<Loading/>:tenants.error?<Problem error={tenants.error} retry={tenants.reload}/>:current?<div className="onboarding-current-brand">
    <div className="brand-orbit" aria-hidden="true"><span>{current.organization.slice(0,1).toUpperCase()}</span><i/><b/></div>
    <div className="onboarding-brand-copy"><div className="brand-title-line"><h3>{current.organization}</h3><RoleTag role={current.role}/></div><p>{current.territory||'Tu espacio creativo'}</p><small>Esta marca tiene su propio material, estilo, personajes, planes y entregas.</small></div>
    <div className="onboarding-next-action">{journey.loading?<Loading text="Buscando tu siguiente paso…"/>:journey.error?<Problem error={journey.error} retry={journey.reload}/>:<><span>SIGUIENTE PASO</span><strong>{journey.data?.next?.label||'Abrir esta marca'}</strong><p>{journey.data?.next?.reason||'Continúa desde el estado real de este espacio.'}</p><Link className="button primary liquid-metal-cta" href={nextHref}>{nextLabel}<Icon name="arrow"/></Link></>}</div>
   </div>:<div className="onboarding-zero-brand">
    <div className="empty-icon"><Icon name="grid"/></div>
    <div><h3>{user.can_create_tenants?'Crea tu primera marca.':'Aún no tienes una marca asignada.'}</h3><p>{user.can_create_tenants?'Le daremos un espacio aislado para su material, estilo y producciones.':'Tu cuenta existe, pero todavía no pertenece a un espacio de marca. La persona responsable de tu organización puede darte acceso.'}</p></div>
    {user.can_create_tenants&&<Link className="button primary" href="/workspaces">Crear mi primera marca<Icon name="arrow"/></Link>}
   </div>}
  </section>

  <Problem error={error}/>
  <div className="onboarding-actions-v8">
   <button className="primary" disabled={busy} onClick={()=>finish('complete')}>{busy?'Guardando…':'Listo, entrar al estudio'}</button>
   <button className="text-button" disabled={busy} onClick={()=>finish('dismiss')}>Saltar por ahora</button>
   <small>Podrás volver a esta guía desde el menú lateral.</small>
  </div>
 </div>;
}

export function NewUserCallout({state}:{state:Resource}){
 if(state.loading||state.error||!state.data||state.data.status!=='NEW')return null;
 return <section className="new-user-callout-v8">
  <div className="new-user-orb" aria-hidden="true"><i/><b/></div>
  <div><p className="eyebrow">NUEVO POR AQUÍ</p><h2>Te ubicamos en menos de dos minutos.</h2><p>Conoce cómo funcionan las marcas, el material, el estilo y la revisión antes de crear.</p></div>
  <Link className="button secondary" href="/onboarding">Ver guía rápida <Icon name="arrow"/></Link>
 </section>;
}

export function BrandStart({tenant}:{tenant:Item}){
 const journey=useLoad('/tenants/'+encodeURIComponent(tenant.tenant_id)+'/journey');
 const d=journey.data;
 const steps=[
  {label:'Material',detail:d?d.uploaded+' videos disponibles':'Comprobando…',done:Boolean(d?.uploaded),icon:'sources'},
  {label:'Estilo',detail:d?.dna_ready?'Listo':'Por definir',done:Boolean(d?.dna_ready),icon:'dna'},
  {label:'Crear',detail:d?.requested?d.requested+' producciones':'Primera historia',done:Boolean(d?.requested),icon:'spark'},
  {label:'Entrega',detail:d?.released?d.released+' listas':d?.awaiting_review?d.awaiting_review+' por revisar':'Todavía no',done:Boolean(d?.released),icon:'release'}
 ];
 return <div className="brand-start-v8">
  <Header eyebrow="TU ESPACIO DE MARCA" title={tenant.organization} description="Aquí ves qué está listo y qué conviene hacer después. Cada dato viene del estado real de esta marca." action={<RoleTag role={tenant.role}/>} />
  <section className="brand-start-hero">
   <div><p className="eyebrow">TODO EN SU LUGAR</p><h2>{tenant.setup_status==='SOURCE_REQUIRED'?'Tu espacio está listo. Empecemos por el material.':d?.released?'Tu marca ya tiene un ciclo completo.':'Sigue construyendo desde aquí.'}</h2><p>Material, estilo, personajes y producciones de <strong>{tenant.organization}</strong> permanecen aislados de otras marcas.</p>{journey.loading?<Loading/>:journey.error?<Problem error={journey.error} retry={journey.reload}/>:d&&<div className="brand-start-next"><span>SIGUIENTE PASO</span><strong>{d.next.label}</strong><p>{d.next.reason}</p><Link className="button primary liquid-metal-cta" href={d.next.href}>{d.next.label}<Icon name="arrow"/></Link></div>}</div>
   <div className="brand-start-art" aria-hidden="true"><span>{tenant.organization.slice(0,1).toUpperCase()}</span><i/><b/><em/></div>
  </section>
  <ol className="brand-start-steps" aria-label="Preparación de esta marca">{steps.map((step,index)=><li key={step.label} data-done={step.done}><span className="brand-step-icon"><Icon name={step.icon}/></span><div><small>{String(index+1).padStart(2,'0')}</small><strong>{step.label}</strong><p>{step.detail}</p></div>{step.done&&<Tag tone="success">Listo</Tag>}</li>)}</ol>
  <section className="brand-isolation-note"><Icon name="grid"/><div><strong>¿Qué significa “espacio de marca”?</strong><p>Es el contenedor privado de esta marca. Lo que subes, configuras o produces aquí no se mezcla con otra marca a la que tengas acceso.</p></div><Link href="/workspaces">Cambiar de marca ↗</Link></section>
 </div>;
}
