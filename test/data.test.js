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
