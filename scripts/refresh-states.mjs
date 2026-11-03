import fs from 'node:fs';
import {searchURL,validateCatalog,getJSON} from './state-races.mjs';
const states='AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' ');
fs.mkdirSync('data/states',{recursive:true});
let cursor=0;const health={checked_at:new Date().toISOString(),states:{}};
async function worker(){while(cursor<states.length){const state=states[cursor++];try{
 const data=validateCatalog(await getJSON(searchURL(state)),state);
 const snapshot={retrieved_at:new Date().toISOString(),source:searchURL(state),definition:'Provider-listed governor races and state/local ballot measures. Catalogue retrieval time is not source update time. Open full race endpoint for complete results and last_updated. Provider projections are not certification.',data};
 fs.writeFileSync('data/states/'+state+'.json',JSON.stringify(snapshot));
 health.states[state]={status:'ok',count:data.count};
 }catch(e){health.states[state]={status:'error',message:e.message,last_good_preserved:true}}}}
await Promise.all(Array.from({length:4},worker));
fs.writeFileSync('data/states/health.json',JSON.stringify(health,null,2));
console.log(JSON.stringify(health));
if(Object.values(health.states).some(s=>s.status==='error'))process.exitCode=1;
