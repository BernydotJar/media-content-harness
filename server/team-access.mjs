import {randomUUID} from 'node:crypto'
import {invariant,safeId,fields,boundedText} from './errors.mjs'

const MANAGERS=['owner','admin']
const ROLES=Object.freeze({municipal_coordinator:'reviewer',it:'admin',editor:'editor',viewer:'viewer'})
const LABELS={owner:'Propietario',reviewer:'Coordinador municipal',admin:'IT / Aprobación técnica',editor:'Editor',viewer:'Consulta'}
const emailKey=value=>String(value||'').trim().toLowerCase()
function roleFor(value){
 invariant(typeof value==='string'&&Object.hasOwn(ROLES,value),'INVALID_ROLE','Elige Coordinador municipal, IT, Editor o Consulta.')
 return ROLES[value]
}
function teamEmail(value){
 const email=boundedText(value,'Email',254).trim().toLowerCase()
 invariant(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),'INVALID_EMAIL','Escribe un correo válido.')
 return email
}

export function createTeamService({repository,auth,requireMembership,tenantIn,append,googleAuthVault}){
 async function localUsers(){
  // An intentionally Google-only configuration has no local users. A broken local
  // identity file must fail closed when deciding whether a user is protected.
  if(!auth.identityFile&&!auth.operatorUsername&&!auth.operatorPasswordVerifier)return []
  return auth.identities()
 }
 async function manager(token,id,state){
  const user=await auth.resolve(token,state)
  requireMembership(user,id,MANAGERS);tenantIn(state,id)
  return user
 }
 function protectTarget(state,id,userId,locals){
  invariant(!locals.some(u=>u.id===userId),'CONFIGURED_MEMBERSHIP_IMMUTABLE','El acceso administrativo se gestiona en la configuración del operador.',409)
  const user=state.external_users?.[userId]||state.local_accounts?.[userId],member=(state.memberships[userId]||[]).find(m=>m.tenant_id===id)
  invariant(user&&member,'NOT_FOUND','Miembro no encontrado.',404)
  invariant(member.role!=='owner','OWNER_IMMUTABLE','El propietario no se puede cambiar ni eliminar desde Equipo.',409)
  return {user,member}
 }
 function revokePending(state,id,email,actorId){
  for(const invite of Object.values(state.invitations||{})){
   if(invite.tenant_id===id&&emailKey(invite.email)===emailKey(email)&&invite.status==='PENDING'){
    invite.status='REVOKED';invite.revoked_by=actorId;invite.revoked_at=new Date().toISOString()
    append(state,id,'TEAM_INVITATION_REVOKED',{actor_id:actorId,invitation_id:invite.id,reason:'MEMBERSHIP_CHANGED'})
   }
  }
 }
 async function directory(state,id){
  const locals=await localUsers(),rows=[]
  for(const local of locals){
   if(local.disabled===true)continue
   const merged=new Map()
   for(const m of [...(state.memberships[local.id]||[]),...(local.memberships||[])])if(m?.tenant_id)merged.set(m.tenant_id,m)
   const member=merged.get(id)
   if(member)rows.push({user_id:local.id,name:local.name||local.email||local.username,email:local.email||local.username,role:member.role,responsibility:LABELS[member.role],auth_provider:'local',configured_membership:true,protected:true})
  }
  for(const user of Object.values(state.external_users||{})){
   const member=(state.memberships[user.id]||[]).find(m=>m.tenant_id===id)
   if(member)rows.push({user_id:user.id,name:user.name||user.email,email:user.email,role:member.role,responsibility:LABELS[member.role],auth_provider:user.provider,configured_membership:false,protected:member.role==='owner'})
  }
  for(const user of Object.values(state.local_accounts||{})){
   if(user.status!=='ACTIVE'||user.disabled===true)continue
   const member=(state.memberships[user.id]||[]).find(m=>m.tenant_id===id)
   if(member)rows.push({user_id:user.id,name:user.name||user.email,email:user.email,role:member.role,responsibility:LABELS[member.role],auth_provider:'local',account_type:'self_service',configured_membership:false,protected:member.role==='owner'})
  }
  return rows.sort((a,b)=>(a.role==='owner'?-1:0)-(b.role==='owner'?-1:0)||String(a.name).localeCompare(String(b.name)))
 }
 return {
  async team(token,id){
   const state=await repository.read(),user=await auth.resolve(token,state),membership=requireMembership(user,id)
   tenantIn(state,id)
   const canManage=MANAGERS.includes(membership.role),canConfigureGoogle=user.manage_integrations===true,members=await directory(state,id),vaultGoogle=canConfigureGoogle&&googleAuthVault?await googleAuthVault.summary():null,google_auth=canConfigureGoogle?{...(vaultGoogle||{configured:false,client_id:null,updated_at:null}),available:(await auth.googleConfig()).available}:null
   const invitations=canManage?Object.values(state.invitations||{}).filter(i=>i.tenant_id===id&&i.status==='PENDING'&&i.expires_at>Date.now()).sort((a,b)=>b.created_at.localeCompare(a.created_at)).map(i=>({id:i.id,email:i.email,role:i.role,responsibility:LABELS[i.role],status:i.status,created_at:i.created_at,expires_at:i.expires_at})):[]
   const registrations=canManage?(await auth.pendingLocalRegistrations(state,id)).sort((a,b)=>String(b.requested_at).localeCompare(String(a.requested_at))):[]
   return{tenant_id:id,current_user_id:user.id,current_role:membership.role,can_manage:canManage,can_configure_google:canConfigureGoogle,google_auth,members,invitations,registrations,approval_flow:[{stage:'CRITIC',label:'Aprobación de contenido',responsibility:'Coordinador municipal',roles:['owner','reviewer']},{stage:'INDEPENDENT_VERIFIER',label:'Verificación técnica',responsibility:'IT',roles:['owner','admin']},{stage:'RELEASE',label:'Aprobación final',responsibility:'Propietario o IT',roles:['owner','admin']}]}
  },
  async approveRegistration(token,id,userId,input){
   safeId(userId,'User ID');fields(input,['responsibility']);const role=roleFor(input.responsibility)
   return repository.transact(async state=>{
    const actor=await manager(token,id,state),account=state.local_accounts?.[userId]
    invariant(account&&account.status==='PENDING_APPROVAL'&&account.requested_tenant_id===id,'NOT_FOUND','Solicitud de acceso no encontrada.',404)
    state.memberships[userId]??=[];const existing=state.memberships[userId].find(m=>m.tenant_id===id);if(existing)existing.role=role;else state.memberships[userId].push({tenant_id:id,role})
    account.status='ACTIVE';account.approved_by=actor.id;account.approved_at=new Date().toISOString();account.updated_at=account.approved_at
    append(state,id,'LOCAL_ACCESS_APPROVED',{actor_id:actor.id,user_id:userId,role})
    return{user_id:userId,status:account.status,name:account.name,email:account.email,role,responsibility:LABELS[role]}
   })
  },
  async rejectRegistration(token,id,userId){
   safeId(userId,'User ID')
   return repository.transact(async state=>{
    const actor=await manager(token,id,state),account=state.local_accounts?.[userId]
    invariant(account&&account.status==='PENDING_APPROVAL'&&account.requested_tenant_id===id,'NOT_FOUND','Solicitud de acceso no encontrada.',404)
    account.status='REJECTED';account.rejected_by=actor.id;account.rejected_at=new Date().toISOString();account.updated_at=account.rejected_at
    append(state,id,'LOCAL_ACCESS_REJECTED',{actor_id:actor.id,user_id:userId})
    return{user_id:userId,status:account.status}
   })
  },
  async inviteTeamMember(token,id,input){
   fields(input,['email','responsibility'])
   const email=teamEmail(input.email),role=roleFor(input.responsibility)
   return repository.transact(async state=>{
    const actor=await manager(token,id,state),locals=await localUsers()
    invariant(!locals.some(u=>emailKey(u.email||u.username)===email),'CONFIGURED_MEMBERSHIP_IMMUTABLE','Este correo corresponde al acceso administrativo protegido. Usa el correo de la persona que invitas.',409)
    const existingOwner=Object.values(state.external_users||{}).find(u=>emailKey(u.email)===email&&(state.memberships[u.id]||[]).some(m=>m.tenant_id===id&&m.role==='owner'))
    invariant(!existingOwner,'OWNER_IMMUTABLE','El propietario no se puede cambiar desde Equipo.',409)
    state.invitations??={}
    const duplicate=Object.values(state.invitations).find(i=>i.tenant_id===id&&emailKey(i.email)===email&&i.status==='PENDING'&&i.expires_at>Date.now())
    if(duplicate){
     const previous_role=duplicate.role;duplicate.role=role;duplicate.updated_at=new Date().toISOString();duplicate.updated_by=actor.id
     append(state,id,'TEAM_INVITATION_UPDATED',{actor_id:actor.id,invitation_id:duplicate.id,previous_role,role})
     return{id:duplicate.id,status:'PENDING',email,role,responsibility:LABELS[role],expires_at:duplicate.expires_at}
    }
    const invitation={id:'invite_'+randomUUID(),tenant_id:id,email,role,status:'PENDING',invited_by:actor.id,created_at:new Date().toISOString(),expires_at:Date.now()+14*24*60*60_000}
    state.invitations[invitation.id]=invitation
    append(state,id,'TEAM_INVITATION_CREATED',{actor_id:actor.id,invitation_id:invitation.id,email,role})
    return{id:invitation.id,status:'PENDING',email,role,responsibility:LABELS[role],expires_at:invitation.expires_at}
   })
  },
  async updateTeamMember(token,id,userId,input){
   safeId(userId,'User ID');fields(input,['responsibility']);const role=roleFor(input.responsibility)
   return repository.transact(async state=>{
    const actor=await manager(token,id,state),locals=await localUsers(),{user,member}=protectTarget(state,id,userId,locals),previous_role=member.role
    member.role=role;revokePending(state,id,user.email,actor.id)
    append(state,id,'TEAM_MEMBER_ROLE_CHANGED',{actor_id:actor.id,user_id:userId,previous_role,role})
    return{user_id:userId,role,responsibility:LABELS[role]}
   })
  },
  async removeTeamMember(token,id,userId){
   safeId(userId,'User ID')
   return repository.transact(async state=>{
    const actor=await manager(token,id,state),locals=await localUsers(),{user,member}=protectTarget(state,id,userId,locals)
    state.memberships[userId]=state.memberships[userId].filter(m=>m.tenant_id!==id)
    revokePending(state,id,user.email,actor.id)
    append(state,id,'TEAM_MEMBER_REMOVED',{actor_id:actor.id,user_id:userId,previous_role:member.role})
    return{removed:true,user_id:userId}
   })
  },
  async revokeInvitation(token,id,inviteId){
   safeId(inviteId,'Invitation ID')
   return repository.transact(async state=>{
    const actor=await manager(token,id,state),invite=state.invitations?.[inviteId]
    invariant(invite&&invite.tenant_id===id&&invite.status==='PENDING','NOT_FOUND','Invitación no encontrada.',404)
    invite.status='REVOKED';invite.revoked_by=actor.id;invite.revoked_at=new Date().toISOString()
    append(state,id,'TEAM_INVITATION_REVOKED',{actor_id:actor.id,invitation_id:inviteId})
    return{revoked:true,id:inviteId}
   })
  }
 }
}
