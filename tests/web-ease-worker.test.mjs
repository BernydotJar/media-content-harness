import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { AtomicRepository } from '../server/repository.mjs'
import { withJobLease } from '../server/worker-lock.mjs'
import { publicJob } from '../server/services.mjs'
import { ExecutionService } from '../server/execution.mjs'
import { digest, GRAPH_REVISION } from '../server/worker-policy.mjs'
import { execFile as callback } from 'node:child_process'
import { promisify } from 'node:util'
import { inspectVideo, FFmpegAdapter } from '../server/worker-adapters.mjs'
const execFile=promisify(callback)
const runtime=process.env.GRAPH_HARNESS_RUNTIME_ROOT||'/home/agent/.cache/media-content-harness/graph-harness-sdlc'
const actor={id:'owner',memberships:[{tenant_id:'tenant-a',role:'owner'}]}
async function fixture(options={}){const root=await mkdtemp(join(tmpdir(),'media-web-execution-'));const repository=new AtomicRepository(root);const source={id:'real-source',locator:'https://example.com/authorized',purpose:'source',authorization:'explicit',match:'exact'};await repository.transact(s=>{s.tenants['tenant-a']={tenant_id:'tenant-a',sources:[source]};s.dna['tenant-a']={revision:'dna-1'};s.jobs['job-one']={id:'job-one',tenant_id:'tenant-a',title:'A real story',objective:'Show our work',source_ids:[source.id],story_devices:['activity-first-story'],strategy:'REAL_FOOTAGE',preferred_provider:'AUTO',target:{aspect_ratio:'9:16',duration_seconds:[1,2]},source_authorization_snapshot:[source],content_dna_revision:'dna-1',status:'BRIEF',stage:'BRIEF',artifacts:[],evidence:[],approvals:[],blockers:[],created_by:'owner'};return null});const service=new ExecutionService({repository,dataRoot:root,graphRuntimeRoot:runtime,testMode:true,deploymentClass:'test',releaseSha:'a'.repeat(40),...options});assert.equal((await service.health()).graph,true,'Mandatory pinned Graph runtime must be available; this test must not skip');return {root,repository,service,source}}
async function runToReview(f){await f.service.start(actor,'job-one');await f.service.drain();return (await f.repository.read()).jobs['job-one']}
async function approve(f){const j=(await f.repository.read()).jobs['job-one'];const value=await f.service.approve(actor,j.id,{candidate_sha:j.candidate_sha,review_stage:j.stage});await f.service.drain();return (await f.repository.read()).jobs[j.id]}
test('mascot and place snapshots reach actual human treatment review, then block unsupported composition before generation',async()=>{const f=await fixture();const context={character:{id:'horse',name:'Caballito',description:'Personaje ficticio principal',content_sha:'c'.repeat(64)},place:{id:'place',name:'Lugar documentado',facts:'Datos aportados con referencia'}};await f.repository.transact(s=>{s.jobs['job-one'].mascot=true;s.jobs['job-one'].creative_context=context;return null});let job=await runToReview(f);assert.equal(job.stage,'CREATIVE_GATE');assert.equal(job.status,'AWAITING_REVIEW');assert.deepEqual(job.treatment.creative_context,context);assert.equal(job.artifacts.length,0);job=await approve(f);assert.equal(job.stage,'PROVIDER_PRODUCTION');assert.equal(job.status,'BLOCKED');assert.equal(job.blockers[0].code,'MASCOT_RENDER_UNAVAILABLE');assert.equal(job.artifacts.length,0);assert.equal(job.provider_execution,undefined);assert.ok(job.graph.nodes.some(n=>n.id==='DIRECTOR_TREATMENT'&&n.status==='done'));});
