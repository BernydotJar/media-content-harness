import { execFile as callback } from 'node:child_process'
import { promisify } from 'node:util'
import { readFile } from 'node:fs/promises'
import { fields, invariant, boundedText } from './errors.mjs'
import { digest } from './worker-policy.mjs'

const execFile=promisify(callback)
const MAX_MEDIA_BYTES=40*1024*1024
const round3=value=>Math.round(Number(value)*1000)/1000

async function safeMediaInputArgs(path){
 const bytes=await readFile(path)
 invariant(bytes.length>0&&bytes.length<=MAX_MEDIA_BYTES,'INVALID_MEDIA','Media exceeds the permitted size',422)
 if(bytes.subarray(4,8).toString()==='ftyp')return ['-protocol_whitelist','file,pipe','-format_whitelist','mov','-f','mov','-enable_drefs','0','-use_absolute_path','0']
 if(bytes.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3])))return ['-protocol_whitelist','file,pipe','-format_whitelist','matroska,webm','-f','matroska']
 if(bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WAVE')return ['-protocol_whitelist','file,pipe','-format_whitelist','wav','-f','wav']
 const id3=bytes.subarray(0,3).toString()==='ID3',mpegFrame=bytes.length>=2&&bytes[0]===0xff&&(bytes[1]&0xe0)===0xe0
 invariant(id3||mpegFrame,'INVALID_MEDIA','Only binary MP3, WAV, M4A, MP4, MOV, and WebM media is accepted',422)
 return ['-protocol_whitelist','file,pipe','-format_whitelist','mp3','-f','mp3']
}

function finite(value,label,min,max,defaultValue){
 const number=value===undefined?defaultValue:Number(value)
 invariant(Number.isFinite(number)&&number>=min&&number<=max,'INVALID_AUDIO_FINISHING',label+' is outside the supported range',422)
 return number
}
function boolean(value,defaultValue){invariant(value===undefined||typeof value==='boolean','INVALID_AUDIO_FINISHING','Audio finishing flags must be booleans',422);return value===undefined?defaultValue:value}
function object(value,label){invariant(value===undefined||(value&&typeof value==='object'&&!Array.isArray(value)),'INVALID_AUDIO_FINISHING',label+' must be an object',422);return value||{}}

