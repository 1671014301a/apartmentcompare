# 데이터 다시 만들기

구글 시트를 고친 뒤 사이트 데이터(`docs/js/data/apartments.js`)를 다시 만드는 방법이에요.

1. 구글 시트를 **파일 → 다운로드 → Microsoft Excel(.xlsx)** 로 받아 `tools/cache/sheet.xlsx` 에 저장
2. 터미널에서 (Python 3 + `pip install openpyxl`)

```bash
python3 tools/extract.py tools/cache/sheet.xlsx tools/cache/raw.json        # 시트 → raw.json
python3 tools/geocode.py tools/cache/raw.json tools/cache/geo.json          # 새 단지만 좌표 찾기 (OpenStreetMap, 1초에 1건)
python3 tools/build_data.py tools/cache/raw.json tools/cache/geo.json docs/js/data/apartments.js tools/cache/stations.json tools/cache/ref_data.json
python3 tools/build_pages.py docs                                           # index.html 을 고쳤을 때만
```

- 시트 구조: 지역별 탭(첫 줄 묶음 제목, 둘째 줄 `아파트명 · 주소 · 세대수 …`), `키워드` 탭(지역 · 단지명 · 점수 · 추천 등급 · 키워드 · 링크).
  `DMC가재울` 탭처럼 가로로 된 표(단지가 열)도 읽어요. `개포(이전)` 탭은 건너뛰어요.
- 두 탭에 같은 단지가 있으면(예: 왕십리·신당) 처음 나온 탭 기준으로 한 번만 넣고, 나머지 탭 이름은 `alsoIn` 으로 남겨요.
- 시트에 없는 값은 `build_data.py` 가 계산해 채우고, 단지마다 `estimated` 목록에 적어요. 사이트에는 **추정** 표시가 붙어요.
  - 위치(좌표)·가까운 역·도보 시간: 주소를 OpenStreetMap에서 찾아 계산
  - 강남·여의도·광화문 이동시간: 가까운 역에서 직선거리로 추정
  - 건설사: 단지 이름의 브랜드로 추정 (예: 래미안 → 삼성물산)
  - 교육 환경 점수, 재건축 점수, 맞춤 추천 조건, 한줄평: 시트 값(학교 거리, 시설, 세대수, 입주연차, 용적률)으로 계산
  - 재건축 '시장성'은 지역별 시세 수준(`MARKET`)으로 추정
- 추천 점수·추천 등급·키워드·시세 링크는 `키워드` 탭 값을 그대로 써요.

- `tools/cache/ref_data.json` 은 비교파트 페이지 파일(단지 목록·비교·맞춤 추천)에 들어 있던 정리된 단지 데이터예요.
  단지 이름, 지역(한 단지가 여러 지역에 속할 수 있음), 세대수·용적률 메모, 커뮤니티 시설, 키워드, 매매가는 이 값을 우선해요.

## 단지 사진 넣기 (tools/photos.py)
1. 네이버 개발자센터(developers.naver.com)에서 애플리케이션을 등록하고 '검색' API를 골라 클라이언트 ID·시크릿을 받아요 (무료, 하루 25,000건).
2. `python3 tools/photos.py search --id 클라이언트ID --secret 시크릿` → 단지마다 이미지 후보 8개를 찾아 `tools/photo_review.html` 을 만들어요.
   처음엔 `--limit 10` 으로 몇 개만 해 보세요.
3. `tools/photo_review.html` 을 브라우저로 열고 단지마다 **허락받은 사진**을 하나씩 누른 뒤 [선택 저장] → 내려받은 `photo_choices.json` 을 `tools/cache/` 에 넣어요.
4. `python3 tools/photos.py download --choices tools/cache/photo_choices.json` → `docs/images/apts/` 에 저장되고, 출처는 `credits.json` 에 남아요.
   출처 문구를 정하려면 `--credit "사진 제공: ○○부동산"` 을 붙여요.
5. `build_data.py` 를 다시 돌리면 카드 오른쪽 아래와 상세 화면에 사진과 출처가 나와요.
- 직접 모은 사진 주소나 파일이 있으면 CSV(`단지명,사진주소 또는 파일경로,출처`)로 바로 넣을 수 있어요: `python3 tools/photos.py download --csv 내사진.csv`

### 그 밖의 방법
- 사진 파일을 `docs/images/apts/` 에 **단지 이름** 그대로(예: `잠실엘스.jpg`) 또는 단지 id로 넣고 `build_data.py` 를 다시 돌리면 카드와 상세 화면에 나와요 (jpg · png · webp).
- 사진이 없는 단지는 `config.js` 의 카카오 키로 카드에 단지 위치 지도를 보여 줘요. Kakao Developers에서 `https://apartmentcompare.org` 를 Web 도메인으로 등록해야 해요.
- 직접 찍은 사진이나 사용 허락을 받은 사진만 넣어 주세요. 부동산 앱·뉴스 사진은 저작권이 있어요.
