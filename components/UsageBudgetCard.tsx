'use client';
import type { Item } from './ui';

export function UsageBudgetCard({data,compact=false,focus=false}:{data:Item;compact?:boolean;focus?:boolean}){
 if(!data)return null;
 const included=Number(data.included_gtq||200),used=Number(data.used_gtq||0),remaining=Number(data.remaining_gtq||0),pct=Math.max(0,Math.min(100,included?used/included*100:0)),today=data.new_generation||{},repairs=data.repairs||{};
 if(focus)return <section className="usage-budget-card usage-budget-focus" aria-label="Uso incluido esta semana">
  <div className="usage-focus-line">
   <span className={'usage-focus-dot '+(today.available_today?'available':'used')} aria-hidden="true"/>
   <div className="usage-focus-copy"><p className="eyebrow">TU SEMANA DE CREACIÓN</p><strong>Q{included.toFixed(0)} incluidos esta semana</strong><span>{today.available_today?'1 video IA disponible hoy':'Video IA de hoy ya utilizado'} · Q{remaining.toFixed(2)} disponibles</span></div>
   <details className="usage-focus-details"><summary>Ver uso</summary><div className="usage-focus-detail-body">
    <div className="usage-budget-stats"><div><span>Protegido para la semana</span><strong>Q{remaining.toFixed(2)}</strong></div><div><span>Ajustes protegidos</span><strong>Q{Number(repairs.remaining_gtq||0).toFixed(2)}</strong></div><div><span>Regla diaria</span><strong>1 video</strong></div></div>
    <p className="usage-budget-note">Los días no usados no se acumulan como videos extra. Las ediciones locales y Audio Finishing no consumen este presupuesto.</p>
   </div></details>
  </div>
  <div className="usage-budget-progress" aria-label={`Q${used.toFixed(2)} utilizados de Q${included.toFixed(2)}`}><i style={{width:pct+'%'}}/></div>
 </section>;
 return <section className={'usage-budget-card '+(compact?'compact':'')} aria-label="Uso incluido esta semana">
  <div className="usage-budget-head"><div><p className="eyebrow">TU SEMANA DE CREACIÓN</p><h3>Q{included.toFixed(0)} incluidos</h3><p>{today.available_today?'Tu video IA de hoy está disponible.':'El video IA incluido de hoy ya fue utilizado.'}</p></div><div className={'usage-day-badge '+(today.available_today?'available':'used')}><strong>{today.available_today?'1':'0'}</strong><span>video IA hoy</span></div></div>
  <div className="usage-budget-progress" aria-label={`Q${used.toFixed(2)} utilizados de Q${included.toFixed(2)}`}><i style={{width:pct+'%'}}/></div>
  <div className="usage-budget-stats"><div><span>Protegido para la semana</span><strong>Q{remaining.toFixed(2)}</strong></div><div><span>Ajustes protegidos</span><strong>Q{Number(repairs.remaining_gtq||0).toFixed(2)}</strong></div><div><span>Regla diaria</span><strong>1 video</strong></div></div>
  {!compact&&<p className="usage-budget-note">Los días no usados no se acumulan como videos extra. Las ediciones locales y Audio Finishing no consumen este presupuesto.</p>}
 </section>
}
