/* 비교파트 core: data, helpers, icons, compare tray, router.
 * Plain scripts (no modules) so the same files run on GitHub Pages and
 * inside the iOS / Android WebView from local files. */
(function () {
  'use strict';

  var BP = (window.BP = window.BP || {});
  var CONFIG = (BP.config = window.BIGYO_CONFIG || {});
  var DATA = (window.BIGYO_DATA && window.BIGYO_DATA.apartments) || [];

  BP.inApp = /BigyoPateuApp/i.test(navigator.userAgent);

  /* ---------- data ---------- */
  var byId = {};
  DATA.forEach(function (a) { byId[a.id] = a; });
  BP.apartments = DATA;
  BP.get = function (id) { return byId[id]; };
  // 지역: 시트 순서대로. 한 단지가 여러 지역(예: 왕십리 · 신당)에 걸치면 모든 지역에서 셈
  function areasOf(a) { return a.areas && a.areas.length ? a.areas : (a.dong ? [a.dong] : []); }
  BP.areasOf = areasOf;
  BP.areas = function () {
    var seen = [];
    DATA.forEach(function (a) { areasOf(a).forEach(function (x) { if (seen.indexOf(x) < 0) seen.push(x); }); });
    return seen;
  };
  BP.inArea = function (area) { return DATA.filter(function (a) { return !area || area === 'all' || areasOf(a).indexOf(area) >= 0; }); };
  BP.areaOptions = function (selected, allLabel) {
    return '<option value=""' + (!selected ? ' selected' : '') + '>' + esc(allLabel || '전체 지역') + ' (' + DATA.length + ')</option>' +
      BP.areas().map(function (x) { return '<option value="' + esc(x) + '"' + (selected === x ? ' selected' : '') + '>' + esc(x) + ' (' + BP.inArea(x).length + ')</option>'; }).join('');
  };
  BP.moveShort = function (a) { return a.approved || (a.approvedYear ? String(a.approvedYear) : '-'); };
  BP.moveLong = function (a) { var p = String(a.approved || '').split('.'); return p[1] ? p[0] + '년 ' + (+p[1]) + '월' : (p[0] ? p[0] + '년' : '-'); };
  BP.moveKey = function (a) { var p = String(a.approved || '').split('.'); return (+p[0] || 0) * 100 + (+p[1] || 0); };

  // 커뮤니티 시설 (구글 시트의 17개 항목과 같은 순서)
  BP.AMENITIES = [
    { key: 'pool', label: '수영장', emoji: '🏊' },
    { key: 'gym', label: '헬스장', emoji: '🏋️' },
    { key: 'playground', label: '놀이터', emoji: '🛝' },
    { key: 'bookCafe', label: '북카페', emoji: '📖' },
    { key: 'seniorCenter', label: '노인정', emoji: '👵' },
    { key: 'library', label: '도서관', emoji: '📚' },
    { key: 'golf', label: '골프장', emoji: '⛳' },
    { key: 'sauna', label: '사우나', emoji: '🧖' },
    { key: 'gx', label: 'GX룸', emoji: '💪' },
    { key: 'kidsCafe', label: '키즈카페', emoji: '🧸' },
    { key: 'guestHouse', label: '게스트하우스', emoji: '🏡' },
    { key: 'meetingRoom', label: '입주민회의실', emoji: '🗓️' },
    { key: 'meals', label: '조식 서비스', emoji: '🍳' },
    { key: 'badminton', label: '배드민턴장', emoji: '🏸' },
    { key: 'basketball', label: '농구장', emoji: '🏀' },
    { key: 'cafe', label: '카페', emoji: '☕' },
    { key: 'outdoorGym', label: '야외 운동시설', emoji: '🏃' }
  ];
  BP.amenityCount = function (a) { return BP.AMENITIES.filter(function (m) { return a[m.key] === true; }).length; };
  BP.chip = function (m, on, attr) {
    return '<button type="button" class="chip' + (on ? ' is-on' : '') + '" ' + attr + '="' + m.key + '" aria-pressed="' + on + '"><span class="emo" aria-hidden="true">' + m.emoji + '</span>' + m.label + '</button>';
  };
  // "추정" 표시: 시트에 없어서 계산·추정으로 채운 값
  BP.est = function (a, key) { return a.estimated && a.estimated.indexOf(key) >= 0 ? '<span class="est" title="시트에 없는 값이라 위치·공개 정보로 추정했어요">추정</span>' : ''; };
  BP.hasAll = function (apt, keys) { return keys.every(function (k) { return apt[k] === true; }); };

  /* ---------- formatting ---------- */
  var esc = (BP.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  });
  BP.dash = function (v, suffix) { return v == null || v === '' ? '-' : esc(v) + (suffix || ''); };
  BP.n = function (v) { return v == null ? '-' : Number(v).toLocaleString('ko-KR'); };
  BP.won = function (v) {
    if (v == null) return '-';
    var man = Math.floor(v / 10000), rest = v % 10000;
    return (man ? man + '만 ' : '') + (rest ? rest.toLocaleString('ko-KR') : '') + '원';
  };
  BP.age = function (a) { return a.approvedYear ? new Date().getFullYear() - a.approvedYear : null; };
  BP.aptUrl = function (a) { return '#/apt/' + encodeURIComponent(a.id); };

  /* ---------- storage (never required) ---------- */
  BP.store = {
    get: function (k, fallback) { try { var v = localStorage.getItem('bigyo.' + k); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; } },
    set: function (k, v) { try { localStorage.setItem('bigyo.' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  };

  /* ---------- icons ---------- */
  var P = {
    map: 'M14.1 6.3 9.9 4.2a2 2 0 0 0-1.8 0L3.6 6.5A1 1 0 0 0 3 7.4v12a1 1 0 0 0 1.4.9l3.7-1.8a2 2 0 0 1 1.8 0l4.2 2.1a2 2 0 0 0 1.8 0l4.5-2.3a1 1 0 0 0 .6-.9v-12a1 1 0 0 0-1.4-.9l-3.7 1.8a2 2 0 0 1-1.8 0ZM15 6v15M9 3v15',
    building: 'M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18ZM6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2M10 6h4M10 10h4M10 14h4M10 18h4',
    compare: 'M12 3v18M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2ZM6 8h3M6 12h3M15 8h3M15 12h3',
    tools: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
    school: 'M21.4 10.9a1 1 0 0 0 0-1.8l-8.6-3.9a2 2 0 0 0-1.7 0L2.6 9.1a1 1 0 0 0 0 1.8l8.6 3.9a2 2 0 0 0 1.7 0zM22 10v6M6 12.5V16a6 3 0 0 0 12 0v-3.5',
    search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
    gem: 'M6 3h12l4 6-10 13L2 9ZM11 3 8 9l4 13 4-13-3-6M2 9h20',
    clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
    hammer: 'm15 12-8.4 8.4a2.1 2.1 0 1 1-3-3L12 9M17.6 15 22 10.6M20.9 11.7l-1.2-1.2a2 2 0 0 1-.6-1.4V7.8l-2.3-2.3a5.5 5.5 0 0 0-4-1.6H9l.9.8a6.2 6.2 0 0 1 2 4.5v1.3l2 2h2.5a2 2 0 0 1 1.4.6l1.2 1.2',
    message: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
    shield: 'M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.7 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.5 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1zM9 12l2 2 4-4',
    info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
    menu: 'M4 6h16M4 12h16M4 18h16',
    x: 'M18 6 6 18M6 6l12 12',
    plus: 'M12 5v14M5 12h14',
    check: 'M20 6 9 17l-5-5',
    checkCircle: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM8 12l3 3 5-6',
    back: 'M19 12H5M12 19l-7-7 7-7',
    train: 'M8 3h8a4 4 0 0 1 4 4v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a4 4 0 0 1 4-4zM4 11h16M12 3v8M8 15h.01M16 15h.01M8 19l-2 3M18 22l-2-3',
    wallet: 'M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4',
    calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
    chart: 'M3 3v16a2 2 0 0 0 2 2h16M7 14l4-4 4 4 6-6',
    book: 'M12 7v14M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z',
    pencil: 'M4 20h16M6 20V10l6-6 6 6v10M10 20v-5h4v5',
    university: 'M3 22h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7M12 2l9 5H3z',
    phone: 'M7.2 3.5 9.4 8 7.8 9.6c1.1 2.3 2.9 4.1 5.2 5.2l1.6-1.6 4.5 2.2-.7 4c-.1.7-.8 1.2-1.5 1.2C9.4 20.6 3.4 14.6 3.4 7.1c0-.7.5-1.4 1.2-1.5Z',
    home: 'M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10',
    more: 'M5 12h.01M12 12h.01M19 12h.01',
    chevron: 'M6 9l6 6 6-6',
    car: 'M19 17h2v-5l-2.5-5.5A2 2 0 0 0 16.7 5H7.3a2 2 0 0 0-1.8 1.5L3 12v5h2M3 12h18M7 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0M13 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0',
    tree: 'M12 22v-6M8 16h8l-4-6 3 0-3-6-3 6 3 0z',
    store: 'M3 9l1.5-5h15L21 9M3 9v11h18V9M3 9h18M9 20v-6h6v6',
    send: 'M22 2 11 13M22 2l-7 20-4-9-9-4z',
    mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6',
    pin: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0ZM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    bars: 'M4 20h16M6 16v-4M10 16V8M14 16v-6M18 16V5',
    sparkle: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9ZM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8ZM5 2l.6 1.4L7 4l-1.4.6L5 6l-.6-1.4L3 4l1.4-.6Z',
    hospital: 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4M12 8v6M9 11h6',
    link: 'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7',
    file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h6'
  };
  BP.icon = function (name, cls) {
    return '<svg class="icon ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true"><path d="' + (P[name] || '') + '"/></svg>';
  };
  BP.logo = '<svg viewBox="18 4 214 208" aria-hidden="true"><path d="M125 9 226 69v15L125 25 24 84V69Z" fill="#5c68a6"/><path d="M125 40 222 97v109H58a30 30 0 0 1-30-30V97Z" fill="#5c68a6"/><path d="M70 111 97 103v103H70ZM110 99 140 90v116h-30ZM153 87 182 79v127h-29Z" fill="#d3dcf3"/></svg>';

  /* ---------- photo with graceful fallback ---------- */
  // 사진이 없는 단지는 단지마다 모양이 다른 밤 풍경 그림 (비교파트 페이지 파일과 같은 그림)
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { return function () { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }; }
  BP.skyline = function (a) {
    var id = String(a.id || a.name), r = rng(hash(id)), hue = 216 + Math.round(r() * 18), gid = 'bpg-' + hash(id).toString(36), t = '', x = -12;
    while (x < 400) {
      var w = 38 + Math.round(r() * 34), h = 110 + Math.round(r() * 140), o = (0.1 + r() * 0.14).toFixed(2);
      t += '<rect x="' + x + '" y="' + (300 - h) + '" width="' + w + '" height="' + h + '" fill="#fff" fill-opacity="' + o + '"/>' +
           '<rect x="' + (x + 6) + '" y="' + (310 - h) + '" width="' + (w - 12) + '" height="' + (h - 10) + '" fill="url(#bp-win)"/>';
      x += w + 6 + Math.round(r() * 12);
    }
    return '<svg class="ph-img" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">' +
      '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(' + hue + ',36%,54%)"/>' +
      '<stop offset="1" stop-color="hsl(' + hue + ',42%,26%)"/></linearGradient></defs>' +
      '<rect width="400" height="300" fill="url(#' + gid + ')"/>' + t + '</svg>';
  };
  function creditText(a) { var l = (a.imageCredit && a.imageCredit.label) || ''; return /^사진/.test(l) ? l : '사진: ' + l; }
  BP.photo = function (a, cls) {
    var ph = '<div class="photo-ph">' + BP.skyline(a) + '</div>';
    if (!a.image) return '<div class="photo ' + (cls || '') + '">' + ph + '</div>';
    var cr = a.imageCredit ? '<a class="photo-credit" href="' + esc(a.imageCredit.source || '#') + '" target="_blank" rel="noopener noreferrer">사진: ' + esc(a.imageCredit.label || '') + '</a>' : '';
    return '<div class="photo ' + (cls || '') + '">' + ph +
      '<img src="' + esc(a.image) + '" alt="' + esc(a.name) + ' 전경" loading="lazy" decoding="async" onerror="this.remove()" style="position:relative">' + cr +
      '</div>';
  };

  var ICON_PLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
  var ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
  var ICON_EXT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>';
  BP.ICON_EXT = ICON_EXT;
  function fab(a) {
    var on = BP.compare.has(a.id);
    return '<button type="button" class="fab" data-compare="' + esc(a.id) + '" aria-pressed="' + on + '" aria-label="' +
      esc(a.name) + (on ? ' 비교함에서 빼기' : ' 비교함에 담기') + '">' + (on ? ICON_CHECK : ICON_PLUS) + '</button>';
  }
  BP.fabIcon = function (on) { return on ? ICON_CHECK : ICON_PLUS; };

  /* ----- 카카오 지도 썸네일 (첨부된 비교파트 페이지와 같은 방식) -----
     사진이 없는 단지는 config.js 의 kakaoMapKey 가 있으면 카드에 단지 위치 지도를 보여 줘요.
     키가 없거나 이 주소가 카카오에 등록돼 있지 않으면 기본 그림 그대로예요. */
  var KAKAO_KEY = CONFIG.kakaoMapKey || '';
  var MAP_ON = !!KAKAO_KEY;
  var mapHTML = {}, sdk = null;
  function loadKakao() {
    if (sdk) return sdk;
    sdk = new Promise(function (resolve, reject) {
      var sc = document.createElement('script');
      sc.src = 'https://dapi.kakao.com/v2/maps/sdk.js?appkey=' + encodeURIComponent(KAKAO_KEY) + '&autoload=false';
      sc.onload = function () { try { window.kakao.maps.load(function () { resolve(window.kakao); }); } catch (e) { reject(e); } };
      sc.onerror = reject;
      document.head.appendChild(sc);
    });
    return sdk;
  }
  function drawMap(el) {
    var a = byId[el.getAttribute('data-map')], box = el.parentNode;
    loadKakao().then(function (k) {
      var pos = new k.maps.LatLng(a.lat, a.lng);
      el.innerHTML = '';
      new k.maps.StaticMap(el, { center: pos, level: 4, marker: { position: pos } });
      mapHTML[a.id] = el.innerHTML;
      box.classList.add('is-ready');
    }).catch(function () { MAP_ON = false; box.classList.add('no-map'); });
  }
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); drawMap(e.target); } });
  }, { rootMargin: '300px 0px' }) : null;
  BP.hydrateMaps = function (root) {
    if (!MAP_ON) return;
    (root || document).querySelectorAll('.ph-map:not([data-on])').forEach(function (el) {
      el.setAttribute('data-on', '1');
      if (mapHTML[el.getAttribute('data-map')]) return;
      if (io) io.observe(el); else drawMap(el);
    });
  };

  // 단지 카드 (단지 목록 · 맞춤 추천 · 리뷰가 같이 써요). body: 카드 아래쪽 내용, rank: 순위(없으면 0)
  BP.card = function (a, body, rank, cls) {
    var rankHTML = rank ? '<span class="rank" aria-label="' + rank + '위">' + rank + '</span>' : '';
    return '<article class="card apt' + (cls ? ' ' + cls : '') + '">' +
      '<div class="ph ph--top' + (!a.image && MAP_ON && a.lat ? ' ph--map' + (mapHTML[a.id] ? ' is-ready' : '') : '') + '">' + BP.skyline(a) +
        (a.image ? '<img class="ph-img ph-photo" src="' + esc(a.image) + '" alt="' + esc(a.name) + ' 전경" loading="lazy" onerror="this.remove()">' : '') +
        (a.image && a.imageCredit ? '<span class="ph-credit">' + esc(creditText(a)) + '</span>' : '') +
        (!a.image && MAP_ON && a.lat ? '<div class="ph-map" data-map="' + esc(a.id) + '">' + (mapHTML[a.id] || '') + '</div>' : '') +
        '<a class="ph-link" href="' + BP.aptUrl(a) + '" aria-label="' + esc(a.name) + ' 상세 정보"></a>' +
        '<div class="ph-cap">' + rankHTML + '<span>' + esc(areasOf(a).join(' · ')) + '</span><h3><a href="' + BP.aptUrl(a) + '">' + esc(a.name) + '</a></h3></div>' +
        fab(a) + '</div>' +
      '<div class="stats">' +
        '<div><span>세대수</span><b>' + (a.households ? BP.n(a.households) + '세대' : '-') + '</b></div>' +
        '<div><span>입주</span><b>' + esc(BP.moveShort(a)) + '</b></div>' +
        '<div><span>커뮤니티</span><b>' + BP.amenityCount(a) + '종</b></div></div>' +
      '<div class="apt-body"><p class="apt-addr">' + esc(a.address || '') + '</p>' + (body || '') +
        '<div class="apt-foot"><a class="more-link" href="' + BP.aptUrl(a) + '">상세 보기</a>' +
        (a.link ? '<a class="ext" href="' + esc(a.link) + '" target="_blank" rel="noopener noreferrer">시세·단지 정보' + ICON_EXT + '</a>' : '') + '</div>' +
      '</div></article>';
  };

  /* ---------- compare tray ---------- */
  var MAX_COMPARE = 3;
  BP.MAX_COMPARE = MAX_COMPARE;
  BP.compare = {
    list: function () { return BP.store.get('compare', []).filter(function (id) { return byId[id]; }); },
    has: function (id) { return BP.compare.list().indexOf(id) >= 0; },
    toggle: function (id) {
      var list = BP.compare.list(), i = list.indexOf(id);
      if (i >= 0) { list.splice(i, 1); BP.toast('비교함에서 뺐어요'); }
      else if (list.length >= MAX_COMPARE) { BP.toast('최대 ' + MAX_COMPARE + '개까지 비교할 수 있어요'); return list.indexOf(id) >= 0; }
      else { list.push(id); BP.toast('비교함에 담았어요'); }
      BP.store.set('compare', list);
      BP.refreshTray();
      BP.compare._emit();
      return list.indexOf(id) >= 0;
    },
    set: function (ids) { BP.store.set('compare', ids.filter(function (id, i) { return byId[id] && ids.indexOf(id) === i; }).slice(0, MAX_COMPARE)); BP.refreshTray(); BP.compare._emit(); },
    clear: function () { BP.store.set('compare', []); BP.refreshTray(); BP.toast('비교함을 비웠어요'); BP.compare._emit(); },
    _subs: [],
    on: function (fn) { BP.compare._subs.push(fn); },
    _emit: function () { BP.compare._subs.forEach(function (fn) { try { fn(BP.compare.list()); } catch (e) { /* page gone */ } }); }
  };
  BP.compareButton = function (a, round) {
    var on = BP.compare.has(a.id);
    if (round) {
      return '<button type="button" class="round-toggle' + (on ? ' is-on' : '') + '" data-compare="' + esc(a.id) + '" aria-pressed="' + on + '" aria-label="' + esc(a.name) + ' 비교함에 담기">' + BP.icon(on ? 'check' : 'plus', 'sm') + '</button>';
    }
    return '<button type="button" class="btn btn-soft' + (on ? ' is-on' : '') + '" data-compare="' + esc(a.id) + '" aria-pressed="' + on + '">' + BP.icon(on ? 'check' : 'plus', 'sm') + '<span>' + (on ? '비교함에 담김' : '비교함에 담기') + '</span></button>';
  };
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-compare]');
    if (!btn) return;
    e.preventDefault();
    var on = BP.compare.toggle(btn.getAttribute('data-compare'));
    document.querySelectorAll('[data-compare="' + CSS.escape(btn.getAttribute('data-compare')) + '"]').forEach(function (b) {
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on);
      if (b.classList.contains('fab')) { b.innerHTML = BP.fabIcon(on); b.setAttribute('aria-label', b.getAttribute('aria-label').replace(/ 비교함.*$/, on ? ' 비교함에서 빼기' : ' 비교함에 담기')); return; }
      var round = b.classList.contains('round-toggle');
      b.innerHTML = round ? BP.icon(on ? 'check' : 'plus', 'sm') : BP.icon(on ? 'check' : 'plus', 'sm') + '<span>' + (on ? '비교함에 담김' : '비교함에 담기') + '</span>';
    });
  });

  BP.refreshTray = function () {
    var list = BP.compare.list();
    document.querySelectorAll('[data-compare-count]').forEach(function (el) { el.textContent = list.length || ''; });
    var tray = document.getElementById('tray');
    if (!tray) return;
    var onCompare = BP.parseHash().name === 'compare';
    tray.classList.toggle('is-visible', list.length > 0 && !onCompare);
    tray.querySelector('.tray-names').innerHTML = '<b>' + list.length + '개</b><span>' + list.map(function (id) { return esc(byId[id].name); }).join(', ') + '</span>';
    var go = tray.querySelector('.tray-go');
    if (go) {
      var ready = list.length >= 2;
      go.setAttribute('aria-disabled', String(!ready));
      go.textContent = ready ? '비교하기' : '1개 더 담기';
    }
  };

  BP.copy = function (text) {
    function fallback() {
      try {
        var ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        var ok = document.execCommand('copy'); ta.remove(); return ok;
      } catch (e) { return false; }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).then(function () { return true; }, fallback);
    return Promise.resolve(fallback());
  };

  var toastTimer;
  BP.toast = function (msg) {
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('is-visible'); }, 1800);
  };

  /* ---------- apartment picker (select element) ---------- */
  BP.aptOptions = function (selected, opts) {
    opts = opts || {};
    var list = DATA.filter(opts.filter || function () { return true; });
    return BP.areas().map(function (area) {
      var items = list.filter(function (a) { return a.dong === area; });
      if (!items.length) return '';
      return '<optgroup label="' + esc(area) + '">' + items.map(function (a) {
        return '<option value="' + esc(a.id) + '"' + (a.id === selected ? ' selected' : '') + '>' + esc(a.name) + '</option>';
      }).join('') + '</optgroup>';
    }).join('');
  };

  /* ---------- router ---------- */
  BP.pages = {};
  BP.page = function (name, def) { BP.pages[name] = def; };

  /*
   * URLs. Pages always refer to each other as "#/apartments", "#/apt/<name>" …
   * On the website those are shown as clean addresses (내도메인.com/apartments,
   * 내도메인.com/apt?id=<name>). scripts/build-pages.js writes a copy of
   * index.html for every page (apartments.html …) so GitHub Pages can serve them.
   * Inside the apps (local files) the #/ addresses are kept — nobody sees them there.
   */
  var CLEAN = CONFIG.cleanUrls !== false && /^https?:$/.test(location.protocol) && !BP.inApp && location.hostname !== 'appassets.androidplatform.net';
  BP.cleanUrls = CLEAN;
  var BASE = (function () {
    var site = (window.BIGYO_CONFIG || {}).siteUrl || '';
    var m = site.match(/^https?:\/\/([^/]+)(\/.*)?$/);
    if (m && m[1] === location.host) return (m[2] || '/').replace(/[^/]*$/, '');
    return location.pathname.replace(/[^/]*$/, '');
  })();

  // "#/apt/래미안?x=1" → "/apt?id=래미안&x=1"
  BP.url = function (route) {
    if (!CLEAN) return route;
    var h = String(route).replace(/^#\/?/, '');
    var qi = h.indexOf('?');
    var path = qi >= 0 ? h.slice(0, qi) : h;
    var q = qi >= 0 ? h.slice(qi + 1) : '';
    var parts = path.split('/').filter(Boolean);
    if (parts[0] === 'apt' && parts[1]) return BASE + 'apt?id=' + parts[1] + (q ? '&' + q : '');
    return BASE + path + (q ? '?' + q : '');
  };
  // The current address, always in "#/…" form
  BP.route = function () {
    var hash = location.hash || '';
    if (!CLEAN || hash.indexOf('#/') === 0) return hash.indexOf('#/') === 0 ? hash : '#/';
    var rest = location.pathname.slice(BASE.length).replace(/\.html$/, '').replace(/^index$/, '');
    var search = location.search.replace(/^\?/, '');
    if (rest === 'apt') {
      var id = '', others = [];
      search.split('&').forEach(function (kv) {
        if (!kv) return;
        if (kv.indexOf('id=') === 0) id = kv.slice(3); else others.push(kv);
      });
      return '#/apt/' + id + (others.length ? '?' + others.join('&') : '');
    }
    return '#/' + rest + (search ? '?' + search : '');
  };

  BP.parseHash = function () {
    var h = BP.route().replace(/^#\/?/, '');
    var qi = h.indexOf('?');
    var path = qi >= 0 ? h.slice(0, qi) : h;
    var query = {};
    if (qi >= 0) h.slice(qi + 1).split('&').forEach(function (kv) {
      if (!kv) return;
      var p = kv.split('=');
      query[decodeURIComponent(p[0])] = decodeURIComponent((p[1] || '').replace(/\+/g, ' '));
    });
    var parts = path.split('/').filter(Boolean).map(decodeURIComponent);
    return { name: parts[0] || 'home', params: parts.slice(1), query: query };
  };
  BP.go = function (route) {
    if (!CLEAN) { location.hash = route; return; }
    history.pushState(null, '', BP.url(route));
    BP._navCount++;
    BP.render();
  };
  BP.setQuery = function (query) {
    var r = BP.parseHash();
    var qs = Object.keys(query).filter(function (k) { return query[k] != null && query[k] !== ''; })
      .map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(query[k]); }).join('&');
    var base = '#/' + [r.name].concat(r.params).map(encodeURIComponent).join('/');
    history.replaceState(null, '', BP.url(base + (qs ? '?' + qs : '')));
  };
  // Show clean addresses on links (so "copy link" and "open in new tab" work)
  BP.linkify = function (root) {
    if (BP.hydrateMaps) BP.hydrateMaps(root);
    if (!CLEAN) return;
    (root || document).querySelectorAll('a[href^="#/"]').forEach(function (a) {
      var r = a.getAttribute('href');
      a.setAttribute('data-route', r);
      a.setAttribute('href', BP.url(r));
    });
  };
  if (CLEAN) {
    // old #/ links and /index.html → clean address
    var now = BP.url(BP.route());
    if (now !== location.pathname + location.search) history.replaceState(null, '', now);
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[data-route], a[href^="#/"]');
      if (!a || (a.target && a.target !== '_self')) return;
      e.preventDefault();
      BP.go(a.getAttribute('data-route') || a.getAttribute('href'));
    });
    window.addEventListener('popstate', function () { BP._navCount++; BP.render(); });
  }

  BP.render = function () {
    var r = BP.parseHash();
    var page = BP.pages[r.name] || BP.pages.notfound;
    var view = document.getElementById('view');
    var ctx = { params: r.params, query: r.query };
    BP.compare._subs = [];
    var holder = document.createElement('div');
    holder.className = 'route route-' + r.name;
    holder.innerHTML = page.render(ctx);
    view.replaceChildren(holder);
    document.title = (typeof page.title === 'function' ? page.title(ctx) : page.title) || '비교파트';
    document.body.setAttribute('data-page', r.name);
    document.querySelectorAll('[data-nav]').forEach(function (a) {
      var names = a.getAttribute('data-nav').split(' ');
      a.classList.toggle('is-active', names.indexOf(r.name) >= 0);
    });
    if (page.mount) page.mount(holder, ctx);
    BP.linkify(document);
    BP.closeDrawer();
    BP.refreshTray();
    if (!page.keepScroll) window.scrollTo(0, 0);
    var h1 = view.querySelector('h1');
    if (h1 && BP._rendered) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
    BP._rendered = true;
  };

  /* ---------- Korean form validation messages ---------- */
  function koMessage(el) {
    var v = el.validity;
    if (v.valueMissing) {
      if (el.type === 'checkbox') return '동의 항목에 체크해 주세요.';
      if (el.tagName === 'SELECT') return '항목을 선택해 주세요.';
      return '이 항목을 입력해 주세요.';
    }
    if (v.typeMismatch && el.type === 'email') return '이메일 주소를 정확히 입력해 주세요.';
    if (v.rangeUnderflow || v.rangeOverflow) return '입력할 수 있는 범위를 확인해 주세요.';
    if (v.badInput) return '숫자만 입력해 주세요.';
    return '';
  }
  document.addEventListener('invalid', function (e) {
    var el = e.target;
    el.setCustomValidity('');
    var msg = koMessage(el);
    if (msg) el.setCustomValidity(msg);
  }, true);
  ['input', 'change'].forEach(function (type) {
    document.addEventListener(type, function (e) { if (e.target.setCustomValidity) e.target.setCustomValidity(''); }, true);
  });

  BP.openDrawer = function () { document.body.classList.add('drawer-open'); };
  BP.closeDrawer = function () { document.body.classList.remove('drawer-open'); };

  BP.back = function (fallback) {
    if (history.length > 1 && BP._navCount > 1) history.back();
    else BP.go(fallback || '#/');
  };
  BP._navCount = 0;
  window.addEventListener('hashchange', function () {
    if (location.hash && location.hash.indexOf('#/') !== 0) return;   // e.g. the "#view" skip link
    if (CLEAN) history.replaceState(null, '', BP.url(BP.route()));
    BP._navCount++;
    BP.render();
  });

  BP.backLink = function (fallback, label) {
    return '<button type="button" class="back-link" onclick="BP.back(\'' + (fallback || '#/') + '\')">' + BP.icon('back', 'sm') + (label || '뒤로가기') + '</button>';
  };
})();
