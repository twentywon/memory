# 데이터 출처와 수록 기준

## 국가·수도·대륙

- mledoze/countries: https://github.com/mledoze/countries (ODbL 1.0, `COUNTRIES-LICENSE` 포함).
- `country-sources.json`에 수집 날짜, 원본 주소, 원본 SHA-256 및 국기별 SHA-256 기록.
- 기본: 유엔 회원국 193개 + 교황청(바티칸) + 팔레스타인 2개, 총 195개.
- '국가·지역 전체'로 비회원 국가·속령 등을 포함한 원본 250개 항목을 볼 수 있습니다. 이는 모두가 주권국이라는 뜻은 아닙니다.
- 대륙: 원본 region/subregion 기준. 중앙아메리카·카리브해는 북아메리카에 포함합니다. 국경을 걸친 국가는 원본의 단일 대륙 분류를 따릅니다.
- 국가명은 원본 한국어 번역, 수도명은 `capitals-ko.js`의 수동 편집 한글 표기로 표시하며 영문 원본은 `countries.js`에 보존합니다. 복수 수도는 모두 표시하고, 수도가 없는 지역은 수도를 포함한 테스트에서 제외하며 국가명↔국기 퀴즈에는 포함합니다. 스위스 베른은 연방시입니다. 예루살렘 등 수도 표기는 원본 기준이며 국제적 지위에 논쟁이 있을 수 있습니다.

## 국기

- https://github.com/hampusborgos/country-flags 의 SVG를 HTTPS로 수집해 앱에 포함했습니다. 이모지가 아닌 실제 이미지이며 오프라인에서도 표시됩니다.
- https://github.com/hampusborgos/country-flags/blob/main/README.md 의 라이선스 안내 참고. 국기의 디자인 및 사용은 국가별 규정의 영향을 받을 수 있습니다.
- 갱신: `python scripts/import-countries.py` 후 `npm run build`. 출처와 전체 파일을 함께 재생성합니다.

## 한국사

다음 참고자료를 바탕으로 재위 기간을 수동 정리했습니다. 국가 데이터와 달리 웹 크롤링 결과라고 주장하지 않습니다.

- 한국의 군주 목록: https://ko.wikipedia.org/wiki/한국의_군주_목록
- 한국민족문화대백과사전: https://encykorea.aks.ac.kr/
- 대통령기록관 역대 대통령: https://www.pa.go.kr/contents/president/president01.jsp
- 대한민국 대통령 목록: https://ko.wikipedia.org/wiki/대한민국의_대통령_목록

고구려·백제·신라·고려·조선의 기존 176명과 대한민국 대통령 14명을 수록합니다. 고대 초기 연대는 전통 기년이며 사료·학설에 따라 차이가 있습니다. 고려 충렬왕·충선왕·충숙왕·충혜왕은 복위 기간을 나누어 표시했습니다. 조선 고종·순종은 대한제국 황제 기간까지 포함합니다. 대통령은 동일인의 연임을 묶고 권한대행은 제외했습니다. 현재 재임 표시는 2026-10-16 편집 기준입니다.

## 영어 단어

기본 제공 단어는 없습니다. 사용자가 직접 등록한 단어와 뜻만 학습합니다.

## 한글 수도와 해외 지도자 (이번 확장)

- `capitals-ko.js`: 원본의 모든 수도명에 대한 한국어 편집 표기. 원본 수도를 바꾸거나 누락하지 않으며 영어→한글 매핑 누락을 테스트합니다. 지명에는 복수의 통용 표기가 있을 수 있습니다.
- `leaders.js`: 수동 정리한 해외 지도자 재임 목록. 온라인 자동 수집 결과가 아닙니다. 해외 인물은 2025년 취임까지 수록하며 끝 연도가 비어 있으면 종료일 미수록입니다. 2026년 이후의 현직 정보로 해석하지 마세요.
- `leader-catalog.js`: 나라별 시대 범위, 직책, 포함·제외 기준과 참고자료. 이 환경에서는 공식 사이트 본문 접근이 제한되어 최신 재임 종료일을 온라인으로 대조하지 못했습니다. 범위와 미수록 종료일을 앱에 표시합니다.

