export const endpoints={senate:'https://civicapi.org/api/v2/race/87528',house:'https://civicapi.org/api/v2/race/87524'};
const check=(ok,message)=>{if(!ok)throw Error(message)};
const party=p=>p==='Democratic'?'d':p==='Republican'?'r':'other';
const integer=n=>Number.isSafeInteger(n)&&n>=0;
function verify(d,key){
 check(d&&d.test_data===false,'Missing live-data flag or test data: '+key);
 check(d.country==='US'&&d.province==='US'&&d.election_scope==='General'&&d.election_date?.startsWith('2026-11-03'),'Wrong election: '+key);
 check(d.election_type===(key==='senate'?'US Senate':'House of Representatives'),'Wrong office: '+key);
 check(Number.isFinite(Date.parse(d.last_updated))&&Date.parse(d.last_updated)<=Date.now()+300000,'Invalid source timestamp');
 check(Array.isArray(d.candidates),'Missing national candidates');
 check(Object.keys(d.region_results||{}).length===(key==='senate'?35:435),'Incomplete national race coverage: '+key);
 for(const [id,r] of Object.entries(d.region_results)){
  check((key==='senate'?/^[a-z]{2}$/:/^[a-z]{2}-(?:\d{2}|al)$/).test(id),'Unexpected geographic identifier');
  check(Array.isArray(r.candidates)&&r.candidates.length>0,'Missing regional candidates');
  check(r.candidates.filter(c=>c.winner===true).length<=1,'Multiple winners in one contest');
  for(const c of r.candidates)check(typeof c.name==='string'&&typeof c.party==='string'&&integer(c.votes),'Invalid candidate votes');
 }
}
export async function normalize(payloads,previous,now=new Date().toISOString()){
 for(const k of ['senate','house'])verify(payloads[k],k);
 const digest=await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(payloads)));
 const fingerprint=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 if(previous.metadata?.civicapi_fingerprint===fingerprint&&previous.contests)return previous;
 for(const k of ['senate','house']){
  const old=previous.metadata?.civicapi_source_times?.[k];
  if(old)check(Date.parse(payloads[k].last_updated)>=Date.parse(old),'Out-of-order '+k+' source timestamp');
 }
 const next={version:1,updated:now,national:{},races:[],contests:[],turnout:previous.turnout||[],events:[...(previous.events||[])],comparisons:previous.comparisons||[],metadata:{...previous.metadata,civicapi_fingerprint:fingerprint,civicapi_source_times:{senate:payloads.senate.last_updated,house:payloads.house.last_updated},retrieved_at:now,provider:'civicAPI',limitations:['civicAPI calls are provider projections, not certification or AP calls.','Aggregate source last_updated is used for region records; individual region update timestamps are unavailable in this payload.','Reporting percentage is a provider estimate; denominator is not sufficiently specified and is not treated as percent of votes counted.','Florida turnout is not supplied by these results endpoints.','Independent winners remain Other until caucus affiliation is separately verified.'],confirmed_results:[],estimates:[]}};
 for(const [key,total] of [['senate',100],['house',435]]){
  const d=payloads[key],held=key==='senate'?{d:34,r:31,other:0}:{d:0,r:0,other:0};
  // The 34/31 not-up allocation is the separately sourced pre-election baseline.
  const n={d:held.d,r:held.r,other:held.other,uncalled:total-held.d-held.r-held.other,heldD:held.d,heldR:held.r,heldOther:held.other,baselineD:null,source:'civicAPI',url:endpoints[key],scope:'United States',updated:d.last_updated,status:'unofficial',definition:'Not-up baseline plus civicAPI winner flags (provider projections). Senate held baseline 34 Democratic caucus (includes 2 independents), 31 Republican; baseline source: https://www.theguardian.com/us-news/ng-interactive/2026/nov/03/midterm-elections-full-results-senate-house-governor-races . Not certified. Source timestamp is aggregate last_updated; retrieval '+now};
  for(const [id,r]of Object.entries(d.region_results)){
   const winner=r.candidates.find(c=>c.winner===true);
   if(winner){n[party(winner.party)]++;n.uncalled--;}
   if(key==='house')next.contests.push({id:'US-2026-HOUSE-'+id.toUpperCase(),provider_id:String(r.election_id),office:'House',state:id.slice(0,2).toUpperCase(),scope:r.name||id,source:'civicAPI',url:'https://civicapi.org/results/elections/'+r.election_id,updated:d.last_updated,status:winner?'projection':'unofficial',call:winner?.name||null,reportedProgress:r.percent_reporting??null,candidates:r.candidates.map(c=>({id:String(c.candidate_id??(c.name+'|'+c.party)),name:c.name,party:c.party,votes:c.votes}))});
   if(key==='senate'){
    const old=previous.races?.find(x=>x.state===id.toUpperCase());
    const race={id:'US-2026-SEN-'+id.toUpperCase(),provider_id:String(r.election_id),office:'Senate',state:id.toUpperCase(),candidates:r.candidates.map(c=>({id:String(c.candidate_id??(c.name+'|'+c.party)),name:c.name,party:c.party,votes:c.votes,incumbent:!!c.incumbent})),counted:null,countedDefinition:'Provider percent_reporting is not treated as vote counted.',reportedProgress:r.percent_reporting??null,seatStatus:r.candidates.some(c=>c.incumbent)?'Incumbent listed by civicAPI':'No incumbent listed by civicAPI; open-seat status requires verification',call:winner?winner.name:null,callSource:winner?'civicAPI':null,callUrl:winner?'https://civicapi.org/results/elections/'+r.election_id:null,source:'civicAPI',url:'https://civicapi.org/results/elections/'+r.election_id,scope:r.name,updated:d.last_updated,status:winner?'projection':'unofficial',definition:'Candidate votes supplied by civicAPI. Zero totals before reporting mean no returns reported. Aggregate source update time; individual state timestamp unavailable.'};
    next.races.push(race);next.contests.push(race);
    if((old?.call||null)!==race.call){const correction=!!old?.call;next.events.push({id:'civicapi-'+id+'-'+fingerprint.slice(0,12),title:correction?'Call changed or withdrawn: '+r.name+' → '+(race.call||'uncalled'):'civicAPI projects '+race.call+' in '+r.name,type:correction?'correction':'Senate',state:race.state,source:'civicAPI',url:race.url,scope:race.scope,updated:now,status:'projection',definition:'Change detected at retrieval time; exact provider call time unavailable. Not certification.'});}
   }
  }
  // Compare allocated-seat totals with provider national seat totals; never count a lead as a win.
  const providerSeats=d.candidates.reduce((sum,c)=>sum+(integer(c.seats)?c.seats:0),0);
  check(providerSeats===n.d+n.r+n.other,'National seat total conflicts with regional calls: '+key);
  n.status=n.d+n.r+n.other>held.d+held.r+held.other?'projection':'unofficial';
  next.national[key]=n;
 }
 next.events=next.events.slice(-500);
 return next;
}
export async function fetchCivic(previous){
 const payloads={};
 for(const [key,url]of Object.entries(endpoints)){
  const response=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(25000)});
  if(!response.ok)throw Error('civicAPI '+key+' HTTP '+response.status);
  payloads[key]=await response.json();
 }
 return normalize(payloads,previous);
}