export function normalizeAudioFinishingContract(input={}){
 invariant(input&&typeof input==='object'&&!Array.isArray(input),'INVALID_AUDIO_FINISHING','Audio finishing contract must be an object',422)
 fields(input,['schema_version','preserve_original_intro','soundtrack','voice','mix','outro','master','sync']);invariant(input.schema_version===undefined||input.schema_version==='audio-finishing.v1','INVALID_AUDIO_FINISHING','Unsupported audio finishing schema version',422)
 const intro=object(input.preserve_original_intro,'preserve_original_intro');fields(intro,['enabled','from_seconds'])
 const soundtrack=object(input.soundtrack,'soundtrack');fields(soundtrack,['asset_id','start_seconds','gain_db']);invariant(typeof soundtrack.asset_id==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/.test(soundtrack.asset_id),'INVALID_AUDIO_FINISHING','Choose an uploaded soundtrack asset',422)
 const voice=object(input.voice,'voice');fields(voice,['preserve','delay_ms'])
 const mix=object(input.mix,'mix');fields(mix,['voice_priority','duck_under_voice','duck_threshold','duck_ratio'])
 const outro=object(input.outro,'outro');fields(outro,['enabled','source_in_seconds','source_out_seconds','approved_phrase','tail_ms','echo','reverb','gain_db'])
 const master=object(input.master,'master');fields(master,['integrated_lufs','true_peak_max_dbtp','compressor','limiter'])
 const sync=object(input.sync,'sync');fields(sync,['lock_to_video_duration'])
 const outroEnabled=boolean(outro.enabled,false),outroIn=outroEnabled?finite(outro.source_in_seconds,'outro.source_in_seconds',0,600,0):0,outroOut=outroEnabled?finite(outro.source_out_seconds,'outro.source_out_seconds',0.05,600,0.9):0
 if(outroEnabled)invariant(outroOut>outroIn,'INVALID_AUDIO_FINISHING','Outro out point must be after the in point',422)
 const approvedPhrase=outro.approved_phrase==null?null:boundedText(outro.approved_phrase,'Approved outro phrase',120);if(outroEnabled)invariant(approvedPhrase,'INVALID_AUDIO_FINISHING','An enabled outro requires an approved phrase label',422)
 return {
  schema_version:'audio-finishing.v1',
  preserve_original_intro:{enabled:boolean(intro.enabled,true),from_seconds:finite(intro.from_seconds,'preserve_original_intro.from_seconds',0,60,0)},
  soundtrack:{asset_id:soundtrack.asset_id,start_seconds:finite(soundtrack.start_seconds,'soundtrack.start_seconds',0,600,0),gain_db:finite(soundtrack.gain_db,'soundtrack.gain_db',-30,6,-8)},
  voice:{preserve:boolean(voice.preserve,true),delay_ms:Math.round(finite(voice.delay_ms,'voice.delay_ms',0,2000,0))},
  mix:{voice_priority:boolean(mix.voice_priority,true),duck_under_voice:boolean(mix.duck_under_voice,true),duck_threshold:finite(mix.duck_threshold,'mix.duck_threshold',0.005,0.5,0.05),duck_ratio:finite(mix.duck_ratio,'mix.duck_ratio',1,20,8)},
  outro:{enabled:outroEnabled,source_in_seconds:round3(outroIn),source_out_seconds:round3(outroOut),approved_phrase:approvedPhrase,tail_ms:Math.round(finite(outro.tail_ms,'outro.tail_ms',0,3000,900)),echo:boolean(outro.echo,true),reverb:boolean(outro.reverb,true),gain_db:finite(outro.gain_db,'outro.gain_db',-18,9,0)},
  master:{integrated_lufs:finite(master.integrated_lufs,'master.integrated_lufs',-24,-8,-14),true_peak_max_dbtp:finite(master.true_peak_max_dbtp,'master.true_peak_max_dbtp',-3,-0.5,-1.5),compressor:master.compressor===undefined?'gentle':boundedText(master.compressor,'Compressor mode',40),limiter:boolean(master.limiter,true)},
  sync:{lock_to_video_duration:boolean(sync.lock_to_video_duration,true)},
 }
}

async function probe(path){
 const args=await safeMediaInputArgs(path)
 const {stdout}=await execFile('/usr/bin/ffprobe',['-v','error',...args,'-show_entries','stream=index,codec_type,codec_name,duration,sample_rate,channels,channel_layout,width,height,r_frame_rate:format=duration','-of','json',path],{timeout:30000,maxBuffer:1024*1024})
 const value=JSON.parse(stdout),duration=Number(value.format?.duration),audio=value.streams?.find(s=>s.codec_type==='audio'),video=value.streams?.find(s=>s.codec_type==='video')
 invariant(Number.isFinite(duration)&&duration>0,'INVALID_MEDIA','Media duration is unavailable',422)
 return {args,duration,audio,video,raw:value}
}

export async function inspectSoundtrack(path){
 const info=await probe(path)
 invariant(info.audio,'INVALID_SOUNDTRACK','Soundtrack must contain an audio stream',422)
 return {duration_seconds:info.duration,sample_rate:Number(info.audio.sample_rate)||null,channels:Number(info.audio.channels)||null,codec:info.audio.codec_name||null}
}

export async function videoStreamSha256(path){
 const args=await safeMediaInputArgs(path)
 const {stdout}=await execFile('/usr/bin/ffmpeg',['-nostdin','-v','error',...args,'-i',path,'-map','0:v:0','-c','copy','-f','hash','-hash','sha256','-'],{timeout:60000,maxBuffer:1024*1024})
 const match=stdout.match(/SHA256=([a-f0-9]{64})/i);invariant(match,'VIDEO_HASH_UNAVAILABLE','Could not verify picture lock',503);return match[1].toLowerCase()
}

