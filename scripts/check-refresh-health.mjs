import fs from 'node:fs';

export function transient(message){return /fetch failed|HTTP(?: Error)?[ :]+(?:408|429|5\d\d)\b|timed?\s*out|TimeoutError|AbortError|ECONN\w*|ENOTFOUND|EAI_AGAIN|ETIMEDOUT|temporary failure|network (?:error|unreachable)|remote end closed/i.test(message||'');}
export function assess({outcomes,read,since}){
 const warnings=[],errors=[];
 const fresh=h=>!since||Date.parse(h?.checked_at)>=Date.parse(since);
 const inspect=(label,message,cache)=>{
  if(transient(message)&&cache)warnings.push(label+': '+message+'; last good data retained.');
  else errors.push(label+': '+(message||'Refresh failed without a health record')+(cache?'':'; no valid cached copy.'));
 };
 if(outcomes.fetch==='failure'){
  const h=read('source-health.json'),d=read('Election_2026_Latest.json');
  inspect('National results',fresh(h)&&h?.status==='error'?h.message:'No current failure health record',d?.version===1&&Array.isArray(d.races)&&!!d.national);
 }
 if(outcomes.states==='failure'){
  const h=read('data/states/health.json');const failures=Object.entries(fresh(h)?h?.states||{}:{}).filter(([,s])=>s.status==='error');
  if(!failures.length)errors.push('State catalogue process failed without per-state error records.');
  for(const [state,s]of failures){const cached=read('data/states/'+state+'.json');inspect(state+' catalogue',s.message,cached?.data?.count===cached?.data?.races?.length&&Array.isArray(cached?.data?.races));}
 }
 if(outcomes.counties==='failure'){
  const h=read('data/counties/health.json');const failures=Object.entries(fresh(h)?h?.states||{}:{}).filter(([,s])=>s.status==='error');
  if(!failures.length)errors.push('County process failed without per-state error records.');
  for(const [state,s]of failures){const cached=read('data/counties/'+state+'.json');inspect(state+' counties',s.message,cached?.data?.test_data===false&&cached.data.province===state&&!!cached.data.region_results);}
 }
 if(outcomes.secondary==='failure'){
  const h=read('data/secondary/health.json'),cached=read('data/secondary/NC.json');
  inspect('NC official source',fresh(h)&&h?.status==='error'?h.message:'No current failure health record',cached?.state==='NC'&&cached.year===2026&&Array.isArray(cached.candidates)&&cached.counties?.length===100);
 }
 return {warnings,errors};
}

if(process.argv[1]?.endsWith('/check-refresh-health.mjs')){
 const read=p=>{try{return JSON.parse(fs.readFileSync(p,'utf8'))}catch{return null}};
 const result=assess({outcomes:{fetch:process.env.FETCH_OUTCOME,states:process.env.STATES_OUTCOME,counties:process.env.COUNTIES_OUTCOME,secondary:process.env.SECONDARY_OUTCOME},read,since:process.env.REFRESH_STARTED_AT});
 const escape=s=>s.replaceAll('%','%25').replaceAll('\r','%0D').replaceAll('\n','%0A');
 for(const message of result.warnings)console.log('::warning::'+escape(message));
 for(const message of result.errors)console.log('::error::'+escape(message));
 if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'## Refresh health\n\n'+(result.warnings.length||result.errors.length?[...result.warnings.map(s=>'- Warning: '+s),...result.errors.map(s=>'- Failure: '+s)].join('\n'):'All source checks succeeded.')+'\n');
 if(result.errors.length)process.exitCode=1;
}
