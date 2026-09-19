'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { api, useLoad, items, Mark, Icon, Loading, Problem, Empty } from './ui';
import { Dashboard, Workspaces, TenantSurface } from './workspace';
import { JobDetail, JobLibrary } from './jobs';
import StudioEntry from './StudioEntry';
import { Integrations } from './Integrations';
import { QuickCreate } from './QuickCreate';
import { FirmesLockup, isFirmesTenant } from './FirmesBrand';
import { Onboarding } from './Onboarding';

export default function Studio({ segments, googleAvailable=false }: { segments: string[]; googleAvailable?: boolean }) {
  const router = useRouter();
  const login = segments[0] === 'login';
  const me = useLoad(login ? null : '/me');
  const tenants = useLoad(!login && me.data ? '/tenants' : null);
  const onboarding = useLoad(!login && me.data ? '/me/onboarding' : null);
  const tenantId = segments[0] === 'workspace' ? segments[1] : null;
  const current = segments[2] || '';
  const routeJob = useLoad(!login && me.data && segments[0] === 'jobs' && segments[1] ? '/jobs/' + encodeURIComponent(segments[1]) : null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (me.error && /401|AUTH|SESSION/.test(me.error.code)) router.replace('/login');
  }, [me.error, router]);

  useEffect(() => setMobileOpen(false), [segments.join('/')]);

  if (login) return <StudioEntry googleAvailable={googleAvailable} />;
  if (me.loading || (!me.data && !me.error)) return <main className="standalone"><Mark /><Loading /></main>;
  if (me.error) return <main className="standalone"><Mark /><Problem error={me.error} retry={me.reload} /><Link href="/login">Volver a iniciar sesión</Link></main>;

  const tenantList = items(tenants.data);
  const shellTenantId = tenantId || routeJob.data?.tenant_id || (tenantList.length === 1 ? tenantList[0].tenant_id : null);
  const tenant = tenantList.find(t => t.tenant_id === shellTenantId);
  const firmesShell = isFirmesTenant(tenant);
  const createHref = shellTenantId ? '/workspace/' + encodeURIComponent(shellTenantId) + '/free' : '/workspaces';
  const creating = segments[0] === 'workspace' && ['free', 'weekly', 'scene'].includes(current);

  const primary = [
    { href: '/dashboard', label: 'Inicio', icon: 'home', active: !segments.length || segments[0] === 'dashboard' },
    { href: createHref, label: 'Crear', icon: 'spark', active: creating },
    { href: '/review', label: 'Revisar', icon: 'review', active: segments[0] === 'review' },
    { href: '/releases', label: 'Entregas', icon: 'release', active: segments[0] === 'releases' }
  ];

  const setup = tenantId ? [
    { key: 'start', label: 'Resumen', icon: 'home' },
    { key: 'sources', label: 'Material', icon: 'sources' },
    { key: 'content-dna', label: 'Estilo', icon: 'dna' },
    { key: 'creative-profiles', label: 'Personajes y lugares', icon: 'dna' },
    { key: 'team', label: 'Equipo', icon: 'review' }
  ] : [];
  const setupActive = setup.some(item => item.key === current);
  const showBrands = tenantList.length > 1 || segments[0] === 'workspaces' || me.data.can_create_tenants === true;

  let content: ReactNode;
  if (!segments.length || segments[0] === 'dashboard') content = <Dashboard tenants={tenants} user={me.data} tenant={tenant} onboarding={onboarding} />;
  else if (segments[0] === 'onboarding') content = <Onboarding user={me.data} tenants={tenants} state={onboarding} />;
  else if (segments[0] === 'workspaces') content = <Workspaces resource={tenants} user={me.data} />;
  else if (segments[0] === 'workspace' && tenantId) content = <TenantSurface id={tenantId} view={current || 'weekly'} />;
  else if (segments[0] === 'admin') content = <Integrations allowed={me.data.manage_integrations === true} />;
  else if (segments[0] === 'jobs' && segments[1]) content = <JobDetail id={segments[1]} manageIntegrations={me.data.manage_integrations === true} />;
  else if (segments[0] === 'review' || segments[0] === 'releases') content = <JobLibrary tenants={tenants} releases={segments[0] === 'releases'} />;
  else content = <Empty title="Esta página no está en el estudio." action={<Link className="button primary" href="/dashboard">Ir al inicio</Link>}>Elige un espacio para continuar.</Empty>;

  const quickTenants = tenantList.map(t => ({ tenant_id: t.tenant_id, organization: t.organization }));

  return <div className={'studio ' + (firmesShell ? 'firmes-shell-v2' : '')}>
    <a className="skip" href="#main">Saltar al contenido</a>

    <div className="mobile-bar liquid-glass-nav">
      <Link className="brand" href="/dashboard"><Mark small /><span>Media Factory</span></Link>
      <div className="mobile-actions">
        <QuickCreate tenants={quickTenants} loading={tenants.loading} brand={firmesShell ? 'firmes' : undefined} />
        <button aria-expanded={mobileOpen} aria-controls="studio-nav" aria-label="Abrir navegación" onClick={() => setMobileOpen(v => !v)}>☰</button>
      </div>
    </div>

    <aside id="studio-nav" className={'sidebar liquid-glass-nav ' + (mobileOpen ? 'open' : '')}>
      <Link className="brand studio-brand" href="/dashboard">
        <Mark small />
        <span>Media Factory<small>Creative Studio</small></span>
      </Link>

      <nav className="primary-nav" aria-label="Principal">
        {primary.map(item => <Link className={'nav-item ' + (item.active ? 'active' : '')} href={item.href} aria-current={item.active ? 'page' : undefined} key={item.label}>
          <Icon name={item.icon} />
          <span>{item.label}</span>
        </Link>)}
      </nav>

      {showBrands && <Link className={'nav-item nav-secondary ' + (segments[0] === 'workspaces' ? 'active' : '')} href="/workspaces">
        <Icon name="grid" />
        <span>Marcas</span>
      </Link>}

      {shellTenantId && <Link className="workspace-label glass-brand-chip" href={'/workspace/' + encodeURIComponent(shellTenantId) + '/start'}>
        {firmesShell ? <FirmesLockup compact /> : <span className="tenant-avatar">{(tenant?.organization || shellTenantId || 'E').slice(0, 1).toUpperCase()}</span>}
        <span>{tenant?.organization || shellTenantId}<small>Marca actual</small></span>
        <span className="brand-chip-arrow" aria-hidden="true">↗</span>
      </Link>}

      {tenantId && <details className="nav-setup" open={setupActive}>
        <summary><span><Icon name="grid" />Configurar marca</span><span className="summary-chevron" aria-hidden="true">⌄</span></summary>
        <nav aria-label="Configurar marca">
          {setup.map(item => <Link className={'nav-item ' + (item.key === current ? 'active' : '')} href={'/workspace/' + tenantId + '/' + item.key} aria-current={item.key === current ? 'page' : undefined} key={item.key}>
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </Link>)}
        </nav>
      </details>}

      {me.data.manage_integrations === true && <Link className={'nav-item nav-admin ' + (segments[0] === 'admin' ? 'active' : '')} href="/admin/integrations">
        <Icon name="grid" />
        <span>APIs e integraciones</span>
      </Link>}

      <div className="sidebar-bottom">
        <Link className={'nav-item nav-help '+(segments[0]==='onboarding'?'active':'')} href="/onboarding"><Icon name="spark"/><span>Guía rápida</span></Link>
        <div className="account">
          <span className="avatar">{(me.data.name || me.data.email || 'U').slice(0, 1).toUpperCase()}</span>
          <span>{me.data.name || me.data.email}<small>Tu cuenta</small></span>
          <button className="logout" aria-label="Cerrar sesión" title="Cerrar sesión" onClick={async () => {
            try {
              await api('/auth/logout', {});
              router.replace('/login');
            } catch {
              me.reload();
            }
          }}>↗</button>
        </div>
      </div>
    </aside>

    <main id="main" className="main">
      <div className="topline liquid-glass-topline">
        <div className="topline-context">
          <span>Media Factory</span>
          {tenant && <><i aria-hidden="true" /><strong>{tenant.organization}</strong></>}
        </div>
        <div className="topline-actions">
          <span className="approval-assurance"><span className="tiny-dot" />Tú apruebas</span>
          <QuickCreate tenants={quickTenants} loading={tenants.loading} brand={firmesShell ? 'firmes' : undefined} />
        </div>
      </div>
      {content}
      <footer className="footer"><span>Media Factory</span><span>Ideas propias. Fuentes claras. Historias que conectan.</span></footer>
    </main>
  </div>;
}
