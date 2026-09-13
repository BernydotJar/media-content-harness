import {readFile} from 'node:fs/promises'
import {join} from 'node:path'
import {createHash} from 'node:crypto'
import {invariant} from './errors.mjs'

export const FIRMES_CABALLITO={
  id:'firmes-caballito-manual-p42',
  sha256:'b17c55ffb0eec46bfa719128ee68a9f18475c45afb90d6d73ce9d82567938397',
  relative_path:join('config','brand-assets','firmes-caballito.png'),
  synthetic:false,
}

export function isFirmesTenantRecord(tenant){
 if(!tenant)return false
 const identity=String(tenant.brand?.identity_key||tenant.brand?.theme||'').toLowerCase()
 const display=String(tenant.brand?.display_name||tenant.organization||'')
 return identity==='firmes'||/\bfirmes\b/i.test(display)||tenant.tenant_id==='caballito'
}

export async function authorizedFirmesCaballito(state,job){
 if(!job?.mascot)return null
 const character=job.creative_context?.character
 const tenant=state.tenants?.[job.tenant_id]
 if(!character||character.rights_confirmed!==true||character.name!=='Caballito de Firmes'||!isFirmesTenantRecord(tenant))return null
 const path=join(process.cwd(),'config','brand-assets','firmes-caballito.png')
 const bytes=await readFile(path)
 const sha256=createHash('sha256').update(bytes).digest('hex')
 invariant(sha256===FIRMES_CABALLITO.sha256,'BRAND_ASSET_CHANGED','The authorized FIRMES caballito asset changed; production was stopped',409)
 return {...FIRMES_CABALLITO,path,sha256}
}
