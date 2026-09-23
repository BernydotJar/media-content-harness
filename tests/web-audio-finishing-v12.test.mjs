import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, mkdtemp, mkdir, rm } from 'node:fs/promises'
import { normalizeAudioFinishingContract, AudioFinishingEngine, videoStreamSha256 } from '../server/audio-finishing.mjs'
import { handleApi } from '../server/http.mjs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFile as callback } from 'node:child_process'
import { promisify } from 'node:util'
const execFile=promisify(callback)

const origin='https://media.example.org'

test('AudioFinishingContract is versioned, normalized and idempotent while semantic lyric markers fail closed',()=>{
 const input={schema_version:'audio-finishing.v1',preserve_original_intro:{enabled:true,from_seconds:0},soundtrack:{asset_id:'audio_'+ 'a'.repeat(64),start_seconds:0,gain_db:-8},voice:{preserve:true,delay_ms:0},mix:{voice_priority:true,duck_under_voice:true},outro:{enabled:true,source_in_seconds:18.42,source_out_seconds:19.31,approved_phrase:'Firmes Firmes',tail_ms:900,echo:true,reverb:true},master:{integrated_lufs:-14,true_peak_max_dbtp:-1.5,compressor:'gentle',limiter:true},sync:{lock_to_video_duration:true}}
 const first=normalizeAudioFinishingContract(input),second=normalizeAudioFinishingContract(first)
 assert.deepEqual(second,first);assert.equal(first.schema_version,'audio-finishing.v1');assert.equal(first.soundtrack.start_seconds,0);assert.equal(first.outro.approved_phrase,'Firmes Firmes')
 assert.throws(()=>normalizeAudioFinishingContract({...input,outro:{...input.outro,marker:'firmes_firmes'}}),e=>e.code==='INVALID_INPUT'||e.code==='INVALID_AUDIO_FINISHING')
 assert.throws(()=>normalizeAudioFinishingContract({...input,outro:{...input.outro,source_in_seconds:20,source_out_seconds:19}}),e=>e.code==='INVALID_AUDIO_FINISHING')
})

test('V12 HTTP surface keeps audio upload binary and finishing contract JSON on the authenticated job route',async()=>{
 const calls=[]
 const service={options:{publicOrigin:origin},uploadAudioAsset:async(token,id,input)=>{calls.push(['upload',token,id,input]);return{id:'audio_test'}},configureAudioFinishing:async(token,id,input)=>{calls.push(['finish',token,id,input]);return{id,status:'QUEUED'}},health:async()=>({status:'ready'})}
 const cookie={cookie:'media_factory_session=session-token','sec-fetch-site':'same-origin',origin}
 const upload=await handleApi(new Request(origin+'/api/v1/jobs/job_one/audio-assets',{method:'POST',headers:{...cookie,'content-type':'video/mp4'},body:new Uint8Array([0,0,0,24,102,116,121,112])}),service)
 assert.equal(upload.status,201);assert.equal(calls[0][0],'upload');assert.equal(calls[0][1],'session-token');assert.equal(calls[0][2],'job_one');assert.equal(calls[0][3].mime_type,'video/mp4');assert.ok(Buffer.isBuffer(calls[0][3].bytes))
 const finish=await handleApi(new Request(origin+'/api/v1/jobs/job_one/audio-finishing',{method:'POST',headers:{...cookie,'content-type':'application/json'},body:JSON.stringify({soundtrack:{asset_id:'audio_test'}})}),service)
 assert.equal(finish.status,202);assert.deepEqual(calls[1].slice(0,3),['finish','session-token','job_one']);assert.deepEqual(calls[1][3],{soundtrack:{asset_id:'audio_test'}})
})

