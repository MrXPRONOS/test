import {DatabaseSync} from 'node:sqlite';
import {readFileSync,copyFileSync} from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const conn=new DatabaseSync(':memory:');conn.exec(readFileSync(new URL('./cloudflare/schema.sql',import.meta.url),'utf8'));
const code='local-testing-only-owner-code';conn.prepare('INSERT INTO settings(key,value) VALUES (?,?)').run('setup_code_hash',crypto.createHash('sha256').update(code).digest('hex'));
class Statement{constructor(sql){this.sql=sql;this.v=[];}bind(...v){this.v=v;return this;}async first(){return conn.prepare(this.sql).get(...this.v)||null;}async all(){return {results:conn.prepare(this.sql).all(...this.v)}}async run(){conn.prepare(this.sql).run(...this.v);return {success:true}}}
const DB={prepare:s=>new Statement(s),batch:async statements=>{conn.exec('BEGIN');try{for(const s of statements)await s.run();conn.exec('COMMIT')}catch(e){conn.exec('ROLLBACK');throw e;}}};
copyFileSync(new URL('./_worker.js',import.meta.url),new URL('./_worker-test.mjs',import.meta.url));
const worker=(await import('./_worker-test.mjs')).default;
async function api(path,body,token){const r=await worker.fetch(new Request('https://test.invalid'+path,{method:body?'POST':'GET',headers:{...(token?{'Authorization':'Bearer '+token}:{}),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),{DB});let d;try{d=await r.json()}catch{}return {status:r.status,...d};}
const signup=await api('/api/auth/signup',{email:'owner@example.com',password:'TestPassphrase23456',bootstrapCode:code});assert.equal(signup.status,201,JSON.stringify(signup));
assert.equal(conn.prepare("SELECT iterations FROM accounts WHERE email='owner@example.com'").get().iterations, 100000, 'Ne pas depasser le plafond PBKDF2 de Workers');
const log=await api('/api/auth/login',{email:'owner@example.com',password:'TestPassphrase23456'});assert.equal(log.status,200);const token=log.access_token;
const snap=await api('/api/snapshot',null,token);assert.equal(snap.people[0].role,'superadmin');
const overview=await api('/api/super/overview',null,token);assert.equal(overview.status,200,JSON.stringify(overview));
const inv=await api('/api/super/invite',{name:'Responsable 1',email:'boss@example.com'},token);assert.equal(inv.status,201,JSON.stringify(inv));
assert.equal((await api('/api/auth/signup',{email:'boss@example.com',password:'BossPassword12345',adminInviteCode:inv.code})).status,201);
const mgr=await api('/api/auth/login',{email:'boss@example.com',password:'BossPassword12345'});assert.equal(mgr.status,200);
assert.equal((await api('/api/super/overview',null,mgr.access_token)).status,403);
assert.equal((await api('/api/super/invite',{name:'Intrus',email:'hacker@example.com'},mgr.access_token)).status,403);
const id=conn.prepare("SELECT id FROM people WHERE email='boss@example.com'").get().id;
assert.equal((await api('/api/super/toggle',{id,active:false},token)).status,200);
assert.equal((await api('/api/snapshot',null,mgr.access_token)).status,401);
console.log('PASS activation, dashboard, invitation, droits et révocation des sessions');