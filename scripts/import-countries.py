"""Refresh attributed world data and local SVG flags using verified HTTPS."""
import concurrent.futures, datetime, hashlib, json, pathlib, subprocess
root=pathlib.Path(__file__).resolve().parents[1]
def download(url,path):
 subprocess.run(['curl','--fail','--location','--silent','--show-error','--max-time','60','--retry','2',url,'-o',str(path)],check=True)
source='https://raw.githubusercontent.com/mledoze/countries/master/countries.json'
tmp=root/'datasets/countries-source.json'
download(source,tmp)
raw=json.loads(tmp.read_text());regions={'Asia':'아시아','Europe':'유럽','Africa':'아프리카','Oceania':'오세아니아','Antarctic':'남극'}
rows=[]
for c in raw:
 continent=regions.get(c['region'])
 if c['region']=='Americas':continent='남아메리카' if c['subregion']=='South America' else '북아메리카'
 assert continent, c['cca2']
 name=c['translations'].get('kor',{}).get('common',c['name']['common'])
 if c['cca2']=='KR':name='대한민국'
 sovereign=c['unMember'] or c['cca2'] in ['VA','PS']
 rows.append(dict(id=c['cca2'].lower(),name=name,english=c['name']['common'],capitals=c['capital'],continent=continent,sovereign=sovereign,flag=f"assets/flags/{c['cca2'].lower()}.svg"))
assert len({r['id'] for r in rows})==len(rows)
assert sum(r['sovereign'] for r in rows)==195
flags='https://raw.githubusercontent.com/hampusborgos/country-flags/main/svg/'
def fetch_flag(row):
 path=root/row['flag'];path.parent.mkdir(parents=True,exist_ok=True)
 download(flags+row['id']+'.svg',path)
 text=path.read_text()
 assert '<svg' in text and '<script' not in text and 'http://www.w3.org/2000/svg' in text,row['id']
 return row['id'],hashlib.sha256(path.read_bytes()).hexdigest()
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:checksums=dict(pool.map(fetch_flag,rows))
rows.sort(key=lambda c:c['name'])
(root/'datasets/countries.js').write_text('export default '+json.dumps(rows,ensure_ascii=False,indent=2)+';\n')
(root/'datasets/country-sources.json').write_text(json.dumps(dict(retrieved=datetime.date.today().isoformat(),source=source,sourceSHA256=hashlib.sha256(tmp.read_bytes()).hexdigest(),flags=flags,flagSHA256=checksums,scope='193 UN members + Holy See + Palestine; optional other countries and territories',license='ODbL-1.0; see COUNTRIES-LICENSE'),ensure_ascii=False,indent=2)+'\n')
tmp.unlink()
print(f'Imported {len(rows)} countries/territories, 195 sovereign entries and {len(checksums)} SVG flags.')
