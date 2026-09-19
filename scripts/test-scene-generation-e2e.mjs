import {prepareRuntime} from './prepare-runtime.mjs'
import {webSourceState} from './web-source-state.mjs'
import {redactTestOutput} from './redact-test-output.mjs'
import {mkdtemp,mkdir,writeFile,readFile,copyFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {randomBytes,scryptSync} from 'node:crypto'
import {spawn,execFileSync} from 'node:child_process'
import {createServer} from 'node:net'
import {once} from 'node:events'

const requireClean=process.argv.includes('--require-clean')
const sourceState=await webSourceState(),buildState=JSON.parse(await readFile('.next/media-factory-build.json','utf8'))
if(sourceState.source_sha256!==buildState.source_sha256)throw new Error('Scene verification requires a build of the current production sources')
if((await readFile('.next/BUILD_ID','utf8')).trim()!==buildState.build_id)throw new Error('Compiled output differs from the recorded build')
const immutable=!sourceState.working_tree_dirty&&!buildState.working_tree_dirty&&sourceState.commit===buildState.commit
if(requireClean&&!immutable)throw new Error('Exact scene verification requires a clean commit and exact build')
const temp=await mkdtemp(join(tmpdir(),'media-factory-scene-e2e-')),dataRoot=join(temp,'data');await mkdir(dataRoot);const identityFile=join(temp,'identities.json')
const passwordRecord=password=>{const salt=randomBytes(24).toString('hex');return {salt,hash:scryptSync(password,Buffer.from(salt,'hex'),64).toString('hex')}}
const account=(id,role,admin=false)=>{const password=randomBytes(24).toString('hex');return {public:{id,email:id+'@example.invalid',password},record:{id,email:id+'@example.invalid',name:id.replaceAll('-',' '),password:passwordRecord(password),memberships:role?[{tenant_id:'firmes-scene',role}]:[],can_create_tenants:admin,system_admin:admin}}}
const owner=account('scene-owner',null,true),critic=account('scene-critic','reviewer'),verifier=account('scene-verifier','admin'),accounts={owner:owner.public,critic:critic.public,verifier:verifier.public}
await writeFile(identityFile,JSON.stringify({users:[owner.record,critic.record,verifier.record]}),{mode:0o600})
const firstImage=join(temp,'first-result.png'),acceptedImage=join(temp,'accepted-result.png'),environmentImage=join(temp,'antigua-environment.png'),finalVideo=join(temp,'final-video.mp4')
for(const [path,color] of [[firstImage,'red'],[acceptedImage,'green'],[environmentImage,'blue']])execFileSync('/usr/bin/ffmpeg',['-nostdin','-v','error','-y','-f','lavfi','-i','color=c='+color+':s=540x960:d=0.1','-frames:v','1',path])
execFileSync('/usr/bin/ffmpeg',['-nostdin','-v','error','-y','-f','lavfi','-i','color=c=yellow:s=540x960:d=6','-c:v','libx264','-threads','1','-pix_fmt','yuv420p',finalVideo])
const reservation=createServer();reservation.listen(0,'127.0.0.1');await once(reservation,'listening');const port=reservation.address().port;await new Promise(resolve=>reservation.close(resolve));const origin=`http://127.0.0.1:${port}`,sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()
const env={...process.env,NODE_ENV:'production',MEDIA_FACTORY_DATA_ROOT:dataRoot,MEDIA_FACTORY_IDENTITY_FILE:identityFile,MEDIA_FACTORY_PUBLIC_ORIGIN:origin,MEDIA_FACTORY_RELEASE_SHA:sha,MEDIA_FACTORY_DEPLOYMENT_CLASS:'controlled_single_operator_preview',GRAPH_HARNESS_RUNTIME_ROOT:'/home/agent/.cache/media-content-harness/graph-harness-sdlc',NEXT_TELEMETRY_DISABLED:'1'};for(const key of ['MEDIA_FACTORY_TEST_MODE','MEDIA_FACTORY_OPERATOR_USERNAME','MEDIA_FACTORY_OPERATOR_PASSWORD_VERIFIER'])delete env[key]
const runtimeDirectory=join(temp,'runtime'),runtimePackage=await prepareRuntime(runtimeDirectory),child=spawn(process.execPath,[join(runtimeDirectory,'server.js')],{cwd:runtimeDirectory,env:{...env,HOSTNAME:'127.0.0.1',PORT:String(port)},stdio:['ignore','pipe','pipe']});let log='';for(const stream of [child.stdout,child.stderr])stream.on('data',chunk=>{log=(log+String(chunk)).slice(-180000)});const started=Date.now()
try{
 let ready=false;while(Date.now()-started<120000){if(child.exitCode!==null)throw new Error('runtime exited before health became ready');try{if((await fetch(origin+'/health')).status===200){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,250))}if(!ready)throw new Error('runtime startup timeout')
 const {runSceneGenerationE2E}=await import('../tests/e2e/scene-generation.mjs'),result=await runSceneGenerationE2E({origin,accounts,temp,firstImage,acceptedImage,environmentImage,finalVideo})
 const afterState=await webSourceState();if(afterState.commit!==sourceState.commit||afterState.source_sha256!==sourceState.source_sha256||(immutable&&afterState.working_tree_dirty))throw new Error('Candidate changed during scene verification')
 const report={candidate_sha:immutable?sha:null,working_tree_dirty:sourceState.working_tree_dirty,production_source_sha256:sourceState.source_sha256,build_id:buildState.build_id,runtime_package:runtimePackage,test_mode:false,deployment_class:'controlled_single_operator_preview',elapsed_ms:Date.now()-started,result};await writeFile(join(temp,'result.json'),JSON.stringify(report,null,2)+'\n')
 if(!requireClean){const out='progress/media-factory-web/creation-e2e';await mkdir(out,{recursive:true});for(const name of ['scene-builder-compiled.png','scene-external-package.png','scene-critic-repair.png','scene-video-from-hero.png','scene-released.png'])await copyFile(join(temp,name),join(out,name));await copyFile(join(temp,'result.json'),join(out,'scene-generation-e2e.json'))}
 console.log(JSON.stringify({...report,evidence_directory:temp},null,2))
}catch(error){const secrets=[accounts.owner.password,accounts.critic.password,accounts.verifier.password];let message=error.message;for(const secret of secrets)message=redactTestOutput(message,secret);console.error(JSON.stringify({result:'FAIL',message,evidence_directory:temp}));process.exitCode=1}finally{child.kill('SIGTERM');await Promise.race([once(child,'close'),new Promise(resolve=>setTimeout(resolve,10000))]);if(child.exitCode===null)child.kill('SIGKILL');let safeLog=log;for(const account of Object.values(accounts))safeLog=redactTestOutput(safeLog,account.password);await writeFile(join(temp,'server.log'),safeLog,{mode:0o600})}
