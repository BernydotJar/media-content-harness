import {prepareRuntime} from './prepare-runtime.mjs'
import {webSourceState} from './web-source-state.mjs'
import {mkdtemp,mkdir,writeFile,readFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {randomBytes,scryptSync} from 'node:crypto'
import {spawn,execFileSync} from 'node:child_process'
import {createServer} from 'node:net'
import {once} from 'node:events'
import {chromium,expect} from '@playwright/test'
import assert from 'node:assert/strict'

const sourceState=await webSourceState()
const buildState=JSON.parse(await readFile('.next/media-factory-build.json','utf8'))
if(sourceState.source_sha256!==buildState.source_sha256)throw new Error('Creator Insight browser verification requires a build of current sources')
const immutable=!sourceState.working_tree_dirty&&!buildState.working_tree_dirty&&sourceState.commit===buildState.commit
if(process.argv.includes('--require-clean')&&!immutable)throw new Error('Creator Insight release verification requires a clean exact candidate')

const temp=await mkdtemp(join(tmpdir(),'creator-insight-v22-e2e-'))
const dataRoot=join(temp,'data');await mkdir(dataRoot)
const identityFile=join(temp,'identities.json')
const password=randomBytes(24).toString('hex'),salt=randomBytes(24).toString('hex'),email='creator-insight-v22@example.invalid'
await writeFile(identityFile,JSON.stringify({users:[{id:'creator-v22',email,name:'Creator V22',password:{salt,hash:scryptSync(password,Buffer.from(salt,'hex'),64).toString('hex')},memberships:[],can_create_tenants:true}]}),{mode:0o600})
const reservation=createServer();reservation.listen(0,'127.0.0.1');await once(reservation,'listening');const port=reservation.address().port;await new Promise(resolve=>reservation.close(resolve))
const origin=`http://127.0.0.1:${port}`,sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()
const env={...process.env,NODE_ENV:'production',MEDIA_FACTORY_DATA_ROOT:dataRoot,MEDIA_FACTORY_IDENTITY_FILE:identityFile,MEDIA_FACTORY_PUBLIC_ORIGIN:origin,MEDIA_FACTORY_RELEASE_SHA:sha,MEDIA_FACTORY_DEPLOYMENT_CLASS:'test',MEDIA_FACTORY_TEST_MODE:'1',GRAPH_HARNESS_RUNTIME_ROOT:process.env.GRAPH_HARNESS_RUNTIME_ROOT||'/home/agent/.cache/media-content-harness/graph-harness-sdlc',NEXT_TELEMETRY_DISABLED:'1'}
for(const key of ['MEDIA_FACTORY_OPERATOR_USERNAME','MEDIA_FACTORY_OPERATOR_PASSWORD_VERIFIER'])delete env[key]
const runtimeDirectory=join(temp,'runtime'),runtimePackage=await prepareRuntime(runtimeDirectory)
const child=spawn(process.execPath,[join(runtimeDirectory,'server.js')],{cwd:runtimeDirectory,env:{...env,HOSTNAME:'127.0.0.1',PORT:String(port)},stdio:['ignore','pipe','pipe']})
let log='';for(const stream of [child.stdout,child.stderr])stream.on('data',chunk=>{log=(log+String(chunk)).slice(-100000)})
const started=Date.now(),browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/usr/bin/chromium',headless:true,args:['--no-sandbox']})
try{
 let ready=false
 while(Date.now()-started<120000){if(child.exitCode!==null)throw new Error('Next.js exited before ready');try{if((await fetch(origin+'/health')).status===200){ready=true;break}}catch{}await new Promise(resolve=>setTimeout(resolve,250))}
 if(!ready)throw new Error('Creator Insight browser startup timeout')
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();page.setDefaultTimeout(20000)
 const login=await context.request.post(origin+'/api/v1/auth/login',{headers:{Origin:origin},data:{email,password}});assert.equal(login.status(),200)
 const tenant=await context.request.post(origin+'/api/v1/tenants',{headers:{Origin:origin},data:{organization:'Creator Insight V22',tenant_id:'creator-insight-v22',content_context:'commercial'}});assert.equal(tenant.status(),201)
 await page.goto(origin+'/workspace/creator-insight-v22/insights')
 await expect(page.getByRole('heading',{name:'Convierte señales en un plan de contenido.',exact:true})).toBeVisible()
 await expect(page.getByText(/No inventamos métricas externas ni datos de TikTok/)).toBeVisible()
 await expect(page.getByText('Vista cronológica del material registrado por tu equipo; no es un ranking ni una recomendación de plataforma.',{exact:true})).toBeVisible()
 const metrics=page.locator('.insight-metric');await expect(metrics).toHaveCount(4);for(let i=0;i<4;i++)await expect(metrics.nth(i).locator('strong')).toHaveText('0')
 await page.getByLabel('Tema o búsqueda').fill('cómo iluminar un video con una sola luz')
 await page.getByLabel('Tipo de señal').selectOption('search')
 await page.getByLabel('Qué estás observando').fill('Pregunta repetida en conversaciones del equipo.')
 await page.getByText('Marcar como oportunidad de contenido',{exact:true}).click()
 await page.getByRole('button',{name:'Crear plan de contenido',exact:true}).click()
 const card=page.locator('.insight-card').first();await expect(card.getByRole('heading',{name:'cómo iluminar un video con una sola luz',exact:true})).toBeVisible()
 await expect(metrics.nth(0).locator('strong')).toHaveText('1');await expect(metrics.nth(1).locator('strong')).toHaveText('1')
 await expect(page.getByLabel('Analítica de señales registradas')).toContainText('Búsqueda 1')
 for(const field of ['IDEA','TÍTULO','DESCRIPCIÓN','HASHTAGS'])await expect(card.getByText(field,{exact:true})).toBeVisible()
 await page.getByLabel('Buscar insights').fill('sin coincidencias');await expect(page.getByText('No hay coincidencias.',{exact:true})).toBeVisible()
 await page.getByLabel('Buscar insights').fill('iluminar');await expect(card).toBeVisible()
 await page.getByLabel('Filtrar insights').selectOption('gap');await expect(card).toBeVisible()
 await page.getByLabel('Filtrar por señal').selectOption('comments');await expect(page.getByText('No hay coincidencias.',{exact:true})).toBeVisible()
 await page.getByLabel('Filtrar por señal').selectOption('search');await expect(card).toBeVisible()
 await card.getByRole('button',{name:'Editar plan',exact:true}).click()
 await card.getByLabel('Título',{exact:true}).fill('Iluminación simple con una sola luz')
 await card.locator('textarea[name="description"]').fill('Guía breve para organizar una luz principal de forma clara y práctica.')
 await card.getByRole('button',{name:'Guardar cambios',exact:true}).click()
 await expect(card.getByText('Iluminación simple con una sola luz',{exact:true})).toBeVisible()
 await card.getByRole('button',{name:'Aprobar plan',exact:true}).click();await expect(card.getByText('Aprobado',{exact:true})).toBeVisible();await expect(metrics.nth(3).locator('strong')).toHaveText('1')
 await page.screenshot({path:join(temp,'creator-insight-v22-approved.png'),fullPage:true})
 await card.getByRole('link',{name:'Crear con este plan →',exact:true}).click();await expect(page).toHaveURL(/\/workspace\/creator-insight-v22\/free\?insight=/)
 await expect(page.getByLabel('¿Qué quieres crear?')).toHaveValue(/Iluminación simple con una sola luz/)
 const report={status:'PASS',candidate_sha:immutable?sha:null,working_tree_dirty:sourceState.working_tree_dirty,build_id:buildState.build_id,production_source_sha256:sourceState.source_sha256,runtime_package:runtimePackage,checks:['workspace-only discovery provenance','four overview metrics','internal signal analytics','search and filters','idea/title/description/hashtags','exact human approval','Create handoff'],evidence_directory:temp}
 await writeFile(join(temp,'result.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));await context.close()
}catch(error){console.error(JSON.stringify({status:'FAIL',message:error.message,evidence_directory:temp}));process.exitCode=1}
finally{await browser.close();child.kill('SIGTERM');await Promise.race([once(child,'close'),new Promise(resolve=>setTimeout(resolve,10000))]);if(child.exitCode===null)child.kill('SIGKILL');await writeFile(join(temp,'server.log'),log,{mode:0o600})}
