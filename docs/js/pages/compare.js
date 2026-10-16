/* 단지 비교 — 첨부된 비교파트 '단지 비교' 페이지를 옮기고, 시트에 있는 교통·학군·병원·주변 시설 항목을 덧붙였어요. */
(function () {
  'use strict';
  var esc = BP.esc, MAX = BP.MAX_COMPARE;

  // 빈 화면 '바로 비교해 보기' (단지 이름으로 지정)
  var STARTERS = [
    ['DMC 센트럴 아이파크', 'DMC 에코자이'],
    ['텐즈힐1단지', '센트라스'],
    ['래미안원베일리', '아크로리버파크', '래미안퍼스티지']
  ];
  function byName(n) { return BP.apartments.filter(function (a) { return a.name === n; })[0]; }
  function has(arr, v) { return arr.indexOf(v) >= 0; }
  function perK(a) { return a.households ? Math.round(BP.amenityCount(a) / a.households * 10000) / 10 : 0; }
  function na() { return '<span class="na">정보 없음</span>'; }
  function meters(t) { var m = String(t || '').match(/\(([\d.,]+)\s*(km|m)\)/); return m ? parseFloat(m[1].replace(/,/g, '')) * (m[2] === 'km' ? 1000 : 1) : null; }
  function placeCell(text) {
    if (!text) return na();
    var m = String(text).match(/^(.*?)\s*\(([^()]*)\)\s*$/);
    return m ? '<span class="place">' + esc(m[1]) + '</span><span class="dist">' + esc(m[2]) + '</span>' : esc(text);
  }

  var state = { want: [], diff: true };

  BP.page('compare', {
    title: '단지 비교 | 비교파트',
    render: function () {
      return '<div class="bp-root pg-compare"><main class="page" data-page>' +
        '<div class="page-head"><div><h1>단지 비교</h1><p>최대 ' + MAX + '개 단지를 나란히 놓고, 항목마다 더 유리한 단지를 표시해요.</p></div>' +
          '<label class="sr" for="addSelect">비교할 단지 추가</label><select class="select add-sel" id="addSelect" data-add></select></div>' +
        '<section class="card empty" data-empty aria-labelledby="emptyTitle">' +
          '<div class="empty-ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16"/><path d="M6 20v-6M10 20V9M14 20v-8M18 20V5"/></svg></div>' +
          '<h2 id="emptyTitle">비교할 단지를 담아 주세요</h2>' +
          '<p>단지 목록에서 <b>+</b>를 누르거나, 위에서 바로 추가할 수 있어요.</p>' +
          '<div class="starter"><p class="starter-t">바로 비교해 보기</p><div class="chips" data-starters></div></div>' +
          '<a class="btn primary" href="#/apartments">단지 목록에서 고르기</a>' +
        '</section>' +
        '<section data-body hidden>' +
          '<div class="card toolbar">' +
            '<p class="pick-t">나에게 중요한 시설<span>고르면 맨 위로 올리고, 단지마다 몇 개를 갖췄는지 세어 드려요</span></p>' +
            '<div class="chips" id="wantChips" data-want-chips></div>' +
            '<div class="toolbar-row">' +
              '<label class="switch"><input type="checkbox" data-diff checked> 차이 나는 시설만 보기</label>' +
              '<div class="btns"><button type="button" class="btn" data-reset>비우기</button>' +
              '<button type="button" class="btn" data-share>' + BP.icon('link') + '링크 복사</button></div>' +
            '</div>' +
          '</div>' +
          '<div class="card tbl" data-table></div>' +
          '<p class="footnote">강조 기준: 입주는 최근일수록, 보유 시설과 1,000세대당 시설은 많을수록, 내가 고른 시설은 더 많이 갖출수록, 역·학교·병원·생활시설은 가까울수록 우세로 표시해요. ' +
            '세대수·건폐율·용적률·매매가는 사람마다 좋고 나쁨이 달라서 강조하지 않아요. ' +
            '<span class="est">추정</span> 표시가 붙은 교통 항목은 지도상 위치로 계산한 값이에요.</p>' +
        '</section>' +
      '</main></div>';
    },
    mount: function (root, ctx) {
      var $ = function (sel) { return root.querySelector(sel); };
      if (ctx.query.ids) BP.compare.set(ctx.query.ids.split(','));
      state.want = String(ctx.query.want || '').split(',').filter(function (k) { return BP.AMENITIES.some(function (m) { return m.key === k; }); });
      state.diff = ctx.query.diff !== '0';

      function ids() { return BP.compare.list(); }
      function query() { return { ids: ids().join(','), want: state.want.join(','), diff: state.diff ? '' : '0' }; }
      function write() { BP.setQuery(query()); }
      function wantHit(a) { return state.want.filter(function (k) { return a[k] === true; }).length; }

      function renderAdd() {
        var cur = ids(), full = cur.length >= MAX, sel = $('[data-add]');
        var html = '<option value="">' + (full ? '최대 ' + MAX + '개까지 담았어요' : '단지 추가...') + '</option>';
        BP.areas().forEach(function (area) {
          var opts = BP.apartments.filter(function (a) { return BP.areasOf(a)[0] === area && !has(cur, a.id); })
            .sort(function (x, y) { return x.name.localeCompare(y.name, 'ko'); });
          if (!opts.length) return;
          html += '<optgroup label="' + esc(area) + '">' + opts.map(function (a) { return '<option value="' + esc(a.id) + '">' + esc(a.name) + '</option>'; }).join('') + '</optgroup>';
        });
        sel.innerHTML = html;
        sel.disabled = full;
      }

      function render() {
        renderAdd();
        var sel = ids().map(BP.get), n = sel.length;
        $('[data-empty]').hidden = n > 0;
        $('[data-body]').hidden = n === 0;
        if (!n) {
          $('[data-starters]').innerHTML = STARTERS.map(function (names) {
            var cs = names.map(byName).filter(Boolean);
            if (cs.length < 2) return '';
            return '<button type="button" class="chip" data-starter="' + esc(cs.map(function (c) { return c.id; }).join(',')) + '">' + esc(cs.map(function (c) { return c.name; }).join(' vs ')) + '</button>';
          }).join('');
          return;
        }
        $('[data-want-chips]').innerHTML = BP.AMENITIES.map(function (m) {
          return '<button type="button" class="chip" data-want="' + m.key + '" aria-pressed="' + has(state.want, m.key) + '"><span aria-hidden="true">' + m.emoji + '</span>' + esc(m.label) + '</button>';
        }).join('');
        $('[data-diff]').checked = state.diff;
        $('[data-diff]').disabled = n < 2;

        var slots = n < MAX ? n + 1 : n;
        var pad = slots > n ? '<div class="t-cell" aria-hidden="true"></div>' : '';
        function cols(inner) { return '<div class="cols" style="--n:' + slots + '">' + inner + '</div>'; }

        var basic = [
          { label: '지역', val: function (c) { return esc(BP.areasOf(c).join(' · ')); } },
          { label: '세대수', val: function (c) { return c.households ? BP.n(c.households) + '세대' + (c.householdsNote ? '<span class="sub">' + esc(c.householdsNote) + '</span>' : '') : na(); } },
          { label: '입주', val: function (c) { return BP.moveLong(c); }, score: BP.moveKey },
          { label: '건폐율', val: function (c) { return c.bcr == null ? na() : c.bcr + '%'; } },
          { label: '용적률', val: function (c) { return c.far == null ? na() : c.far + '%' + (c.farNote ? '<span class="sub">' + esc(c.farNote) + '</span>' : ''); } }
        ];
        if (sel.some(function (c) { return c.priceMin != null; })) {
          basic.push({ label: '매매가', val: function (c) { return c.priceMin == null ? na() : c.priceMin + '억 ~ ' + c.priceMax + '억'; } });
        }
        var comm = [
          { label: '보유 시설', val: function (c) { return BP.amenityCount(c) + '<span class="sub">/ ' + BP.AMENITIES.length + '종</span>'; }, score: BP.amenityCount },
          { label: '1,000세대당 시설', hint: '시설 종류 ÷ 세대수 × 1,000', val: function (c) { return perK(c).toFixed(1); }, score: perK }
        ];
        if (state.want.length) {
          comm.push({ label: '내가 고른 시설', hint: state.want.map(function (k) { return BP.AMENITIES.filter(function (m) { return m.key === k; })[0].label; }).join(', '),
            val: function (c) { return wantHit(c) + '<span class="sub">/ ' + state.want.length + '</span>'; }, score: wantHit });
        }
        // 시트에 있는 나머지 항목: 가까울수록(작을수록) 우세
        function near(label, get, hint) {
          return { label: label, hint: hint, val: function (c) { return placeCell(get(c)); }, score: function (c) { var m = meters(get(c)); return m == null ? null : -m; } };
        }
        var trans = [
          { label: '가까운 역', val: function (c) { return placeCell(c.subway); }, score: function (c) { return c.subwayM == null ? null : -c.subwayM; } },
          { label: '역까지 도보', val: function (c) { return c.subwayMin == null ? na() : c.subwayMin + '분'; }, score: function (c) { return c.subwayMin == null ? null : -c.subwayMin; } },
          { label: '강남역까지', val: function (c) { return c.toGangnam == null ? na() : c.toGangnam + '분'; }, score: function (c) { return c.toGangnam == null ? null : -c.toGangnam; } },
          { label: '여의도역까지', val: function (c) { return c.toYeouido == null ? na() : c.toYeouido + '분'; }, score: function (c) { return c.toYeouido == null ? null : -c.toYeouido; } },
          { label: '광화문역까지', val: function (c) { return c.toGwanghwamun == null ? na() : c.toGwanghwamun + '분'; }, score: function (c) { return c.toGwanghwamun == null ? null : -c.toGwanghwamun; } }
        ];
        var school = [near('초등학교', function (c) { return c.elementary; }), near('중학교', function (c) { return c.middle; }), near('고등학교', function (c) { return c.high; }),
          near('유치원', function (c) { return ((c.nearby || {}).kindergarten || {}).text; }), near('어린이집', function (c) { return ((c.nearby || {}).daycare || {}).text; })];
        var hosp = (BP.HOSPITALS || []).map(function (h) { return near(h[1], function (c) { return ((c.hospitals || {})[h[0]] || {}).text; }); });
        var life = (BP.NEARBY || []).map(function (h) { return near(h[1], function (c) { return ((c.nearby || {})[h[0]] || {}).text; }); });

        var wins = sel.map(function () { return 0; });
        function mark(rows, count) {
          rows.forEach(function (r) {
            r.best = [];
            if (n < 2 || !r.score) return;
            var sc = sel.map(r.score), present = sc.filter(function (v) { return v != null; });
            if (present.length < 2) return;
            var max = Math.max.apply(null, present), min = Math.min.apply(null, present);
            if (max === min) return;
            sc.forEach(function (v, i) { if (v === max) { r.best.push(i); if (count) wins[i]++; } });
          });
        }
        mark(basic.concat(comm), true);
        mark(trans.concat(school, hosp, life), false);

        function rowHTML(r) {
          return '<div class="t-row"><div class="t-label">' + esc(r.label) + (r.hint ? '<span class="hint">' + esc(r.hint) + '</span>' : '') + '</div>' +
            cols(sel.map(function (c, i) {
              var b = has(r.best, i);
              return '<div class="t-cell' + (b ? ' best' : '') + '">' + r.val(c) + (b ? '<span class="best-tag">우세</span>' : '') + '</div>';
            }).join('') + pad) + '</div>';
        }

        var order = state.want.concat(BP.AMENITIES.map(function (m) { return m.key; }).filter(function (k) { return !has(state.want, k); }));
        var hidden = 0, facRows = '';
        order.forEach(function (k) {
          var m = BP.AMENITIES.filter(function (x) { return x.key === k; })[0];
          var hv = sel.map(function (c) { return c[k] === true; });
          var same = hv.every(function (h) { return h === hv[0]; });
          var mine = has(state.want, k);
          if (n >= 2 && state.diff && same && !mine) { hidden++; return; }
          facRows += '<div class="t-row"><div class="t-label">' + (mine ? '<span class="star" aria-label="중요">★</span>' : '') +
            '<span aria-hidden="true">' + m.emoji + '</span> ' + esc(m.label) + '</div>' +
            cols(hv.map(function (h) {
              return '<div class="t-cell' + (h && !same ? ' best' : '') + '">' + (h ? '<span class="yes" aria-label="있음">✓</span>' : '<span class="no" aria-label="없음">–</span>') + '</div>';
            }).join('') + pad) + '</div>';
        });

        var kwRow = '<div class="t-row"><div class="t-label">단지 키워드<span class="hint">비교파트 조사</span></div>' + cols(sel.map(function (c) {
          return '<div class="t-cell"><div class="tags">' + ((c.keywords || []).length ? c.keywords.map(function (k) { return '<span class="tag">' + esc(k) + '</span>'; }).join('') : na()) + '</div></div>';
        }).join('') + pad) + '</div>';

        var head = '<div class="t-head"><div class="t-head-l">항목</div>' + cols(
          sel.map(function (c, i) {
            return '<div class="t-col"><p class="area">' + esc(BP.areasOf(c).join(' · ')) + '</p><h3><a href="' + BP.aptUrl(c) + '">' + esc(c.name) + '</a></h3>' +
              (n >= 2 ? '<span class="wins">우세 ' + wins[i] + '개</span>' : '') +
              '<button type="button" class="x" data-remove="' + esc(c.id) + '" aria-label="' + esc(c.name) + ' 빼기">✕</button></div>';
          }).join('') +
          (slots > n ? '<div class="t-col t-col-add"><button type="button" class="t-add" data-focus-add>＋ 단지 추가</button></div>' : '')
        ) + '</div>';

        $('[data-table]').innerHTML = head +
          (n < 2 ? '<p class="one-hint">단지를 1개 더 담으면 항목마다 우세한 단지를 표시해요.</p>' : '') +
          '<div class="t-sec-h">기본 정보</div>' + basic.map(rowHTML).join('') +
          '<div class="t-sec-h">커뮤니티 요약</div>' + comm.map(rowHTML).join('') +
          '<div class="t-sec-h">시설별 비교' + (hidden ? '<small>같은 시설 ' + hidden + '개 숨김</small>' : '') + '</div>' +
          (facRows || '<p class="one-hint">갖춘 시설이 모두 같아요.</p>') +
          '<div class="t-sec-h">키워드</div>' + kwRow +
          '<div class="t-sec-h">교통 <span class="est">추정</span></div>' + trans.map(rowHTML).join('') +
          '<div class="t-sec-h">학군·보육</div>' + school.map(rowHTML).join('') +
          '<div class="t-sec-h">병원</div>' + hosp.map(rowHTML).join('') +
          '<div class="t-sec-h">주변 시설</div>' + life.map(rowHTML).join('');
        BP.linkify(root);
      }

      root.addEventListener('click', function (e) {
        var t = e.target.closest('[data-remove],[data-want],[data-starter],[data-focus-add],[data-reset],[data-share]');
        if (!t) return;
        if (t.hasAttribute('data-remove')) { var id = t.getAttribute('data-remove'); BP.compare.set(ids().filter(function (x) { return x !== id; })); }
        else if (t.hasAttribute('data-want')) {
          var k = t.getAttribute('data-want');
          state.want = has(state.want, k) ? state.want.filter(function (w) { return w !== k; }) : state.want.concat(k);
          write(); render();
          var f = root.querySelector('[data-want="' + k + '"]'); if (f) f.focus({ preventScroll: true });
        }
        else if (t.hasAttribute('data-starter')) BP.compare.set(t.getAttribute('data-starter').split(','));
        else if (t.hasAttribute('data-focus-add')) { var s = $('[data-add]'); s.focus(); try { if (s.showPicker) s.showPicker(); } catch (err) { /* not supported */ } }
        else if (t.hasAttribute('data-reset')) { state.want = []; state.diff = true; BP.compare.clear(); }
        else if (t.hasAttribute('data-share')) {
          var url = location.href.split(/[?#]/)[0];
          var qs = Object.keys(query()).filter(function (k) { return query()[k]; }).map(function (k) { return k + '=' + encodeURIComponent(query()[k]); }).join('&');
          var link = BP.cleanUrls ? url + (qs ? '?' + qs : '') : url + '#/compare' + (qs ? '?' + qs : '');
          BP.copy(link).then(function (ok) { BP.toast(ok ? '비교 링크를 복사했어요' : '복사가 안 됐어요. 주소창의 링크를 복사해 주세요'); });
        }
      });
      $('[data-add]').addEventListener('change', function () {
        if (!this.value) return;
        if (ids().length >= MAX) { BP.toast('최대 ' + MAX + '개까지 비교할 수 있어요'); return; }
        BP.compare.set(ids().concat(this.value));
        BP.toast('비교함에 담았어요');
      });
      $('[data-diff]').addEventListener('change', function () { state.diff = this.checked; write(); render(); });
      BP.compare.on(function () { if (document.body.contains(root)) { write(); render(); } });
      write();
      render();
    }
  });
})();
