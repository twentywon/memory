import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {countries,dynasties,getCards,continents,capitalsKo,countryModes,leaderCatalog} from '../data.js';
import {emptyState,markResult,isMistake,validateState,loadState,saveState,mergeStates} from '../storage.js';
test('full imported scope and continent partitions match 195/250 entries',()=>{
 assert.equal(countries.length,250);assert.equal(new Set(countries.map(c=>c.id)).size,250);assert.equal(getCards('countries').length,195);
 for(const scope of ['all','sovereign']){
  const all=getCards('countries','name-capital',{scope});
  const filtered=continents.flatMap(continent=>getCards('countries','name-capital',{scope,continent}));
  assert.equal(filtered.length,all.length);assert.equal(new Set(filtered.map(c=>c.id)).size,all.length);
 }
});
test('every flag is SVG and matches the collected checksum',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../datasets/country-sources.json',import.meta.url)));
 for(const c of countries){const bytes=await readFile(new URL('../'+c.flag,import.meta.url));assert.match(bytes.toString(),/<svg/);assert.equal(createHash('sha256').update(bytes).digest('hex'),manifest.flagSHA256[c.id]);}
});
test('all six distinct country pairs show exactly one field on each side',()=>{
 assert.equal(countryModes.length,6);assert.equal(new Set(countryModes.map(([d])=>d)).size,6);
 for(const [direction]of countryModes){
  const [from,to]=direction.split('-'),c=getCards('countries',direction).find(c=>c.id==='kr');
  const fields={name:'대한민국',capital:'서울',flag:''};
  assert.equal(c.left,fields[from]);assert.equal(c.right,fields[to]);assert.equal(c.flagSide,from==='flag'?'left':to==='flag'?'right':null);
 }
 assert.equal(getCards('countries','name-flag',{scope:'all',test:true}).length,250);
 assert.ok(getCards('countries','name-capital',{scope:'all',test:true}).length<250);
});
test('every original capital has a Korean label and multiple capitals remain together',()=>{
 for(const c of countries)for(const capital of c.capitals){assert.ok(capitalsKo[capital],capital);assert.match(capitalsKo[capital],/[가-힣]/,capital);}
 assert.equal(getCards('countries').find(c=>c.id==='za').right,'프리토리아 · 블룸폰테인 · 케이프타운');
});
test('country catalog contains only the appropriate history groups with periods',()=>{
 assert.deepEqual(Object.keys(leaderCatalog),['한국','중국','미국','영국','프랑스','독일','일본']);
 for(const entry of Object.values(leaderCatalog))for(const group of entry.groups){assert.ok(dynasties[group].length);assert.ok(getCards('kings',null,{dynasty:group}).every(c=>c.period&&c.right));}
 assert.equal(dynasties['미국 대통령'].length,47);assert.equal(dynasties['일본 총리대신'].length,80);
 assert.equal(dynasties['미국 대통령'].filter(r=>r.name==='그로버 클리블랜드').length,2);
 assert.equal(dynasties['일본 총리대신'].filter(r=>r.name==='아베 신조').length,2);
 assert.equal(dynasties['중화민국 임시·북양정부'][0].name,'쑨원');
 assert.match(dynasties['중화민국 임시·북양정부'][0].period,/1912/);
 assert.match(dynasties['고구려'][0].period,/기원전/);
});
test('v1 words and country mistakes migrate without losing word IDs or errors',()=>{
 const state=validateState({words:[{id:'w1',word:'remember',meaning:'기억하다'}],mistakes:{words:{w1:['reverse']},countries:{kr:['forward','reverse','flag']}}});
 assert.deepEqual(state.books,[{id:'legacy-default',name:'기존 단어장'}]);assert.equal(state.words[0].id,'w1');assert.equal(state.words[0].bookId,'legacy-default');
 assert.deepEqual(state.mistakes.words.w1,['reverse']);
 assert.deepEqual(state.mistakes.countries.kr,['name-capital','capital-name','capital-flag','flag-name','flag-capital']);
});
test('book selection isolates vocabulary cards and mistakes',()=>{
 const words=[{id:'a',word:'one',meaning:'하나',bookId:'teps'},{id:'b',word:'lost',meaning:'길을 잃은',bookId:'lost'}];
 assert.deepEqual(getCards('words','reverse',{words,bookId:'teps'}),[{id:'a',left:'하나',right:'one'}]);
 assert.equal(getCards('words','forward',{words:[],bookId:'lost'}).length,0);
});
test('six-direction mistake records remain independent and persist',()=>{
 const state=emptyState();for(const [d]of countryModes)markResult(state,'countries','kr',d,false);
 markResult(state,'countries','kr','name-flag',true);assert.equal(isMistake(state,'countries','kr','name-flag'),false);assert.equal(state.mistakes.countries.kr.length,5);
 const storage={value:null,setItem(k,v){this.value=v;},getItem(){return this.value;}};
 assert.ok(saveState(storage,state));assert.deepEqual(loadState(storage).state,state);
 assert.equal(saveState({setItem(){throw Error();}},state),false);assert.equal(loadState({getItem(){return '{broken';}}).error,true);
});
test('backup merges remap conflicting book and word IDs, retaining both sets of notes',()=>{
 const base={books:[{id:'book',name:'텝스'}],words:[{id:'word',word:'one',meaning:'하나',bookId:'book'}],mistakes:{countries:{},words:{word:['forward']}}};
 const incoming={books:[{id:'book',name:'LOST'}],words:[{id:'word',word:'lost',meaning:'길을 잃은',bookId:'book'}],mistakes:{countries:{},words:{word:['reverse']}}};
 let i=0;const merged=mergeStates(base,incoming,()=>`new-${++i}`);
 assert.equal(merged.books.length,2);assert.equal(merged.words.length,2);assert.equal(new Set(merged.words.map(w=>w.bookId)).size,2);
 assert.deepEqual(merged.mistakes.words.word,['forward']);assert.deepEqual(merged.mistakes.words['new-2'],['reverse']);
 assert.deepEqual(validateState(merged),merged);
});
test('backup validation rejects malformed values and object prototype IDs',()=>{
 const state=validateState(JSON.parse('{"books":[{"id":"constructor","name":"bad"}],"words":[{"id":"__proto__","word":"unsafe","meaning":"unsafe"}],"mistakes":{"countries":{"__proto__":["name-flag"]}}}'));
 assert.equal(state.words.length,0);assert.equal(state.books.length,0);assert.equal(Object.keys(state.mistakes.countries).length,0);assert.equal(isMistake(state,'countries','toString','name-flag'),false);
});

