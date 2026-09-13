'use client';
import Image from 'next/image';
import {useId, type ReactNode} from 'react';
import type {Item} from './ui';
import firmesCaballito from '../config/brand-assets/firmes-caballito.png';

const LEGACY_FIRMES_TENANTS=new Set(['caballito']);

export function isFirmesTenant(tenant?:Item|null){
 if(!tenant)return false;
 const identity=String(tenant.brand?.identity_key||tenant.brand?.theme||'').toLowerCase();
 const display=String(tenant.brand?.display_name||tenant.organization||'');
 return identity==='firmes'||/\bfirmes\b/i.test(display)||LEGACY_FIRMES_TENANTS.has(String(tenant.tenant_id||''));
}

export function FirmesCaballito({compact=false}:{compact?:boolean}){
 return <span className={'firmes-caballito '+(compact?'compact':'')}><Image src={firmesCaballito} alt="Caballito de FIRMES" sizes={compact?'84px':'(max-width: 720px) 160px, 230px'} priority={!compact}/></span>;
}

export function FirmesLockup({compact=false}:{compact?:boolean}){
 return <span className={'firmes-lockup '+(compact?'compact':'')} aria-label="FIRMES"><span className="firmes-mark" aria-hidden="true"><svg viewBox="0 0 64 64" role="presentation"><polygon points="32,4 55,17 55,47 32,60 9,47 9,17"/><path d="M21 42V21h23M21 31h18"/></svg></span><span className="firmes-word">FIRMES<small>IDENTIDAD V2</small></span></span>;
}

export function FirmesFrame({tenant,children,banner=true}:{tenant?:Item|null;children:ReactNode;banner?:boolean}){
 if(!isFirmesTenant(tenant))return <>{children}</>;
 return <section className="brand-firmes-v2" data-brand="firmes-v2">{banner&&<FirmesBrandBanner/>}{children}</section>;
}

export function FirmesBrandBanner(){
 const id='gooey-'+useId().replace(/:/g,'');
 return <aside className="firmes-brand-banner" aria-label="Identidad visual FIRMES V2"><svg className="gooey-filter-defs" aria-hidden="true"><defs><filter id={id} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur"/><feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10" result="goo"/><feComposite in="SourceGraphic" in2="goo" operator="atop"/></filter></defs></svg><div className="firmes-gooey" style={{filter:`url(#${id})`}} aria-hidden="true"><i/><i/><i/></div><FirmesCaballito compact/><FirmesLockup/><div className="firmes-brand-copy"><span>MANUAL DE IDENTIDAD · JULIO 2026</span><strong>Fuerza gráfica. Claridad operativa.</strong><small>Paleta, jerarquía y caballito autorizado, aplicados sin alterar la procedencia del contenido.</small></div></aside>;
}
