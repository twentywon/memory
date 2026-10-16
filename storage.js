const validId=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(id)&&!Object.hasOwn(Object.prototype,id);
export const STORAGE_KEY='chagok.personal.v1'; // Keep the key so existing installations migrate in place.
export const countryDirections=['name-capital','name-flag','capital-name','capital-flag','flag-name','flag-capital'];
const legacyDirections={forward:['name-capital'],reverse:['capital-name','capital-flag'],flag:['flag-name','flag-capital']};
export function emptyState(){return {schemaVersion:2,books:[],words:[],mistakes:{countries:{},words:{}}};}
export function validateState(value){
 const state=emptyState();if(!value||typeof value!=='object')return state;
 const bookIds=new Set();
 if(Array.isArray(value.books))state.books=value.books.filter(b=>b&&validId(b.id)&&typeof b.name==='string'&&b.name.trim()&&b.name.length<=100&&!bookIds.has(b.id)&&bookIds.add(b.id)).map(b=>({id:b.id,name:b.name.trim()}));
 if(Array.isArray(value.words)){
  const seen=new Set();
  for(const w of value.words){
   if(!w||!validId(w.id)||typeof w.word!=='string'||typeof w.meaning!=='string'||!w.word.trim()||!w.meaning.trim()||w.word.length>100||w.meaning.length>500||seen.has(w.id))continue;
   seen.add(w.id);let bookId=bookIds.has(w.bookId)?w.bookId:'legacy-default';
   if(!bookIds.has(bookId)){state.books.push({id:bookId,name:'기존 단어장'});bookIds.add(bookId);}
   state.words.push({id:w.id,word:w.word.trim(),meaning:w.meaning.trim(),bookId});
  }
 }
 for(const topic of ['countries','words']){
  const records=value.mistakes?.[topic];if(!records||typeof records!=='object')continue;
  for(const [id,dirs]of Object.entries(records)){
   if(!validId(id)||!Array.isArray(dirs))continue;
   const valid=[...new Set(dirs.flatMap(d=>typeof d!=='string'?[]:topic==='countries'?(countryDirections.includes(d)?[d]:Object.hasOwn(legacyDirections,d)?legacyDirections[d]:[]):['forward','reverse'].includes(d)?[d]:[]))];
   if(valid.length)state.mistakes[topic][id]=valid;
  }
 }
 return state;
}
export function loadState(storage){try{return {state:validateState(JSON.parse(storage.getItem(STORAGE_KEY)||'null')),error:false};}catch{return {state:emptyState(),error:true};}}
export function saveState(storage,state){try{storage.setItem(STORAGE_KEY,JSON.stringify(state));return true;}catch{return false;}}
export function markResult(state,topic,id,direction,correct){
 if(!['countries','words'].includes(topic)||!validId(id))return;
 const previous=state.mistakes[topic][id],remaining=new Set(Array.isArray(previous)?previous:[]);
 if(correct)remaining.delete(direction);else remaining.add(direction);
 if(remaining.size)state.mistakes[topic][id]=[...remaining];else delete state.mistakes[topic][id];
}
export function isMistake(state,topic,id,direction){const record=state.mistakes[topic]?.[id];return Array.isArray(record)&&record.includes(direction);}
export function mergeStates(current,incoming,newId){
 const merged=validateState(current),other=validateState(incoming);
 const books=new Map(merged.books.map(b=>[b.id,b])),words=new Map(merged.words.map(w=>[w.id,w])),remap=new Map();
 for(const book of other.books){
  const existing=books.get(book.id);const id=existing&&existing.name!==book.name?newId():book.id;
  remap.set(book.id,id);books.set(id,{...book,id});
 }
 for(const word of other.words){
  const mapped={...word,bookId:remap.get(word.bookId)||word.bookId};
  const existing=words.get(word.id);
  if(existing&&(existing.word!==mapped.word||existing.meaning!==mapped.meaning||existing.bookId!==mapped.bookId)){
   const id=newId();other.mistakes.words[id]=other.mistakes.words[word.id]||[];delete other.mistakes.words[word.id];mapped.id=id;
  }
  words.set(mapped.id,mapped);
 }
 merged.books=[...books.values()];merged.words=[...words.values()];
 for(const t of ['countries','words'])for(const [id,dirs]of Object.entries(other.mistakes[t]))merged.mistakes[t][id]=[...new Set([...(merged.mistakes[t][id]||[]),...dirs])];
 return merged;
}
