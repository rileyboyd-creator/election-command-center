const BASE='https://civicapi.org/api/v2/race/', DATE='2026-11-03';
const assert=(x,m)=>{if(!x)throw Error(m)};
export function searchURL(state){assert(/^[A-Z]{2}$/.test(state),'Invalid state');return BASE+'search?'+new URLSearchParams({startDate:DATE,endDate:DATE,country:'US',province:state,limit:'50000'})}
export function validateCatalog(d,state){
 assert(d&&Array.isArray(d.races)&&Number.isInteger(d.count)&&d.count===d.races.length,'Incomplete race catalogue');
 const ids=new Set;
 for(const r of d.races){assert(Number.isSafeInteger(r.id)&&!ids.has(r.id),'Invalid or duplicate race ID');ids.add(r.id);
 assert(r.country==='US'&&r.province===state&&r.election_date?.startsWith(DATE)&&r.test_data!==true,'Wrong election or test data');
 assert(typeof r.election_name==='string'&&Array.isArray(r.candidates),'Invalid race');
 for(const c of r.candidates)assert(typeof c.name==='string'&&Number.isSafeInteger(c.votes)&&c.votes>=0,'Invalid candidate');}
 const races=d.races.filter(r=>r.type==='Governor'||category(r)==='Ballot measures');return {...d,count:races.length,races};
}
export function validateDetail(d,state){
 assert(d?.test_data===false&&d.country==='US'&&d.province===state&&d.election_date?.startsWith(DATE),'Wrong election or test data');
 assert(Number.isFinite(Date.parse(d.last_updated))&&Date.parse(d.last_updated)<=Date.now()+300000,'Invalid timestamp');
 assert(typeof d.election_name==='string'&&Array.isArray(d.candidates),'Invalid detail');
 for(const c of d.candidates)assert(typeof c.name==='string'&&Number.isSafeInteger(c.votes)&&c.votes>=0,'Invalid votes');
 return d;
}
export async function getJSON(url){const r=await fetch(url,{signal:AbortSignal.timeout(25000),headers:{Accept:'application/json'}});if(!r.ok){const e=Error('HTTP '+r.status);const retry=r.headers.get('Retry-After');e.retryAfter=retry?(Number.isFinite(Number(retry))?Number(retry)*1000:Math.max(0,Date.parse(retry)-Date.now())):0;throw e}return r.json()}
export function category(r){const t=(r.type||'')+' '+r.election_name;if(/referendum|amendment|proposition|ballot|levy|bond|advisory question/i.test(t))return 'Ballot measures';return 'Governor'}
const esc=s=>String(s??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cache=new Map;let active=null,options=null,selected=null,query='',group='All races',offset=0,detail=null,detailError='',catalogError='',busy=false,nextCatalog=0,nextDetail=0,retryAt=0,failures=0;
function root(){return document.getElementById('stateRaceExplorer')}
function visible(){return root()&&!document.hidden&&!options.paused()}
function render(){
 const el=root();if(!el)return;const c=cache.get(active);
 el.innerHTML='<h3>Governors & ballot measures</h3><p>Governor races and state or local ballot measures listed by CivicAPI for November 3. Coverage is provider supplied and may be incomplete. Counts are unofficial; calls are CivicAPI projections.</p><p id="stateRaceHealth" role="status"></p><div class="tools"><input id="stateRaceQuery" aria-label="Search races and ballot measures" placeholder="Search office, measure, district or county…" value="'+esc(query)+'"><select id="stateRaceGroup" aria-label="Race category">'+['All races','Governor','Ballot measures'].map(t=>'<option '+(group===t?'selected':'')+'>'+t+'</option>').join('')+'</select><button id="stateRaceRefresh">Refresh state races</button></div><div id="stateRaceRows"></div><div id="stateRaceDetail"></div>';
 el.querySelector('#stateRaceQuery').oninput=e=>{query=e.target.value;offset=0;rows()};
 el.querySelector('#stateRaceGroup').onchange=e=>{group=e.target.value;offset=0;rows()};
 el.querySelector('#stateRaceRefresh').onclick=()=>{nextCatalog=nextDetail=retryAt=0;tick()};
 rows();drawDetail();health();
}
function health(){const el=document.getElementById('stateRaceHealth');if(!el)return;const c=cache.get(active);el.textContent=(options.paused()?'Paused · ':document.hidden?'Tab hidden · ':'')+(c?c.data.count+' governor / ballot-measure contests · '+(c.fallback?'Fallback snapshot':'Direct feed')+' retrieved '+c.checked:'Loading state race catalogue…')+(catalogError?' · Catalogue refresh failed: '+catalogError+' · last good data retained':'')+'. Catalogue retrieval time is not a source update timestamp; open a race for its source timestamp.';}
function rows(){
 const el=document.getElementById('stateRaceRows');if(!el)return;const c=cache.get(active);
 if(!c){el.innerHTML='<p>Awaiting available race catalogue.</p>';return}
 const list=c.data.races.filter(r=>(group==='All races'||category(r)===group)&&(!query||(r.election_name+' '+(r.district||'')+' '+(r.municipality||'')+' '+r.candidates.map(c=>c.name).join(' ')).toLowerCase().includes(query.toLowerCase()))).sort((a,b)=>(a.election_type==='Statewide'?0:1)-(b.election_type==='Statewide'?0:1)||a.election_name.localeCompare(b.election_name));
 offset=Math.min(offset,Math.max(0,Math.floor((list.length-1)/25)*25));
 el.innerHTML='<p>'+list.length+' matching contests · '+(list.length?offset+1:0)+'–'+Math.min(offset+25,list.length)+'</p><div class="scroll"><table><thead><tr><th>Contest</th><th>Category</th><th>Location</th><th>Details</th></tr></thead><tbody>'+list.slice(offset,offset+25).map(r=>'<tr><td>'+esc(r.election_name)+'</td><td>'+esc(category(r))+'</td><td>'+esc([r.district,r.municipality].filter(Boolean).join(' · ')||'Statewide')+'</td><td><button data-race-id="'+r.id+'" aria-pressed="'+(selected===r.id)+'">View live results</button></td></tr>').join('')+'</tbody></table></div><div class="tools"><button id="racePrev" '+(!offset?'disabled':'')+'>Previous</button><button id="raceNext" '+(offset+25>=list.length?'disabled':'')+'>Next</button></div>';
 el.querySelectorAll('[data-race-id]').forEach(b=>b.onclick=()=>{selected=Number(b.dataset.raceId);detail=null;detailError='';nextDetail=retryAt=0;drawDetail();tick()});
 el.querySelector('#racePrev').onclick=()=>{offset-=25;rows()};el.querySelector('#raceNext').onclick=()=>{offset+=25;rows()};
}
function drawDetail(){
 const el=document.getElementById('stateRaceDetail');if(!el)return;
 if(!selected){el.innerHTML='<p>Select a contest to load its full candidate or ballot-option results. No winner is inferred from a lead or an uncontested listing.</p>';return}
 if(!detail){el.innerHTML='<p role="status">'+(detailError?'Results unavailable: '+esc(detailError):'Loading full race results…')+'</p>';return}
 const d=detail.data,total=d.candidates.reduce((s,c)=>s+c.votes,0),aggregate=d.candidates.some(c=>Object.hasOwn(c,'seats'));
 el.innerHTML='<div class="card"><h3>'+esc(d.election_name)+'</h3><p>'+ (detailError?'Refresh failed: '+esc(detailError)+' · cached results retained. ':'')+'Source updated '+esc(d.last_updated)+(Date.now()-Date.parse(d.last_updated)>600000?' · STALE (>10 min)':'')+' · retrieved '+esc(detail.checked)+'</p><div class="scroll"><table><thead><tr><th>Candidate / option'+(aggregate?' / party':'')+'</th><th>Party</th><th>Votes</th><th>Provider share</th>'+(aggregate?'<th>Provider seats</th>':'')+'<th>Status</th></tr></thead><tbody>'+d.candidates.map(c=>'<tr><td>'+esc(c.name)+'</td><td>'+esc(c.party)+'</td><td>'+(total?c.votes.toLocaleString():'Awaiting returns')+'</td><td>'+(total&&Number.isFinite(c.percent)?esc(c.percent)+'%':'—')+'</td>'+(aggregate?'<td>'+esc(c.seats)+'</td>':'')+'<td>'+(c.winner===true?'CivicAPI projection':'No projection')+'</td></tr>').join('')+'</tbody></table></div><p>Provider reporting estimate: '+esc(d.percent_reporting)+'%. This is not a verified percentage of votes counted. Shares are supplied by CivicAPI; no shares or pass/fail thresholds are inferred.'+(aggregate?' Seat figures are provider aggregates and do not count toward the national ladder.':'')+'</p><a target="_blank" rel="noopener" href="https://civicapi.org/results/elections/'+selected+'">Open CivicAPI race and geographic results</a></div>';
}
async function tick(){
 if(!visible()||busy||Date.now()<retryAt){health();return}
 const state=active;busy=true;
 try{
 if(Date.now()>=nextCatalog){try{
 const data=validateCatalog(await getJSON(searchURL(state)),state);cache.set(state,{data,checked:new Date().toISOString(),fallback:false});if(state===active){catalogError='';nextCatalog=Date.now()+60000;rows();}
 }catch(e){if(state===active){catalogError=e.message;nextCatalog=Date.now()+60000;}
 if(!cache.has(state)){try{const snap=await getJSON('./data/states/'+state+'.json');validateCatalog(snap.data,state);cache.set(state,{data:snap.data,checked:snap.retrieved_at,fallback:true});if(state===active)rows()}catch{}}
 throw e;}}
 if(state===active&&selected&&Date.now()>=nextDetail){const id=selected;try{
 const d=validateDetail(await getJSON(BASE+id),state);
 const listing=cache.get(state)?.data.races.find(r=>r.id===id);assert(listing&&listing.election_name===d.election_name,'Race identity mismatch');
 if(detail?.id===id)assert(Date.parse(d.last_updated)>=Date.parse(detail.data.last_updated),'Older detail rejected');
 if(active===state&&selected===id){detail={id,data:d,checked:new Date().toISOString()};detailError='';drawDetail()}nextDetail=Date.now()+10000;
 }catch(e){if(active===state&&selected===id){detailError=e.message;drawDetail()}throw e;}}
 failures=0;
 }catch(e){if(state!==active)return;failures++;retryAt=Date.now()+Math.max(e.retryAfter||0,Math.min(300000,30000*2**Math.min(failures-1,4)));}
 finally{busy=false;health()}
}
export function mount(state,opts){options=opts;if(active!==state){active=state;selected=null;detail=null;detailError=catalogError='';query='';group='All races';offset=0;nextCatalog=nextDetail=retryAt=0;failures=0}render();tick()}
if(typeof document!=='undefined'){setInterval(tick,1000);document.addEventListener('visibilitychange',tick)}
