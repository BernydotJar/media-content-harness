import { cp, mkdir, readdir, lstat, realpath, writeFile } from 'node:fs/promises'
import { resolve, join, relative, isAbsolute } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
export async function prepareRuntime(output){
 const project=await realpath(process.cwd()),source=join(project,'.next','standalone'),target=resolve(output)
 if(target===project||target.startsWith(source+'/'))throw new Error('Runtime destination must be a fresh separate directory')
 await mkdir(target,{recursive:false,mode:0o755})
 const skip=path=>!path.endsWith('.nft.json')&&!relative(source,path).split('/').some(p=>p==='cache'||p==='standalone')
 const copy=async(from,to,filter)=>cp(from,to,{recursive:true,dereference:false,verbatimSymlinks:true,errorOnExist:true,force:false,...(filter?{filter}: {})})
 for(const name of ['server.js','package.json','node_modules','.next'])await copy(join(source,name),join(target,name),name==='.next'?skip:undefined)
 await copy(join(project,'.next','static'),join(target,'.next','static'))
 for(const name of ['schemas','config','examples'])await copy(join(project,name),join(target,name))
 await mkdir(join(target,'scripts'));await copy(join(project,'scripts','provision-operator.py'),join(target,'scripts','provision-operator.py'))
 const files=[]
 async function audit(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const path=join(dir,entry.name),rel=relative(target,path);if(['.git','.env','data','.media-factory','progress','specs','tests','__pycache__'].includes(entry.name)||entry.name.startsWith('.critic')||entry.name.startsWith('.env'))throw new Error('Forbidden runtime content: '+rel);const meta=await lstat(path);if(meta.isSymbolicLink()){const actual=await realpath(path);const confined=relative(target,actual);if(confined==='..'||confined.startsWith('../')||isAbsolute(confined))throw new Error('Runtime dependency link escapes package: '+rel);files.push({path:rel,link:confined})}else if(meta.isDirectory())await audit(path);else if(meta.isFile())files.push({path:rel,sha256:createHash('sha256').update(await readFile(path)).digest('hex')});else throw new Error('Unsupported runtime file type: '+rel)}}
 await audit(target)
 const report={format:'media-factory-runtime.v1',files:files.length,manifest_sha256:createHash('sha256').update(JSON.stringify(files.sort((a,b)=>a.path.localeCompare(b.path)))).digest('hex'),build_id:(await readFile(join(target,'.next','BUILD_ID'),'utf8')).trim(),forbidden_entries:0,external_symlinks:0}
 await writeFile(join(target,'runtime-package.json'),JSON.stringify(report,null,2)+'\n')
 return report
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))console.log(JSON.stringify(await prepareRuntime(process.argv[2]),null,2))
