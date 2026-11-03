import assert from 'node:assert/strict';
import {assess,transient} from './check-refresh-health.mjs';
const cache={data:{count:1,races:[{}]}};
const run=(message,cached=cache)=>assess({outcomes:{states:'failure'},read:p=>p.endsWith('health.json')?{states:{ID:{status:'error',message}}}:cached});
for(const msg of ['fetch failed','HTTP 503','HTTP 429','The operation timed out','HTTP Error 502: Bad Gateway']){assert(transient(msg));assert.equal(run(msg).errors.length,0);assert.equal(run(msg).warnings.length,1)}
for(const msg of ['Incomplete race catalogue','Wrong election or test data','Unexpected token in JSON','HTTP 401','HTTP 403'])assert.equal(run(msg).errors.length,1);
assert.equal(run('fetch failed',null).errors.length,1);
assert.equal(run('fetch failed',{data:{count:2,races:[{}]}}).errors.length,1);
assert.equal(assess({outcomes:{counties:'failure'},read:()=>null}).errors.length,1);
assert.deepEqual(assess({outcomes:{fetch:'success',states:'success'},read:()=>null}),{warnings:[],errors:[]});
console.log('PASS: transient failures with cache warn; validation/auth/missing-cache/process failures remain failures.');

assert.equal(assess({outcomes:{states:'failure'},since:'2026-11-03T20:00:00Z',read:()=>({checked_at:'2026-11-03T19:00:00Z',states:{ID:{status:'error',message:'fetch failed'}}})}).errors.length,1);
