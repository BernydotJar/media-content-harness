import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
export async function webSourceState(){
 const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim()
 const files=[...new Set(git('ls-files','--cached','--others','--exclude-standard').split('\n').filter(p=>/^(app|components|server|plugins|schemas|config)\//.test(p)||/^(package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|next\.config\.mjs|tsconfig\.json|instrumentation\.ts|scripts\/(build-web|web-source-state|prepare-runtime)\.mjs)$/.test(p)))].sort()
 const manifest=[];for(const path of files)manifest.push({path,sha256:createHash('sha256').update(await readFile(path)).digest('hex')})
 return {commit:git('rev-parse','HEAD'),working_tree_dirty:git('status','--porcelain').length>0,source_sha256:createHash('sha256').update(JSON.stringify(manifest)).digest('hex'),manifest}
}
