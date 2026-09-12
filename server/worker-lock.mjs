import { spawn } from 'node:child_process'
import { open } from 'node:fs/promises'
import { constants } from 'node:fs'
import { ProductError } from './errors.mjs'
// Node owns the open file description. Python acquires flock on inherited FD 3
// and exits before fn starts. The shared lock remains held by Node's descriptor
// until finally closes it, so helper death cannot release an active worker lease.
const PROGRAM=`import fcntl,sys
try:
 fcntl.flock(3,fcntl.LOCK_EX|fcntl.LOCK_NB)
except BlockingIOError:
 sys.exit(3)
print('acquired',flush=True)
`
export async function withJobLease(path,fn){const handle=await open(path,constants.O_CREAT|constants.O_RDWR|constants.O_NOFOLLOW,0o600);try{await new Promise((resolve,reject)=>{const child=spawn('/usr/bin/python3',['-u','-c',PROGRAM],{stdio:['ignore','pipe','pipe',handle.fd]});let text='';const timer=setTimeout(()=>{child.kill();reject(new ProductError('LOCK_UNAVAILABLE','Production lease could not be acquired',503))},10000);child.once('error',()=>{clearTimeout(timer);reject(new ProductError('LOCK_UNAVAILABLE','Production lease runtime is unavailable',503))});child.stdout.on('data',chunk=>{text=(text+chunk.toString()).slice(-128)});child.stderr.resume();child.once('close',code=>{clearTimeout(timer);if(code===0&&text.includes('acquired\n'))resolve();else reject(new ProductError(code===3?'JOB_BUSY':'LOCK_UNAVAILABLE',code===3?'Production is already being processed':'Production lease could not be acquired',code===3?409:503))})});return await fn()}finally{await handle.close()}}