test('modern leader parties are populated and specific to their recorded tenure',()=>{
 for(const [country,entry]of Object.entries(leaderCatalog))for(const group of entry.groups){
  if(country==='한국'&&group!=='대한민국 대통령')continue;
  assert.ok(getCards('kings',null,{dynasty:group}).every(c=>typeof c.party==='string'&&c.party.length>0),group);
 }
 assert.equal(dynasties['미국 대통령'][0].party,'무소속');
 assert.equal(dynasties['미국 대통령'].find(r=>r.name==='시어도어 루스벨트').party,'공화당');
 const ito=dynasties['일본 총리대신'].filter(r=>r.name==='이토 히로부미');
 assert.equal(ito[0].party,'무소속');assert.equal(ito.at(-1).party,'입헌정우회');
 const russell=dynasties['영국 총리'].filter(r=>r.name==='존 러셀');
 assert.equal(russell[0].party,'휘그당');assert.equal(russell[1].party,'자유당');
 assert.ok(dynasties['조선'].every(r=>!r.party));
});

test('Hanja has 5978 unique characters, 15 grade allocations and both study directions',async()=>{
 const {hanja,hanjaGrades}=await import('../data.js');
 assert.equal(hanja.length,5978);assert.equal(new Set(hanja.map(h=>h.id)).size,5978);assert.equal(hanjaGrades.length,15);
 const totals=[50,100,150,225,300,400,500,750,1000,1500,1817,2355,3500,4650,5978];
 for(const [i,grade]of hanjaGrades.entries())assert.equal(getCards('hanja','forward',{grade}).length,totals[i]);
 const forward=getCards('hanja','forward',{grade:'8급'}),reverse=getCards('hanja','reverse',{grade:'8급'});
 assert.equal(forward.length,50);assert.equal(forward[0].left,reverse[0].right);assert.equal(forward[0].right,reverse[0].left);
 assert.ok(hanja.every(h=>h.hanja&&h.answer&&h.grade));
 assert.equal(getCards('hanja','forward',{grade:'7급',hanjaScope:'new'}).length,50);
});
test('shuffle preserves records, does not mutate the source and uses its random source',async()=>{
 const {shuffledCards}=await import('../learning.js');
 const original=[{id:'a'},{id:'b'},{id:'c'},{id:'d'}];let calls=0;
 const shuffled=shuffledCards(original,()=>{calls++;return 0;});
 assert.equal(calls,3);assert.deepEqual(original.map(c=>c.id),['a','b','c','d']);assert.deepEqual(shuffled.map(c=>c.id),['b','c','d','a']);assert.deepEqual(new Set(shuffled.map(c=>c.id)),new Set(original.map(c=>c.id)));
});
test('screen parents return from lessons through selection screens and stay at home',async()=>{
 const {previousScreen}=await import('../learning.js');
 assert.equal(previousScreen('workspace','words'),'choose');assert.equal(previousScreen('choose','words'),'books');assert.equal(previousScreen('choose','hanja'),'grades');assert.equal(previousScreen('choose','kings'),'leaders');assert.equal(previousScreen('books','words'),'home');assert.equal(previousScreen('home',null),'home');
});
test('Hanja errors persist without losing existing word or country mistakes',()=>{
 const state=validateState({words:[],mistakes:{countries:{kr:['name-capital']},words:{w1:['forward']},hanja:{'hanja-5b78':['reverse']}}});
 assert.ok(isMistake(state,'hanja','hanja-5b78','reverse'));markResult(state,'hanja','hanja-5b78','reverse',true);assert.equal(Object.keys(state.mistakes.hanja).length,0);assert.ok(state.mistakes.words.w1);assert.ok(state.mistakes.countries.kr);
});

