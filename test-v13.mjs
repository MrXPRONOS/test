import {DatabaseSync} from 'node:sqlite';
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const dir=new URL('.',import.meta.url);const src=readFileSync(new URL('cloudflare/worker.js',dir),'utf8');
const path=new URL('./cloudflare/worker-test-generated.mjs',dir);
writeFileSync(path,'const ASSETS={};\n'+src.replace(/^import \{ ASSETS \} from.*\n/,''));
const worker=(await import(path.href+'?run='+Date.now())).default;
const conn=new DatabaseSync(':memory:');conn.exec(readFileSync(new URL('cloudflare/schema.sql',dir),'utf8'));
class Statement{constructor(statement){this.statement=statement;this.args=[]}bind(...values){this.args=values;return this}first(){return Promise.resolve(this.statement.get(...this.args)||null)}all(){return Promise.resolve({results:this.statement.all(...this.args)})}run(){return Promise.resolve(this.statement.run(...this.args))}}
const db={prepare:(sql)=>new Statement(conn.prepare(sql)),batch:async (statements)=>{conn.exec('BEGIN');try{const results=[];for(const stmt of statements)results.push(await stmt.run());conn.exec('COMMIT');return results;}catch(e){conn.exec('ROLLBACK');throw e;}}};
async function api(path,body,token='',method='POST'){
 let req=new Request('https://gw-suivi.pages.dev'+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(method==='POST'?{body:JSON.stringify(body||{})}:{})});
 const res=await worker.fetch(req,{DB:db});let data=await res.json();return {status:res.status,...data};
}
async function pass(email,password='password-very-secure-2026'){const r=await api('/api/auth/login',{identifier:email,password});assert.equal(r.status,200,JSON.stringify(r));return r.access_token;}
const bootstrap='owner-only-123456';
const hashBuffer=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(bootstrap));const hash=Buffer.from(hashBuffer).toString('hex');conn.prepare('INSERT INTO settings(key,value) VALUES (?,?)').run('setup_code_hash',hash);
let r=await api('/api/auth/signup',{email:'owner@gw.tg',password:'password-very-secure-2026',bootstrapCode:bootstrap});assert.equal(r.status,201,JSON.stringify(r));
const owner=await pass('owner@gw.tg');
r=await api('/api/super/invite',{name:'Responsable Test',phone:'90 11 22 33'},owner);assert.equal(r.status,201,JSON.stringify(r));assert.equal(r.email,'');assert.equal(r.phone,'+22890112233');assert.match(r.link,/^https:\/\/gw-suivi.pages.dev\/#invite=[a-f0-9]{48}$/);
let inviteAdminToken=r.link.split('invite=')[1];r=await api('/api/auth/invite/preview',{token:inviteAdminToken});assert.equal(r.status,200);assert.equal(r.role,'admin');
r=await api('/api/auth/signup',{inviteToken:inviteAdminToken,password:'password-very-secure-2026'});assert.equal(r.status,201,JSON.stringify(r));
r=await api('/api/auth/signup',{inviteToken:inviteAdminToken,password:'password-very-secure-2026'});assert.notEqual(r.status,201);
const admin=await pass('+22890112233');r=await api('/api/super/overview',{},admin,'GET');assert.equal(r.status,403);
r=await api('/api/ops',{op:{type:'person_upsert',person:{id:crypto.randomUUID(),name:'Employé WhatsApp',phone:'+22891020304'}}},admin);assert.equal(r.status,201,JSON.stringify(r));assert.equal(r.email,'');
const employeeLink=r.link;let employeeToken=employeeLink.split('invite=')[1];
r=await api('/api/auth/invite/preview',{token:employeeToken});assert.equal(r.status,200);assert.equal(r.role,'employee');
r=await api('/api/auth/signup',{inviteToken:employeeToken,password:'employee-password-2026'});assert.equal(r.status,201,JSON.stringify(r));
const employee=await pass('91020304','employee-password-2026');
r=await api('/api/ops',{op:{type:'person_upsert',person:{id:crypto.randomUUID(),name:'Escalade',email:'attack@gw.tg'}}},employee);assert.equal(r.status,403);
r=await api('/api/people/reinvite',{id:'nonexistent'},employee);assert.equal(r.status,403);
r=await api('/api/snapshot',{},employee,'GET');assert.equal(r.status,200);assert.equal(r.people[0].email,'');assert.equal(r.people[0].phone,'+22891020304');
r=await api('/api/ops',{op:{type:'person_upsert',person:{id:crypto.randomUUID(),name:'Employé mixte',phone:'92 00 11 22',email:'mixte@gw.tg'}}},admin);assert.equal(r.status,201,JSON.stringify(r));
r=await api('/api/auth/signup',{inviteToken:r.link.split('invite=')[1],password:'mixte-password-2026'});assert.equal(r.status,201);
const emailLogin=await pass('mixte@gw.tg','mixte-password-2026');const phoneLogin=await pass('92001122','mixte-password-2026');assert(emailLogin&&phoneLogin);
r=await api('/api/ops',{op:{type:'person_upsert',person:{id:crypto.randomUUID(),name:'Doublon',phone:'+22892001122'}}},admin);assert.equal(r.status,409);
const personID=crypto.randomUUID();r=await api('/api/ops',{op:{type:'person_upsert',person:{id:personID,name:'A renouveler',email:'rotation@gw.tg'}}},admin);assert.equal(r.status,201);
const stale=r.link.split('invite=')[1];r=await api('/api/people/reinvite',{id:personID},admin);assert.equal(r.status,200);const fresh=r.link.split('invite=')[1];
r=await api('/api/auth/invite/preview',{token:stale});assert.equal(r.status,404);
r=await api('/api/auth/invite/preview',{token:fresh});assert.equal(r.status,200);
const ownerStatus=conn.prepare("SELECT count(*) AS n FROM people WHERE is_superadmin=1").get();assert.equal(ownerStatus.n,1);
console.log('PASS: bootstrap, phone-only admin, phone-only employee, both contacts, login, token one-time, rotation, auth boundaries, duplicate prevention, unique superadmin.');