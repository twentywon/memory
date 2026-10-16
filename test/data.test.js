import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {countries,dynasties,getCards,continents} from '../data.js';
import {emptyState,markResult,isMistake,validateState,loadState,saveState} from '../storage.js';
test('full imported scope and per-continent partitions match 195/250 entries',()=>{
 assert.equal(countries.length,250);
 assert.equal(new Set(countries.map(c=>c.id)).size,250);
 assert.equal(getCards('countries').length,195);
 assert.equal(getCards('countries','forward',{scope:'all'}).length,250);
 for(const scope of ['all','sovereign']){
  const all=getCards('countries','forward',{scope});
  const filtered=continents.flatMap(continent=>getCards('countries','forward',{scope,continent}));
  assert.equal(filtered.length,all.length);assert.equal(new Set(filtered.map(c=>c.id)).size,all.length);
 }
});
test('every flag is present, is SVG, and matches the collected checksum',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../datasets/country-sources.json',import.meta.url)));
 for(const c of countries){
  const bytes=await readFile(new URL('../'+c.flag,import.meta.url));
  assert.match(bytes.toString(),/<svg/);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),manifest.flagSHA256[c.id],c.id);
 }
});
test('directions preserve associations, show multiple capitals and exclude capital-less test items',()=>{
 const kr=getCards('countries').find(c=>c.id==='kr');assert.equal(kr.right,'Seoul');assert.equal(kr.flagSide,'left');
 const reverse=getCards('countries','reverse').find(c=>c.id==='kr');assert.equal(reverse.left,'Seoul');assert.equal(reverse.right,'대한민국');assert.equal(reverse.flagSide,'right');
 const flag=getCards('countries','flag').find(c=>c.id==='kr');assert.equal(flag.left,'');assert.ok(flag.right.includes('대한민국'));
 const za=countries.find(c=>c.id==='za');assert.ok(za.capitals.length>1);assert.equal(getCards('countries').find(c=>c.id==='za').right,za.capitals.join(' · '));
 const tests=getCards('countries','forward',{scope:'all',test:true});assert.ok(tests.length<250);assert.ok(tests.every(c=>c.right!=='수도 없음'));
});
test('history has named periods for every ruler and includes presidents and restorations',()=>{
 const expected={'고구려':28,'백제':31,'신라':56,'고려':34,'조선':27,'대한민국 대통령':14};
 for(const [dynasty,length]of Object.entries(expected)){
  const cards=getCards('kings','forward',{dynasty});assert.equal(cards.length,length);assert.ok(cards.every(c=>c.period&&c.right));
 }
 assert.match(dynasties['고구려'][0].period,/기원전/);
 assert.match(dynasties['고려'].find(r=>r.name==='충선왕').period,/,/);
 assert.equal(dynasties['대한민국 대통령'].at(-1).name,'이재명');
});
test('words have no defaults and preserve user IDs across reversed directions',()=>{
 assert.equal(getCards('words').length,0);
 const words=[{id:'user-123',word:'user supplied',meaning:'직접 등록'}];
 assert.deepEqual(getCards('words','reverse',{words}),[{id:'user-123',left:'직접 등록',right:'user supplied'}]);
});
test('mistakes persist independently by topic and direction; correcting removes only that direction',()=>{
 const state=emptyState();markResult(state,'countries','kr','forward',false);markResult(state,'countries','kr','reverse',false);markResult(state,'words','kr','forward',false);
 markResult(state,'countries','kr','forward',true);
 assert.equal(isMistake(state,'countries','kr','forward'),false);assert.ok(isMistake(state,'countries','kr','reverse'));assert.ok(isMistake(state,'words','kr','forward'));
 markResult(state,'countries','kr','reverse',true);assert.equal(state.mistakes.countries.kr,undefined);
 const storage={value:null,setItem(k,v){this.value=v;},getItem(){return this.value;}};
 assert.ok(saveState(storage,state));assert.deepEqual(loadState(storage).state,state);
 assert.equal(saveState({setItem(){throw Error();}},state),false);
 assert.equal(loadState({getItem(){return '{broken';}}).error,true);
});
test('import validation rejects malformed words, duplicate IDs and invalid directions',()=>{
 const state=validateState({words:[{id:'w1',word:'hi',meaning:'안녕'},{id:'w1',word:'other',meaning:'다름'},{id:'bad id',word:'bad',meaning:'bad'}],mistakes:{words:{w1:['forward','hack','flag']},countries:{kr:['flag','flag']}}});
 assert.equal(state.words.length,1);assert.deepEqual(state.mistakes.words.w1,['forward']);assert.deepEqual(state.mistakes.countries.kr,['flag']);
});

test('backup IDs cannot collide with object prototype keys',()=>{
 const state=validateState(JSON.parse('{"words":[{"id":"constructor","word":"unsafe","meaning":"unsafe"}],"mistakes":{"countries":{"__proto__":["forward"],"toString":["reverse"]}}}'));
 assert.equal(state.words.length,0);assert.equal(Object.keys(state.mistakes.countries).length,0);
 assert.equal(isMistake(state,'countries','toString','forward'),false);
 markResult(state,'words','__proto__','forward',false);assert.equal(Object.keys(state.mistakes.words).length,0);
});