test('Korean subdivisions retain 17 provinces, updated borders and multiple-parent names',async()=>{
 const {regions}=await import('../data.js');assert.equal(regions.provinces.length,17);assert.equal(regions.rows.length,268);
 assert.equal(regions.rows.filter(r=>['시','군','자치구'].includes(r.kind)).length,227);
 assert.equal(regions.rows.filter(r=>r.kind==='행정시').length,2);assert.ok(!regions.rows.some(r=>r.province==='세종특별자치시'));
 assert.equal(regions.rows.find(r=>r.name==='군위군').province,'대구광역시');
 assert.ok(regions.rows.some(r=>r.name==='화성시 동탄구'));assert.ok(regions.rows.some(r=>r.name==='영종구'&&r.province==='인천광역시'));
 const cards=getCards('regions','forward',{province:'전체'});const jung=cards.find(c=>c.left==='중구');assert.ok(jung.right.includes('서울특별시'));assert.ok(jung.right.includes('부산광역시'));assert.ok(!jung.right.includes('인천광역시'));
 const goseong=cards.find(c=>c.left==='고성군');assert.ok(goseong.right.includes('강원특별자치도'));assert.ok(goseong.right.includes('경상남도'));
 assert.ok(getCards('regions','forward',{province:'경기도'}).every(c=>c.right.includes('경기도')));
 assert.ok(!getCards('regions','forward',{regionKind:'basic'}).some(c=>c.left==='수원시 영통구'));
});
test('idioms have exactly four characters, stable IDs and reversed question/answer pairs',async()=>{
 const {idioms}=await import('../data.js');assert.equal(idioms.length,2307);assert.equal(new Set(idioms.map(r=>r.id)).size,2307);
 assert.ok(idioms.every(r=>[...r.word].length===4&&[...r.hanja].length===4&&r.meaning));
 const a=getCards('idioms','forward'),b=getCards('idioms','reverse');assert.equal(a[0].left,b[0].right);assert.equal(a[0].right,b[0].left);
});
test('118 recognized elements have unique numbers, symbols and grid positions; hypothetical 119 excluded',async()=>{
 const {elements}=await import('../data.js');assert.equal(elements.length,118);assert.deepEqual(elements.map(e=>e.number),Array.from({length:118},(_,i)=>i+1));
 assert.equal(new Set(elements.map(e=>e.symbol)).size,118);assert.equal(new Set(elements.map(e=>`${e.x}-${e.y}`)).size,118);
 assert.ok(elements.every(e=>/^[A-Z][a-z]?$/.test(e.symbol)&&/[가-힣]/.test(e.name)&&e.x>=1&&e.x<=18&&e.y>=1&&e.y<=10));
 const a=getCards('elements','forward'),b=getCards('elements','reverse');assert.equal(a[0].left,'1 · 수소');assert.equal(a[0].right,'1 · H');assert.equal(b[0].left,'1 · H');assert.equal(b[0].right,'1 · 수소');
 assert.equal(getCards('elements','forward',{elementPeriod:'1'}).length,2);
});
test('new topic mistakes migrate, merge and persist alongside existing vocabulary',()=>{
 const state=emptyState();for(const topic of ['regions','idioms','elements'])markResult(state,topic,topic+'-one','forward',false);
 const copy=validateState(state);for(const topic of ['regions','idioms','elements'])assert.ok(isMistake(copy,topic,topic+'-one','forward'));
 const merged=mergeStates(copy,{words:[],mistakes:{hanja:{'hanja-one':['reverse']}}},()=> 'new');assert.ok(merged.mistakes.hanja['hanja-one']);assert.ok(merged.mistakes.elements['elements-one']);
});

