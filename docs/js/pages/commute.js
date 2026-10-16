/* 출퇴근 스트레스 */
(function () {
  'use strict';
  var esc = BP.esc;

  var DEST = [
    { key: 'toGangnam', label: '강남역', short: '강남', color: '#5079DD' },
    { key: 'toYeouido', label: '여의도역', short: '여의도', color: '#8476D6' },
    { key: 'toGwanghwamun', label: '광화문역', short: '광화문', color: '#3f9bb0' }
  ];
  var GRADES = [
    { letter: 'A', max: 35, color: '#2fa58b', wash: 'var(--good-wash)', desc: '35분 이하 구간이에요.' },
    { letter: 'B', max: 40, color: '#4c7be8', wash: 'var(--ok-wash)', desc: '36~40분 구간이에요.' },
    { letter: 'C', max: 48, color: '#c98f22', wash: 'var(--warn-wash)', desc: '41~48분 구간이에요.' },
    { letter: 'D', max: Infinity, color: '#d4566c', wash: 'var(--bad-wash)', desc: '48분을 넘는 구간이에요.' }
  ];

  function usable(a) { return DEST.every(function (d) { return a[d.key] != null; }) && a.subwayMin != null; }
  BP.commute = function (a) {
    if (!usable(a)) return null;
    var avg = (a.toGangnam + a.toYeouido + a.toGwanghwamun) / 3;
    var total = avg + a.subwayMin;
    var g = GRADES.filter(function (x) { return total <= x.max; })[0];
    return { avg: avg, walk: a.subwayMin, total: total, grade: g };
  };
  function fmt(n) { return (Math.round(n * 10) / 10).toString(); }
  function tick(total) {
    var bounds = [0, 35, 40, 48, 65];
    for (var i = 0; i < 4; i++) {
      if (total <= bounds[i + 1] || i === 3) {
        var f = Math.min(Math.max((total - bounds[i]) / (bounds[i + 1] - bounds[i]), 0), 1);
        return 25 * i + f * 25;
      }
    }
  }

  BP.page('commute', {
    title: '출퇴근 스트레스 | 비교파트',
    keepScroll: false,
    render: function (ctx) {
      var a = BP.get(ctx.query.id);
      if (!a || !usable(a)) a = BP.apartments.filter(usable)[0];
      if (!a) return BP.pages.notfound.render();
      var c = BP.commute(a), g = c.grade;
      var maxBar = Math.max.apply(null, BP.apartments.filter(usable).map(function (x) { return Math.max(x.toGangnam, x.toYeouido, x.toGwanghwamun); }));

      var ranking = BP.inArea(a.dong).filter(usable).map(function (x) { return { a: x, c: BP.commute(x) }; })
        .sort(function (p, q) { return p.c.total - q.c.total; });
      var maxTotal = Math.max.apply(null, ranking.map(function (r) { return r.c.total; }));

      return '<div class="page">' + BP.backLink('#/tools') +
        '<div class="page-head"><div><h1>집을 고를 때, 출퇴근도 함께</h1><p>세 업무지구까지의 평균 이동시간에 역까지 걷는 시간을 더해 출퇴근 부담을 하나의 숫자로 보여드려요.</p></div></div>' +
        '<div class="commute-layout">' +
          '<section class="panel">' +
            '<label class="field" style="margin-bottom:12px"><span>아파트 선택</span><select class="select" data-pick>' + BP.aptOptions(a.id, { filter: usable }) + '</select></label>' +
            '<div style="display:flex;justify-content:space-between;color:var(--muted);font-size:.85rem;margin-top:18px"><span>주요 업무지구</span><span>편도, 대중교통 · 추정</span></div>' +
            DEST.map(function (d) {
              return '<div class="dest-row"><span class="dest-chip" style="background:' + d.color + '22;color:' + d.color + '">' + d.short[0] + '</span><span>' + d.label + '</span><span class="val">' + a[d.key] + '<small>분</small></span></div>';
            }).join('') +
            '<div class="dest-row"><span class="dest-chip" style="background:var(--paper);color:var(--muted)">+</span><span>지하철역까지 도보</span><span class="val">' + a.subwayMin + '<small>분</small></span></div>' +
            '<p class="hint" style="margin:10px 0 20px">' + esc(a.subway || '') + '</p>' +
            '<div class="commute-rank"><div><small>' + esc(a.dong) + ' ' + ranking.length + '개 단지 중</small><strong>' + (ranking.findIndex(function (r) { return r.a.id === a.id; }) + 1) + '위</strong></div>' +
              '<p>출퇴근 스트레스가 낮은 순서예요. 아래에서 다른 단지와 비교해 보세요.</p></div>' +
          '</section>' +
          '<section class="panel stress-panel">' +
            '<div class="stress-head"><div><div style="font-weight:700">출퇴근 스트레스</div>' +
              '<div class="stress-num"><strong>' + fmt(c.total) + '</strong><span>분</span></div>' +
              '<div class="hint">' + g.letter + '등급, ' + g.desc + '</div></div>' +
              '<div class="grade-badge" style="background:' + g.wash + '"><small>등급</small><b style="color:' + g.color + '">' + g.letter + '</b></div></div>' +
            '<div class="scale"><div class="scale-bar">' + GRADES.map(function (x) { return '<span style="background:' + x.color + '"></span>'; }).join('') + '</div>' +
              '<div class="scale-tick" style="left:' + tick(c.total) + '%"></div></div>' +
            '<div class="scale-labels"><span>A ≤35분</span><span>B ≤40분</span><span>C ≤48분</span><span>D &gt;48분</span></div>' +
            '<div class="equation"><div><small>세 지역 평균</small><b>' + fmt(c.avg) + '분</b></div><span class="op">+</span><div><small>도보</small><b>' + fmt(c.walk) + '분</b></div><span class="op">=</span><div class="total"><small>출퇴근 스트레스</small><b>' + fmt(c.total) + '분</b></div></div>' +
            '<div class="where">어디로 이동하나요?</div>' +
            '<div class="time-bars" style="margin-bottom:16px">' + DEST.map(function (d) {
              return '<div class="time-bar"><span>' + d.short + '</span><div class="track"><div class="fill" style="width:' + (a[d.key] / maxBar * 100) + '%;background:' + d.color + '"></div></div><b>' + a[d.key] + '분</b></div>';
            }).join('') + '</div>' +
            '<div class="info-box">세 지역을 같은 비중으로 계산한 비교 지표예요. 이동시간은 지도상 위치로 계산한 추정치라 실제 출퇴근 시간과 다를 수 있어요.</div>' +
          '</section>' +
        '</div>' +
        '<section class="panel" style="margin-top:16px"><h2 class="panel-title">' + esc(a.dong) + ' 단지별 출퇴근 스트레스</h2>' +
          '<ol class="rank-list">' + ranking.map(function (r, i) {
            return '<li><button type="button" data-id="' + esc(r.a.id) + '" class="' + (r.a.id === a.id ? 'is-active' : '') + '"' + (r.a.id === a.id ? ' aria-current="true"' : '') + '>' +
              '<span class="rank">' + (i + 1) + '</span><span class="name">' + esc(r.a.name) + '</span>' +
              '<span class="bar"><span style="width:' + (r.c.total / maxTotal * 100) + '%;background:' + r.c.grade.color + '"></span></span>' +
              '<span class="min">' + fmt(r.c.total) + '분</span><span class="g" style="color:' + r.c.grade.color + '">' + r.c.grade.letter + '</span></button></li>';
          }).join('') + '</ol></section>' +
      '</div>';
    },
    mount: function (root) {
      function pick(id) { BP.go('#/commute?id=' + encodeURIComponent(id)); }
      root.querySelector('[data-pick]').addEventListener('change', function (e) { pick(e.target.value); });
      root.querySelector('.rank-list').addEventListener('click', function (e) {
        var b = e.target.closest('[data-id]'); if (b) pick(b.getAttribute('data-id'));
      });
    }
  });
})();
