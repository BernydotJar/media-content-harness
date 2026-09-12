import { resolve } from 'node:path'
import { createService } from './services.mjs'
import { AtomicRepository } from './repository.mjs'
import { ExecutionService } from './execution.mjs'
const key=Symbol.for('media-factory.server.service')
export function getService(){
 if(globalThis[key])return globalThis[key]
 const dataRoot=resolve(process.env.MEDIA_FACTORY_DATA_ROOT||'./data')
 const repository=new AtomicRepository(dataRoot)
 const testMode=process.env.MEDIA_FACTORY_TEST_MODE==='1'
 const deploymentClass=process.env.MEDIA_FACTORY_DEPLOYMENT_CLASS||'production'
 const execution=new ExecutionService({repository,dataRoot,graphRuntimeRoot:process.env.GRAPH_HARNESS_RUNTIME_ROOT,releaseSha:process.env.MEDIA_FACTORY_RELEASE_SHA,testMode,deploymentClass})
 const service=createService({repository,dataRoot,identityFile:process.env.MEDIA_FACTORY_IDENTITY_FILE,operatorUsername:process.env.MEDIA_FACTORY_OPERATOR_USERNAME,operatorPasswordVerifier:process.env.MEDIA_FACTORY_OPERATOR_PASSWORD_VERIFIER,publicOrigin:process.env.MEDIA_FACTORY_PUBLIC_ORIGIN,releaseSha:process.env.MEDIA_FACTORY_RELEASE_SHA,testMode,deploymentClass,providers:execution.providers,execution})
 globalThis[key]=service
 execution.recover().catch(()=>{})
 return service
}
