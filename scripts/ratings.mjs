import {senateStates,source} from './votehub.mjs?v=1';
export {senateStates};
export const ratingSource={provider:source.name,date:'2026-11-03',url:source.url};
export const ratings=Object.freeze({}); // No editorial race ratings are inferred from polling.
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let polling=null;
const day=s=>new Date(s+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'});
export async function loadPolling(){try{const r=await fetch('./data/polling.json',{cache:'no-cache',signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Polling HTTP '+r.status);const next=await r.json();if(next.version!==1||!next.races||!Number.isFinite(Date.parse(next.fetched_at)))throw Error('Invalid polling snapshot');polling=next;}catch(e){console.warn('Polling context unavailable',e)}return polling;}
export function ratingTag(id){
 if(!senateStates.some(s=>id==='US-2026-SEN-'+s))return '';
 const p=polling?.races[id];if(!p)return '<span class="rating" data-poll-contest="'+id+'" title="VoteHub · No recent compatible general-election poll loaded">'+(polling?'No recent matching poll':'Polling unavailable')+'</span>';
 const leader=p.answers[0],color=p.margin===0?'#394556':leader.party==='Democratic'?'#244c79':leader.party==='Republican'?'#753244':'#59437a';
 const label=p.margin===0?'Tied':leader.name.split(/\s+/).at(-1)+' +'+p.margin;
 const stale=Date.parse('2026-11-03')-Date.parse(p.end_date)>30*86400000;
 const detail='Latest poll, not an average or forecast · '+p.pollster+' · '+p.start_date+'–'+p.end_date+' · n='+p.sample_size+' '+p.population.toUpperCase()+(p.partisan?' · '+p.partisan+' partisan source':'')+(p.sponsors.length?' · Sponsors: '+p.sponsors.join(', '):'')+(stale?' · Older than 30 days':'');
 return '<span class="poll-context"><a class="rating" data-poll-contest="'+id+'" style="background:'+color+';color:#fff;border-color:#8997ad" href="'+esc(p.url)+'" target="_blank" rel="noopener noreferrer" title="'+esc(detail)+'">Latest poll: '+esc(label)+' · '+esc(day(p.end_date))+(stale?' · older poll':'')+'</a><details class="poll-details"><summary>Poll details</summary><p>'+esc(p.pollster)+' · '+esc(p.start_date)+'–'+esc(p.end_date)+' · '+p.sample_size+' '+p.population.toUpperCase()+'</p><p>'+p.answers.map(a=>esc(a.name)+': '+a.pct+'%').join(' · ')+'</p><p>'+(p.partisan?esc(p.partisan)+' partisan source. ':'')+(p.sponsors.length?'Sponsors: '+esc(p.sponsors.join(', '))+'. ':'')+'Single poll, not an average or forecast. <a href="'+source.url+'" target="_blank" rel="noopener noreferrer">Via VoteHub</a> · <a href="'+source.license+'" target="_blank" rel="noopener noreferrer">CC BY 4.0</a></p></details></span>';
}
