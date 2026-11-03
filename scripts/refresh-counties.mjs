import fs from 'node:fs';
import {getJSON,validateDetail} from './state-races.mjs';
import {countyRows} from './county.mjs';
import {observe,emptyLog} from './insights.mjs';
const snapshot=JSON.parse(fs.readFileSync('Election_2026_Latest.json','utf8'));
let changes=fs.existsSync('Election_2026_Changes.json')?JSON.parse(fs.readFileSync('Election_2026_Changes.json','utf8')):emptyLog();
fs.mkdirSync('data/counties',{recursive:true});let failed=false;
for(const state of ['FL','IA','TX','KS','NC','MI','OH','GA','ME','AK']){const r=snapshot.races.find(r=>r.state===state);if(!r)continue;const file='data/counties/'+state+'.json';try{
 const before=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):null;
 const d=validateDetail(await getJSON('https://civicapi.org/api/v2/race/'+r.url.split('/').pop()),state);
 if(before&&Date.parse(d.last_updated)<Date.parse(before.data.last_updated))throw Error('Older county source rejected');
 const now=new Date().toISOString();const normalize=data=>({races:[],national:null,turnout:[],contests:countyRows(data).map(c=>({id:'US-2026-SEN-'+state+'-COUNTY-'+(c.fips||c.id),office:'County',state,source:'civicAPI',url:r.url,updated:data.last_updated,call:c.candidates.find(c=>c.winner)?.name||null,reportedProgress:c.percent_reporting,candidates:c.candidates.map(c=>({id:c.name+'|'+c.party,name:c.name,party:c.party,votes:c.votes}))}))});
 changes=observe(before?normalize(before.data):{contests:[],races:[]},normalize(d),changes,now);
 const value={state,source:r.url,retrieved_at:now,data:d};fs.writeFileSync(file+'.tmp',JSON.stringify(value));fs.renameSync(file+'.tmp',file);
 }catch(e){failed=true;console.error(state+': '+e.message)}}
fs.writeFileSync('Election_2026_Changes.json.tmp',JSON.stringify(changes));fs.renameSync('Election_2026_Changes.json.tmp','Election_2026_Changes.json');
if(failed)process.exitCode=1;
