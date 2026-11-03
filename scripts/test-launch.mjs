import assert from 'node:assert/strict';
import fs from 'node:fs';
import {control,scenarioEligible} from './insights.mjs';
import {ratings,ratingSource,ratingTag} from './ratings.mjs';
const race=(id,candidates,extra={})=>({id,office:'Senate',state:id,candidates,call:null,...extra});
const d={id:'d',name:'D',party:'Democratic',votes:0},r={id:'r',name:'R',party:'Republican',votes:0},i={id:'i',name:'Independent',party:'Independent',votes:0};
const safe=race('safe',[d,r]),ind=race('ind',[r,i]),single=race('single',[r]),verified=race('verified',[r],{uncontestedVerified:true,ballotSource:'https://example.test/official-ballot',ballotVerifiedAt:'2026-11-02T00:00:00Z'}),called=race('called',[d,r],{call:'D'});
assert(scenarioEligible(safe));assert(scenarioEligible(ind));assert(scenarioEligible(single),'Incomplete roster alone must not imply uncontested');assert(!scenarioEligible(verified));assert(!scenarioEligible(called));
const snap={national:{senate:{d:35,r:31,other:0,uncalled:34}},contests:[safe,ind,single,verified,called]};
const result=control(snap,{safe:'d',ind:'i',verified:'r',called:'r'});assert.deepEqual(result.totals,{d:36,r:31,other:1,uncalled:32});assert.equal(Object.values(result.totals).reduce((a,b)=>a+b,0),100);assert.equal(control(snap).totals.d,35);assert.equal(result.races.length,3);
assert.equal(ratingSource.provider,'VoteHub Polling API');assert.equal(Object.keys(ratings).length,0);assert.equal(ratingTag('unrated'),'');assert.match(ratingTag('US-2026-SEN-MI'),/Polling unavailable/);
const html=fs.readFileSync('index.html','utf8');assert(!html.match(/const tabs=\[([^\]]+)\]/)[1].includes("'Control'"));assert(html.includes('id="controlPanel"'));for(const key of ['og:title','og:image','twitter:card','canonical','favicon.svg','Fuel the Command Center','election-followed-states','Last checked:','Last updated:'])assert(html.includes(key),key);assert(!html.includes('Florida turnout laboratory'));const image=fs.readFileSync('assets/social-preview.png');assert.equal(image.readUInt32BE(16),1200);assert.equal(image.readUInt32BE(20),630);
console.log('PASS: scenario exclusions and retained safe/independent races, seat arithmetic/reset, ratings provenance, metadata, support/favorites/freshness, preview dimensions');

