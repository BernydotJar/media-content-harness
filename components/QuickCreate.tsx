'use client';
import Link from 'next/link';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import styles from './QuickCreate.module.css';

type Workspace = { tenant_id: string; organization: string };
export function QuickCreate({ tenants, loading = false, brand }: { tenants: Workspace[]; loading?: boolean; brand?: 'firmes' }) {
  const modes = [{ path: 'weekly', label: 'Producción semanal', description: 'Planifica una semana de historias' }, { path: 'free', label: 'Modo libre', description: 'Empieza con tus propias palabras' }];
  return <DropdownMenu.Root>
    <DropdownMenu.Trigger className={styles.trigger + (brand==='firmes' ? ' '+styles.firmes : '')} disabled={loading} aria-busy={loading || undefined}>
      <span aria-hidden="true" className={styles.plus}>+</span>Crear<Chevron down />
    </DropdownMenu.Trigger>
    <DropdownMenu.Portal>
      <DropdownMenu.Content className={styles.content + (brand==='firmes' ? ' '+styles.firmes : '')} sideOffset={8} align="end" collisionPadding={12} loop aria-label="Crear contenido">
        <DropdownMenu.Label className={styles.label}>Una nueva historia</DropdownMenu.Label>
        {tenants.length ? modes.map(mode => <DropdownMenu.Sub key={mode.path}>
          <DropdownMenu.SubTrigger className={styles.item} textValue={mode.label}>
            <span><strong>{mode.label}</strong><small>{mode.description}</small></span><Chevron />
          </DropdownMenu.SubTrigger>
          <DropdownMenu.Portal>
            <DropdownMenu.SubContent className={styles.content + (brand==='firmes' ? ' '+styles.firmes : '')} sideOffset={6} alignOffset={-6} collisionPadding={12} loop aria-label={'Espacios para ' + mode.label.toLowerCase()}>
              <DropdownMenu.Label className={styles.label}>Elige un espacio</DropdownMenu.Label>
              {tenants.map(tenant => <DropdownMenu.Item asChild className={styles.item} key={tenant.tenant_id} textValue={tenant.organization}>
                <Link href={'/workspace/' + encodeURIComponent(tenant.tenant_id) + '/' + mode.path}>{tenant.organization}</Link>
              </DropdownMenu.Item>)}
            </DropdownMenu.SubContent>
          </DropdownMenu.Portal>
        </DropdownMenu.Sub>) : <DropdownMenu.Item asChild className={styles.item}>
          <Link href="/workspaces"><span><strong>Crear un espacio de trabajo</strong><small>Tu organización y su material</small></span></Link>
        </DropdownMenu.Item>}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>;
}
function Chevron({ down = false }: { down?: boolean }) { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d={down ? 'm4 6 4 4 4-4' : 'm6 4 4 4-4 4'} /></svg>; }
