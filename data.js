import countries from './datasets/countries.js';
import dynasties from './datasets/history.js';
export {countries,dynasties};
export const continents=['아시아','유럽','아프리카','북아메리카','남아메리카','오세아니아','남극'];
export function getCards(topic,direction='forward',options={}) {
 if(topic==='kings') return (dynasties[options.dynasty||'조선']||[]).map((r,i)=>({id:`${options.dynasty||'조선'}-${i}`,left:`${options.dynasty||'조선'} ${r.order}`,right:r.name,period:r.period}));
 if(topic==='words') return (options.words||[]).map(w=>({id:w.id,left:direction==='reverse'?w.meaning:w.word,right:direction==='reverse'?w.word:w.meaning}));
 return countries.filter(c=>(options.scope==='all'||c.sovereign)&&(!options.continent||options.continent==='전체'||c.continent===options.continent)&&(!options.test||c.capitals.length)).map(c=>{
 const capital=c.capitals.join(' · ')||'수도 없음';
 return {id:c.id,left:direction==='reverse'?capital:direction==='flag'?'':c.name,right:direction==='reverse'?c.name:direction==='flag'?`${c.name} · ${capital}`:capital,flag:c.flag,flagSide:direction==='reverse'?'right':'left',countryName:c.name,continent:c.continent};
 });
}
