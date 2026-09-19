import { access } from 'node:fs/promises'
import { resolve } from 'node:path'
import { inspectAudioMaster, videoStreamSha256 } from '../server/audio-finishing.mjs'

const path=resolve(process.argv[2]||process.env.MEDIA_FACTORY_AUDIO_GOLDEN||'/shared-auth/development/firmes_hero_song_only_intro00_polished_final_exact.mp4')
await access(path)
const qa=await inspectAudioMaster(path),video_stream_sha256=await videoStreamSha256(path)
const expected={duration_seconds:19.75,sample_rate:48000,channels:2,integrated_lufs:-13.5,lra_lu:1.7,true_peak_dbtp:-1.9,video_stream_sha256:'adfd2ccbeb01b2f059a0871b7830d9f88af053b3e548f403618cc327f24e3bac'}
const within=(a,b,tolerance)=>Math.abs(Number(a)-Number(b))<=tolerance
const checks={
 duration:within(qa.duration_seconds,expected.duration_seconds,0.001),
 av_sync:within(qa.audio_duration_seconds,qa.video_duration_seconds,0.001),
 sample_rate:qa.sample_rate===expected.sample_rate,
 channels:qa.channels===expected.channels,
 integrated_loudness:within(qa.integrated_lufs,expected.integrated_lufs,0.1),
 loudness_range:within(qa.lra_lu,expected.lra_lu,0.1),
 true_peak:within(qa.true_peak_dbtp,expected.true_peak_dbtp,0.1),
 decode:qa.decode_ok===true,
 picture_hash:video_stream_sha256===expected.video_stream_sha256,
}
const result={status:Object.values(checks).every(Boolean)?'PASS':'FAIL',path,qa,video_stream_sha256,expected,checks}
console.log(JSON.stringify(result,null,2))
if(result.status!=='PASS')process.exitCode=1
