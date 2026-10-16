/* 재건축 가능성 */
(function () {
  'use strict';
  var esc = BP.esc;
  var MAX = 3;

  var CRITERIA = [
    { key: 'age', icon: 'calendar', title: '노후도', desc: '건물이 지어진 지 얼마나 됐는지', scale: ['25년 미만', '25~29년', '30~34년', '35~39년', '40년 이상'],
      actual: function (a) { var y = BP.age(a); return y != null ? '준공 ' + y + '년차' : null; } },
    { key: 'market', icon: 'chart', title: '시장성', desc: '주변 아파트의 평균 시세 (지역 기준 추정)', scale: ['4억 원 미만', '4억~7억 원', '7억~10억 원', '10억~15억 원', '15억 원 이상'],
      actual: function (a) { var s = a.rebuild && a.rebuild.market; return s ? a.dong + ' 평균 ' + ['4억 미만', '4~7억', '7~10억', '10~15억', '15억 이상'][s - 1] : null; } },
    { key: 'far', icon: 'building', title: '개발 여력', desc: '현재 용적률이 낮을수록 더 지을 여지', scale: ['220% 초과', '191~220%', '171~190%', '151~170%', '150% 이하'],
      actual: function (a) { return a.far != null ? '용적률 ' + a.far + '%' : null; } },
    { key: 'scale', icon: 'tools', title: '단지 특성', desc: '세대수가 많을수록 사업 효율이 좋아요', scale: ['300세대 미만', '300~699세대', '700~999세대', '1,000~1,499세대', '1,500세대 이상'],
      actual: function (a) { return a.households ? BP.n(a.households) + '세대' : null; } },
    { key: 'location', icon: 'train', title: '입지', desc: '가장 가까운 지하철역까지의 도보 거리', scale: ['1.5km 초과', '1km~1.5km', '801m~1km', '501~800m', '500m 이하'],
      actual: function (a) { return a.subwayM != null ? '역까지 ' + BP.n(a.subwayM) + 'm' : null; } },
    { key: 'finance', icon: 'wallet', title: '개인 재정', desc: '내 연봉으로 본 추가분담금 대응 여력', scale: ['2,000만 원 미만', '2,000만~2,999만 원', '3,000만~3,999만 원', '4,000만~4,999만 원', '5,000만 원 이상'],
      actual: function () { return null; } }
  ];
  var GRADES = [[26, 30], [21, 25], [16, 20], [11, 15], [6, 10]];
  var GRADE_NOTE = ['가능성이 매우 높아요', '가능성이 높은 편이에요', '보통 수준이에요', '가능성이 낮은 편이에요', '가능성이 매우 낮아요'];

  function financeScore(salary) {
    if (salary == null || isNaN(salary)) return null;
    return salary >= 5000 ? 5 : salary >= 4000 ? 4 : salary >= 3000 ? 3 : salary >= 2000 ? 2 : 1;
  }
  function scores(a, salary) {
    var rb = Object.assign({}, a.rebuild || {});
    var f = financeScore(salary);
    if (f != null) rb.finance = f;
    var keys = CRITERIA.map(function (c) { return c.key; });
    var complete = keys.every(function (k) { return rb[k] != null; });
    rb.total = complete ? keys.reduce(function (s, k) { return s + rb[k]; }, 0) : null;
    rb.grade = rb.total != null ? GRADES.findIndex(function (g) { return rb.total >= g[0] && rb.total <= g[1]; }) + 1 : null;
    return rb;
  }

  function pips(score) {
    var out = '<span class="pips" aria-hidden="true">';
    for (var i = 1; i <= 5; i++) out += '<i class="' + (score != null && i <= score ? 'on' : '') + '"></i>';
    return out + '</span>';
  }

  function summaryCard(a, rb) {
    return '<article class="rb-card">' +
      '<div class="rb-card-top"><div><small>' + esc(a.dong || '') + '</small><h2><a href="' + BP.aptUrl(a) + '">' + esc(a.name) + '</a></h2></div>' +
        '<button type="button" class="icon-btn" data-remove="' + esc(a.id) + '" aria-label="' + esc(a.name) + ' 빼기">' + BP.icon('x') + '</button></div>' +
      '<div class="rb-total"><strong>' + (rb.total != null ? rb.total : '-') + '</strong><span>/ 30점</span>' +
        (rb.grade ? '<em>' + rb.grade + '등급</em>' : '') + '</div>' +
      '<p class="rb-note">' + (rb.grade ? '재건축 ' + GRADE_NOTE[rb.grade - 1] : '점수 데이터가 아직 없어요') + '</p>' +
      '<ol class="grade-track" aria-label="등급 위치">' + GRADES.map(function (g, i) {
        return '<li class="' + (rb.grade === i + 1 ? 'on' : '') + '"><b>' + (i + 1) + '</b><span>' + g[0] + '~' + g[1] + '</span></li>';
      }).join('') + '</ol>' +
    '</article>';
  }

  function matrix(apts, all) {
    var head = '<thead><tr><th class="rowhead" scope="col">기준</th>' + apts.map(function (a) {
      return '<th scope="col">' + esc(a.name) + '</th>';
    }).join('') + '</tr></thead>';
    var body = CRITERIA.map(function (c) {
      var vals = all.map(function (rb) { return rb[c.key]; });
      var present = vals.filter(function (v) { return v != null; });
      var max = present.length > 1 ? Math.max.apply(null, present) : null;
      var allSame = present.every(function (v) { return v === max; });
      return '<tr><th class="rowhead" scope="row"><span class="rb-crit">' + BP.icon(c.icon, 'sm') + '<span><b>' + c.title + '</b><small>' + c.desc + '</small></span></span></th>' +
        apts.map(function (a, i) {
          var s = vals[i], actual = c.actual(a);
          if (c.key === 'finance') actual = all.salary ? '연봉 ' + BP.n(all.salary) + '만 원' : '기본값';
          var best = s != null && max != null && !allSame && s === max;
          return '<td class="' + (best ? 'best' : '') + '"><div class="rb-cell">' + pips(s) + '<strong>' + (s != null ? s + '점' : '-') + '</strong></div>' +
            (actual ? '<small class="rb-actual">' + esc(actual) + '</small>' : '') + (best ? '<span class="sr-only">(가장 높음)</span>' : '') + '</td>';
        }).join('') + '</tr>';
    }).join('');
    var foot = '<tfoot><tr><th class="rowhead" scope="row">합계</th>' + all.map(function (rb) {
      return '<td><strong class="rb-sum">' + (rb.total != null ? rb.total + '점' : '-') + '</strong>' + (rb.grade ? ' <span class="tag blue">' + rb.grade + '등급</span>' : '') + '</td>';
    }).join('') + '</tr></tfoot>';
    return '<div class="sheet-wrap"><table class="sheet rb-sheet" style="min-width:' + (220 + apts.length * 190) + 'px">' + head + '<tbody>' + body + '</tbody>' + foot + '</table></div>';
  }

  function criteriaReference() {
    return '<div class="criteria-grid">' + CRITERIA.map(function (c) {
      return '<div class="criterion"><header><span class="icon-tile">' + BP.icon(c.icon, 'sm') + '</span><h3>' + c.title + '</h3></header><p>' + c.desc + '</p>' +
        '<ul class="scale-list">' + c.scale.map(function (label, i) { return { n: i + 1, label: label }; }).reverse().map(function (s) {
          return '<li><b>' + s.n + '</b>' + s.label + '</li>';
        }).join('') + '</ul></div>';
    }).join('') + '</div>';
  }

  function gradeScale() {
    return '<div class="grade-scale">' + GRADES.map(function (g, i) {
      return '<div><b>' + (i + 1) + '등급</b>' + g[0] + '~' + g[1] + '점</div>';
    }).join('') + '</div>';
  }

  BP.page('rebuild', {
    title: '재건축 가능성 | 비교파트',
    render: function (ctx) {
      var ids = (ctx.query.ids || '').split(',').filter(BP.get).slice(0, MAX);
      var salary = ctx.query.salary ? parseInt(ctx.query.salary, 10) : (BP.store.get('salary', null));
      var apts = ids.map(BP.get);
      var picker = '<label class="rb-picker"><span class="sr-only">단지 추가</span><select class="select" data-add' + (apts.length >= MAX ? ' disabled' : '') + '><option value="">' + (apts.length >= MAX ? '최대 3개까지 비교할 수 있어요' : (apts.length ? '단지 추가…' : '아파트를 선택하세요')) + '</option>' +
        BP.aptOptions(null, { filter: function (a) { return ids.indexOf(a.id) < 0 && a.rebuild; } }) + '</select></label>';

      if (!apts.length) {
        var top = BP.apartments.filter(function (a) { return a.rebuild && a.rebuild.total != null; })
          .sort(function (x, y) { return y.rebuild.total - x.rebuild.total; }).slice(0, 5);
        return '<div class="page">' + BP.backLink('#/tools') +
          '<section class="tool-intro">' +
            '<div class="tool-intro-main">' +
              '<h1>우리 아파트, 재건축 가능성은 얼마나 될까요?</h1>' +
              '<p>노후도, 시장성, 용적률, 단지 규모, 입지와 내 연봉까지 여섯 가지 기준을 각각 1~5점으로 매겨 30점 만점으로 계산해요.</p>' +
              picker +
              (top.length ? '<div class="quick-picks"><span>점수가 높은 단지로 시작하기</span><div class="chip-row">' + top.map(function (a) {
                return '<a class="chip" href="#/rebuild?ids=' + encodeURIComponent(a.id) + '">' + esc(a.name) + ' <b>' + a.rebuild.total + '</b></a>';
              }).join('') + '</div></div>' : '') +
            '</div>' +
            '<ul class="tool-intro-list">' + CRITERIA.map(function (c) {
              return '<li><span class="icon-tile">' + BP.icon(c.icon, 'sm') + '</span><div><b>' + c.title + '</b><small>' + c.desc + '</small></div></li>';
            }).join('') + '</ul>' +
          '</section>' +
          '<section class="panel" style="margin-top:16px"><h2 class="panel-title">점수 기준</h2>' + criteriaReference() +
            '<h3 style="margin:26px 0 12px;font-size:1rem">등급 기준</h3>' + gradeScale() + '</section>' +
        '</div>';
      }

      var all = apts.map(function (a) { return scores(a, salary); });
      all.salary = salary;

      return '<div class="page">' + '<a class="back-link" href="#/rebuild">' + BP.icon('back', 'sm') + '처음으로</a>' +
        '<div class="page-head"><div><h1>재건축 가능성 비교</h1><p>여섯 가지 기준을 1~5점으로 매겨 더했어요. 점수가 높을수록 재건축 가능성이 높아요.</p></div>' + picker + '</div>' +
        '<div class="rb-cards" style="--n:' + apts.length + '">' + apts.map(function (a, i) { return summaryCard(a, all[i]); }).join('') + '</div>' +
        '<form class="salary-strip" data-salary>' +
          '<span class="icon-tile">' + BP.icon('wallet', 'sm') + '</span>' +
          '<label for="rb-salary"><b>내 연봉으로 계산하기</b><small>개인 재정 점수에 반영돼요. 이 기기에만 저장돼요.</small></label>' +
          '<div class="salary-input"><input class="input" id="rb-salary" name="salary" type="number" inputmode="numeric" min="0" step="100" placeholder="예: 4500" value="' + (salary || '') + '"><span>만 원</span></div>' +
          '<button class="btn btn-primary" type="submit">반영하기</button>' +
        '</form>' +
        '<h2 class="section-title">기준별 점수</h2>' +
        matrix(apts, all) +
        '<p class="legend"><i aria-hidden="true"></i>기준마다 가장 점수가 높은 단지예요.</p>' +
        '<details class="rb-ref"><summary>점수 기준 자세히 보기</summary>' + criteriaReference() +
          '<h3 style="margin:24px 0 12px;font-size:1rem">등급 기준</h3>' + gradeScale() + '</details>' +
        '<p class="hint" style="margin-top:16px">재건축 가능성은 시트의 입주연차·용적률·세대수와 위치로 계산한 참고 지표예요(시장성은 지역 시세 수준으로 추정). 실제 사업 추진 여부는 조합, 인허가, 시장 상황에 따라 달라져요.</p>' +
      '</div>';
    },
    mount: function (root, ctx) {
      var ids = (ctx.query.ids || '').split(',').filter(BP.get).slice(0, MAX);
      function go(next, salary) {
        var q = '#/rebuild?ids=' + next.map(encodeURIComponent).join(',');
        if (salary) q += '&salary=' + salary;
        BP.go(q);
      }
      var cur = ctx.query.salary || BP.store.get('salary', '');
      root.querySelector('[data-add]').addEventListener('change', function (e) { if (e.target.value) go(ids.concat(e.target.value), cur); });
      root.addEventListener('click', function (e) {
        var b = e.target.closest('[data-remove]'); if (b) go(ids.filter(function (id) { return id !== b.getAttribute('data-remove'); }), cur);
      });
      var form = root.querySelector('[data-salary]');
      if (form) form.addEventListener('submit', function (e) {
        e.preventDefault();
        var v = parseInt(form.salary.value, 10);
        BP.store.set('salary', isNaN(v) ? null : v);
        go(ids, isNaN(v) ? '' : v);
      });
    }
  });
})();
