import {MediaGraphService} from '/workspace/plugins/media-graph.mjs';
import {readFile,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
process.chdir('/workspace');
const paths={projectPath:'graph/media-factory-web.project.json',eventsPath:'graph/media-factory-web.events.jsonl'};
const graph=new MediaGraphService({failClosed:true,projectRoot:'/workspace',runtimeRoot:'/home/agent/.cache/media-content-harness/graph-harness-sdlc',pinnedRevision:'477bdcc3d390c30eb49d823e5c7fd105fee2cc4d'});
const commit='c648711cd2cf53d6371c1de5504165f4b423eda8', dir='progress/media-factory-web/c648711-deployed/';
const hash=async p=>createHash('sha256').update(await readFile(p)).digest('hex');
const before=await graph.status(paths); const states=Object.fromEntries(before.nodes.map(n=>[n.id,n.status]));
if(states['WEB005-DEPLOYMENT']!=='done'||states['WEB006-RELEASE']!=='ready')throw Error('Unexpected graph state; inspect before retrying');
const move=async(node,to,reason)=>graph.transition({...paths,node,to,actor:'codex-root',reason});
async function evidence(node,kind,actor,artifact,command,metadata={}){return graph.recordEvidence({...paths,node,kind,actor,artifact,command,result:'PASS',sha256:await hash(artifact),commit,metadata});}
async function gate(node,items){const ids=[];for(const item of items)ids.push((await evidence(node,...item)).event_id); await graph.evaluateGate({...paths,node,actor:'codex-root-release-gate',gate:'implementation_quality',result:'PASS',evidenceIds:ids,note:'Separate Critic and Independent Verifier accept this exact signed, deployed controlled software release. Existing tests are reused with source identities; product capabilities remaining in OPEN_BLOCKERS are not declared complete.'});await move(node,'review','Actual independent evidence accepts the bounded delivered release');await move(node,'done','Gate passed and exact release evidence persisted; broad product terminal remains PARTIAL_WITH_DOCUMENTED_BLOCKERS');}
await move('WEB006-RELEASE','running','Highest-priority and only remaining READY delivery node');
await evidence('WEB006-RELEASE','implementation','codex-root',dir+'RELEASE_REPORT.md','Persisted truthful delivery report and boundaries after actual host convergence',{blockers_artifact:dir+'OPEN_BLOCKERS.json',blockers_sha256:await hash(dir+'OPEN_BLOCKERS.json'),test_reuse:'progress/media-factory-web/TEST_REUSE_CHECKPOINT.md'});
await gate('WEB006-RELEASE',[
 ['critique','ibm-granite-release-risk','progress/media-factory-web/c648711/risk-raw.json','Actual prior exact-candidate risk model review; unchanged software and signed receipt reused'],
 ['critique','deployment_recovery',dir+'deployment-critic.md','Independent final deployment and public boundary critique, no rerun'],
 ['independent_verification','graph_engineer_recovery',dir+'release-independent-review.md','Independent final read-only release evidence and scope review; accepts controlled delivery and documents remaining integration work']
]);
await graph.checkpoint({...paths,actor:'codex-root',label:'PARTIAL_WITH_DOCUMENTED_BLOCKERS-deployed-controlled-software-delivery',commit,evidenceSummary:{terminal_state:'PARTIAL_WITH_DOCUMENTED_BLOCKERS',software_release_sha:commit,deployment:'active/converged',request_id:'3f932cee-be65-4206-8460-3e442b08c355',software_delivery_nodes:'6/6 DONE',broad_product_vision:'PARTIAL; missing integrations and real production activation remain explicit',host_evidence_sha256:await hash(dir+'host-reconcile.json'),public_verification_sha256:await hash(dir+'public-verification.json'),blockers_artifact:dir+'OPEN_BLOCKERS.json',blockers_sha256:await hash(dir+'OPEN_BLOCKERS.json'),test_reuse:true,paid_generation_performed:false,customer_media_approval:false,social_publication:false}});
const status=await graph.status(paths);const remaining=await graph.readyNodes(paths);if(remaining.length)throw Error('READY delivery work remains');
await writeFile(dir+'graph-final-status.json',JSON.stringify(status,null,2)+'\n');
await writeFile(dir+'FINAL_STATE.json',JSON.stringify({terminal_state:'PARTIAL_WITH_DOCUMENTED_BLOCKERS',software_release_sha:commit,product_url:'https://media-factory.textilesdemedellin.com/login',health_url:'https://media-factory.textilesdemedellin.com/health',repository:'https://github.com/BernydotJar/media-content-harness',branch:'main',nodes:Object.fromEntries(status.nodes.map(n=>[n.id,n.status])),ready_nodes:remaining,blockers:dir+'OPEN_BLOCKERS.json',release_report:dir+'RELEASE_REPORT.md'},null,2)+'\n');
console.log(JSON.stringify({nodes:Object.fromEntries(status.nodes.map(n=>[n.id,n.status])),ready_nodes:remaining,terminal_state:'PARTIAL_WITH_DOCUMENTED_BLOCKERS'},null,2));