test('review stays decision-first while Studio exposes advanced audio controls and explicit outro IN/OUT',async()=>{
 const [source,studio,metadata,css]=await Promise.all([readFile('components/jobs.tsx','utf8'),readFile('components/studio.tsx','utf8'),readFile('server/site-metadata.mjs','utf8'),readFile('app/globals.css','utf8')])
 for(const text of ['TU DECISIÓN','¿Esta versión está bien?','Pedir un cambio','Abrir Studio','Ajusta música, voz y cierre.','Música','Voz','Final','Terminar audio','Crear nueva versión','audio/mpeg','audio/wav','.mp3','.wav','.m4a','MP3, WAV, M4A, MP4, MOV o WebM'])assert.ok(source.includes(text),text)
 assert.ok(source.includes('studioMode?<>'));assert.ok(source.includes('reviewable&&hasVideo?<AudioFinishingPanel'));assert.match(source,/IN \(s\)/);assert.match(source,/OUT \(s\)/);assert.match(source,/Si quieres usar un fragmento exacto al final/);assert.match(source,/Picture lock/);assert.match(source,/El audio necesita un último ajuste/);assert.match(source,/Reintentar master de audio/);assert.match(source,/showRepairInstructions/)
 assert.match(studio,/studioMode=\{segments\[2\] === 'studio'\}/);assert.match(metadata,/Studio de producción/);assert.match(css,/\.audio-finishing-panel/);assert.match(css,/\.review-studio-entry/);assert.match(css,/\.advanced-job-info/)
})

test('short dynamic 4.8 second master uses bounded loudness correction without changing picture lock',async t=>{
 const root=await mkdtemp(join(tmpdir(),'short-audio-v18-'));t.after(()=>rm(root,{recursive:true,force:true}));await mkdir(root,{recursive:true})
 const picture=join(root,'picture.mp4'),soundtrack=join(root,'soundtrack.mp3'),output=join(root,'out.mp4')
 await execFile('/usr/bin/ffmpeg',['-nostdin','-v','error','-y','-f','lavfi','-i','testsrc2=size=180x320:rate=30:duration=4.8','-f','lavfi','-i',"aevalsrc='if(lt(t,0.7),0.9*sin(2*PI*440*t),0.03*sin(2*PI*440*t))':s=48000:d=4.8",'-c:v','libx264','-threads','1','-c:a','aac','-pix_fmt','yuv420p','-shortest',picture])
 await execFile('/usr/bin/ffmpeg',['-nostdin','-v','error','-y','-f','lavfi','-i',"aevalsrc='if(mod(floor(t*4),2),0.5*sin(2*PI*220*t),0.02*sin(2*PI*220*t))':s=48000:d=12",'-c:a','libmp3lame','-b:a','192k',soundtrack])
 const before=await videoStreamSha256(picture),result=await new AudioFinishingEngine().finish({picturePath:picture,soundtrackPath:soundtrack,outputPath:output,contract:{soundtrack:{asset_id:'audio_test',start_seconds:0,gain_db:-8},voice:{preserve:true},mix:{duck_under_voice:true},outro:{enabled:false},master:{integrated_lufs:-14,true_peak_max_dbtp:-1.5,compressor:'gentle',limiter:true},sync:{lock_to_video_duration:true}}}),after=await videoStreamSha256(output)
 assert.equal(result.loudness_correction_applied,true);assert.ok(result.loudness_correction_db>1&&result.loudness_correction_db<=3);assert.ok(Math.abs(result.qa.integrated_lufs+14)<=1);assert.ok(result.qa.true_peak_dbtp<=-1.25);assert.equal(result.qa.sample_rate,48000);assert.equal(result.qa.channels,2);assert.equal(result.qa.duration_seconds,4.8);assert.equal(before,after)
})

test('V18 UX hides stale repair copy on audio QA blockers and normalizes chosen week to Monday',async()=>{
 const [jobs,planner]=await Promise.all([readFile('components/jobs.tsx','utf8'),readFile('components/planner.tsx','utf8')])
 for(const value of ['El audio necesita un último ajuste','Reintentar master de audio','RETRY_AUDIO_FINISHING','showRepairInstructions'])assert.ok(jobs.includes(value),value)
 assert.match(planner,/setWeek\(weekStart\(e\.target\.value\)\)/);assert.match(planner,/Elegimos automáticamente el lunes de esa semana/)
})

test('golden reference manifest documents exact measurable studio characteristics without committing the binary',async()=>{
 const doc=await readFile('docs/AUDIO_FINISHING_ENGINE.md','utf8'),script=await readFile('scripts/verify-audio-golden.mjs','utf8')
 for(const value of ['19.750 s','-13.5 LUFS','-1.9 dBFS','48 kHz','adfd2ccbeb01b2f059a0871b7830d9f88af053b3e548f403618cc327f24e3bac'])assert.ok(doc.includes(value),value)
 assert.match(script,/MEDIA_FACTORY_AUDIO_GOLDEN/);assert.match(doc,/evidence, not a template binary/i)
})
