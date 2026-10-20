import mapData from './datasets/region-maps.js';
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shortNames={'서울특별시':'서울','부산광역시':'부산','대구광역시':'대구','인천광역시':'인천','광주광역시':'광주','대전광역시':'대전','울산광역시':'울산','세종특별자치시':'세종','경기도':'경기','강원특별자치도':'강원','충청북도':'충북','충청남도':'충남','전북특별자치도':'전북','전라남도':'전남','경상북도':'경북','경상남도':'경남','제주특별자치도':'제주'};
const mapFor=id=>id?(mapData.cities[id]||mapData.regions[id]):mapData.nation;
export const parentMap=id=>mapData.cities[id]?.parentId||null;
export function mapMarkup(locationId){
 const data=mapFor(locationId);
 const city=mapData.cities[locationId];
 const backLabel=city?`${city.parentName} 지도`:locationId?'대한민국 전체 지도':'이전 화면';
 return `<button class="back" id="back">← ${esc(backLabel)}</button><section class="intro"><span class="eyebrow">KOREA · MAP</span><h1>${esc(data.name||'대한민국 행정구역 지도')}</h1><p>${city?'구를 눌러 이름과 위치를 확인하세요.':locationId?'시·군·구를 눌러 이름과 위치를 확인하세요. 구가 있는 시는 누르면 구별 지도로 이동합니다.':'도·광역시를 누르면 해당 지역의 상세 지도로 이동합니다.'}</p></section><div class="map-controls"><button id="map-zoom-in" aria-label="지도 확대">＋ 확대</button><button id="map-zoom-out" aria-label="지도 축소">− 축소</button><button id="map-reset">기본 크기</button><button id="map-fit">전체 보기</button><output id="map-scale" aria-live="polite">100%</output><label><input type="checkbox" id="map-labels" checked> 이름 표시</label></div><p class="data-note">지도를 크게 표시했습니다. 스크롤하거나 끌어서 이동하고, 두 손가락 또는 확대·축소 버튼으로 크기를 조절하세요. 전체 보기로 지도 전체를 확인할 수 있습니다.</p><div id="map-detail" class="element-detail" aria-live="polite">${locationId?`${esc(data.name)} · ${data.features.length}개 ${city?'구':'시·군·구'} 경계`:'17개 시·도를 선택해 보세요.'}</div><div class="map-canvas" tabindex="0" role="region" aria-label="스크롤 가능한 지도"><svg id="korea-map" viewBox="0 0 ${data.width} ${data.height}" role="group" aria-label="${esc(data.name||'대한민국')} 행정경계 지도">${data.features.map((f,i)=>`<path class="map-region map-color-${i%6}" data-map-id="${f.id}" d="${f.d}" fill-rule="evenodd" vector-effect="non-scaling-stroke" role="button" tabindex="0" aria-label="${esc(f.name)}${f.cityId?' 구별 지도 열기':''}"><title>${esc(f.name)}</title></path>`).join('')}<g class="map-labels" aria-hidden="true">${data.features.map(f=>`<text x="${f.x}" y="${f.y}" text-anchor="middle" dominant-baseline="central">${esc(locationId?f.name:shortNames[f.name]||f.name)}</text>`).join('')}</g></svg></div><section class="map-list" aria-label="${city?'구':locationId?'시군구':'시도'} 목록">${data.features.map(f=>`<button data-map-list="${f.id}" ${f.cityId?`aria-label="${esc(f.name)} 구별 지도 열기"`: ''}>${esc(f.name)}${f.cityId?' →':''}</button>`).join('')}</section><p class="map-snapshot">경계 기준: <strong>2026.04.01</strong>. ${locationId==='28'?'인천은 2026년 7월 개편 이전 경계입니다. 퀴즈의 제물포구·영종구·검단구 목록과 다릅니다.':'이후 행정구역 변경은 지도에 반영되지 않을 수 있습니다.'}</p><p class="data-note">출처: 통계청 통계지리정보서비스(SGIS), 공공누리 제1유형 · <a href="https://github.com/vuski/admdongkor" target="_blank" rel="noopener">vuski/admdongkor</a>, CC BY 4.0. 행정동 경계를 시·군·구 및 시·도로 합치고 화면용으로 단순화했습니다. 학습용 지도이며 측량·법적 경계 확인용이 아닙니다.</p>`;
}
export function bindMap(container,locationId,onProvince){
 const data=mapFor(locationId);
 const svg=container.querySelector('#korea-map'),canvas=container.querySelector('.map-canvas');
 let scale=1,gesture=null;
 const pointers=new Map();
 const viewport=()=>({w:canvas.clientWidth||320,h:canvas.clientHeight||480});
 const local=p=>{const r=canvas.getBoundingClientRect();return {x:p.x-r.left-canvas.clientLeft,y:p.y-r.top-canvas.clientTop};};
 const center=()=>{const v=viewport();return {x:v.w/2,y:v.h/2};};
 function resize(next,anchor=center(),world={x:(canvas.scrollLeft+anchor.x)/scale,y:(canvas.scrollTop+anchor.y)/scale}){
  scale=Math.max(.2,Math.min(5,next));
  svg.style.width=`${data.width*scale}px`;svg.style.height=`${data.height*scale}px`;
  canvas.scrollLeft=world.x*scale-anchor.x;canvas.scrollTop=world.y*scale-anchor.y;
  container.querySelector('#map-scale').textContent=`${Math.round(scale*100)}%`;
  container.querySelector('#map-zoom-in').disabled=scale>=5;
  container.querySelector('#map-zoom-out').disabled=scale<=.2;
 }
 function select(id,focus=false){
  if(!locationId){onProvince(id);return;}
  const feature=data.features.find(f=>f.id===id);if(!feature)return;
  if(feature.cityId){onProvince(feature.cityId);return;}
  container.querySelector('#map-detail').innerHTML=`<strong>${esc(feature.name)}</strong><span>${esc(data.name)} · 선택한 영역의 경계를 강조했습니다.</span>`;
  container.querySelectorAll('[data-map-id]').forEach(p=>p.setAttribute('aria-pressed',String(p.dataset.mapId===id)));
  if(focus)resize(Math.max(scale,1.5),center(),{x:feature.x,y:feature.y});
 }
 container.querySelector('#map-zoom-in').onclick=()=>resize(scale*1.5);
 container.querySelector('#map-zoom-out').onclick=()=>resize(scale/1.5);
 container.querySelector('#map-reset').onclick=()=>resize(1);
 container.querySelector('#map-fit').onclick=()=>{const v=viewport();resize(Math.min(v.w/data.width,v.h/data.height),{x:0,y:0},{x:0,y:0});};
 container.querySelector('#map-labels').onchange=e=>{container.querySelector('.map-labels').style.display=e.target.checked?'':'none';};
 container.querySelectorAll('[data-map-list]').forEach(b=>b.onclick=()=>select(b.dataset.mapList,true));
 container.querySelectorAll('[data-map-id]').forEach(p=>p.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(p.dataset.mapId);}});
 function startGesture(moved=false){
  const points=[...pointers.values()];if(!points.length){gesture=null;return;}
  if(points.length>=2){
   const [a,b]=points,anchor=local({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
   gesture={pinch:true,moved:true,distance:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)),scale,world:{x:(canvas.scrollLeft+anchor.x)/scale,y:(canvas.scrollTop+anchor.y)/scale}};
  }else gesture={...points[0],left:canvas.scrollLeft,top:canvas.scrollTop,moved};
 }
 canvas.onpointerdown=e=>{
  if(e.button!==0||pointers.size>=2)return;
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,id:e.target.closest('[data-map-id]')?.dataset.mapId});
  canvas.setPointerCapture?.(e.pointerId);startGesture(pointers.size>1);
 };
 canvas.onpointermove=e=>{
  if(!pointers.has(e.pointerId)||!gesture)return;
  const old=pointers.get(e.pointerId);pointers.set(e.pointerId,{...old,x:e.clientX,y:e.clientY});
  if(gesture.pinch){
   const [a,b]=[...pointers.values()],anchor=local({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
   resize(gesture.scale*Math.hypot(a.x-b.x,a.y-b.y)/gesture.distance,anchor,gesture.world);
  }else{
   const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
   if(Math.hypot(dx,dy)>4)gesture.moved=true;
   if(gesture.moved){canvas.scrollLeft=gesture.left-dx;canvas.scrollTop=gesture.top-dy;}
  }
 };
 function finish(e,cancelled=false){
  if(!pointers.has(e.pointerId))return;
  const selected=!cancelled&&!gesture?.moved?gesture?.id:null;
  pointers.delete(e.pointerId);canvas.releasePointerCapture?.(e.pointerId);startGesture(true);
  if(selected)select(selected);
 }
 canvas.onpointerup=e=>finish(e);
 canvas.onpointercancel=e=>finish(e,true);
 canvas.onlostpointercapture=e=>{if(pointers.has(e.pointerId)){pointers.delete(e.pointerId);startGesture(true);}};
 canvas.addEventListener('wheel',e=>{if(e.ctrlKey){e.preventDefault();resize(scale*(e.deltaY<0?1.15:1/1.15),local({x:e.clientX,y:e.clientY}));}},{passive:false});
 resize(1,{x:0,y:0},{x:0,y:0});
}
