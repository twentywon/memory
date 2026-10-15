import test from 'node:test';
import assert from 'node:assert/strict';
import {countries,words,dynasties,getCards} from '../data.js';
test('country directions preserve country and capital associations',()=>{
 for(const [i,[flag,name,capital]] of countries.entries()){
 assert.equal(getCards('countries','forward')[i].right,capital);
 assert.equal(getCards('countries','reverse')[i].left,capital);
 assert.equal(getCards('countries','reverse')[i].right,`${flag} ${name}`);
 assert.equal(getCards('countries','flag')[i].left,flag);
 assert.equal(getCards('countries','flag')[i].right,`${name} · ${capital}`);
 }
});
test('word reverse mode swaps prompts and answers',()=>{
 for(const [i,[english,korean]] of words.entries()){
 assert.equal(getCards('words','forward')[i].left,english);
 assert.equal(getCards('words','reverse')[i].left,korean);
 assert.equal(getCards('words','reverse')[i].right,english);
 }
});
test('king lists have full expected lengths, stable IDs and sequence labels',()=>{
 const expected={'고구려':28,'백제':31,'신라':56,'고려':34,'조선':27};
 for(const [name,length] of Object.entries(expected)){
 const cards=getCards('kings','forward',name);
 assert.equal(dynasties[name].length,length);
 assert.equal(new Set(cards.map(c=>c.id)).size,length);
 assert.equal(cards.at(-1).left,`${name} ${length}대`);
 assert.ok(cards.every(c=>c.left&&c.right));
 }
});