export async function inspectAudioMaster(path){
 const info=await probe(path);invariant(info.video,'INVALID_MEDIA','Finished master must contain video',422);invariant(info.audio,'INVALID_MEDIA','Finished master must contain audio',422)
 await execFile('/usr/bin/ffmpeg',['-nostdin','-v','error',...info.args,'-i',path,'-f','null','-'],{timeout:120000,maxBuffer:1024*1024})
 const {stderr}=await execFile('/usr/bin/ffmpeg',['-nostdin','-hide_banner',...info.args,'-i',path,'-af','ebur128=peak=true','-f','null','-'],{timeout:120000,maxBuffer:4*1024*1024})
 const summary=stderr.slice(stderr.lastIndexOf('Summary:'))
 const integrated=summary.match(/I:\s*(-?\d+(?:\.\d+)?)\s*LUFS/),lra=summary.match(/LRA:\s*(\d+(?:\.\d+)?)\s*LU/),peak=summary.match(/Peak:\s*(-?\d+(?:\.\d+)?)\s*dBFS/)
 invariant(integrated&&lra&&peak,'AUDIO_QA_UNAVAILABLE','Could not measure loudness and true peak',503)
 return {duration_seconds:round3(info.duration),video_duration_seconds:round3(Number(info.video.duration)||info.duration),audio_duration_seconds:round3(Number(info.audio.duration)||info.duration),sample_rate:Number(info.audio.sample_rate)||null,channels:Number(info.audio.channels)||null,integrated_lufs:Number(integrated[1]),lra_lu:Number(lra[1]),true_peak_dbtp:Number(peak[1]),decode_ok:true}
}

function dbVolume(value){return Number(value).toFixed(2)+'dB'}
function msStereo(value){return String(Math.max(0,Math.round(value)))+'|'+String(Math.max(0,Math.round(value)))}