test('region exams ignore study province and district-kind filters',()=>{
 const all=getCards('regions','forward',{test:true});
 const restricted=getCards('regions','forward',{test:true,province:'서울특별시',regionKind:'basic'});
 assert.deepEqual(restricted,all);assert.ok(restricted.some(c=>c.left==='수원시 영통구'));assert.ok(restricted.some(c=>c.right.includes('제주특별자치도')));
});
test('offline map preserves 255 districts through province and city hierarchy',async()=>{
 const {default:maps}=await import('../datasets/region-maps.js');
 assert.equal(maps.snapshot,'2026-04-01');assert.equal(maps.nation.features.length,17);assert.equal(Object.keys(maps.regions).length,17);
 assert.equal(Object.values(maps.regions).reduce((n,r)=>n+r.features.filter(f=>!f.cityId).length,0)+Object.values(maps.cities).reduce((n,r)=>n+r.features.length,0),255);
 for(const map of [maps.nation,...Object.values(maps.regions),...Object.values(maps.cities)])for(const f of map.features){assert.match(f.d,/^M/);assert.ok(f.d.endsWith('Z'));assert.ok(!f.d.includes('NaN'));assert.ok(f.name);assert.ok(f.x>=0&&f.x<=map.width&&f.y>=0&&f.y<=map.height);}
 assert.equal(maps.regions['11'].features.length,25);assert.equal(maps.regions['50']?.features.length||Object.values(maps.regions).find(r=>r.name==='제주특별자치도').features.length,2);
});
test('expanded idioms preserve original IDs and definitions, while tests ignore study searches',async()=>{
 const {idioms}=await import('../data.js');const original=JSON.parse(await readFile(new URL('../datasets/idioms/curated-base.json',import.meta.url)));
 for(const old of original)assert.deepEqual(idioms.find(r=>r.id===old.id),old);
 assert.equal(new Set(idioms.map(r=>r.word)).size,idioms.length);
 assert.ok(getCards('idioms','forward',{idiomSearch:'고진감래'}).length<idioms.length);
 assert.equal(getCards('idioms','forward',{idiomSearch:'고진감래',test:true}).length,idioms.length);
});
test('every element card keeps its atomic number alongside the name and symbol in both directions',async()=>{
 const {elements}=await import('../data.js');for(const direction of ['forward','reverse']){
  const cards=getCards('elements',direction);for(const [i,c]of cards.entries()){assert.ok(c.left.startsWith(`${elements[i].number} · `));assert.ok(c.right.startsWith(`${elements[i].number} · `));}
 }
});


test('general districts are grouped into one city boundary and kept on city detail maps',async()=>{
 const {default:maps}=await import('../datasets/region-maps.js');
 const expected={'41110':['수원시',4],'41130':['성남시',3],'41170':['안양시',2],'41190':['부천시',3],'41270':['안산시',2],'41280':['고양시',3],'41460':['용인시',3],'41590':['화성시',4],'43110':['청주시',4],'44130':['천안시',2],'47110':['포항시',2],'48120':['창원시',5],'52110':['전주시',2]};
 assert.deepEqual(Object.keys(maps.cities).sort(),Object.keys(expected).sort());
 const leaves=[];
 for(const [cid,[name,count]]of Object.entries(expected)){
  const city=maps.cities[cid],parent=maps.regions[city.parentId];assert.equal(city.name,name);assert.equal(city.features.length,count);assert.equal(city.parentName,parent.name);
  assert.equal(parent.features.filter(f=>f.cityId===cid&&f.name===name).length,1);
  for(const f of city.features){assert.ok(f.name.endsWith('구'));assert.ok(!f.name.includes(' '));assert.ok(!parent.features.some(p=>p.id===f.id));assert.ok(!f.cityId);leaves.push(f.id);}
 }
 for(const region of Object.values(maps.regions))for(const f of region.features){if(!f.cityId)leaves.push(f.id);assert.doesNotMatch(f.name,/시 .+구$/);}
 assert.equal(new Set(leaves).size,255);assert.equal(leaves.length,255);
 assert.equal(maps.regions['41'].features.length,31);
 assert.deepEqual(maps.cities['41190'].features.map(f=>f.name).sort(),['소사구','오정구','원미구']);
 assert.deepEqual(maps.cities['41130'].features.map(f=>f.name).sort(),['분당구','수정구','중원구']);
 assert.equal(maps.regions['11'].features.length,25);assert.equal(maps.regions['36'].features.length,1);assert.equal(maps.regions['50'].features.length,2);
});
