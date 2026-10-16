import hanja from './datasets/hanja.js';
import countries from './datasets/countries.js';
import koreanHistory from './datasets/history.js';
import internationalHistory from './datasets/leaders.js';
import capitalsKo from './datasets/capitals-ko.js';
import leaderCatalog from './datasets/leader-catalog.js';
export {countries,capitalsKo,leaderCatalog,hanja};
export const hanjaGrades=['8급','7급Ⅱ','7급','6급Ⅱ','6급','5급Ⅱ','5급','4급Ⅱ','4급','3급Ⅱ','3급','2급','1급','특급Ⅱ','특급'];
export const dynasties={...koreanHistory,...internationalHistory};
export const continents=['아시아','유럽','아프리카','북아메리카','남아메리카','오세아니아','남극'];
export const countryModes=[['name-capital','국가명 → 수도'],['name-flag','국가명 → 국기'],['capital-name','수도 → 국가명'],['capital-flag','수도 → 국기'],['flag-name','국기 → 국가명'],['flag-capital','국기 → 수도']];
export const fieldNames={name:'국가명',capital:'수도',flag:'국기'};
export function getCards(topic,direction,options={}){
 if(topic==='hanja'){
  const rank=hanjaGrades.indexOf(options.grade||'8급');
  return hanja.filter(h=>options.hanjaScope==='new'?h.grade===(options.grade||'8급'):hanjaGrades.indexOf(h.grade)<=rank).map(h=>({id:h.id,left:direction==='reverse'?h.answer:h.hanja,right:direction==='reverse'?h.hanja:h.answer,hanjaSide:direction==='reverse'?'right':'left'}));
 }
 if(topic==='kings')return(dynasties[options.dynasty||'조선']||[]).map((r,i)=>({id:`${options.dynasty||'조선'}-${i}`,left:`${options.dynasty||'조선'} ${r.order}`,right:r.name,period:r.period,party:r.party}));
 if(topic==='words')return(options.words||[]).filter(w=>!options.bookId||w.bookId===options.bookId).map(w=>({id:w.id,left:direction==='reverse'?w.meaning:w.word,right:direction==='reverse'?w.word:w.meaning}));
 const [from,to]=(direction||'name-capital').split('-');
 if(!countryModes.some(([key])=>key===(direction||'name-capital')))return[];
 return countries.filter(c=>(options.scope==='all'||c.sovereign)&&(!options.continent||options.continent==='전체'||c.continent===options.continent)&&(!(from==='capital'||to==='capital')||!options.test||c.capitals.length)).map(c=>{
 const fields={name:c.name,capital:c.capitals.map(capital=>capitalsKo[capital]||'표기 미등록').join(' · ')||'수도 없음',flag:''};
 return{id:c.id,left:fields[from],right:fields[to],flag:c.flag,flagSide:from==='flag'?'left':to==='flag'?'right':null,countryName:c.name,continent:c.continent,from,to};
 });
}