참고 목록:

- 미국 백악관 역대 대통령: https://www.whitehouse.gov/about-the-white-house/presidents/
- 영국 정부 역대 총리: https://www.gov.uk/government/history/past-prime-ministers
- 프랑스 엘리제궁 역대 대통령: https://www.elysee.fr/en/french-presidency/the-presidents-of-the-republic
- 독일 연방총리실 역대 총리: https://www.bundeskanzler.de/bk-en/chancellery/federal-chancellors-since-1949
- 바이마르공화국 총리 목록: https://en.wikipedia.org/wiki/List_of_chancellors_of_Germany
- 중국 국가수반 목록: https://en.wikipedia.org/wiki/List_of_heads_of_state_of_China
- 일본 수상관저 역대 내각: https://japan.kantei.go.jp/rekidainaikaku/ichiran.html

독일은 나치·동독을 제외하고, 영국은 1832년 선거법 개정 당시 재임 총리부터, 프랑스는 제2~5공화국 대통령을 수록합니다. 중국은 사용자 요청에 따라 1912년부터 시작하며 북양정부·국민정부·중화인민공화국을 구분합니다. 일본은 총리대신직이 생긴 1885년부터입니다. 나라별 민주화가 같은 시점이나 같은 제도를 뜻하지 않음을 전제로 편집했습니다.

## 정당 참고 정보

현대 지도자 행의 `party`는 해당 재임 기간의 정당을 참고용으로 정리한 것입니다. →는 재임 중의 당명 변경·당적 변경·탈당을 나타냅니다. 비연속 재임자는 각 행의 기간에 맞춰 표기하며, 퇴임 후 창당·입당은 해당 재임 기간에 소급하지 않습니다. 무소속, 의회 정치집단, 선거연합, 군벌 계파, 전시 정치단체와 집단 국가수반은 각각 구분합니다. 고대 왕조에는 현대 정당을 붙이지 않습니다. 한국 대통령과 해외 국가 지도자를 대상으로 기존 국가별 참고 목록 및 인물별 정당 이력을 바탕으로 수동 편집했습니다. 역사적 계파를 현대 정당과 동등하게 해석하지 마세요. 최신 당적 변동을 실시간 수집하지는 않습니다.

## 한국어문회 한자

15급수 5,978자를 공개 CSV 미러에서 수집했습니다. 원자료 권리·수집 경로·교차 확인·급수별 수량은 [hanja/README.md](hanja/README.md), 원본 및 SHA-256은 `hanja/original.csv`, `hanja/sources.json`에 있습니다.

## 대한민국 행정구역·사자성어·원소 (v1.5)

- 행정구역: 공개 주소 트리에서 추출하고 최근 명칭·경계 변경을 수동 반영했습니다. 범위·동명 정답·세종·제주 예외와 보정 내역은 `regions/README.md`, 출처·원본 체크섬은 `regions/sources.json`에 있습니다. 실시간 공식 코드 원본과 연동하지 않습니다.
- 사자성어: 자주 쓰이는 4음절 표현·4한자 65개를 선별했습니다. 공개 목록 https://github.com/dalmook/dalsaja 의 표현·한자를 참고해 대조했고 풀이는 직접 요약했습니다. 다섯 글자 이상의 고사성어는 이 목록에 포함하지 않습니다. 교과 과정이나 시험의 공식 전체 목록을 뜻하지 않습니다. 뜻에는 다른 가능한 동의 표현이 있을 수 있어 자기 채점으로 제공합니다.
- 원소: https://github.com/Bowserinator/Periodic-Table-JSON , CC BY-SA 3.0. 원자번호 1~118번과 주기율표 좌표를 사용하고 한글 이름·통용명을 편집했습니다. 원본에 있는 미확정 119번은 제외합니다. 상세 기준·라이선스는 `science/README.md`, `science/ELEMENTS-LICENSE.md`, 수집 기록은 `science/sources.json`에 있습니다.
