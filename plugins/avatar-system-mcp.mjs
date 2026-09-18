import {avatarMcpCatalogDefinition,executeAvatarMcpTool} from '../server/avatar-system.mjs'

export const avatarMcpTools=avatarMcpCatalogDefinition()

export function listAvatarMcpTools(){return structuredClone(avatarMcpTools)}

export function callAvatarMcpTool(name,input,context){
  return executeAvatarMcpTool(name,input,context)
}
