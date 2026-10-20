"""Generate simplified offline SVG paths from the attributed SGIS/admdongkor snapshot.
Requires Python 3 and shapely 2.1.2; pass the downloaded original GeoJSON path.
"""
import sys,json,math,hashlib,pathlib,collections,datetime,re
from shapely.geometry import shape
from shapely import union_all,make_valid
root=pathlib.Path(__file__).resolve().parents[1]
source=pathlib.Path(sys.argv[1]);raw=json.loads(source.read_text())
province_names={};by_district=collections.defaultdict(list);district_names={};district_province={}
for feature in raw['features']:
 p=feature['properties'];pid=p['sido'];sid=p['sgg']
 province_names[pid]=p['sidonm'];district_names[sid]=re.sub(r'^(.+시)([^ ]+구)$',r'\1 \2',p['sggnm']);district_province[sid]=pid
 geom=shape(feature['geometry']);by_district[sid].append(make_valid(geom)if not geom.is_valid else geom)
assert len(province_names)==17
merged={sid:union_all(shapes)for sid,shapes in by_district.items()}
province_geoms={pid:union_all([g for sid,g in merged.items()if district_province[sid]==pid])for pid in province_names}
def polygons(g):
 if g.geom_type=='Polygon':return [g]
 if hasattr(g,'geoms'):return [p for c in g.geoms for p in polygons(c)]
 return []
def project(lon,lat):return math.radians(lon),-math.log(math.tan(math.pi/4+math.radians(lat)/2))
def render(items,width,height,tolerance):
 shapes={id:g.simplify(tolerance,preserve_topology=True)for id,g in items.items()}
 allgeom=union_all(list(shapes.values()));minx,miny,maxx,maxy=allgeom.bounds
 x0,y0=project(minx,maxy);x1,y1=project(maxx,miny);padding=30;scale=min((width-2*padding)/(x1-x0),(height-2*padding)/(y1-y0));ox=(width-(x1-x0)*scale)/2;oy=(height-(y1-y0)*scale)/2
 def xy(lon,lat):
  x,y=project(lon,lat);return round(ox+(x-x0)*scale,2),round(oy+(y-y0)*scale,2)
 result=[]
 for id,geom in shapes.items():
  pieces=[]
  for polygon in polygons(geom):
   for ring in [polygon.exterior,*polygon.interiors]:
    coords=[xy(*point[:2])for point in ring.coords]
    if len(coords)<4:continue
    pieces.append('M'+'L'.join(f'{x},{y}'for x,y in coords)+'Z')
  largest=max(polygons(geom),key=lambda p:p.area);center=largest.representative_point();cx,cy=xy(center.x,center.y)
  result.append(dict(id=id,d=''.join(pieces),x=cx,y=cy))
 return dict(width=width,height=height,features=result)
nation=render(province_geoms,800,1000,0.003)
for f in nation['features']:f['name']=province_names[f['id']]
# General districts belong inside a city detail, not alongside cities on a province map.
city_districts=collections.defaultdict(list);city_names={};city_province={}
for sid,name in district_names.items():
 match=re.fullmatch(r'(.+시) ([^ ]+구)',name)
 if match:
  cid=sid[:4]+'0';city_districts[cid].append(sid)
  city_names[cid]=match[1];city_province[cid]=district_province[sid]
city_geoms={cid:union_all([merged[sid]for sid in ids])for cid,ids in city_districts.items()}
# Check that aggregation neither drops districts nor changes the city outline.
assert all(len(ids)>1 for ids in city_districts.values())
regions={};cities={}
for pid,name in province_names.items():
 items={sid:g for sid,g in merged.items()if district_province[sid]==pid and sid[:4]+'0' not in city_districts}
 items.update({cid:g for cid,g in city_geoms.items()if city_province[cid]==pid})
 original=union_all([g for sid,g in merged.items()if district_province[sid]==pid])
 assert union_all(list(items.values())).symmetric_difference(original).area<1e-10
 data=render(items,900,800,0.0006)
 for f in data['features']:
  cid=f['id'];f['name']=city_names[cid]if cid in city_names else district_names[cid]
  if cid in city_names:f['cityId']=cid
 data['name']=name;regions[pid]=data
for cid,ids in city_districts.items():
 data=render({sid:merged[sid]for sid in ids},900,800,0.0002)
 for f in data['features']:f['name']=district_names[f['id']].split(' ',1)[1]
 data.update(name=city_names[cid],parentId=city_province[cid],parentName=province_names[city_province[cid]])
 cities[cid]=data
out=dict(snapshot='2026-04-01',nation=nation,regions=regions,cities=cities)
(root/'datasets/region-maps.js').write_text('export default '+json.dumps(out,ensure_ascii=False,separators=(',',':'))+';\n')
meta=dict(source='https://github.com/vuski/admdongkor',raw='https://raw.githubusercontent.com/vuski/admdongkor/master/ver20260401/HangJeongDong_ver20260401.geojson',snapshot='2026-04-01',retrieved=datetime.date.today().isoformat(),sha256=hashlib.sha256(source.read_bytes()).hexdigest(),license='CC-BY-4.0; SGIS upstream attribution preserved',upstream='통계청 통계지리정보서비스(SGIS), 공공누리 제1유형',provinces=len(regions),districts=len(merged),city_maps=len(cities),processing='행정동 경계를 시군구·시도로 합치고, 일반구가 있는 시는 도 지도에서 하나로 병합해 별도 구 지도로 분리. 위상 보존 단순화 후 메르카토르 투영의 SVG 경로 생성',notice='학습용 경계. 인천 2026.07 개편은 지도에 미반영. 퀴즈 최신 편집 목록과 차이 있음.')
(root/'datasets/maps/sources.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
print('Generated',len(regions),'provinces and',len(merged),'districts,',len(cities),'city detail maps;', (root/'datasets/region-maps.js').stat().st_size,'bytes')
