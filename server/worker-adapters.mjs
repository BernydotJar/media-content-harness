import { execFile as callback } from 'node:child_process'
import { promisify } from 'node:util'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { invariant } from './errors.mjs'
const execFile=promisify(callback)
const RESOLUTIONS={'9:16':[1080,1920],'1:1':[1080,1080],'16:9':[1920,1080]}
async function inputArgs(path){const bytes=await readFile(path);invariant(bytes.length>0&&bytes.length<=40*1024*1024,'INVALID_MEDIA','Media exceeds the permitted size',422);if(bytes.subarray(4,8).toString()==='ftyp')return ['-protocol_whitelist','file,pipe','-format_whitelist','mov','-f','mov','-enable_drefs','0','-use_absolute_path','0'];invariant(bytes.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3])),'INVALID_MEDIA','Only binary MP4, MOV, and WebM media is accepted',422);return ['-protocol_whitelist','file,pipe','-format_whitelist','matroska,webm','-f','matroska']}
export class FFmpegAdapter {
  capabilities(){return {strategies:['REAL_FOOTAGE'],paid:false,automatic_social_publish:false}}
  estimate(){return {credits:0}}
  async prepare(input){invariant(input.assets?.length>0&&input.assets.length<=8,'SOURCE_BYTES_REQUIRED','Upload one to eight authorized videos to continue',409);return input}
  async generate(input){
    const output=join(input.directory,'candidate.mp4'),target=input.job.target||{},range=target.duration_seconds
    const duration=input.job.repair_controls?.duration_seconds??(Array.isArray(range)?Number(range[0]):Number(range??8))
    invariant(Number.isFinite(duration)&&duration>=1&&duration<=60,'INVALID_TARGET','Target duration must be between 1 and 60 seconds',422)
    const dimensions=RESOLUTIONS[target.aspect_ratio||'9:16'];invariant(dimensions,'INVALID_TARGET','Target aspect ratio is unsupported',422)
    const [width,height]=dimensions,args=['-nostdin','-v','error','-y'],filters=[];let concat=''
    for(let i=0;i<input.assets.length;i++){
      const asset=input.assets[i],meta=await inspectVideo(asset.path),part=duration/input.assets.length
      invariant(meta.duration_seconds>=part,'SOURCE_TOO_SHORT','Uploaded footage is too short for the requested duration',409)
      args.push(...await inputArgs(asset.path),'-i',asset.path)
      filters.push('['+i+':v]trim=duration='+part+',setpts=PTS-STARTPTS,scale='+width+':'+height+':force_original_aspect_ratio=decrease,pad='+width+':'+height+':(ow-iw)/2:(oh-ih)/2:color=black,fps=30,setsar=1[v'+i+']')
      if(meta.has_audio)filters.push('['+i+':a]aresample=48000,apad,atrim=duration='+part+',asetpts=PTS-STARTPTS[a'+i+']')
      else filters.push('anullsrc=channel_layout=stereo:sample_rate=48000,atrim=duration='+part+'[a'+i+']')
      concat+='[v'+i+'][a'+i+']'
    }
    filters.push(concat+'concat=n='+input.assets.length+':v=1:a=1[basev][a]')
    if(input.mascotAsset){
      const mascot=await readFile(input.mascotAsset.path);invariant(mascot.length>0&&mascot.length<=8*1024*1024,'BRAND_ASSET_CHANGED','The authorized mascot asset is unavailable',409)
      const mascotIndex=input.assets.length,argsWidth=Math.round(width*.32)
      args.push('-loop','1','-i',input.mascotAsset.path)
      filters.push('['+mascotIndex+':v]scale='+argsWidth+':-1,format=rgba[mascot]')
      filters.push('[basev][mascot]overlay=W-w-48:H-h-48:shortest=1:format=auto[v]')
    }else filters.push('[basev]null[v]')
    args.push('-filter_complex_threads','1','-filter_complex',filters.join(';'),'-map','[v]','-map','[a]','-t',String(duration),'-c:v','libx264','-threads','2','-preset','veryfast','-pix_fmt','yuv420p','-c:a','aac','-movflags','+faststart',output)
    await execFile('/usr/bin/ffmpeg',args,{timeout:180000,maxBuffer:1024*1024})
    return {output,mime_type:'video/mp4',test:false,production_note:input.mascotAsset?'Authorized FIRMES caballito reference composited locally over authorized real footage; no model-generated character and no automatic publication.':'Every selected authorized source contributes an equal-duration segment; original audio is retained where present, with silence for sources without audio. Footage is fitted with padding; creative review remains required.'}
  }

  async poll(value){return {...value,status:'completed'}}
  async collect(value){return {...value,bytes:await readFile(value.output)}}
  provenance(input){return {adapter:'ffmpeg',synthetic:false,used_sources:input.assets.map(a=>({source_id:a.source_id,sha256:a.sha256})),brand_assets:input.mascotAsset?[{asset_id:input.mascotAsset.id,sha256:input.mascotAsset.sha256,synthetic:false}]:[],paid:false,external_review:false}}
}
export class DeterministicTestAdapter extends FFmpegAdapter {
  capabilities(){return {strategies:['AUTO','REAL_FOOTAGE','HYBRID','GENERATIVE'],test:true,paid:false}}
  async prepare(input){invariant(input.test===true,'TEST_MODE_REQUIRED','Test adapter is unavailable',503);return input}
  async generate(input){invariant(input.test===true,'TEST_MODE_REQUIRED','Test adapter is unavailable',503);const output=join(input.directory,'candidate.mp4');await execFile('/usr/bin/ffmpeg',['-nostdin','-v','error','-y','-f','lavfi','-i','color=c=navy:s=180x320:d=1','-c:v','libx264','-threads','1','-pix_fmt','yuv420p','-movflags','+faststart',output],{timeout:30000,maxBuffer:1024*1024});return {output,mime_type:'video/mp4',test:true,production_note:'Isolated deterministic test fixture; not customer production.'}}
  provenance(){return {adapter:'deterministic-test',synthetic:true,used_sources:[],test:true,paid:false,external_review:false}}
}
export async function inspectVideo(path){const args=await inputArgs(path);const {stdout}=await execFile('/usr/bin/ffprobe',['-v','error',...args,'-show_entries','stream=codec_type,width,height:format=duration','-of','json',path],{timeout:30000,maxBuffer:1024*1024});const result=JSON.parse(stdout);const video=result.streams?.find(s=>s.codec_type==='video');invariant(video&&video.width>0&&video.height>0&&Number(result.format?.duration)>0,'INVALID_MEDIA','A playable video is required',422);return {width:video.width,height:video.height,duration_seconds:Number(result.format.duration),has_audio:result.streams.some(s=>s.codec_type==='audio')}}
