/* 모든 아파트 + 아파트 상세 */
(function () {
  'use strict';
  var esc = BP.esc, dash = BP.dash;

  /* ---------- 모든 아파트 (단지 목록) — 첨부된 비교파트 '모든 아파트' 페이지 그대로 ---------- */
  var PAGE = 24;
  function byName(a, b) { return a.name.localeCompare(b.name, 'ko'); }
  var SORT = {
    name: byName,
    hh: function (a, b) { return (b.households || 0) - (a.households || 0) || byName(a, b); },
    'new': function (a, b) { return BP.moveKey(b) - BP.moveKey(a) || byName(a, b); },
    fac: function (a, b) { return BP.amenityCount(b) - BP.amenityCount(a) || byName(a, b); }
  };
  var LABEL = {}; BP.AMENITIES.forEach(function (m) { LABEL[m.key] = m.label; });

  BP.facTags = function (a, hitKeys) {
    var on = BP.AMENITIES.filter(function (m) { return a[m.key] === true; });
    if (!on.length) return '<p class="tag-none">표시된 커뮤니티 시설이 없어요</p>';
    return '<div class="tags">' + on.map(function (m) {
      return '<span class="tag' + (hitKeys && hitKeys.indexOf(m.key) >= 0 ? ' hit' : '') + '">' + esc(m.label) + '</span>';
    }).join('') + '</div>';
  };

  BP.page('apartments', {
    title: '모든 아파트 | 비교파트',
    render: function () {
      return '<div class="bp-root pg-list"><main class="page">' +
        '<div class="page-head"><div><h1>모든 아파트</h1><p data-sub></p></div></div>' +
        '<div class="controls">' +
          '<label class="search">' + BP.icon('search') + '<span class="sr">단지 검색</span><input type="search" data-q placeholder="단지명, 지역, 주소로 검색" autocomplete="off"></label>' +
          '<label class="sr" for="areaSel">지역</label><select class="select" id="areaSel" data-area></select>' +
          '<label class="sr" for="sortSel">정렬</label><select class="select" id="sortSel" data-sort>' +
            '<option value="name">이름순</option><option value="hh">세대수 많은 순</option><option value="new">입주 최신순</option><option value="fac">커뮤니티 많은 순</option></select>' +
        '</div>' +
        '<p class="fac-t">커뮤니티 시설<span>고른 시설을 모두 갖춘 단지만 보여 줘요</span></p>' +
        '<div class="chips" id="facChips" data-chips></div>' +
        '<div class="res-bar"><p class="res-count" data-count aria-live="polite"></p><button type="button" class="btn" data-reset hidden>필터 초기화</button></div>' +
        '<div class="grid" data-cards></div>' +
        '<div class="more-wrap" data-more-wrap hidden><p data-more-info></p><button type="button" class="btn more-btn" data-more>더 보기</button></div>' +
      '</main></div>';
    },
    mount: function (root, ctx) {
      var q0 = ctx.query;
      var state = {
        q: q0.q || '',
        area: BP.areas().indexOf(q0.area) >= 0 ? q0.area : '',
        fac: String(q0.fac || q0.amenities || '').split(',').filter(function (k) { return LABEL[k]; }),
        sort: SORT[q0.sort] ? q0.sort : 'name',
        shown: PAGE
      };
      var $ = function (sel) { return root.querySelector(sel); };
      function write() {
        BP.setQuery({ area: state.area, q: state.q, fac: state.fac.join(','), sort: state.sort === 'name' ? '' : state.sort });
      }
      function filtered() {
        var t = state.q.trim().toLowerCase().replace(/\s+/g, '');
        return BP.inArea(state.area).filter(function (a) {
          if (t && (a.name + BP.areasOf(a).join('') + (a.address || '')).toLowerCase().replace(/\s+/g, '').indexOf(t) < 0) return false;
          return BP.hasAll(a, state.fac);
        }).sort(SORT[state.sort]);
      }
      function chips() {
        $('[data-chips]').innerHTML = BP.AMENITIES.map(function (m) {
          return '<button type="button" class="chip" data-fac="' + m.key + '" aria-pressed="' + (state.fac.indexOf(m.key) >= 0) + '"><span aria-hidden="true">' + m.emoji + '</span>' + esc(m.label) + '</button>';
        }).join('');
      }
      function render() {
        var list = filtered(), scopeN = BP.inArea(state.area).length;
        $('[data-sub]').textContent = !state.area
          ? BP.areas().length + '개 지역, ' + BP.n(BP.apartments.length) + '개 단지를 실거주 데이터로 살펴보세요.'
          : state.area + '의 ' + scopeN + '개 단지를 실거주 데이터로 살펴보세요.';
        $('[data-count]').innerHTML = '<b>' + BP.n(list.length) + '</b>개 단지' + (list.length !== scopeN ? ' · 전체 ' + BP.n(scopeN) + '개 중' : '');
        $('[data-reset]').hidden = !(state.q || state.fac.length || state.area || state.sort !== 'name');
        var shown = list.slice(0, state.shown);
        $('[data-cards]').innerHTML = shown.length
          ? shown.map(function (a) { return BP.card(a, BP.facTags(a, state.fac)); }).join('')
          : '<p class="no-result">조건에 맞는 단지가 없어요. 시설 필터를 줄여 보세요.</p>';
        var more = list.length > shown.length;
        $('[data-more-wrap]').hidden = !more;
        if (more) $('[data-more-info]').textContent = shown.length + ' / ' + list.length + '개';
        BP.linkify(root);
      }
      function changed() { state.shown = PAGE; write(); render(); }

      $('[data-area]').innerHTML = BP.areaOptions(state.area);
      $('[data-sort]').value = state.sort;
      $('[data-q]').value = state.q;
      chips();
      render();
      $('[data-q]').addEventListener('input', function (e) { state.q = e.target.value; changed(); });
      $('[data-area]').addEventListener('change', function (e) { state.area = e.target.value; changed(); });
      $('[data-sort]').addEventListener('change', function (e) { state.sort = e.target.value; changed(); });
      $('[data-chips]').addEventListener('click', function (e) {
        var b = e.target.closest('[data-fac]'); if (!b) return;
        var k = b.getAttribute('data-fac');
        state.fac = state.fac.indexOf(k) >= 0 ? state.fac.filter(function (x) { return x !== k; }) : state.fac.concat(k);
        b.setAttribute('aria-pressed', String(state.fac.indexOf(k) >= 0));
        changed();
      });
      $('[data-reset]').addEventListener('click', function () {
        state = { q: '', area: '', fac: [], sort: 'name', shown: PAGE };
        $('[data-q]').value = ''; $('[data-area]').value = ''; $('[data-sort]').value = 'name';
        chips(); changed();
      });
      $('[data-more]').addEventListener('click', function () { state.shown += PAGE; render(); });
    }
  });

  // 예전 카드 (분석 도구 페이지들에서 씀)
  BP.aptCard = function (a, extra) { return BP.card(a, extra || BP.facTags(a)); };

  /* ---------- detail ---------- */
  function kv(rows) {
    return '<dl class="kv">' + rows.filter(function (r) { return r && r[1] != null && r[1] !== ''; }).map(function (r) {
      var v = Array.isArray(r[1]) ? '<ul class="sub-list">' + r[1].map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : r[1];
      return '<dt>' + r[0] + '</dt><dd>' + v + '</dd>';
    }).join('') + '</dl>';
  }

  function timeBars(a) {
    var rows = [['강남역', a.toGangnam], ['여의도역', a.toYeouido], ['광화문역', a.toGwanghwamun]].filter(function (r) { return r[1] != null; });
    if (!rows.length) return '<p class="muted">이동시간 정보가 아직 없어요.</p>';
    return '<div class="time-bars">' + rows.map(function (r) {
      return '<div class="time-bar"><span>' + r[0] + '</span><div class="track"><div class="fill" style="width:' + Math.min(100, r[1] / 60 * 100) + '%"></div></div><b>' + r[1] + '분</b></div>';
    }).join('') + '</div>';
  }

  BP.HOSPITALS = [['general', '종합병원'], ['pharmacy', '약국'], ['internal', '내과'], ['pediatric', '소아과'], ['ortho', '정형외과'], ['dental', '치과'], ['eye', '안과'], ['ent', '이비인후과'], ['derm', '피부과'], ['vet', '동물병원']];
  BP.NEARBY = [['convenience', '편의점', '🏪'], ['mart', '마트', '🛒'], ['daiso', '다이소', '🧺'], ['park', '공원', '🌳'], ['bank', '은행', '🏦'], ['post', '우체국', '📮'],
    ['daycare', '어린이집', '🧒'], ['kindergarten', '유치원', '🎒'], ['stationery', '문구점', '✏️'], ['hair', '미용실', '💇'], ['cosmetics', '화장품매장', '💄'], ['optician', '안경점', '👓'],
    ['pilates', '필라테스', '🧘'], ['sauna', '사우나·목욕탕', '♨️'], ['karaoke', '노래방', '🎤'], ['oriental', '한의원', '🌿'], ['nursing', '요양원', '🏥'], ['church', '교회', '⛪'], ['parking', '공영주차장', '🅿️']];

  function split(text) {
    var m = String(text || '').match(/^(.*?)\s*\(([^()]*)\)\s*$/);
    return m ? { name: m[1], dist: m[2] } : { name: text, dist: '' };
  }
  function distClass(m) { return m == null ? '' : m <= 300 ? 'near' : m <= 700 ? 'mid' : 'far'; }

  function placeList(a, group, defs) {
    var src = a[group] || {};
    return '<ul class="place-list">' + defs.map(function (d) {
      var v = src[d[0]];
      if (!v) return '<li class="none"><span class="pl-k">' + (d[2] ? '<i aria-hidden="true">' + d[2] + '</i>' : '') + d[1] + '</span><span class="pl-v">정보 없음</span></li>';
      var p = split(v.text);
      return '<li><span class="pl-k">' + (d[2] ? '<i aria-hidden="true">' + d[2] + '</i>' : '') + d[1] + '</span><span class="pl-v">' + esc(p.name) + '</span><b class="pl-d ' + distClass(v.m) + '">' + esc(p.dist) + '</b></li>';
    }).join('') + '</ul>';
  }

  BP.page('apt', {
    title: function (ctx) { var a = BP.get(ctx.params[0]); return (a ? a.name : '아파트') + ' | 비교파트'; },
    render: function (ctx) {
      var a = BP.get(ctx.params[0]);
      if (!a) return BP.pages.notfound.render();
      var age = BP.age(a);
      var amenityHtml = BP.AMENITIES.map(function (m) {
        var v = a[m.key];
        return '<div class="amenity ' + (v === true ? 'yes' : v === false ? '' : 'unknown') + '"><span class="emo" aria-hidden="true">' + m.emoji + '</span>' + m.label +
          '<span class="sr-only">' + (v === true ? ' 있음' : v === false ? ' 없음' : ' 정보 없음') + '</span></div>';
      }).join('');
      var rb = a.rebuild;

      var basic = [
        ['주소', a.address ? esc(a.address) : null],
        ['세대수', a.households ? BP.n(a.households) + '세대' + (a.householdsNote ? ' <span class="muted">(' + esc(a.householdsNote) + ')</span>' : '') : null],
        ['입주', a.approved ? esc(a.approved) + (age != null ? ' <span class="muted">(' + age + '년차)</span>' : '') : null],
        ['건설사', a.builder ? esc(a.builder) + BP.est(a, 'builder') : null]
      ];
      var basic2 = [
        ['용적률', a.far != null ? a.far + '%' : null],
        ['건폐율', a.bcr != null ? a.bcr + '%' : null],
        ['시세', a.price ? esc(a.price) : null],
        ['생활권', esc(a.dong) + (a.alsoIn ? ' <span class="muted">· ' + a.alsoIn.map(esc).join(', ') + ' 생활권에도 포함</span>' : '')]
      ];

      return '<div class="page">' + BP.backLink('#/apartments') +
        '<section class="detail-hero">' + BP.photo(a) +
          '<div class="hero-text">' +
            '<div><span class="area">' + esc(a.dong || '') + (a.gu ? ' · ' + esc(a.gu) : '') + '</span><h1>' + esc(a.name) + '</h1>' +
              '<p class="sub">' + [a.address, a.approved && a.approved + ' 입주'].filter(Boolean).map(esc).join(' · ') + '</p></div>' +
            '<div class="detail-actions">' + BP.compareButton(a) +
              '<a class="btn btn-ghost" href="#/commute?id=' + encodeURIComponent(a.id) + '">' + BP.icon('clock', 'sm') + '출퇴근 분석</a>' +
              (a.link ? '<a class="btn btn-ghost" href="' + esc(a.link) + '" target="_blank" rel="noopener">' + BP.icon('link', 'sm') + '시세·매물 보기</a>' : '') +
            '</div>' +
          '</div>' +
        '</section>' +
        '<dl class="keyfacts">' +
          '<div><dt>세대수</dt><dd>' + (a.households ? BP.n(a.households) + '<small>세대</small>' : '-') + '</dd></div>' +
          '<div><dt>입주 후</dt><dd>' + (age != null ? age + '<small>년</small>' : '-') + '</dd></div>' +
          '<div><dt>커뮤니티 시설</dt><dd>' + BP.amenityCount(a) + '<small>/ ' + BP.AMENITIES.length + '개</small></dd></div>' +
          '<div><dt>추천 점수</dt><dd>' + (a.valueScore != null ? a.valueScore + '<small>점' + (a.recommendLevel ? ' · ' + esc(a.recommendLevel) : '') + '</small>' : '-') + '</dd></div>' +
        '</dl>' +
        (a.review ? '<figure class="verdict">' + BP.icon('message') + '<figcaption><p>' + esc(a.review) + '</p>' +
          ((a.keywords || []).length ? '<div class="chip-row verdict-tags">' + a.keywords.map(function (k) { return '<span class="tag blue"># ' + esc(k) + '</span>'; }).join('') + '</div>' : '') +
          '<small>비교파트 한줄평</small></figcaption></figure>' : '') +

        '<div class="detail-grid">' +
          '<section class="panel span-2"><h2 class="panel-title">기본 정보</h2><div class="kv-2col">' + kv(basic) + kv(basic2) + '</div></section>' +

          '<section class="panel span-2"><h2 class="panel-title">커뮤니티 시설 <span class="count-badge">' + BP.amenityCount(a) + '개 있음</span></h2>' +
            '<div class="amenity-grid">' + amenityHtml + '</div></section>' +

          '<section class="panel"><h2 class="panel-title">교통과 업무지구</h2>' + kv([
            ['가까운 역', a.subway ? esc(a.subway) + BP.est(a, 'subway') : '-'],
            ['역까지 도보', a.subwayMin != null ? a.subwayMin + '분' : '-']
          ]) + '<div style="margin-top:20px">' + timeBars(a) + '</div>' +
          '<p class="hint" style="margin:14px 0 0">이동시간은 지도상 위치로 계산한 대중교통 추정치예요. <a href="#/commute?id=' + encodeURIComponent(a.id) + '">출퇴근 스트레스 등급 보기</a></p></section>' +

          '<section class="panel"><h2 class="panel-title">학군</h2>' +
            (a.eduScore != null ? '<div class="score-row" style="margin-bottom:18px"><span class="medal sm">' + a.eduScore + '</span><div><div class="label">교육 환경 점수' + BP.est(a, 'eduScore') + '</div><div style="font-weight:750">' + a.eduScore + '점 / 100</div></div></div>' : '') +
            placeList({ s: { elementary: a.elementary && { text: a.elementary }, middle: a.middle && { text: a.middle }, high: a.high && { text: a.high },
              kindergarten: (a.nearby || {}).kindergarten, daycare: (a.nearby || {}).daycare } }, 's',
              [['elementary', '초등학교'], ['middle', '중학교'], ['high', '고등학교'], ['kindergarten', '유치원'], ['daycare', '어린이집']]) +
            '<p class="hint" style="margin:14px 0 0"><a href="#/school?ids=' + encodeURIComponent(a.id) + '">다른 단지와 학군 비교하기</a></p></section>' +

          '<section class="panel"><h2 class="panel-title">' + BP.icon('hospital') + '병원·약국</h2>' + placeList(a, 'hospitals', BP.HOSPITALS) + '</section>' +

          '<section class="panel"><h2 class="panel-title">' + BP.icon('store') + '주변 생활시설</h2>' + placeList(a, 'nearby', BP.NEARBY.slice(0, 10)) + '</section>' +
          '<section class="panel span-2"><h2 class="panel-title">그 밖의 주변 시설</h2><div class="place-cols">' + placeList(a, 'nearby', BP.NEARBY.slice(10)) + '</div></section>' +

          ((rb || a.valueScore != null) ? '<section class="panel span-2"><h2 class="panel-title">비교파트 분석</h2><div class="cols" style="--n:2">' +
            (rb && rb.total != null ? '<div class="score-row"><span class="medal sm">' + rb.total + '</span><div><div class="label">재건축 가능성 (30점 만점)' + BP.est(a, 'rebuild') + '</div><div style="font-weight:750">' + (rb.grade ? rb.grade + '등급' : '') + ' <a class="hint" href="#/rebuild?ids=' + encodeURIComponent(a.id) + '">자세히</a></div></div></div>' : '') +
            (a.valueScore != null ? '<div class="score-row"><span class="medal sm">' + a.valueScore + '</span><div><div class="label">추천 점수' + (a.recommendLevel ? ' · ' + esc(a.recommendLevel) : '') + '</div><div style="font-weight:750">' + (a.valueFeatures || []).length + '가지 강점 <a class="hint" href="#/value?area=' + encodeURIComponent(a.dong || '') + '">비슷한 단지 찾기</a></div></div></div>' : '') +
          '</div>' + ((a.valueFeatures || []).length ? '<div class="chip-row" style="margin-top:18px">' + a.valueFeatures.map(function (f) { return '<span class="tag blue">' + esc(f) + '</span>'; }).join('') + '</div>' : '') + '</section>' : '') +
        '</div>' +
        '<p class="hint" style="margin-top:18px"><span class="est">추정</span> 표시는 시트에 없는 값을 위치와 공개 정보로 계산해 채운 값이에요. 실제와 다를 수 있어요.</p>' +
      '</div>';
    }
  });
})();
