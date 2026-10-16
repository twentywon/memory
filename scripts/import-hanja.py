"""Import Korean Language Education Society grade allocations from its published CSV mirror."""
import ast,csv,datetime,hashlib,io,json,pathlib,subprocess
root=pathlib.Path(__file__).resolve().parents[1]
url='https://raw.githubusercontent.com/rycont/hanja-grade-dataset/main/hanja.csv'
result=subprocess.run(['curl','--fail','--location','--silent','--show-error','--max-time','90',url],capture_output=True,check=True)
rows=list(csv.DictReader(io.StringIO(result.stdout.decode('utf-8-sig'))))
levels=['8급','7급Ⅱ','7급','6급Ⅱ','6급','5급Ⅱ','5급','4급Ⅱ','4급','3급Ⅱ','3급','2급','1급','특급Ⅱ','특급']
expected=[50,50,50,75,75,100,100,250,250,500,317,538,1145,1150,1328]
output=[]
for r in rows:
 meanings=ast.literal_eval(r['meaning'])
 assert r['level']in levels and len(r['hanja'])==1 and meanings
 parts=[]
 for definition,sound in meanings:
  assert definition and sound and all(isinstance(v,str)for v in definition+sound)
  parts.append('·'.join(definition)+' '+'·'.join(sound))
 output.append(dict(id='hanja-'+format(ord(r['hanja']),'x'),hanja=r['hanja'],grade=r['level'],reading=r['main_sound'],answer=' / '.join(parts)))
assert len(output)==5978 and len({r['id']for r in output})==5978
counts=[sum(r['grade']==g for r in output)for g in levels]
assert counts==expected,counts
(root/'datasets/hanja.js').write_text('export default '+json.dumps(output,ensure_ascii=False,separators=(',',':'))+';\n')
metadata=dict(source=url,original='https://www.hanja.re.kr/',mirror='https://github.com/rycont/hanja-grade-dataset',retrieved=datetime.date.today().isoformat(),sha256=hashlib.sha256(result.stdout).hexdigest(),count=len(output),gradeNewCounts=dict(zip(levels,counts)),notice='한국어문회 공식 XLS 자료를 CSV로 변환한 공개 미러. 원자료 저작권은 한국어문회에 있습니다. 원본 급수 배정을 유지합니다.')
(root/'datasets/hanja/sources.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n')
(root/'datasets/hanja/original.csv').write_bytes(result.stdout)
print('Imported 5,978 unique characters across 15 grade levels; original allocation preserved.')