export class AudioFinishingEngine {
 async finish({picturePath,soundtrackPath,outputPath,contract}){
  const normalized=normalizeAudioFinishingContract(contract),picture=await probe(picturePath),soundtrack=await probe(soundtrackPath)
  invariant(picture.video,'INVALID_MEDIA','Picture lock must contain video',422);invariant(soundtrack.audio,'INVALID_SOUNDTRACK','Soundtrack must contain audio',422)
  const duration=picture.duration,sourceAudio=Boolean(picture.audio),outro=normalized.outro
  invariant(normalized.soundtrack.start_seconds<soundtrack.duration,'INVALID_AUDIO_FINISHING','Soundtrack start is outside the uploaded asset',422)
  if(outro.enabled)invariant(outro.source_out_seconds<=soundtrack.duration,'INVALID_AUDIO_FINISHING','Outro timecodes exceed the uploaded soundtrack',422)
  const pictureHashBefore=await videoStreamSha256(picturePath),pictureArgs=await safeMediaInputArgs(picturePath),soundtrackArgs=await safeMediaInputArgs(soundtrackPath)
  const args=['-nostdin','-v','error','-y',...pictureArgs,'-i',picturePath,...soundtrackArgs,'-i',soundtrackPath],filters=[]
  const voiceDelay=normalized.voice.delay_ms
  if(sourceAudio&&normalized.voice.preserve){
    filters.push('[0:a:0]aresample=48000,apad,atrim=duration='+duration+',asetpts=PTS-STARTPTS'+(voiceDelay?(',adelay='+msStereo(voiceDelay)): '')+'[voice]')
  }else filters.push('anullsrc=channel_layout=stereo:sample_rate=48000,atrim=duration='+duration+'[voice]')
  filters.push(outro.enabled?'[1:a:0]asplit=2[musicraw][outroraw]':'[1:a:0]anull[musicraw]')
  filters.push('[musicraw]atrim=start='+normalized.soundtrack.start_seconds+',asetpts=PTS-STARTPTS,aresample=48000,volume='+dbVolume(normalized.soundtrack.gain_db)+',apad,atrim=duration='+duration+'[music]')
  const useDucking=normalized.mix.duck_under_voice&&normalized.voice.preserve&&sourceAudio
  if(useDucking){
    filters.push('[voice]asplit=2[voice_mix][voice_sc]')
    filters.push('[music][voice_sc]sidechaincompress=threshold='+normalized.mix.duck_threshold+':ratio='+normalized.mix.duck_ratio+':attack=20:release=260[ducked]')
    filters.push('[voice_mix][ducked]amix=inputs=2:duration=longest:normalize=0[mainmix]')
  }else filters.push('[voice][music]amix=inputs=2:duration=longest:normalize=0[mainmix]')
  let mixLabel='mainmix'
  if(outro.enabled){
    const segment=outro.source_out_seconds-outro.source_in_seconds,tail=outro.tail_ms/1000,startAt=Math.max(0,duration-segment-tail),delay=Math.round(startAt*1000)
    let chain='[outroraw]atrim=start='+outro.source_in_seconds+':end='+outro.source_out_seconds+',asetpts=PTS-STARTPTS,aresample=48000,volume='+dbVolume(outro.gain_db)
    if(outro.echo)chain+=',aecho=0.8:0.42:180:0.34'
    if(outro.reverb)chain+=',aecho=0.8:0.32:55|105:0.18|0.12'
    chain+=',adelay='+msStereo(delay)+',apad,atrim=duration='+duration+'[outro]';filters.push(chain)
    filters.push('[mainmix][outro]amix=inputs=2:duration=longest:normalize=0[premaster]');mixLabel='premaster'
  }
  const compressor=normalized.master.compressor==='gentle'?',acompressor=threshold=-18dB:ratio=2:attack=10:release=120:makeup=1.15':''
  const limiter=normalized.master.limiter?',alimiter=limit='+Math.pow(10,normalized.master.true_peak_max_dbtp/20).toFixed(6)+':attack=5:release=50':''
  filters.push('['+mixLabel+']'+compressor.replace(/^,/, '')+(compressor?'':'anull')+limiter+',loudnorm=I='+normalized.master.integrated_lufs+':TP='+normalized.master.true_peak_max_dbtp+':LRA=7:linear=true,aresample=48000,atrim=duration='+duration+',asetpts=N/SR/TB[aout]')
  args.push('-filter_complex_threads','1','-filter_complex',filters.join(';'),'-map','0:v:0','-map','[aout]','-t',String(duration),'-c:v','copy','-c:a','aac','-b:a','256k','-ar','48000','-ac','2','-movflags','+faststart',outputPath)
  await execFile('/usr/bin/ffmpeg',args,{timeout:180000,maxBuffer:4*1024*1024})
  const pictureHashAfter=await videoStreamSha256(outputPath);invariant(pictureHashAfter===pictureHashBefore,'PICTURE_LOCK_CHANGED','Audio finishing changed the picture stream',409)
  const qa=await inspectAudioMaster(outputPath),loudnessDelta=Math.abs(qa.integrated_lufs-normalized.master.integrated_lufs),durationDelta=Math.max(Math.abs(qa.audio_duration_seconds-duration),Math.abs(qa.video_duration_seconds-duration))
  invariant(loudnessDelta<=1.0,'LOUDNESS_QA_FAILED','Finished audio missed the loudness target',409)
  invariant(qa.true_peak_dbtp<=normalized.master.true_peak_max_dbtp+0.25,'TRUE_PEAK_QA_FAILED','Finished audio exceeds the true-peak ceiling',409)
  invariant(!normalized.sync.lock_to_video_duration||durationDelta<=0.04,'AV_SYNC_QA_FAILED','Finished audio and video durations are not locked',409)
  return {contract:normalized,contract_sha256:digest(normalized),picture_stream_sha256:pictureHashBefore,qa,output_duration_seconds:round3(duration)}
 }
}
