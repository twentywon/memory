import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {STORAGE_KEY} from '../storage.js';
const html=await readFile(new URL('../dist/chagok-demo.html',import.meta.url),'utf8');
function setup(seed){
 const errors=[];
 const dom=new JSDOM(html,{url:'http://memory.test/',runScripts:'dangerously',beforeParse(w){if(seed)w.localStorage.setItem(STORAGE_KEY,JSON.stringify(seed));w.confirm=()=>true;w.addEventListener('error',e=>errors.push(e.error));}});
 const d=dom.window.document;
 const click=s=>{const e=d.querySelector(s);assert.ok(e,s);e.click();};
 const change=(selector,value)=>{const e=d.querySelector(selector);e.value=value;e.dispatchEvent(new dom.window.Event('change'));};
 return {dom,d,click,change,errors};
}
test('countries filter, reveal, red/green grading and only-wrong retesting survive restart',()=>{
 const x=setup();const {d,click,change}=x;
 click('[data-topic="countries"]');click('[data-mode="test"]');assert.equal(d.querySelectorAll('.learning-row').length,195);
 change('#continent','아시아');assert.ok(d.querySelectorAll('.learning-row').length<195);
 const first=d.querySelector('.question').textContent;
 click('.reveal');click('[data-grade="wrong"]');assert.ok(d.querySelector('#row-0').classList.contains('is-wrong'));
 click('#review');assert.equal(d.querySelectorAll('.learning-row').length,1);assert.equal(d.querySelector('.question').textContent,first);
 assert.equal(d.querySelectorAll('[data-grade]').length,0);
 click('.reveal');click('[data-grade="correct"]');assert.ok(d.querySelector('#row-0').classList.contains('is-correct'));
 click('#reset');assert.equal(d.querySelectorAll('.learning-row').length,0);
 const state=JSON.parse(x.dom.window.localStorage.getItem(STORAGE_KEY));assert.deepEqual(state.mistakes.countries,{});
 assert.deepEqual(x.errors,[]);x.dom.window.close();
});
test('custom words only, escaped rendering, saved records, separate word notebook and deletion',()=>{
 let x=setup();let {d,click}=x;
 click('[data-topic="words"]');click('[data-mode="study"]');assert.equal(d.querySelectorAll('.learning-row').length,0);click('#back');
 const value='<img src=x onerror="alert(1)">';
 d.querySelector('[name=word]').value=value;d.querySelector('[name=meaning]').value='내 단어';
 d.querySelector('#word-form').dispatchEvent(new x.dom.window.Event('submit',{bubbles:true,cancelable:true}));
 assert.equal(d.querySelectorAll('.word-items img').length,0);assert.ok(d.querySelector('.word-items').textContent.includes(value));
 click('[data-mode="test"]');click('.reveal');click('[data-grade="wrong"]');
 const state=JSON.parse(x.dom.window.localStorage.getItem(STORAGE_KEY));assert.equal(state.words.length,1);assert.equal(Object.keys(state.mistakes.words).length,1);assert.equal(Object.keys(state.mistakes.countries).length,0);
 x.dom.window.close();x=setup(state);({d,click}=x);
 click('[data-topic="words"]');click('[data-mode="review"]');assert.equal(d.querySelectorAll('.learning-row').length,1);assert.equal(d.querySelectorAll('.learning-row img').length,0);
 click('.reveal');click('[data-grade="correct"]');click('#reset');assert.equal(d.querySelectorAll('.learning-row').length,0);
 click('#back');click('[data-delete]');assert.equal(d.querySelectorAll('[data-delete]').length,0);
 assert.deepEqual(x.errors,[]);x.dom.window.close();
});
test('reversed country flags stay hidden until reveal and flag prompts do not leak names in alt',()=>{
 const {dom,d,click,change,errors}=setup();click('[data-topic="countries"]');click('[data-mode="test"]');
 change('#direction','reverse');assert.equal(d.querySelectorAll('.learning-row img').length,0);click('.reveal');assert.equal(d.querySelectorAll('.learning-row img').length,1);
 change('#direction','flag');assert.equal(d.querySelector('.flag-image').alt,'국기 문제');assert.ok(d.querySelector('.flag-image').src.startsWith('data:image/svg+xml;base64,'));
 assert.deepEqual(errors,[]);dom.window.close();
});
test('presidents include tenure and kings have no invented word-style grading',()=>{
 const {dom,d,click,change,errors}=setup();click('[data-topic="kings"]');click('[data-mode="study"]');change('#direction','대한민국 대통령');
 assert.equal(d.querySelectorAll('.learning-row').length,14);assert.ok(d.querySelector('.learning-list').textContent.includes('1948.07.24'));
 click('#test');assert.equal(d.querySelectorAll('.period').length,0);click('.reveal');assert.equal(d.querySelectorAll('.period').length,1);assert.equal(d.querySelectorAll('[data-grade]').length,0);
 assert.deepEqual(errors,[]);dom.window.close();
});
test('text backup merges without replacing existing user words',()=>{
 const {dom,d,click,errors}=setup();
 d.querySelector('#backup-text').value=JSON.stringify({words:[{id:'w1',word:'one',meaning:'하나'}],mistakes:{words:{w1:['forward']},countries:{kr:['forward']}}});
 click('#restore-text');click('#export');assert.ok(d.querySelector('#backup-text').value.includes('one'));
 d.querySelector('#backup-text').value=JSON.stringify({words:[{id:'w2',word:'two',meaning:'둘'}],mistakes:{words:{},countries:{}}});click('#restore-text');
 const state=JSON.parse(dom.window.localStorage.getItem(STORAGE_KEY));assert.equal(state.words.length,2);assert.ok(state.mistakes.countries.kr);
 assert.deepEqual(errors,[]);dom.window.close();
});
