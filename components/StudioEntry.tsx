'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import hero from '../assets/media-factory-hero.webp';
import { api, Mark, Icon, Problem, type ApiError } from './ui';
import styles from './StudioEntry.module.css';

export default function StudioEntry() {
 const router = useRouter(), frame = useRef<HTMLElement>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState<ApiError|null>(null);
 const [paused,setPaused]=useState(false),[reduce,setReduce]=useState(true),[visible,setVisible]=useState(true),[inView,setInView]=useState(true);
 useEffect(()=>{const query=window.matchMedia('(prefers-reduced-motion: reduce)');const preference=()=>setReduce(query.matches);const visibility=()=>setVisible(!document.hidden);preference();visibility();query.addEventListener('change',preference);document.addEventListener('visibilitychange',visibility);const observer=new IntersectionObserver(entries=>setInView(entries[0]?.isIntersecting??false),{threshold:0.05});if(frame.current)observer.observe(frame.current);return()=>{query.removeEventListener('change',preference);document.removeEventListener('visibilitychange',visibility);observer.disconnect()};},[]);
 const stopped=paused||reduce||!visible||!inView;
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();if(busy)return;setBusy(true);setError(null);const fields=new FormData(e.currentTarget);try{await api('/auth/login',{email:fields.get('email'),password:fields.get('password')});router.replace('/dashboard');router.refresh()}catch(err){setError(err as ApiError)}finally{setBusy(false)}}
 return <main className={styles.entry}>
  <a className="skip" href="#studio-access">Ir al acceso del estudio</a>
  <section className={styles.story} aria-labelledby="entry-title">
   <header className={styles.header}><Link className="brand" href="/login"><Mark small/><span>Media Factory<small>ESTUDIO CREATIVO</small></span></Link><a className={styles.jump} href="#studio-access">Entrar <span aria-hidden="true">↘</span></a></header>
   <div className={styles.intro}><p className={styles.eyebrow}>LA MIRADA ES TUYA. LAS POSIBILIDADES, INFINITAS.</p><h1 id="entry-title">Dale forma a<br/><span>lo que imaginas.</span></h1><p className={styles.subtitle}>Material real. Identidad propia.<br/>Un nuevo espacio para tus historias.</p></div>
   <figure ref={frame} className={styles.artwork} data-paused={stopped} aria-label="Arte original de Media Factory">
    <img src={hero.src} width={hero.width} height={hero.height} alt="Escultura de vidrio rojo con luz ámbar que fluye alrededor de una apertura oscura" fetchPriority="high" className={styles.hero}/>
    <div className={styles.lightSweep} aria-hidden="true"/>
    <figcaption className={styles.artCaption}><span>01 / UNA IDEA TOMA FORMA</span><span>ARTE CONCEPTUAL · IA</span></figcaption>
    <button type="button" className={styles.motion} onClick={()=>setPaused(p=>!p)} aria-pressed={paused} disabled={reduce} aria-label={reduce?'Movimiento reducido por tu preferencia del sistema':paused?'Reanudar animación':'Pausar animación'}><span aria-hidden="true">{stopped?'▷':'Ⅱ'}</span><span>{reduce?'Movimiento reducido':paused?'Reanudar':'Pausar'}</span></button>
   </figure>
   <footer className={styles.storyFooter}><p>Creatividad con dirección.<br/><strong>Cada entrega, con tu aprobación.</strong></p><span aria-hidden="true" className={styles.signature}>M<span>F</span>—</span></footer>
  </section>
  <section id="studio-access" className={styles.access} aria-labelledby="access-title">
   <div className={styles.accessBody}><div className={styles.number} aria-hidden="true">02 / ENTRA AL ESTUDIO</div><p className={styles.eyebrow}>DE LA IDEA A LA ENTREGA</p><h2 id="access-title">Vamos a crear.</h2><p className={styles.accessDescription}>Entra a tus espacios de trabajo.<br/>Tu próxima historia te espera.</p><form onSubmit={submit} aria-busy={busy}><label className={styles.field}><span>Usuario o correo</span><input name="email" type="text" autoComplete="username" placeholder="Tu usuario" required/></label><label className={styles.field}><span>Contraseña</span><input name="password" type="password" autoComplete="current-password" required/></label><Problem error={error}/><button className={styles.enter} disabled={busy}>{busy?'Entrando…':'Entrar al estudio'}<Icon name="arrow"/></button></form><p className={styles.help}>Tu organización gestiona el acceso. Si necesitas una cuenta, contacta a la persona responsable de tu espacio.</p></div>
   <footer className={styles.accessFooter}><span>IDEAR. PRODUCIR. REVISAR.</span><p>Las herramientas cambian.<br/>Tu mirada permanece.</p></footer>
  </section>
 </main>
}
