import mapData from './datasets/region-maps.js';
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shortNames={'서울특별시':'서울','부산광역시':'부산','대구광역시':'대구','인천광역시':'인천','광주광역시':'광주','대전광역시':'대전','울산광역시':'울산','세종특별자치시':'세종','경기도':'경기','강원특별자치도':'강원','충청북도':'충북','충청남도':'충남','전북특별자치도':'전북','전라남도':'전남','경상북도':'경북','경상남도':'경남','제주특별자치도':'제주'};
export function mapMarkup(provinceId){
 const data=provinceId?mapData.regions[provinceId]:mapData.nation;
 return `<button class="back" id="back">← ${provinceId?'대한민국 전체 지도':'이전 화면'}</button><section class="intro"><span class="eyebrow">KOREA · MAP</span><h1>${esc(data.name||'대한민국 행정구역 지도')}</h1><p>${provinceId?'시·군·구를 눌러 이름과 위치를 확인하세요.':'도·광역시를 누르면 해당 지역의 상세 지도로 이동합니다.'}</p></section><div class="map-controls"><button id="map-zoom-in" aria-label="지도 확대">＋ 확대</button><button id="map-zoom-out" aria-label="지도 축소">− 축소</button><button id="map-reset">처음 크기</button><label><input type="checkbox" id="map-labels" checked> 이름 표시</label></div><p class="data-note">확대·축소 버튼을 사용하고 지도를 끌어 이동할 수 있어요. 작은 지역은 아래 목록에서도 선택할 수 있습니다.</p><div id="map-detail" class="element-detail" aria-live="polite">${provinceId?`${esc(data.name)} · ${data.features.length}개 시·군·구 경계`:'17개 시·도를 선택해 보세요.'}</div><div class="map-canvas"><svg id="korea-map" viewBox="0 0 ${data.width} ${data.height}" role="group" aria-label="${esc(data.name||'대한민국')} 행정경계 지도">${data.features.map((f,i)=>`<path class="map-region map-color-${i%6}" data-map-id="${f.id}" d="${f.d}" fill-rule="evenodd" vector-effect="non-scaling-stroke" role="button" tabindex="0" aria-label="${esc(f.name)}"><title>${esc(f.name)}</title></path>`).join('')}<g class="map-labels" aria-hidden="true">${data.features.map(f=>`<text x="${f.x}" y="${f.y}" text-anchor="middle" dominant-baseline="central">${esc(provinceId?f.name:shortNames[f.name]||f.name)}</text>`).join('')}</g></svg></div><section class="map-list" aria-label="${provinceId?'시군구':'시도'} 목록">${data.features.map(f=>`<button data-map-list="${f.id}">${esc(f.name)}</button>`).join('')}</section><p class="map-snapshot">경계 기준: <strong>2026.04.01</strong>. ${provinceId==='28'?'인천은 2026년 7월 개편 이전 경계입니다. 퀴즈의 제물포구·영종구·검단구 목록과 다릅니다.':'이후 행정구역 변경은 지도에 반영되지 않을 수 있습니다.'}</p><p class="data-note">출처: 통계청 통계지리정보서비스(SGIS), 공공누리 제1유형 · <a href="https://github.com/vuski/admdongkor" target="_blank" rel="noopener">vuski/admdongkor</a>, CC BY 4.0. 행정동 경계를 시·군·구 및 시·도로 합치고 화면용으로 단순화했습니다. 학습용 지도이며 측량·법적 경계 확인용이 아닙니다.</p>`;
}
export function bindMap(container,provinceId,onProvince){
 const data=provinceId?mapData.regions[provinceId]:mapData.nation,svg=container.querySelector('#korea-map');
 let box={x:0,y:0,w:data.width,h:data.height},drag=null;
 const paint=()=>svg.setAttribute('viewBox',`${box.x} ${box.y} ${box.w} ${box.h}`);
 const clamp=()=>{box.x=Math.max(0,Math.min(data.width-box.w,box.x));box.y=Math.max(0,Math.min(data.height-box.h,box.y));paint();};
 function zoom(factor){
  const w=Math.max(data.width/10,Math.min(data.width,box.w/factor)),h=w*data.height/data.width;
  box={x:box.x+(box.w-w)/2,y:box.y+(box.h-h)/2,w,h};clamp();
 }
 function select(id,focus=false){
  if(!provinceId){onProvince(id);return;}
  const feature=data.features.find(f=>f.id===id);if(!feature)return;
  container.querySelector('#map-detail').innerHTML=`<strong>${esc(feature.name)}</strong><span>${esc(data.name)} · 선택한 영역의 경계를 강조했습니다.</span>`;
  container.querySelectorAll('[data-map-id]').forEach(p=>p.setAttribute('aria-pressed',String(p.dataset.mapId===id)));
  if(focus){box={x:feature.x-data.width/6,y:feature.y-data.height/6,w:data.width/3,h:data.height/3};clamp();}
 }
 container.querySelector('#map-zoom-in').onclick=()=>zoom(1.5);
 container.querySelector('#map-zoom-out').onclick=()=>zoom(1/1.5);
 container.querySelector('#map-reset').onclick=()=>{box={x:0,y:0,w:data.width,h:data.height};paint();};
 container.querySelector('#map-labels').onchange=e=>{container.querySelector('.map-labels').style.display=e.target.checked?'':'none';};
 container.querySelectorAll('[data-map-list]').forEach(b=>b.onclick=()=>select(b.dataset.mapList,true));
 container.querySelectorAll('[data-map-id]').forEach(p=>p.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(p.dataset.mapId);}});
 svg.onpointerdown=e=>{if(e.button!==0||drag)return;drag={pointerId:e.pointerId,x:e.clientX,y:e.clientY,box:{...box},id:e.target.closest('[data-map-id]')?.dataset.mapId,moved:false};svg.setPointerCapture(e.pointerId);};
 svg.onpointermove=e=>{
  if(!drag||e.pointerId!==drag.pointerId)return;const rect=svg.getBoundingClientRect();const units=Math.max(box.w/rect.width,box.h/rect.height);
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>4)drag.moved=true;
  if(drag.moved){box.x=drag.box.x-dx*units;box.y=drag.box.y-dy*units;clamp();}
 };
 svg.onpointerup=e=>{if(!drag||e.pointerId!==drag.pointerId)return;const old=drag;drag=null;svg.releasePointerCapture(e.pointerId);if(!old.moved&&old.id)select(old.id);};
 svg.onpointercancel=()=>{drag=null;};
 svg.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY<0?1.15:1/1.15);},{passive:false});
}
