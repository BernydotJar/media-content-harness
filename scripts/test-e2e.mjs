import { prepareRuntime } from './prepare-runtime.mjs'
import { webSourceState } from './web-source-state.mjs'
import { redactTestOutput } from './redact-test-output.mjs'
import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomBytes, scryptSync } from 'node:crypto'
import { spawn, execFileSync } from 'node:child_process'
import { createServer } from 'node:net'
import { once } from 'node:events'

const sourceState=await webSourceState()
const buildState=JSON.parse(await readFile('.next/media-factory-build.json','utf8'))
if(sourceState.source_sha256!==buildState.source_sha256)throw new Error('Browser verification requires a build of the current production sources')
if((await readFile('.next/BUILD_ID','utf8')).trim()!==buildState.build_id)throw new Error('Compiled output differs from the recorded build')
const immutable=!sourceState.working_tree_dirty&&!buildState.working_tree_dirty&&sourceState.commit===buildState.commit
if(process.argv.includes('--require-clean')&&!immutable)throw new Error('Release verification requires a clean commit and an exact build of that commit')
const temp = await mkdtemp(join(tmpdir(), 'media-factory-browser-e2e-'))
const dataRoot = join(temp, 'data')
await mkdir(dataRoot)
const identityFile = join(temp, 'identities.json')
const password = randomBytes(24).toString('hex')
const salt = randomBytes(24).toString('hex')
const email = 'browser-verifier@example.invalid'
await writeFile(identityFile, JSON.stringify({ users: [{ id: 'browser-verifier', email, name: 'Browser Verifier', password: { salt, hash: scryptSync(password, Buffer.from(salt, 'hex'), 64).toString('hex') }, memberships: [], can_create_tenants: true }] }), { mode: 0o600 })
const reservation = createServer()
reservation.listen(0, '127.0.0.1')
await once(reservation, 'listening')
const port = reservation.address().port
await new Promise(resolve => reservation.close(resolve))
const origin = `http://127.0.0.1:${port}`
const sha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
const graphRuntimeRoot=process.env.GRAPH_HARNESS_RUNTIME_ROOT||'/home/agent/.cache/media-content-harness/graph-harness-sdlc'
const env = { ...process.env, NODE_ENV: 'production', MEDIA_FACTORY_DATA_ROOT: dataRoot, MEDIA_FACTORY_IDENTITY_FILE: identityFile, MEDIA_FACTORY_PUBLIC_ORIGIN: origin, MEDIA_FACTORY_RELEASE_SHA: sha, MEDIA_FACTORY_DEPLOYMENT_CLASS: 'test', MEDIA_FACTORY_TEST_MODE: '1', GRAPH_HARNESS_RUNTIME_ROOT: graphRuntimeRoot, NEXT_TELEMETRY_DISABLED: '1' }
// Host identity must not bleed into an isolated browser verification run.
for (const key of ['MEDIA_FACTORY_OPERATOR_USERNAME', 'MEDIA_FACTORY_OPERATOR_PASSWORD_VERIFIER']) delete env[key]
const runtimeDirectory=join(temp,'runtime')
const runtimePackage=await prepareRuntime(runtimeDirectory)
const child = spawn(process.execPath, [join(runtimeDirectory,'server.js')], { cwd:runtimeDirectory, env:{...env,HOSTNAME:'127.0.0.1',PORT:String(port)}, stdio: ['ignore', 'pipe', 'pipe'] })
let log = ''
for (const stream of [child.stdout, child.stderr]) stream.on('data', chunk => { log = (log + String(chunk)).slice(-150000) })
const started = Date.now()
try {
  let ready = false
  while (Date.now() - started < 120000) {
    if (child.exitCode !== null) throw new Error('Next.js exited before health became ready')
    try { const response = await fetch(`${origin}/health`); if (response.status === 200) { ready = true; break } } catch {}
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  if (!ready) throw new Error('Browser E2E startup timeout')
  const { runStudioE2E } = await import('../tests/e2e/studio.mjs')
  const result = await runStudioE2E({ origin, email, password, dataRoot, identityFile, temp, sha })
  const afterState=await webSourceState()
  if(afterState.commit!==sourceState.commit||afterState.source_sha256!==sourceState.source_sha256||(immutable&&afterState.working_tree_dirty))throw new Error('Candidate changed during browser verification')
  if((await readFile('.next/BUILD_ID','utf8')).trim()!==buildState.build_id)throw new Error('Compiled output changed during browser verification')
  const report = { candidate_sha: immutable?sha:null, configured_health_release_sha:sha, working_tree_dirty:sourceState.working_tree_dirty, build_id:buildState.build_id, runtime_package:runtimePackage, production_source_sha256:sourceState.source_sha256, test_only: true, temporary_storage: true, elapsed_ms: Date.now() - started, result }
  await writeFile(join(temp, 'result.json'), JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify({ ...report, evidence_directory: temp }, null, 2))
} catch (error) {
  console.error(JSON.stringify({ result: 'FAIL', message: redactTestOutput(error.message,password), evidence_directory: temp }))
  process.exitCode = 1
} finally {
  child.kill('SIGTERM')
  await Promise.race([once(child, 'close'), new Promise(resolve => setTimeout(resolve, 10000))])
  if (child.exitCode === null) child.kill('SIGKILL')
  await writeFile(join(temp, 'server.log'), redactTestOutput(log,password), { mode: 0o600 })
}
