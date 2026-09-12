import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { readFile, writeFile } from 'node:fs/promises'
import { webSourceState } from './web-source-state.mjs'
const before=await webSourceState()
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','build'],{stdio:'inherit',env:process.env})
const [code]=await once(child,'exit');if(code!==0)process.exit(code||1)
const after=await webSourceState()
if(before.source_sha256!==after.source_sha256||before.commit!==after.commit)throw new Error('Production sources changed during build; rebuild the reviewed candidate')
await writeFile('.next/media-factory-build.json',JSON.stringify({...after,build_id:(await readFile('.next/BUILD_ID','utf8')).trim()},null,2)+'\n')
