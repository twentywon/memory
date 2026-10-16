const validId=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(id)&&!Object.hasOwn(Object.prototype,id);
export const STORAGE_KEY='chagok.personal.v1';
export function emptyState(){return {words:[],mistakes:{countries:{},words:{}}};}
export function validateState(value){
 const state=emptyState();
 if(!value||typeof value!=='object')return state;
 if(Array.isArray(value.words)){
  const seen=new Set();
  state.words=value.words.filter(w=>w&&validId(w.id)&&typeof w.word==='string'&&typeof w.meaning==='string'&&w.word.trim()&&w.meaning.trim()&&w.word.length<=100&&w.meaning.length<=500&&!seen.has(w.id)&&seen.add(w.id)).map(w=>({id:w.id,word:w.word.trim(),meaning:w.meaning.trim()}));
 }
 for(const topic of ['countries','words']){
  const records=value.mistakes?.[topic];
  if(!records||typeof records!=='object')continue;
  for(const [id,directions] of Object.entries(records)){
   if(!validId(id)||!Array.isArray(directions))continue;
   const valid=[...new Set(directions.filter(d=>['forward','reverse',...(topic==='countries'?['flag']:[])].includes(d)))];
   if(valid.length)state.mistakes[topic][id]=valid;
  }
 }
 return state;
}
export function loadState(storage){
 try{return {state:validateState(JSON.parse(storage.getItem(STORAGE_KEY)||'null')),error:false};}
 catch{return {state:emptyState(),error:true};}
}
export function saveState(storage,state){try{storage.setItem(STORAGE_KEY,JSON.stringify(state));return true;}catch{return false;}}
export function markResult(state,topic,id,direction,correct){
 if(!['countries','words'].includes(topic)||!validId(id))return;
 const previous=state.mistakes[topic][id];
 const remaining=new Set(Array.isArray(previous)?previous:[]);
 if(correct)remaining.delete(direction);else remaining.add(direction);
 if(remaining.size)state.mistakes[topic][id]=[...remaining];else delete state.mistakes[topic][id];
}
export function isMistake(state,topic,id,direction){const record=state.mistakes[topic]?.[id];return Array.isArray(record)&&record.includes(direction);}
