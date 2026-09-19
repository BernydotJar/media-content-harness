import {createPublicKey,verify as verifySignature} from 'node:crypto'
import {ProductError,invariant,boundedText} from './errors.mjs'

const JWKS_URL='https://www.googleapis.com/oauth2/v3/certs'
const MAX_TOKEN_BYTES=16*1024
const MAX_JWKS_BYTES=256*1024
const SKEW_SECONDS=120

function jsonPart(value,label){try{return JSON.parse(Buffer.from(value,'base64url').toString('utf8'))}catch{throw new ProductError('GOOGLE_ID_TOKEN_INVALID','Google returned an invalid '+label+'.',401)}}
function normalizedEmail(value){const email=boundedText(value,'Email',254).trim().toLowerCase();invariant(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),'GOOGLE_ID_TOKEN_INVALID','Google account email is invalid.',401);return email}
function authoritativeEmail(claims,email){return email.endsWith('@gmail.com')||(claims.email_verified===true&&typeof claims.hd==='string'&&claims.hd.length>0)}
function audienceMatches(aud,clientId){return typeof aud==='string'?aud===clientId:Array.isArray(aud)&&aud.includes(clientId)}

export class GoogleIdentityVerifier {
 constructor({clientId,fetchImpl=globalThis.fetch,clock=()=>Date.now()}={}){this.clientId=clientId;this.fetch=fetchImpl;this.clock=clock;this.cache=null}
 configured(){return typeof this.clientId==='string'&&/^[A-Za-z0-9._-]{20,200}$/.test(this.clientId)}
 async keys(){
  const now=this.clock();if(this.cache&&this.cache.expires_at>now)return this.cache.keys
  let response;try{response=await this.fetch(JWKS_URL,{method:'GET',headers:{Accept:'application/json'},signal:AbortSignal.timeout(10_000),redirect:'error'})}catch{throw new ProductError('GOOGLE_AUTH_UNAVAILABLE','Google sign-in is temporarily unavailable.',503)}
  invariant(response.ok,'GOOGLE_AUTH_UNAVAILABLE','Google sign-in is temporarily unavailable.',503)
  const declared=Number(response.headers?.get?.('content-length')||0);invariant(!declared||declared<=MAX_JWKS_BYTES,'GOOGLE_AUTH_UNAVAILABLE','Google sign-in key response is unexpectedly large.',503)
  const text=await response.text();invariant(Buffer.byteLength(text)<=MAX_JWKS_BYTES,'GOOGLE_AUTH_UNAVAILABLE','Google sign-in key response is unexpectedly large.',503)
  let body;try{body=JSON.parse(text)}catch{throw new ProductError('GOOGLE_AUTH_UNAVAILABLE','Google sign-in keys are malformed.',503)}
  invariant(Array.isArray(body?.keys)&&body.keys.length>0&&body.keys.length<=20,'GOOGLE_AUTH_UNAVAILABLE','Google sign-in keys are unavailable.',503)
  const maxAge=String(response.headers?.get?.('cache-control')||'').match(/max-age=(\d+)/i);const ttl=Math.min(60*60*1000,Math.max(60_000,(Number(maxAge?.[1])||300)*1000))
  this.cache={keys:body.keys,expires_at:now+ttl};return body.keys
 }
 async verify(token,{nonce}={}){
  invariant(this.configured(),'GOOGLE_AUTH_NOT_CONFIGURED','Google sign-in is not configured.',503)
  invariant(typeof token==='string'&&token.length>100&&Buffer.byteLength(token)<=MAX_TOKEN_BYTES&&!/[\r\n\0]/.test(token),'GOOGLE_ID_TOKEN_INVALID','Google sign-in token is invalid.',401)
  const parts=token.split('.');invariant(parts.length===3,'GOOGLE_ID_TOKEN_INVALID','Google sign-in token is invalid.',401)
  const header=jsonPart(parts[0],'token header'),claims=jsonPart(parts[1],'token payload')
  invariant(header?.alg==='RS256'&&typeof header.kid==='string'&&header.kid.length>0&&header.kid.length<256,'GOOGLE_ID_TOKEN_INVALID','Google sign-in token uses an unsupported signature.',401)
  const keys=await this.keys(),jwk=keys.find(k=>k.kid===header.kid&&k.kty==='RSA'&&(k.use===undefined||k.use==='sig'))
  invariant(jwk,'GOOGLE_ID_TOKEN_INVALID','Google sign-in signing key is unavailable.',401)
  let key;try{key=createPublicKey({key:jwk,format:'jwk'})}catch{throw new ProductError('GOOGLE_AUTH_UNAVAILABLE','Google sign-in signing key is invalid.',503)}
  const signature=Buffer.from(parts[2],'base64url'),ok=verifySignature('RSA-SHA256',Buffer.from(parts[0]+'.'+parts[1]),key,signature)
  invariant(ok,'GOOGLE_ID_TOKEN_INVALID','Google sign-in token signature is invalid.',401)
  const now=Math.floor(this.clock()/1000)
  invariant(['https://accounts.google.com','accounts.google.com'].includes(claims.iss),'GOOGLE_ID_TOKEN_INVALID','Google sign-in issuer is invalid.',401)
  invariant(audienceMatches(claims.aud,this.clientId),'GOOGLE_ID_TOKEN_INVALID','Google sign-in token was not issued for Media Factory.',401)
  if(Array.isArray(claims.aud)&&claims.aud.length>1)invariant(claims.azp===this.clientId,'GOOGLE_ID_TOKEN_INVALID','Google sign-in authorized party is invalid.',401)
  invariant(Number.isFinite(claims.exp)&&claims.exp>now-SKEW_SECONDS&&Number.isFinite(claims.iat)&&claims.iat<=now+SKEW_SECONDS,'GOOGLE_ID_TOKEN_INVALID','Google sign-in token is expired or not yet valid.',401)
  if(nonce!==undefined)invariant(typeof claims.nonce==='string'&&claims.nonce===nonce,'GOOGLE_ID_TOKEN_INVALID','Google sign-in nonce is invalid.',401)
  invariant(typeof claims.sub==='string'&&/^[A-Za-z0-9_-]{6,255}$/.test(claims.sub),'GOOGLE_ID_TOKEN_INVALID','Google account identifier is invalid.',401)
  invariant(claims.email_verified===true,'GOOGLE_EMAIL_UNVERIFIED','Use a Google account with a verified email address.',401)
  const email=normalizedEmail(claims.email)
  invariant(authoritativeEmail(claims,email),'GOOGLE_EMAIL_NOT_AUTHORITATIVE','Use a Gmail or Google Workspace account for departmental sign-in.',403)
  return {provider:'google',subject:claims.sub,email,name:typeof claims.name==='string'?claims.name.slice(0,200):email,hosted_domain:typeof claims.hd==='string'?claims.hd:null}
 }
}
