import {createHash,createHmac,randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';
export const hash=value=>createHash('sha256').update(value).digest('hex');
export const randomToken=()=>randomBytes(32).toString('base64url');
export function verifyPassword(password){
 const [salt,stored]=String(process.env.ADMIN_PASSWORD_HASH||'').split(':');
 if(!salt||!stored||!/^[a-f0-9]{128}$/.test(stored)||typeof password!=='string'||password.length>256)return false;
 const actual=scryptSync(password,salt,64);return timingSafeEqual(actual,Buffer.from(stored,'hex'));
}
export function sign(value){return createHmac('sha256',process.env.SESSION_SECRET).update(value).digest('base64url');}
export function session(){const payload=Buffer.from(JSON.stringify({expires:Date.now()+8*3600000,nonce:randomToken()})).toString('base64url');return `${payload}.${sign(payload)}`;}
export function authorized(req){
 if(!process.env.SESSION_SECRET||!process.env.ADMIN_PASSWORD_HASH)return false;
 try{
  const cookies=String(req.headers.cookie||'').split(';').map(v=>v.trim());const value=cookies.find(v=>v.startsWith('joane_session='))?.slice(14);
  const [payload,signature]=String(value||'').split('.');if(!payload||!signature)return false;
  const expected=Buffer.from(sign(payload));const actual=Buffer.from(signature);
  return expected.length===actual.length&&timingSafeEqual(expected,actual)&&JSON.parse(Buffer.from(payload,'base64url')).expires>Date.now();
 }catch{return false;}
}
export function cookie(value,clear=false){return `joane_session=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${clear?0:28800}${process.env.NODE_ENV==='development'?'':'; Secure'}`;}
export function requireAdmin(req){if(!authorized(req))throw Object.assign(new Error('Please sign in.'),{status:401});}
export function sameOrigin(req){
 const origin=req.headers.origin;const host=req.headers.host;
 if(!origin||!host||new URL(origin).host!==host)throw Object.assign(new Error('Please submit from this website.'),{status:403});
}
