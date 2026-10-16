# 비교파트

GitHub Pages용 정적 사이트예요. 주소: https://apartmentcompare.org/

## 배포
1. GitHub 저장소에 이 폴더를 올리고 Settings → Pages → Branch: main / `docs` 선택
2. Custom domain에 `apartmentcompare.org` 입력 (`docs/CNAME` 에 이미 들어 있어요) → Enforce HTTPS 켜기
3. 도메인 DNS 설정: `apartmentcompare.org` 에 GitHub Pages A 레코드 4개
   (185.199.108.153 / 185.199.109.153 / 185.199.110.153 / 185.199.111.153), `www` 는 CNAME → `<깃허브아이디>.github.io`
4. NAVER Cloud 콘솔 → Maps → Application → Web 서비스 URL에 `https://apartmentcompare.org` (와 www 주소) 등록

- 설정: `docs/js/config.js` (네이버 지도 키, 상담 메일, 변호사 정보)
- 데이터: `docs/js/data/apartments.js` — 구글 시트로 다시 만드는 방법은 `tools/README.md`
- 지도: 네이버 지도 키가 지금 주소에 등록돼 있으면 네이버 지도, 아니면 자동으로 OpenStreetMap 지도로 바뀌어요.
- 로컬 확인: `python3 -m http.server 8080 -d docs` 후 http://localhost:8080
