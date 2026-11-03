// Shared by browser and unattended refresh. Observations, never forecasts.
export const emptyLog=()=>({version:1,checked_at:null,events:[],history:{},health:null});
const key=c=>String(c.id??c.candidate_id??(c.name+'|'+c.party));
export function metrics(r){const candidates=r.candidates||[],d=candidates.filter(c=>c.party==='Democratic').reduce((a,c)=>a+c.votes,0),rr=candidates.filter(c=>c.party==='Republican').reduce((a,c)=>a+c.votes,0),total=candidates.reduce((a,c)=>a+c.votes,0);return {total,margin:d-rr,pp:d+rr?100*(d-rr)/(d+rr):null};}
export function contests(snapshot){return snapshot.contests||snapshot.races.map(r=>({...r,id:'US-2026-SEN-'+r.state,office:'Senate',provider_id:r.url?.split('/').pop()}));}
export function observe(previous,next,log=emptyLog(),at=new Date().toISOString()){
 const out=structuredClone(log),old=new Map(contests(previous).map(r=>[r.id,r]));
 const emit=(r,type,before,after,title,status='unofficial')=>{const id=JSON.stringify([r.id,type,before,after,r.updated]);if(!out.events.some(e=>e.id===id))out.events.push({id,contest_id:r.id,state:r.state,office:r.office,type,before,after,title,status,source:r.source,url:r.url,source_updated:r.updated,observed_at:at});};
 for(const r of contests(next)){
  const p=old.get(r.id),m=metrics(r),point={at,source_updated:r.updated,...m,progress:r.reportedProgress??null,call:r.call??null,candidates:r.candidates.map(c=>({id:key(c),name:c.name,party:c.party,votes:c.votes}))};
  const series=out.history[r.id]||=[];const last=series.at(-1);
  if(last&&Date.parse(r.updated)<Date.parse(last.source_updated))continue;
  const signature=x=>JSON.stringify([x.source_updated,x.total,x.margin,x.pp,x.progress,x.call,x.candidates]);
  if(!last||signature(last)!==signature(point))series.push(point);
  if(!p){if(r.office==='County'&&m.total>0)emit(r,'county_available',null,m.total,'County returns now available');continue;} if(Date.parse(r.updated)<Date.parse(p.updated))continue;
  const a=metrics(p),before=new Map(p.candidates.map(c=>[key(c),c.votes]));
  const correction=p.candidates.length!==r.candidates.length||r.candidates.some(c=>{const old=p.candidates.find(x=>key(x)===key(c)||x.name===c.name&&x.party===c.party);return !old||c.votes<old.votes||c.name!==old.name||c.party!==old.party});
  if(correction&&JSON.stringify(p.candidates)!==JSON.stringify(r.candidates))emit(r,'correction',p.candidates,r.candidates,'Candidate totals or roster corrected','unofficial');
  else if(m.total!==a.total)emit(r,'votes',a.total,m.total,(m.total-a.total).toLocaleString()+' newly reported votes');
  if(m.margin!==a.margin)emit(r,correction?'correction':'margin',a.margin,m.margin,'D–R vote margin changed');
  if((r.call??null)!==(p.call??null))emit(r,p.call?'correction':'call',p.call??null,r.call??null,r.call?'Provider projects '+r.call:'Projection withdrawn','projection');
  if((r.reportedProgress??null)!==(p.reportedProgress??null))emit(r,'progress',p.reportedProgress??null,r.reportedProgress??null,'Provider reporting estimate changed');
 }
 for(const office of ['house','senate']){const a=previous.national?.[office],b=next.national?.[office];if(a&&b&&JSON.stringify([a.d,a.r,a.other,a.uncalled])!==JSON.stringify([b.d,b.r,b.other,b.uncalled]))emit({id:'US-2026-'+office,office:office==='house'?'House':'Senate',source:b.source,url:b.url,updated:b.updated},'seats',{d:a.d,r:a.r,other:a.other,uncalled:a.uncalled},{d:b.d,r:b.r,other:b.other,uncalled:b.uncalled},'Chamber seat allocation changed',b.status);}
 for(const t of next.turnout||[]){const p=previous.turnout?.find(x=>x.scope===t.scope&&x.party===t.party&&x.mode===t.mode);if(p&&p.ballots!==t.ballots)emit({...t,id:'turnout-'+t.scope+'-'+t.party+'-'+t.mode,office:'Turnout'},t.ballots<p.ballots?'correction':'turnout',p.ballots,t.ballots,'Reported turnout changed','turnout');}
 out.checked_at=at;return out;
}
export function healthEvent(log,status,message,at=new Date().toISOString()){
 const out=structuredClone(log);if(out.health&&out.health.status!==status&&((out.health.status==='error')!==(status==='error')))out.events.push({id:'health-'+at,contest_id:'provider-health',office:'Source',type:'health',before:out.health.status,after:status,title:status==='error'?'Provider unavailable: '+message:'Provider connection recovered',source:'civicAPI',url:'https://civicapi.org/api/v2/status',observed_at:at,source_updated:null,status:'unofficial'});out.health={status,message,checked_at:at};out.checked_at=at;return out;
}
export function scenarioEligible(r){
 if(r.call||r.status==='official')return false;
 // Exclude only explicitly verified uncontested ballots. Never infer from party or rating.
 if(r.uncontestedVerified===true&&r.ballotSource&&Number.isFinite(Date.parse(r.ballotVerifiedAt)))return false;
 return true;
}
export function control(snapshot,selections={}){
 const n=snapshot.national?.senate;if(!n)return null;
 const totals={d:n.d,r:n.r,other:n.other,uncalled:n.uncalled},ranges={d:[n.d,n.d],r:[n.r,n.r],other:[n.other,n.other]},races=contests(snapshot).filter(r=>r.office==='Senate'&&!r.call);
 for(const r of races){const parties=new Set(r.candidates.map(c=>c.party==='Democratic'?'d':c.party==='Republican'?'r':'other'));for(const p of parties)ranges[p][1]++;if(parties.size===1)ranges[[...parties][0]][0]++;
 const c=scenarioEligible(r)&&r.candidates.find(c=>key(c)===selections[r.id]);if(c){totals[c.party==='Democratic'?'d':c.party==='Republican'?'r':'other']++;totals.uncalled--;}}
 return {totals,ranges,races:races.filter(scenarioEligible),needed:{d:Math.max(0,51-totals.d),r:Math.max(0,50-totals.r)},baselineD:n.baselineD,netD:n.baselineD==null?null:totals.d-n.baselineD};
}
export function twoPartyMargin(candidates){const d=candidates.filter(c=>c.party==='Democratic').reduce((s,c)=>s+c.votes,0),r=candidates.filter(c=>c.party==='Republican').reduce((s,c)=>s+c.votes,0);return d+r?100*(d-r)/(d+r):null;}
export function swing(current,historical){const a=twoPartyMargin(current),b=twoPartyMargin(historical);return a==null||b==null?null:a-b;}
export function closingStatus(start,end,now=Date.now(),reporting=false){if(reporting)return 'Results reporting';if(now>=Date.parse(end))return 'Scheduled polls closed';if(now>=Date.parse(start))return 'Some polls closed';if(Date.parse(start)-now<=1800000)return 'Closing soon';return 'Polls open';}
export function reconcile(primary,secondary){if(!secondary)return{record:primary,warning:'Secondary data unavailable'};if(primary.id!==secondary.id)return{record:primary,warning:'Incompatible contest scopes'};const mismatch=JSON.stringify(primary.candidates.map(c=>[c.name==='Shannon W. Bray'?'Shannon Bray':c.name,c.party,c.votes]).sort())!==JSON.stringify(secondary.candidates.map(c=>[c.name==='Shannon W. Bray'?'Shannon Bray':c.name,c.party,c.votes]).sort());return{record:primary,secondary,warning:mismatch?'Sources disagree; primary retained. Counts are not averaged.':null};}
