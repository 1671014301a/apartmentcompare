/*
 * 비교파트 settings — the only file you normally need to edit.
 */
window.BIGYO_CONFIG = {
  // Public address of the GitHub Pages site (with trailing slash).
  // The iOS / Android app loads the Naver map from here, because Naver only
  // accepts map requests from domains you registered in the NAVER Cloud console.
  // 비워 두면 지금 열린 주소를 그대로 써요. 앱(iOS/Android)에 넣을 때만 실제 사이트 주소를 적어 주세요.
  // e.g. "https://yourname.github.io/저장소이름/"  or  "https://내도메인.com/"
  siteUrl: "https://apartmentcompare.org/",

  // NAVER Cloud Platform → AI·NAVER API → Maps → Application → "Client ID"
  // 이 키의 Web 서비스 URL에 아래 주소를 등록해야 지도가 떠요:
  //   https://apartmentcompare.org
  //   https://www.apartmentcompare.org   (www 주소도 쓸 경우)
  //   http://localhost:8080              (내 컴퓨터에서 테스트할 때)
  naverMapClientId: "pqlijzerxw",
  // Newer NAVER Maps keys use "ncpKeyId". Older keys used "ncpClientId".
  naverMapKeyParam: "ncpKeyId",

  // 지도는 네이버 지도예요 (원본 사이트와 같아요). 키가 이 주소에 등록돼 있지 않으면
  // 지도 자리에 '지도 인증에 실패했어요' 안내가 나와요.
  // "leaflet" 으로 바꾸면 네이버 대신 OpenStreetMap 지도를 써요 (테스트용).
  mapEngine: "naver",
  tileUrl: "",
  tileAttribution: "",

  // 카카오 지도 JavaScript 키: 사진이 없는 단지 카드에 단지 위치 지도를 보여 줘요 (비워 두면 기본 그림).
  // Kakao Developers → 내 애플리케이션 → 플랫폼 → Web 사이트 도메인에 https://apartmentcompare.org 를 등록해 주세요.
  kakaoMapKey: "ab880fbc2950d6cbd1b73e0602a38c36",

  // Where 안심거래센터 consultation requests and privacy questions are sent.
  contactEmail: "",

  // 1:1 상담 form is delivered by FormSubmit (https://formsubmit.co) to this inbox.
  // The very first request sends an activation email here — click "Activate Form" once.
  // After activating, FormSubmit gives you a random string; you can paste it here
  // instead of the address so the email isn't visible in the site's code.
  formSubmitEmail: "bubble.youthimpact@gmail.com",

  // 1:1 상담 partner lawyer (shown on 안심거래센터)
  lawyer: {
    name: "차형진",
    firm: "법무법인 온전",
    phone: "010-9049-1537",
    photo: "images/lawyer.jpg"
  }
};
