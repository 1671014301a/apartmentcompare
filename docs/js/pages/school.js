/* 최적의 학군: 교육 환경 비교 */
(function () {
  'use strict';
  var esc = BP.esc;
  var MAX = 3;

  function tags(a) {
    var f = a.valueFeatures || [];
    var out = [];
    if (f.indexOf('학군·교육 환경') >= 0) out.push('<span class="tag pink">교육 환경 우수</span>');
    if (f.indexOf('초등학교 도보권') >= 0) out.push('<span class="tag green">초등학교 도보권</span>');
    if (f.indexOf('아이 키우기 좋은 단지') >= 0) out.push('<span class="tag green">아이 키우기 좋은 단지</span>');
    if (a.library) out.push('<span class="tag blue">단지 내 도서관</span>');
    if (a.bookCafe) out.push('<span class="tag blue">북카페</span>');
    return out.join('');
  }

  // "서울강남초 (600 m)" → { name: '서울강남초', dist: '600 m', meters: 600 }
  function place(text) {
    if (!text || text === '-') return null;
    var m = String(text).match(/^(.*?)\s*\((.*)\)\s*$/);
    var name = m ? m[1] : text, dist = m ? m[2] : '';
    var d = dist.replace(/,/g, '').match(/([\d.]+)\s*(km|m)\b/i);
    return { name: name, dist: dist, meters: d ? (d[2].toLowerCase() === 'km' ? parseFloat(d[1]) * 1000 : parseFloat(d[1])) : null };
  }

  function summaryCard(a) {
    var score = a.eduScore;
    return '<article class="rb-card edu-card">' +
      '<div class="rb-card-top"><div><small>' + esc(a.dong || '') + '</small><h2><a href="' + BP.aptUrl(a) + '">' + esc(a.name) + '</a></h2></div>' +
        '<button type="button" class="icon-btn" data-remove="' + esc(a.id) + '" aria-label="' + esc(a.name) + ' 빼기">' + BP.icon('x') + '</button></div>' +
      '<div class="rb-total"><strong>' + (score != null ? score : '-') + '</strong><span>/ 100점</span></div>' +
      '<p class="rb-note">교육 환경 점수</p>' +
      '<div class="edu-meter" aria-hidden="true"><span style="width:' + (score || 0) + '%"></span></div>' +
      '<div class="chip-row edu-tags">' + tags(a) + '</div>' +
    '</article>';
  }

  function schoolRows(apts) {
    var rows = [['pencil', '초등학교', 'elementary'], ['book', '중학교', 'middle'], ['school', '고등학교', 'high']];
    return rows.map(function (r) {
      var cells = apts.map(function (a) { return place(a[r[2]]); });
      var ms = cells.filter(function (c) { return c && c.meters != null; }).map(function (c) { return c.meters; });
      var best = ms.length > 1 ? Math.min.apply(null, ms) : null;
      var same = ms.every(function (v) { return v === best; });
      return '<tr><th class="rowhead" scope="row"><span class="rb-crit">' + BP.icon(r[0], 'sm') + '<span><b>' + r[1] + '</b></span></span></th>' +
        cells.map(function (c) {
          if (!c) return '<td class="na">정보 없음</td>';
          var isBest = best != null && !same && c.meters === best;
          return '<td class="' + (isBest ? 'best' : '') + '"><span class="edu-place">' + esc(c.name) + '</span>' +
            (c.dist ? '<span class="edu-dist">' + esc(c.dist) + '</span>' : '') + (isBest ? '<span class="sr-only">(가장 가까움)</span>' : '') + '</td>';
        }).join('') + '</tr>';
    }).join('');
  }

  function nearRows(apts) {
    var rows = [['home', '유치원', 'nearby', 'kindergarten'], ['home', '어린이집', 'nearby', 'daycare'], ['pencil', '문구점', 'nearby', 'stationery'], ['hospital', '소아과', 'hospitals', 'pediatric']];
    return rows.map(function (r) {
      var cells = apts.map(function (a) { var v = (a[r[2]] || {})[r[3]]; return v ? place(v.text) : null; });
      var ms = cells.filter(function (c) { return c && c.meters != null; }).map(function (c) { return c.meters; });
      var best = ms.length > 1 ? Math.min.apply(null, ms) : null;
      var same = ms.every(function (v) { return v === best; });
      return '<tr><th class="rowhead" scope="row"><span class="rb-crit">' + BP.icon(r[0], 'sm') + '<span><b>' + r[1] + '</b></span></span></th>' +
        cells.map(function (c) {
          if (!c) return '<td class="na">정보 없음</td>';
          var isBest = best != null && !same && c.meters === best;
          return '<td class="' + (isBest ? 'best' : '') + '"><span class="edu-place">' + esc(c.name) + '</span>' + (c.dist ? '<span class="edu-dist">' + esc(c.dist) + '</span>' : '') + '</td>';
        }).join('') + '</tr>';
    }).join('');
  }

  function academyCell(items) {
    if (!items || !items.length) return '<td class="na">정보 없음</td>';
    var nums = items.map(function (x) { return x.minutes != null ? x.minutes : x.meters; }).filter(function (v) { return v != null; });
    var min = nums.length ? Math.min.apply(null, nums) : null;
    var max = nums.length ? Math.max.apply(null, nums) : 1;
    return '<td><ul class="edu-acad">' + items.map(function (x) {
      var v = x.minutes != null ? x.minutes : x.meters;
      var fast = v === min;
      return '<li class="' + (fast ? 'fast' : '') + '"><div><span>' + esc(x.name) + '</span><b>' + esc(x.value) + '</b></div>' +
        '<i aria-hidden="true"><em style="width:' + (v != null ? Math.max(8, v / max * 100) : 0) + '%"></em></i></li>';
    }).join('') + '</ul></td>';
  }

  function table(apts) {
    var head = '<thead><tr><th class="rowhead" scope="col">항목</th>' + apts.map(function (a) { return '<th scope="col">' + esc(a.name) + '</th>'; }).join('') + '</tr></thead>';
    return '<div class="sheet-wrap"><table class="sheet rb-sheet edu-sheet" style="min-width:' + (180 + apts.length * 230) + 'px">' + head +
      '<tbody><tr class="group"><th class="rowhead" scope="rowgroup">학교까지 거리</th>' + apts.map(function () { return '<th></th>'; }).join('') + '</tr>' +
      schoolRows(apts) +
      '<tr class="group"><th class="rowhead" scope="rowgroup">보육·교육 주변 시설</th>' + apts.map(function () { return '<th></th>'; }).join('') + '</tr>' +
      nearRows(apts) +
      '</tbody></table></div>';
  }

  BP.page('school', {
    title: '최적의 학군 | 비교파트',
    render: function (ctx) {
      var ids = (ctx.query.ids || '').split(',').filter(BP.get).slice(0, MAX);
      var apts = ids.map(BP.get);
      if (!apts.length) {
        var top = BP.apartments.filter(function (a) { return a.eduScore != null; })
          .sort(function (x, y) { return y.eduScore - x.eduScore; }).slice(0, 5);
        var items = [
          ['pencil', '학교까지의 거리', '가장 가까운 초등·중·고등학교'],
          ['school', '교육 환경 점수', '학교 거리, 단지 내 도서관·북카페, 학원가 접근성을 종합한 100점 만점 점수'],
          ['home', '유치원·어린이집', '아이를 맡길 곳까지의 거리'],
          ['hospital', '소아과·문구점', '아이 키우는 집에 매일 필요한 주변 시설']
        ];
        return '<div class="page">' + BP.backLink('#/tools') +
          '<section class="tool-intro">' +
            '<div class="tool-intro-main">' +
              '<h1>우리 아이에게 맞는 학군은 어디일까요?</h1>' +
              '<p>최대 세 단지를 골라 학교까지의 거리와 유치원·어린이집·소아과 같은 주변 시설을 나란히 비교해 보세요.</p>' +
              '<label class="rb-picker"><span class="sr-only">단지 선택</span><select class="select" data-add><option value="">아파트를 선택하세요</option>' +
                BP.aptOptions(null, { filter: function (a) { return a.eduScore != null; } }) + '</select></label>' +
              '<div class="quick-picks"><span>교육 환경 점수가 높은 단지로 시작하기</span><div class="chip-row">' + top.map(function (a) {
                return '<a class="chip" href="#/school?ids=' + encodeURIComponent(a.id) + '">' + esc(a.name) + ' <b>' + a.eduScore + '</b></a>';
              }).join('') + '</div></div>' +
            '</div>' +
            '<ul class="tool-intro-list">' + items.map(function (it) {
              return '<li><span class="icon-tile">' + BP.icon(it[0], 'sm') + '</span><div><b>' + it[1] + '</b><small>' + it[2] + '</small></div></li>';
            }).join('') + '</ul>' +
          '</section></div>';
      }
      return '<div class="page">' + '<a class="back-link" href="#/school">' + BP.icon('back', 'sm') + '처음으로</a>' +
        '<div class="page-head"><div><h1>학군 비교</h1><p>학교까지의 거리와 아이 키우는 데 필요한 주변 시설을 나란히 놓고 비교해요.</p></div>' +
        '<label class="rb-picker"><span class="sr-only">단지 추가</span><select class="select" data-add' + (apts.length >= MAX ? ' disabled' : '') + '><option value="">' + (apts.length >= MAX ? '최대 3개까지 비교할 수 있어요' : '단지 추가…') + '</option>' +
          BP.aptOptions(null, { filter: function (a) { return ids.indexOf(a.id) < 0 && a.eduScore != null; } }) + '</select></label></div>' +
        '<div class="rb-cards" style="--n:' + apts.length + '">' + apts.map(summaryCard).join('') + '</div>' +
        '<h2 class="section-title">항목별 비교</h2>' + table(apts) +
        '<p class="legend"><i aria-hidden="true"></i>항목마다 가장 가까운 단지를 표시해요.</p>' +
      '</div>';
    },
    mount: function (root, ctx) {
      var ids = (ctx.query.ids || '').split(',').filter(BP.get).slice(0, MAX);
      function go(next) { BP.go('#/school?ids=' + next.map(encodeURIComponent).join(',')); }
      root.querySelector('[data-add]').addEventListener('change', function (e) { if (e.target.value) go(ids.concat(e.target.value)); });
      root.addEventListener('click', function (e) {
        var b = e.target.closest('[data-remove]'); if (b) go(ids.filter(function (id) { return id !== b.getAttribute('data-remove'); }));
      });
    }
  });
})();
