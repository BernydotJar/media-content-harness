import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'

const sha=value=>createHash('sha256').update(value).digest('hex')
function pngSize(bytes){
 assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a')
 return {width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20)}
}

test('FIRMES favicon family is app-discoverable and derived without mutating the authorized Caballito asset',async()=>{
 const [icon,apple,ico,mascot,layout]=await Promise.all([
  readFile('app/icon.png'),readFile('app/apple-icon.png'),readFile('app/favicon.ico'),readFile('config/brand-assets/firmes-caballito.png'),readFile('app/layout.tsx','utf8')
 ])
 assert.deepEqual(pngSize(icon),{width:512,height:512})
 assert.deepEqual(pngSize(apple),{width:180,height:180})
 assert.equal(ico.subarray(0,4).toString('hex'),'00000100')
 assert.equal(ico.readUInt16LE(4),4)
 assert.equal(sha(mascot),'b17c55ffb0eec46bfa719128ee68a9f18475c45afb90d6d73ce9d82567938397')
 assert.equal(sha(icon),'6720c20cb501f452886352b7e6b88e3dd548148ec86c5673db9f5ffb24c69f48')
 assert.equal(sha(apple),'4dc18cb22df791c17db1881e8e89e9ddb493e0c36db1f510975be16c80e55f76')
 assert.equal(sha(ico),'61529902e260f70ffbcf78447932c5baeb880619859bec2776dfdf41b74be859')
 assert.match(layout,/\/favicon\.ico/)
 assert.match(layout,/\/icon\.png/)
 assert.match(layout,/\/apple-icon\.png/)
})
