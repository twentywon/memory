import {countries,dynasties,continents,getCards,countryModes,fieldNames,leaderCatalog} from './data.js';
import {loadState,saveState,markResult,isMistake,validateState,emptyState,mergeStates} from './storage.js';
const app=document.querySelector('#app');
let loaded;
try{loaded=loadState(window.localStorage);}catch{loaded={state:emptyState(),error:true};}
let saved=loaded.state,storageError=loaded.error;
const topics={
 countries:{title:'국기와 수도',icon:'◎',tag:'WORLD',description:'대륙을 따라 만나는 세계의 나라와 수도.',color:'green'},
 kings:{title:'왕과 대통령',icon:'♜',tag:'HISTORY',description:'나라를 선택해 살펴보는 왕과 국가 지도자.',color:'orange'},
 words:{title:'나의 영어 단어',icon:'Aa',tag:'LANGUAGE',description:'내가 고른 단어로 만드는 나만의 단어장.',color:'purple'}
};
let topic=null,mode=null,direction='name-capital',dynasty='조선',continent='전체',scope='sovereign',activeBook=null,leaderCountry='한국';
let revealed=new Set(),results=new Map(),cards=[],shuffled=false,review=false;
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function persist(){try{storageError=!saveState(window.localStorage,saved);}catch{storageError=true;}}
function warning(){return storageError?'<p class="storage-warning" role="alert">이 환경에서는 기록을 저장할 수 없습니다. 새로고침 전에 단어·기록을 내보내세요.</p>':'';}
function countLabel(id){return id==='countries'?'195개국 · 전체 250개 국가·지역':id==='kings'?'7개 국가 · 왕과 국가 지도자':`${saved.books.length}개 단어장 · ${saved.words.length}개 단어`;}
function home(){
 topic=null;mode=null;
 app.innerHTML=`<section class="hero"><span class="eyebrow">YOUR PERSONAL MEMORY SPACE</span><h1>오늘은 무엇을<br><span>기억해 볼까요?</span></h1><p>작은 배움이 모여 오래 남는 기억이 됩니다.<br>관심 있는 주제를 골라 시작해 보세요.</p><div class="hero-decoration" aria-hidden="true"><div class="paper paper-back"></div><div class="paper paper-front"><span>✦</span><i></i><i></i><i></i><small>하루 한 장의 배움</small></div><b>✧</b></div></section>${warning()}<div class="section-heading"><h2>나의 학습 주제 <span>03</span></h2><span>나만의 속도로 시작하세요</span></div><section class="topics">${Object.entries(topics).map(([id,t])=>`<button class="topic-card ${t.color}" data-topic="${id}"><div class="card-top"><span class="topic-icon">${t.icon}</span><span class="tag">${t.tag}</span></div><h3>${t.title}</h3><p>${t.description}</p><div class="card-bottom"><span>${countLabel(id)}</span><span class="arrow">↗</span></div></button>`).join('')}</section><aside class="tip"><span>✦</span><div><strong>틀린 문제를 다시 만나 보세요</strong><p>정답을 확인한 뒤 맞음·틀림을 표시하면, 틀린 항목만 오답노트에서 다시 풀 수 있어요.</p></div></aside><div class="backup"><button id="export">단어·오답 기록 내보내기</button><label class="import-label">기록 가져오기<input type="file" id="import" accept="application/json,.json"></label><p>기록은 이 기기의 브라우저 또는 앱에 저장됩니다. 다른 기기로 옮길 때는 내보내기를 사용하세요.</p><details id="backup-tools" class="backup-tools"><summary>텍스트로 백업·복원</summary><label for="backup-text">백업 JSON (복사해 보관하거나 붙여 넣어 복원하세요)</label><textarea id="backup-text" spellcheck="false"></textarea><button id="restore-text">붙여 넣은 기록 합치기</button></details><p id="backup-status" role="status"></p></div>`;
 app.querySelectorAll('[data-topic]').forEach(b=>b.onclick=()=>openTopic(b.dataset.topic));
 document.querySelector('#export').onclick=()=>{
  document.querySelector('#backup-tools').open=true;
  const field=document.querySelector('#backup-text');field.value=JSON.stringify(saved,null,2);field.focus();field.select();
  document.querySelector('#backup-status').textContent='백업 내용을 복사해 텍스트 파일에 보관하세요. Android 앱에서도 사용할 수 있습니다.';
 };
 document.querySelector('#restore-text').onclick=()=>restoreBackup(document.querySelector('#backup-text').value);
 document.querySelector('#import').onchange=async e=>{
  const file=e.target.files[0];if(!file)return;
  if(file.size>5_000_000){document.querySelector('#backup-status').textContent='파일이 너무 큽니다.';return;}
  try{restoreBackup(await file.text());}catch{document.querySelector('#backup-status').textContent='파일을 읽지 못했습니다.';}
 };
}
function restoreBackup(text){
 try{
  if(text.length>5_000_000)throw new Error('백업이 너무 큽니다.');
  const raw=JSON.parse(text);
  if(!Array.isArray(raw.words)||!raw.mistakes)throw new Error('차곡 백업 데이터를 넣어 주세요.');
  saved=mergeStates(saved,raw,newId);
  persist();home();document.querySelector('#backup-status').textContent='기존 기록을 유지하며 백업을 합쳤습니다.';
 }catch(err){document.querySelector('#backup-status').textContent=err.message||'파일을 읽지 못했습니다.';}
}
function openTopic(id){
 if(id==='words'){activeBook=null;showBooks();}else if(id==='kings')showLeaderCountries();else choose(id);
}
function currentBook(){return saved.books.find(b=>b.id===activeBook);}
function title(){return topic==='words'?(currentBook()?.name||'나의 영어 단어'):topic==='kings'?`왕과 대통령 · ${leaderCountry}`:topics[topic].title;}
function showBooks(message=''){
 topic='words';mode=null;
 app.innerHTML=`<button class="back" id="back">← 모든 주제</button>${warning()}<section class="intro"><span class="eyebrow">MY WORDBOOKS</span><h1>나의 영어 단어장</h1><p>텝스도, 좋아하는 드라마도. 목적에 맞는 단어장을 만들어 보세요.</p></section><section class="word-editor"><form id="book-form"><label>새 단어장 이름<input name="bookName" maxlength="100" required placeholder="예: 텝스 단어장, 미드 LOST"></label><button class="primary" type="submit">단어장 만들기</button></form><p id="book-message" role="status">${escape(message)}</p></section><section class="book-grid">${saved.books.map(b=>`<article class="book-card"><button class="book-open" data-book="${escape(b.id)}"><span class="topic-icon purple">Aa</span><h2>${escape(b.name)}</h2><p>${saved.words.filter(w=>w.bookId===b.id).length}개 단어 · 공부 / 테스트 / 오답노트</p></button><div class="book-actions"><button data-rename-book="${escape(b.id)}">이름 변경</button><button data-delete-book="${escape(b.id)}">삭제</button></div></article>`).join('')||'<div class="empty-state"><strong>첫 단어장을 만들어 보세요.</strong><p>단어는 단어장 안에서 직접 추가할 수 있어요.</p></div>'}</section>`;
 document.querySelector('#back').onclick=home;
 document.querySelector('#book-form').onsubmit=e=>{
  e.preventDefault();const name=e.currentTarget.elements.bookName.value.trim();
  if(!name)return;
  if(saved.books.some(b=>b.name.toLowerCase()===name.toLowerCase())){document.querySelector('#book-message').textContent='이미 같은 이름의 단어장이 있어요.';return;}
  saved.books.push({id:newId(),name});persist();showBooks('단어장을 만들었어요. 단어장을 선택해 단어를 추가하세요.');
 };
 app.querySelectorAll('[data-book]').forEach(b=>b.onclick=()=>{activeBook=b.dataset.book;choose('words');});
 app.querySelectorAll('[data-rename-book]').forEach(b=>b.onclick=()=>{
  const book=saved.books.find(x=>x.id===b.dataset.renameBook),name=window.prompt('새 단어장 이름',book.name)?.trim();
  if(!name)return;if(name.length>100||saved.books.some(x=>x.id!==book.id&&x.name.toLowerCase()===name.toLowerCase())){showBooks('100자 이내의 겹치지 않는 이름을 입력해 주세요.');return;}
  book.name=name;persist();showBooks('이름을 변경했어요.');
 });
 app.querySelectorAll('[data-delete-book]').forEach(b=>b.onclick=()=>{
  if(!window.confirm('이 단어장에 담긴 단어와 오답 기록도 함께 삭제할까요?'))return;
  const id=b.dataset.deleteBook;for(const w of saved.words.filter(w=>w.bookId===id))delete saved.mistakes.words[w.id];
  saved.words=saved.words.filter(w=>w.bookId!==id);saved.books=saved.books.filter(book=>book.id!==id);persist();showBooks('단어장을 삭제했어요.');
 });
}
function showLeaderCountries(){
 topic='kings';mode=null;
 app.innerHTML=`<button class="back" id="back">← 모든 주제</button><section class="intro"><span class="eyebrow">WORLD LEADERS</span><h1>어느 나라를 살펴볼까요?</h1><p>나라별 시대와 직책에 맞춰 왕과 국가 지도자를 공부하세요.</p></section><section class="book-grid">${Object.entries(leaderCatalog).map(([country,entry])=>`<article class="book-card"><button class="book-open" data-leader-country="${country}"><h2>${country}</h2><p>${entry.groups.join(' · ')}</p><small>${entry.groups.reduce((n,g)=>n+dynasties[g].length,0)}개 재임 항목</small></button></article>`).join('')}</section>`;
 document.querySelector('#back').onclick=home;
 app.querySelectorAll('[data-leader-country]').forEach(b=>b.onclick=()=>{leaderCountry=b.dataset.leaderCountry;dynasty=leaderCatalog[leaderCountry].groups[0];choose('kings');});
}
function choose(id){
 topic=id;mode=null;review=false;const t=topics[id];if(id==='words'&&!currentBook()){showBooks();return;}
 app.innerHTML=`<button class="back" id="back">← 모든 주제</button>${warning()}<section class="intro"><span class="topic-icon ${t.color}">${t.icon}</span><span class="eyebrow">${t.tag}</span><h1>${escape(title())}</h1><p>어떤 방식으로 기억을 쌓아 볼까요?</p></section><section class="modes ${id!=='kings'?'three-modes':''}"><button data-mode="study"><span class="mode-symbol">▤</span><h2>공부하기 <span>→</span></h2><p>${id==='kings'?'순서와 재임 기간을 함께 살펴보세요.':'질문과 답을 나란히 보며 익혀 보세요.'}</p><small>차근차근 알아가기</small></button><button data-mode="test"><span class="mode-symbol">✧</span><h2>테스트하기 <span>→</span></h2><p>정답을 하나씩 확인하고 기억을 점검하세요.</p><small>기억 꺼내 보기</small></button>${id!=='kings'?`<button data-mode="review"><span class="mode-symbol">↺</span><h2>오답노트 <span>→</span></h2><p>틀림으로 표시했던 문제만 다시 풀어 보세요.</p><small>방향별 기록 · ${(id==='words'?saved.words.filter(w=>w.bookId===activeBook&&saved.mistakes.words[w.id]).length:Object.keys(saved.mistakes[id]).length)}개 항목</small></button>`:''}</section>${id==='words'?wordEditor():''}`;
 document.querySelector('#back').onclick=()=>id==='words'?showBooks():id==='kings'?showLeaderCountries():home();
 app.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{review=b.dataset.mode==='review';mode=review?'test':b.dataset.mode;direction=topic==='countries'?'name-capital':'forward';shuffled=false;reset();render();});
 if(id==='words')bindWordEditor();
}
function newId(){return globalThis.crypto?.randomUUID?.()||`w-${Date.now()}-${Math.random().toString(36).slice(2)}`;}
function wordEditor(){return `<section class="word-editor"><h2>내 단어 등록 <span>${saved.words.filter(w=>w.bookId===activeBook).length}개</span></h2><form id="word-form"><label>영어 단어<input name="word" required maxlength="100" placeholder="예: 내가 외울 단어" autocomplete="off"></label><label>뜻<input name="meaning" required maxlength="500" placeholder="기억하고 싶은 뜻" autocomplete="off"></label><button type="submit" class="primary">단어 추가</button></form><p id="word-message" role="status"></p><div class="word-items">${saved.words.filter(w=>w.bookId===activeBook).map(w=>`<div><strong>${escape(w.word)}</strong><span>${escape(w.meaning)}</span><button data-delete="${escape(w.id)}" aria-label="${escape(w.word)} 삭제">삭제</button></div>`).join('')}</div><p class="muted">기본 단어는 제공하지 않아요. 직접 등록한 단어만 공부하고 테스트합니다.</p></section>`;}
function bindWordEditor(){
 const form=document.querySelector('#word-form');
 form.onsubmit=e=>{
  e.preventDefault();const word=form.elements.word.value.trim(),meaning=form.elements.meaning.value.trim();
  if(!word||!meaning){document.querySelector('#word-message').textContent='단어와 뜻을 모두 입력해 주세요.';return;}
  if(saved.words.some(w=>w.bookId===activeBook&&w.word.toLowerCase()===word.toLowerCase()&&w.meaning===meaning)){document.querySelector('#word-message').textContent='이미 같은 단어와 뜻이 등록되어 있어요.';return;}
  saved.words.push({id:newId(),word,meaning,bookId:activeBook});persist();choose('words');document.querySelector('#word-message').textContent=`${word} 등록 완료`;document.querySelector('[name=word]').focus();
 };
 app.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>{
  if(!window.confirm('이 단어와 해당 오답 기록을 삭제할까요?'))return;
  saved.words=saved.words.filter(w=>w.id!==b.dataset.delete);delete saved.mistakes.words[b.dataset.delete];persist();choose('words');
 });
}
function reset(){
 revealed.clear();results.clear();
 cards=getCards(topic,direction,{dynasty,continent,scope,words:saved.words,bookId:activeBook,test:mode==='test'});
 if(review)cards=cards.filter(c=>isMistake(saved,topic,c.id,direction));
 if(shuffled)for(let i=cards.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[cards[i],cards[j]]=[cards[j],cards[i]];}
}
function options(values,selected){return values.map(([value,label])=>`<option value="${escape(value)}" ${value===selected?'selected':''}>${escape(label)}</option>`).join('');}
function directionOptions(){return options(topic==='countries'?countryModes:[['forward','영어 → 한국어'],['reverse','한국어 → 영어']],direction);}
function flag(c,side){
 if(!c.flag||c.flagSide!==side)return '';
 // A flag-only question must not expose its answer to assistive technology.
 const alt=side==='left'?'국기 문제':`${c.countryName} 국기`;
 const src=window.MEMORY_FLAGS?.[c.id]||c.flag;
 return `<img class="flag-image" src="${escape(src)}" alt="${escape(alt)}" width="56" height="38" loading="lazy">`;
}
function answerHTML(c,i){
 if(mode==='test'&&!revealed.has(c.id))return `<button class="reveal" data-index="${i}" aria-label="${i+1}번 정답 보기">정답 보기 <span>＋</span></button>`;
 return `<div class="answer-text">${flag(c,'right')}<span>${escape(c.right)}</span>${c.period?`<small class="period">${escape(c.period)}</small>`:''}</div>${mode==='test'&&topic!=='kings'?`<div class="grade-actions" role="group" aria-label="${i+1}번 자기 채점"><button class="grade correct ${results.get(c.id)===true?'selected':''}" data-grade="correct" data-index="${i}" aria-pressed="${results.get(c.id)===true}">✓ 맞음</button><button class="grade wrong ${results.get(c.id)===false?'selected':''}" data-grade="wrong" data-index="${i}" aria-pressed="${results.get(c.id)===false}">✕ 틀림</button></div>`:''}`;
}
function summary(){
 if(mode!=='test')return '';
 const right=[...results.values()].filter(Boolean).length,wrong=results.size-right;
 return `<div class="progress-label"><span>정답 공개 ${revealed.size} / ${cards.length}${topic!=='kings'?` · <span class="right-count">맞음 ${right}</span> · <span class="wrong-count">틀림 ${wrong}</span> · 미채점 ${cards.length-results.size}`:''}</span></div><div class="progress-track"><div style="width:${cards.length?revealed.size/cards.length*100:0}%"></div></div>`;
}
function render(){
 const t=topics[topic],test=mode==='test',gradable=topic!=='kings';
 app.innerHTML=`<button class="back" id="back">← 학습 방식 선택</button>${warning()}<div class="workspace-title"><div><span class="eyebrow">${t.tag}${review?' / REVIEW':''}</span><h1>${escape(title())}${review?' <small>오답노트</small>':''}</h1></div><div class="segmented"><button id="study" class="${!test?'active':''}">공부</button><button id="test" class="${test&&!review?'active':''}">테스트</button>${gradable?`<button id="review" class="${review?'active':''}">오답</button>`:''}</div></div><p class="workspace-description">${review?'선택한 방향·범위에서 틀린 문제만 다시 풉니다. 맞음으로 표시하면 해당 방향의 오답노트에서 빠집니다.':test?gradable?'답을 떠올린 뒤 정답을 확인하고, 맞음(초록) 또는 틀림(빨강)을 표시하세요.':'이름을 떠올리고 정답과 재임 기간을 확인하세요.':'질문과 답을 연결하며 천천히 익혀 보세요.'}</p><div class="toolbar"><div class="filters">${topic==='countries'?`<label>범위 <select id="scope">${options([['sovereign','195개국'],['all','국가·지역 전체 (250)']],scope)}</select></label><label>대륙 <select id="continent">${options(['전체',...continents].map(c=>[c,c]),continent)}</select></label>`:''}${topic==='kings'?`<label>국가 <select id="leader-country">${options(Object.keys(leaderCatalog).map(c=>[c,c]),leaderCountry)}</select></label>`:''}<label>${topic==='kings'?'시대·직책':'학습 방향'} <select id="direction">${topic==='kings'?options(leaderCatalog[leaderCountry].groups.map(k=>[k,k]),dynasty):directionOptions()}</select></label></div><div class="toolbar-actions">${!(topic==='kings'&&!test)?`<button id="shuffle">⇄ ${shuffled?'순서대로':'섞기'}</button>`:''}${test?'<button id="reset">↺ 다시 시작</button>':''}</div></div>${topic==='countries'?'<p class="data-note">수도명은 한글 표기입니다. 국기·국가명·수도 중 하나를 보고 하나만 맞힙니다. 중앙아메리카·카리브해는 북아메리카에 포함합니다. 수도가 없는 지역은 수도를 포함한 테스트에서 제외됩니다.</p>':''}${topic==='kings'?`<p class="data-note">${escape(leaderCatalog[leaderCountry].note)} 해외 목록은 2025년 취임 인물까지의 고정 학습 자료입니다. 끝 연도가 빈 항목은 종료일 미수록이며 실시간 현직 정보가 아닙니다. ‘재임 순서’는 공식 내각 대수가 아닙니다. <a href="${leaderCatalog[leaderCountry].source}" target="_blank" rel="noopener">참고자료</a></p>`:''}<div id="summary" aria-live="polite">${summary()}</div><div class="list-header"><span>${topic==='countries'?fieldNames[direction.split('-')[0]]:topic==='kings'?'시대 · 순서':direction==='reverse'?'한국어 뜻':'영어 단어'}</span><span>${topic==='countries'?fieldNames[direction.split('-')[1]]:topic==='kings'?'이름 · 재임 기간':direction==='reverse'?'영어 단어':'한국어 뜻'}</span></div><section class="learning-list">${cards.length?cards.map((c,i)=>`<div class="learning-row" id="row-${i}"><div class="question"><span class="row-number">${String(i+1).padStart(2,'0')}</span>${flag(c,'left')}<span>${escape(c.left)}</span></div><div class="answer" id="answer-${i}">${answerHTML(c,i)}</div></div>`).join(''):`<div class="empty-state"><strong>${review?'이 방향·범위에 남아 있는 오답이 없어요.':topic==='words'?'아직 등록한 단어가 없어요.':'선택한 범위에 항목이 없어요.'}</strong><p>${review?'다른 학습 방향·대륙을 선택하거나 일반 테스트를 풀어 보세요.':topic==='words'?'학습 방식 선택으로 돌아가 첫 단어를 추가해 주세요.':'다른 대륙이나 범위를 선택해 주세요.'}</p></div>`}</section><p class="end-note">${test&&gradable?'정답 공개만으로는 채점되지 않습니다. 맞음·틀림을 직접 표시해 주세요.':'오늘의 배움이 차곡차곡 쌓이고 있어요.'}</p><div id="completion" role="status"></div><details class="sources"><summary>데이터 출처와 수록 기준</summary><p>국가·수도·대륙: <a href="https://github.com/mledoze/countries" target="_blank" rel="noopener">mledoze/countries (ODbL)</a> · 국기: <a href="https://github.com/hampusborgos/country-flags" target="_blank" rel="noopener">country-flags SVG</a>. 유엔 회원국 193개 + 바티칸·팔레스타인 = 195개국. 전체 범위는 비주권 지역 등을 포함한 250개 항목입니다. 복수 수도는 모두 표시하며 원본 영문에 대응하는 한글 표기를 사용합니다.</p><p>역사·지도자: <a href="https://ko.wikipedia.org/wiki/한국의_군주_목록" target="_blank" rel="noopener">한국의 군주 목록</a>, <a href="https://encykorea.aks.ac.kr/" target="_blank" rel="noopener">한국민족문화대백과</a>, <a href="https://www.pa.go.kr/contents/president/president01.jsp" target="_blank" rel="noopener">대통령기록관</a> 참고 정리. 한국 왕조·대통령과 6개국의 선택된 시대 지도자를 수록합니다. 국가별 참고자료와 범위는 상단에 표시됩니다. 상세 출처·라이선스는 프로젝트 datasets/SOURCES.md에 있습니다.</p></details>`;
 document.querySelector('#back').onclick=()=>choose(topic);
 for(const m of ['study','test','review']){const b=document.querySelector('#'+m);if(b)b.onclick=()=>{review=m==='review';mode=m==='study'?'study':'test';reset();render();};}
 const countrySelect=document.querySelector('#leader-country');if(countrySelect)countrySelect.onchange=e=>{leaderCountry=e.target.value;dynasty=leaderCatalog[leaderCountry].groups[0];reset();render();};
 document.querySelector('#direction').onchange=e=>{if(topic==='kings')dynasty=e.target.value;else direction=e.target.value;reset();render();};
 for(const id of ['scope','continent']){const el=document.querySelector('#'+id);if(el)el.onchange=e=>{if(id==='scope')scope=e.target.value;else continent=e.target.value;reset();render();};}
 const shuffle=document.querySelector('#shuffle');if(shuffle)shuffle.onclick=()=>{shuffled=!shuffled;reset();render();};
 const restart=document.querySelector('#reset');if(restart)restart.onclick=()=>{reset();render();};
 bindAnswers();
}
function bindAnswers(){
 app.querySelectorAll('.reveal').forEach(b=>b.onclick=()=>{
  const i=Number(b.dataset.index);revealed.add(cards[i].id);document.querySelector('#answer-'+i).innerHTML=answerHTML(cards[i],i);bindGrades();refreshProgress();
 });bindGrades();
}
function bindGrades(){app.querySelectorAll('[data-grade]').forEach(b=>b.onclick=()=>{
 const i=Number(b.dataset.index),c=cards[i],correct=b.dataset.grade==='correct';
 if(!revealed.has(c.id))return;
 results.set(c.id,correct);markResult(saved,topic,c.id,direction,correct);persist();
 const row=document.querySelector('#row-'+i);row.classList.toggle('is-correct',correct);row.classList.toggle('is-wrong',!correct);
 document.querySelector('#answer-'+i).innerHTML=answerHTML(c,i);bindGrades();refreshProgress();
 if(storageError&&!app.querySelector('.storage-warning'))app.insertAdjacentHTML('afterbegin',warning());
 });}
function refreshProgress(){
 document.querySelector('#summary').innerHTML=summary();
 document.querySelector('#completion').textContent=cards.length&&(topic==='kings'?revealed.size:results.size)===cards.length?'모두 확인했어요. 다시 시작하거나 오답노트에서 복습해 보세요.':'';
}
document.querySelector('.brand').onclick=e=>{e.preventDefault();home();};home();
