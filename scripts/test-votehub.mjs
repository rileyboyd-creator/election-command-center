import assert from 'node:assert/strict';import fs from 'node:fs';import {normalizePolls,senateStates} from './votehub.mjs';import {loadPolling,ratingTag} from './ratings.mjs';import {control} from './insights.mjs';
const snapshot=JSON.parse(fs.readFileSync('Election_2026_Latest.json')),before=JSON.stringify(snapshot),saved=JSON.parse(fs.readFileSync('data/polling.json'));
const race=snapshot.races.find(r=>r.state==='MI'),answers=race.candidates.slice(0,2).map((c,i)=>({choice:c.name,pct:48-i}));
const p={id:'fixture',poll_type:'us-senator',subject:'2026 Michigan',internal:false,population:'lv',sample_size:700,url:'https://example.test/poll',pollster:'Fixture',start_date:'2026-10-29',end_date:'2026-11-01',answers};
assert.throws(()=>normalizePolls([],snapshot));assert.throws(()=>normalizePolls({},snapshot));
for(const extra of [{subject:'2026 Michigan Democratic'},{end_date:'2026-11-04'},{internal:true},{population:'a'},{answers:[{choice:'Unknown',pct:60},{choice:'Other candidate',pct:30}]},{answers:[{choice:answers[0].choice,pct:101},answers[1]]},{answers:[answers[0],answers[0]]}])assert.throws(()=>normalizePolls([{...p,...extra}],snapshot));
assert.equal(normalizePolls([p,{...p,id:'older',end_date:'2026-10-30'}],snapshot).races[race.id].poll_id,'fixture');
assert.equal(JSON.stringify(snapshot),before);assert.deepEqual(control(snapshot),control(JSON.parse(before)));
globalThis.fetch=async()=>({ok:true,json:async()=>saved});await loadPolling();
for(const state of senateStates){const tag=ratingTag('US-2026-SEN-'+state);assert(tag.includes('data-poll-contest='));if(saved.races['US-2026-SEN-'+state]){assert(tag.includes('Latest poll:'));assert(tag.includes('CC BY 4.0'));assert(tag.includes('not an average or forecast'));}else assert(tag.includes('No recent matching poll'));}
assert.equal(ratingTag('US-2026-SEN-UT'),'');assert.equal(ratingTag('US-2026-HOUSE-MI-1'),'');
assert(saved.races['US-2026-SEN-FL'].special);assert(saved.races['US-2026-SEN-OH'].special);
assert(Object.keys(saved.races).length>0&&Object.keys(saved.races).length<=35);assert(!fs.readFileSync('index.html','utf8').includes('Crystal Ball'));
console.log('PASS: API normalization, primary/internal/future/invalid/mismatched poll rejection, dates, all 35 badges, 24 polls, missing coverage, specials, licensing, and election-data preservation');
