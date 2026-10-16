/* 맞춤 단지 추천 — 첨부된 비교파트 '맞춤 추천' 페이지를 옮겼어요. 키워드는 시트의 '키워드' 탭 값이에요. */
(function () {
  'use strict';
  var esc = BP.esc;
  var PAGE = 24;
  function has(a, v) { return a.indexOf(v) >= 0; }

  // 키워드: 데이터에 있는 것만, 아래 순서로 (새 키워드는 맨 뒤에 붙어요)
  var ORDER = ['교통', '입지', '도심접근성', '직주근접', '생활편의', '상권', '학군', '교육환경', '학원가', '목동학군',
    '가족친화', '공원', '녹지', '산책환경', '서울숲생활권', '한강생활권', '한강조망', '조용한환경', '주거쾌적성',
    '신축', '대단지', '브랜드단지', '커뮤니티', '재건축'];
  var EMOJI = { 교통: '🚇', 입지: '📍', 도심접근성: '🏙️', 직주근접: '💼', 생활편의: '🛒', 상권: '🛍️', 학군: '🎓',
    교육환경: '📚', 학원가: '✏️', 목동학군: '🏫', 가족친화: '👨‍👩‍👧', 공원: '🌳', 녹지: '🌿', 산책환경: '🚶',
    서울숲생활권: '🌲', 한강생활권: '🌊', 한강조망: '🌉', 조용한환경: '🌙', 주거쾌적성: '☀️', 신축: '✨',
    대단지: '🏘️', 브랜드단지: '🏷️', 커뮤니티: '🏊', 재건축: '🏗️' };
  var present = [];
  BP.apartments.forEach(function (c) { (c.keywords || []).forEach(function (k) { if (present.indexOf(k) < 0) present.push(k); }); });
  var KW = ORDER.filter(function (k) { return has(present, k); }).concat(present.filter(function (k) { return !has(ORDER, k); }));
  BP.KEYWORDS = KW; BP.KW_EMOJI = EMOJI;

  function level(s) {
    if (s >= 100) return [4, '모두 맞아요'];
    if (s >= 67) return [3, '잘 맞아요'];
    if (s >= 34) return [2, '일부 맞아요'];
    return [1, '조금 맞아요'];
  }
  var CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
  var SPARK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3Z"/></svg>';

  function body(it, P, M, dim) {
    var c = it.c, kws = c.keywords || [], selected = P.concat(M), scoreHTML;
    if (dim) {
      scoreHTML = it.untagged ? '<p class="missing">키워드 조사 전이라 추천에서 뺐어요</p>' : '<p class="missing">없는 필수 조건: ' + it.miss.map(esc).join(', ') + '</p>';
    } else if (it.untagged) {
      scoreHTML = '<div class="score wait">' + SPARK + '키워드 조사 전인 단지예요</div>';
    } else if (!selected.length) {
      scoreHTML = '<div class="score wait">' + SPARK + '키워드를 고르면 나와 맞는 정도가 나와요</div>';
    } else {
      var top;
      if (P.length) {
        var lv = level(it.score);
        top = '<div class="score-top"><div><span>선호 키워드 충족</span><b class="big">' + it.hit.length + '<small>/ ' + P.length + '</small></b></div>' +
          '<div class="score-r"><span class="pts">' + it.score + '점</span><span class="lv lv-' + lv[0] + '">' + lv[1] + '</span></div></div>' +
          '<div class="meter" aria-hidden="true"><i style="width:' + it.score + '%"></i></div>';
      } else {
        top = '<div class="score-top"><div><span>필수 조건</span><b class="big">모두 충족</b></div></div>';
      }
      var lines = M.map(function (k) {
        return '<li class="ok"><span class="m" aria-hidden="true">✓</span>' + esc(k) + ' <span class="t must">필수</span><span class="sr">있음</span></li>';
      }).concat(P.map(function (k) {
        var ok = has(kws, k);
        return '<li class="' + (ok ? 'ok' : 'no') + '"><span class="m" aria-hidden="true">' + (ok ? '✓' : '✕') + '</span>' + esc(k) + ' <span class="t">선호</span><span class="sr">' + (ok ? '있음' : '없음') + '</span></li>';
      }));
      var formula = P.length ? '선호 ' + P.length + '개 중 ' + it.hit.length + '개 → ' + it.hit.length + ' ÷ ' + P.length + ' × 100 = ' + it.score + '점' : '필수 키워드는 점수 대신 통과 여부만 봐요';
      scoreHTML = '<div class="score">' + top + '<details class="calc"><summary>점수 계산 보기' + CHEV + '</summary><ul>' + lines.join('') + '</ul><p class="formula">' + formula + '</p></details></div>';
    }
    return scoreHTML + (kws.length ? '<div class="tags">' + kws.map(function (k) { return '<span class="tag' + (has(selected, k) ? ' hit' : '') + '">' + esc(k) + '</span>'; }).join('') + '</div>' : '');
  }

  var def = {
    title: '맞춤 단지 추천 | 비교파트',
    render: function () {
      return '<div class="bp-root pg-rec"><main class="page">' +
        '<div class="page-head"><div><h1>맞춤 단지 추천</h1><p data-sub></p></div></div>' +
        '<div class="controls">' +
          '<label class="search">' + BP.icon('search') + '<span class="sr">단지 검색</span><input type="search" data-q placeholder="단지명, 지역, 주소로 검색" autocomplete="off"></label>' +
          '<label class="sr" for="recArea">지역</label><select class="select" id="recArea" data-area></select>' +
        '</div>' +
        '<section aria-labelledby="kwTitle">' +
          '<div class="kw-head"><h2 id="kwTitle">원하는 키워드</h2><div class="legend">' +
            '<span><i class="dot" aria-hidden="true"></i>한 번 누르면 선호</span><span><i class="dot full" aria-hidden="true"></i>두 번 누르면 필수</span><span>세 번 누르면 해제</span></div></div>' +
          '<div class="chips" data-kw-chips></div><p class="kw-sel" data-kw-sel aria-live="polite"></p>' +
        '</section>' +
        '<details class="card how"><summary>점수는 이렇게 계산해요' + CHEV.replace('<svg ', '<svg class="chev" width="18" height="18" ') + '</summary><div class="how-body">' +
          '<div class="how-item"><h3>키워드를 안 고르면</h3><p>점수를 매기지 않아요. 기준 없이 나온 점수는 의미가 없어서, 고르기 전에는 이름순으로 보여 드려요.</p></div>' +
          '<div class="how-item"><h3>필수 키워드</h3><p>점수가 아니라 거르는 조건이에요. 하나라도 없는 단지는 결과에서 빼고, 아래에 따로 모아 둬요.</p></div>' +
          '<div class="how-item"><h3>선호 키워드</h3><p>고른 선호 키워드 중 몇 개를 갖췄는지로 점수를 내요. 키워드는 비교파트가 단지마다 직접 조사했어요.</p><code>갖춘 선호 수 ÷ 고른 선호 수 × 100</code></div>' +
          '<div class="bands" aria-label="점수 구간"><div class="band"><b>모두 맞아요</b><span>100점</span></div><div class="band"><b>잘 맞아요</b><span>67~99점</span></div><div class="band"><b>일부 맞아요</b><span>34~66점</span></div><div class="band"><b>조금 맞아요</b><span>0~33점</span></div></div>' +
        '</div></details>' +
        '<div class="res-bar"><p class="res-count" data-count></p><div class="res-actions">' +
          '<button type="button" class="btn" data-reset><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>초기화</button>' +
          '<button type="button" class="btn" data-share>' + BP.icon('link') + '링크 복사</button>' +
          '<label class="sr" for="recSort">정렬</label><select class="select" id="recSort" data-sort><option value="match">추천순 (선호 키워드)</option><option value="name">이름순</option><option value="hh">세대수 많은 순</option><option value="new">입주 최신순</option></select>' +
        '</div></div>' +
        '<div class="notice" data-notice hidden><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/></svg><span data-notice-text></span></div>' +
        '<div class="grid" data-cards></div>' +
        '<div class="more-wrap" data-more-wrap hidden><p data-more-info></p><button type="button" class="btn more-btn" data-more>더 보기</button></div>' +
        '<details class="out" data-out hidden><summary><span data-out-title></span>' + CHEV + '</summary><div class="grid" data-out-cards></div>' +
          '<div class="more-wrap" data-out-more-wrap hidden><button type="button" class="btn more-btn" data-out-more>더 보기</button></div></details>' +
      '</main></div>';
    },
    mount: function (root, ctx) {
      var $ = function (sel) { return root.querySelector(sel); };
      var q0 = ctx.query;
      var state = { area: BP.areas().indexOf(q0.area) >= 0 ? q0.area : '', q: '', kw: {}, sort: 'name', sortTouched: false, shown: PAGE, outShown: PAGE };
      String(q0.pref || '').split(',').forEach(function (k) { if (has(KW, k)) state.kw[k] = 1; });
      String(q0.must || '').split(',').forEach(function (k) { if (has(KW, k)) state.kw[k] = 2; });
      if (/^(match|name|hh|new)$/.test(q0.sort || '')) { state.sort = q0.sort; state.sortTouched = true; }

      function pref() { return KW.filter(function (k) { return state.kw[k] === 1; }); }
      function must() { return KW.filter(function (k) { return state.kw[k] === 2; }); }
      function query() { return { area: state.area, pref: pref().join(','), must: must().join(','), sort: state.sortTouched ? state.sort : '' }; }
      function write() { BP.setQuery(query()); }
      function effectiveSort() {
        if (!pref().length && state.sort === 'match') return 'name';
        if (!state.sortTouched) return pref().length ? 'match' : 'name';
        return state.sort;
      }
      function cmp(sort) {
        return function (a, b) {
          if (sort === 'match' && (b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
          if (sort === 'hh' && b.c.households !== a.c.households) return (b.c.households || 0) - (a.c.households || 0);
          if (sort === 'new' && BP.moveKey(b.c) !== BP.moveKey(a.c)) return BP.moveKey(b.c) - BP.moveKey(a.c);
          return a.c.name.localeCompare(b.c.name, 'ko');
        };
      }

      function render() {
        var P = pref(), M = must();
        var scope = BP.inArea(state.area);
        $('[data-sub]').textContent = '원하는 키워드로 찾는 단지 · ' + (state.area ? state.area + ' ' : '') + BP.n(scope.length) + '개 단지';
        $('[data-kw-chips]').innerHTML = KW.map(function (key) {
          var st = state.kw[key] || 0;
          var cnt = scope.filter(function (c) { return has(c.keywords || [], key); }).length;
          var stLabel = st === 1 ? '선호' : st === 2 ? '필수' : '';
          return '<button type="button" class="kw" data-kw="' + esc(key) + '" data-state="' + st + '"' + (cnt === 0 && !st ? ' disabled' : '') +
            ' aria-label="' + esc(key) + ' ' + cnt + '개 단지' + (stLabel ? ', ' + stLabel : '') + '"><span aria-hidden="true">' + (EMOJI[key] || '🏷️') + '</span>' + esc(key) +
            (stLabel ? '<span class="st">' + stLabel + '</span>' : '<span class="cnt">' + cnt + '</span>') + '</button>';
        }).join('');
        var sel = [];
        if (P.length) sel.push('선호 <b>' + P.map(esc).join(', ') + '</b>');
        if (M.length) sel.push('필수 <b>' + M.map(esc).join(', ') + '</b>');
        $('[data-kw-sel]').innerHTML = sel.length ? sel.join(' · ') : '아직 고른 키워드가 없어요.';

        var sort = effectiveSort();
        $('[data-sort]').querySelector('option[value="match"]').disabled = !P.length;
        $('[data-sort]').value = sort;

        var q = state.q.trim().toLowerCase().replace(/\s+/g, '');
        var picked = P.length + M.length > 0;
        var inList = [], outList = [];
        scope.forEach(function (c) {
          if (q && (c.name + BP.areasOf(c).join('') + (c.address || '')).toLowerCase().replace(/\s+/g, '').indexOf(q) < 0) return;
          var kws = c.keywords || [], untagged = !kws.length;
          var miss = M.filter(function (k) { return !has(kws, k); });
          var hit = P.filter(function (k) { return has(kws, k); });
          var it = { c: c, hit: hit, miss: miss, untagged: untagged, score: P.length && !untagged ? Math.round(hit.length / P.length * 100) : null };
          ((picked && untagged) || miss.length ? outList : inList).push(it);
        });
        inList.sort(cmp(sort));
        outList.sort(cmp('name'));

        var sortName = { match: '선호 키워드 맞는 순', name: '이름순', hh: '세대수 많은 순', 'new': '입주 최신순' }[sort];
        $('[data-count]').innerHTML = '<b>' + BP.n(inList.length) + '개</b> 단지 · ' + sortName;
        var notice = $('[data-notice]');
        if (!picked) { notice.hidden = false; $('[data-notice-text]').textContent = '키워드를 고르면 나와 얼마나 맞는지 점수로 보여 드려요. 지금은 이름순이에요.'; }
        else if (!P.length) { notice.hidden = false; $('[data-notice-text]').textContent = '필수 조건을 모두 갖춘 단지만 모았어요. 선호 키워드도 고르면 맞는 순서로 정렬해요.'; }
        else notice.hidden = true;

        var rankOn = sort === 'match';
        var shown = inList.slice(0, state.shown);
        $('[data-cards]').innerHTML = shown.length ? shown.map(function (it, i) { return BP.card(it.c, body(it, P, M, false), rankOn ? i + 1 : 0); }).join('')
          : '<p class="no-result">조건에 맞는 단지가 없어요. 필수 키워드를 선호로 바꿔 보세요.</p>';
        $('[data-more-wrap]').hidden = inList.length <= shown.length;
        $('[data-more-info]').textContent = shown.length + ' / ' + inList.length + '개';

        var out = $('[data-out]');
        out.hidden = !outList.length;
        if (outList.length) {
          $('[data-out-title]').textContent = '추천에서 빠진 단지 ' + BP.n(outList.length) + '개';
          $('[data-out-cards]').innerHTML = outList.slice(0, state.outShown).map(function (it) { return BP.card(it.c, body(it, P, M, true), 0, 'dim'); }).join('');
          $('[data-out-more-wrap]').hidden = outList.length <= state.outShown;
        }
        BP.linkify(root);
      }
      function changed() { state.shown = PAGE; state.outShown = PAGE; write(); render(); }

      $('[data-kw-chips]').addEventListener('click', function (e) {
        var b = e.target.closest('[data-kw]');
        if (!b || b.disabled) return;
        var k = b.getAttribute('data-kw'), next = ((state.kw[k] || 0) + 1) % 3;
        if (next) state.kw[k] = next; else delete state.kw[k];
        changed();
        var f = root.querySelector('[data-kw="' + CSS.escape(k) + '"]'); if (f) f.focus({ preventScroll: true });
      });
      $('[data-area]').innerHTML = BP.areaOptions(state.area);
      $('[data-area]').addEventListener('change', function () { state.area = this.value; changed(); });
      $('[data-q]').addEventListener('input', function () { state.q = this.value; state.shown = PAGE; render(); });
      $('[data-sort]').addEventListener('change', function () { state.sort = this.value; state.sortTouched = true; changed(); });
      $('[data-reset]').addEventListener('click', function () {
        state = { area: '', q: '', kw: {}, sort: 'name', sortTouched: false, shown: PAGE, outShown: PAGE };
        $('[data-q]').value = ''; $('[data-area]').value = '';
        changed(); BP.toast('초기화했어요');
      });
      $('[data-share]').addEventListener('click', function () {
        var qy = query(), qs = Object.keys(qy).filter(function (k) { return qy[k]; }).map(function (k) { return k + '=' + encodeURIComponent(qy[k]); }).join('&');
        var link = BP.cleanUrls ? location.href.split(/[?#]/)[0] + (qs ? '?' + qs : '') : location.href.split('#')[0] + '#/recommend' + (qs ? '?' + qs : '');
        BP.copy(link).then(function (ok) { BP.toast(ok ? '추천 조건이 담긴 링크를 복사했어요' : '복사가 안 됐어요. 주소창의 링크를 복사해 주세요'); });
      });
      $('[data-more]').addEventListener('click', function () { state.shown += PAGE; render(); });
      $('[data-out-more]').addEventListener('click', function () { state.outShown += PAGE; render(); });
      BP.compare.on(function () { if (document.body.contains(root)) render(); });
      render();
    }
  };
  BP.page('recommend', def);
  BP.page('value', def);   // 예전 주소(#/value)도 같은 페이지로
})();
