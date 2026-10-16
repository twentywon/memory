"""Merge the MIT-licensed public idiom corpus with existing curated items."""
import json,pathlib,re,subprocess,hashlib,unicodedata,datetime,collections
root=pathlib.Path(__file__).resolve().parents[1]
url='https://raw.githubusercontent.com/LiF-Lee/idioms/main/idioms.json'
response=subprocess.run(['curl','-fsSL','--max-time','90',url],check=True,capture_output=True)
raw=json.loads(response.stdout)['idioms'];base=json.loads((root/'datasets/idioms/curated-base.json').read_text())
rows=list(base);words={r['word']for r in rows};characters={unicodedata.normalize('NFKC',r['hanja'])for r in rows};excluded=collections.Counter()
for item in raw:
 match=re.fullmatch(r'\s*([^\s(]+)\s*\(([^)]+)\)\s*',str(item.get('Q','')))
 if not match:excluded['형식 불일치']+=1;continue
 hanja,word=match.groups();word=word.strip();hanja=hanja.strip();meaning=re.sub(r'\s+',' ',str(item.get('A',''))).strip()
 if not re.fullmatch(r'[가-힣]{4}',word)or not re.fullmatch(r'[\u3400-\u9fff\uf900-\ufaff]{4}',hanja)or not meaning:excluded['4음절·4한자 또는 뜻 조건 미달']+=1;continue
 key=unicodedata.normalize('NFKC',hanja)
 if word in words or key in characters:excluded['중복·표기 변형']+=1;continue
 rows.append(dict(id='idiom-'+hashlib.sha256(word.encode()).hexdigest()[:12],word=word,hanja=hanja,meaning=meaning));words.add(word);characters.add(key)
rows.sort(key=lambda r:r['word'])
assert all(r in rows for r in base)and len({r['id']for r in rows})==len(rows)
(root/'datasets/idioms.js').write_text('export default '+json.dumps(rows,ensure_ascii=False,indent=2)+';\n')
(root/'datasets/idioms/original.json').write_bytes(response.stdout)
meta=dict(source='https://github.com/LiF-Lee/idioms',raw=url,sha256=hashlib.sha256(response.stdout).hexdigest(),retrieved=datetime.date.today().isoformat(),license='MIT; Copyright (c) 2021 EliF',rawCount=len(raw),curatedPreserved=len(base),accepted=len(rows),excluded=dict(excluded),notice='특정 시험·사전의 전체 수록 목록이 아님. 네 글자 표현만 수록하며 기존 65개 ID·풀이를 보존함. 공개 자료의 역사적·고전적 표현 포함.')
(root/'datasets/idioms/sources.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
print('Idioms:',len(raw),'source entries;',len(rows),'accepted;',dict(excluded))
