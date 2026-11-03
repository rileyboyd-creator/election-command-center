// Individually stated factual classifications, not a reproduced ratings table.
export const ratingSource={provider:"Sabato’s Crystal Ball",date:'2026-11-02',url:'https://sabatoscrystalball.substack.com/p/the-final-2026-ratings-democrats'};
export const ratings={'US-2026-SEN-AK':'Lean D','US-2026-SEN-MI':'Lean D','US-2026-SEN-IA':'Lean R','US-2026-SEN-SC':'Lean R','US-2026-SEN-LA':'Lean R'};
export function ratingTag(id){const label=ratings[id];return label?'<a class="rating '+(label.endsWith('D')?'d':'r')+'" href="'+ratingSource.url+'" target="_blank" rel="noopener noreferrer" title="Pre-election rating · '+ratingSource.provider+' · '+ratingSource.date+'">'+label+'</a>':'<span class="rating" title="No verified pre-election rating loaded">Unrated</span>';}
