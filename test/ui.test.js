import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {STORAGE_KEY} from '../storage.js';
const html=await readFile(new URL('../dist/chagok-demo.html',import.meta.url),'utf8');
function setup(seed){
 const errors=[];
 const dom=new JSDOM(html,{url:'http://memory.test/',runScripts:'dangerously',beforeParse(w){if(seed)w.localStorage.setItem(STORAGE_KEY,JSON.stringify(seed));w.confirm=()=>true;w.prompt=()=> '새 이름';w.addEventListener('error',e=>errors.push(e.error));}});
 const d=dom.window.document,click=s=>{const e=d.querySelector(s);assert.ok(e,s);e.click();};
 const change=(s,v)=>{const e=d.querySelector(s);e.value=v;e.dispatchEvent(new dom.window.Event('change'));};
 const submit=(selector,values)=>{const form=d.querySelector(selector);for(const [key,value]of Object.entries(values))form.elements[key].value=value;form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));};
 return {dom,d,click,change,submit,errors};
}
test('all six quizzes hide the answer field and render Korean capitals',()=>{
 const {dom,d,click,change,errors}=setup();click('[data-topic="countries"]');click('[data-mode="test"]');
 assert.equal(d.querySelectorAll('#direction option').length,6);
 for(const direction of ['name-capital','name-flag','capital-name','capital-flag','flag-name','flag-capital']){
  change('#direction',direction);const from=direction.split('-')[0];
  assert.equal(d.querySelectorAll('.answer img').length,0);
  assert.equal(d.querySelectorAll('.question img').length,from==='flag'?195:0);
  if(from==='flag')assert.equal(d.querySelector('.flag-image').alt,'국기 문제');
  if(from==='capital')assert.match(d.querySelector('.question').textContent,/[가-힣]/);
  click('.reveal');assert.equal(d.querySelectorAll('.answer img').length,direction.endsWith('-flag')?1:0);
 }
 assert.deepEqual(errors,[]);dom.window.close();
});
test('red-green grading and review filter stay independent across the six directions',()=>{
 const {dom,d,click,change,errors}=setup();click('[data-topic="countries"]');click('[data-mode="test"]');change('#continent','아시아');
 click('.reveal');click('[data-grade="wrong"]');assert.ok(d.querySelector('#row-0').classList.contains('is-wrong'));
 click('#review');assert.equal(d.querySelectorAll('.learning-row').length,1);
 change('#direction','name-flag');assert.equal(d.querySelectorAll('.learning-row').length,0);
 change('#direction','name-capital');click('.reveal');click('[data-grade="correct"]');assert.ok(d.querySelector('#row-0').classList.contains('is-correct'));click('#reset');assert.equal(d.querySelectorAll('.learning-row').length,0);
 assert.deepEqual(errors,[]);dom.window.close();
});
test('create separate books, add words, isolate reviews, rename and remove only one book',()=>{
 const {dom,d,click,submit,errors}=setup();click('[data-topic="words"]');
 submit('#book-form',{bookName:'텝스'});submit('#book-form',{bookName:'미드 LOST'});assert.equal(d.querySelectorAll('[data-book]').length,2);
 const [teps,lost]=[...d.querySelectorAll('[data-book]')].map(b=>b.dataset.book);
 click(`[data-book="${teps}"]`);submit('#word-form',{word:'remember',meaning:'기억하다'});click('[data-mode="test"]');click('.reveal');click('[data-grade="wrong"]');
 click('#back');click('#back');click(`[data-book="${lost}"]`);assert.equal(d.querySelectorAll('[data-delete]').length,0);
 submit('#word-form',{word:'<img onerror=alert(1)>',meaning:'내 단어'});assert.equal(d.querySelectorAll('.word-items img').length,0);
 click('[data-mode="review"]');assert.equal(d.querySelectorAll('.learning-row').length,0);
 click('#back');click('#back');click(`[data-rename-book="${lost}"]`);assert.ok(d.querySelector('.book-grid').textContent.includes('새 이름'));
 click(`[data-delete-book="${lost}"]`);assert.equal(d.querySelectorAll('[data-book]').length,1);
 const state=JSON.parse(dom.window.localStorage.getItem(STORAGE_KEY));assert.equal(state.words.length,1);assert.equal(Object.keys(state.mistakes.words).length,1);
 click(`[data-book="${teps}"]`);click('[data-mode="review"]');assert.equal(d.querySelectorAll('.learning-row').length,1);
 assert.deepEqual(errors,[]);dom.window.close();
});
test('existing saved words open in a migrated book and retain their review across reload',()=>{
 const seed={words:[{id:'old-word',word:'before',meaning:'이전'}],mistakes:{words:{'old-word':['forward']},countries:{}}};
 const {dom,d,click,errors}=setup(seed);click('[data-topic="words"]');assert.ok(d.querySelector('.book-grid').textContent.includes('기존 단어장'));click('[data-book]');click('[data-mode="review"]');assert.equal(d.querySelectorAll('.learning-row').length,1);click('.reveal');assert.ok(d.querySelector('.answer').textContent.includes('이전'));
 assert.deepEqual(errors,[]);dom.window.close();
});
test('country picker shows seven nations and series change together with the country',()=>{
 const {dom,d,click,change,errors}=setup();click('[data-topic="kings"]');assert.equal(d.querySelectorAll('[data-leader-country]').length,7);
 click('[data-leader-country="미국"]');click('[data-mode="study"]');assert.equal(d.querySelectorAll('.learning-row').length,47);assert.ok(d.querySelector('.learning-list').textContent.includes('조지 워싱턴'));
 change('#leader-country','일본');assert.equal(d.querySelectorAll('.learning-row').length,80);assert.ok(d.querySelector('.learning-list').textContent.includes('1885'));
 change('#leader-country','중국');assert.equal(d.querySelectorAll('#direction option').length,3);assert.ok(d.querySelector('.learning-list').textContent.includes('쑨원'));
 change('#leader-country','한국');change('#direction','대한민국 대통령');assert.equal(d.querySelectorAll('.learning-row').length,14);
 click('#test');assert.equal(d.querySelectorAll('.period').length,0);click('.reveal');assert.equal(d.querySelectorAll('.period').length,1);
 assert.deepEqual(errors,[]);dom.window.close();
});
test('text backup preserves book boundaries when restored',()=>{
 const {dom,d,click,errors}=setup();
 d.querySelector('#backup-text').value=JSON.stringify({books:[{id:'b',name:'텝스'}],words:[{id:'w',word:'one',meaning:'하나',bookId:'b'}],mistakes:{words:{w:['forward']},countries:{}}});click('#restore-text');click('#export');
 assert.ok(d.querySelector('#backup-text').value.includes('텝스'));click('[data-topic="words"]');click('[data-book="b"]');click('[data-mode="review"]');assert.equal(d.querySelectorAll('.learning-row').length,1);
 assert.deepEqual(errors,[]);dom.window.close();
});
