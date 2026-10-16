/* 분석 도구 hub + shared tool list */
(function () {
  'use strict';
  BP.TOOLS = [
    { route: 'school', icon: 'school', title: '최적의 학군', desc: '초·중·고등학교까지의 거리와 유치원·어린이집·소아과를 단지별로 비교해요.' },
    { route: 'recommend', icon: 'sparkle', title: '맞춤 추천', desc: '원하는 키워드를 선호·필수로 고르면 나와 얼마나 맞는지 점수로 보여 드려요.' },
    { route: 'reviews', icon: 'message', title: '리뷰', desc: '단지마다 꼭 알아야 할 장단점과 키워드를 한눈에 정리했어요.' },
    { route: 'commute', icon: 'clock', title: '출퇴근 스트레스', desc: '강남·여의도·광화문까지의 이동시간과 역까지 도보시간으로 출퇴근 부담을 계산해요.' },
    { route: 'rebuild', icon: 'hammer', title: '재건축 가능성', desc: '노후도, 용적률, 세대수, 역까지 거리, 지역 시세와 내 연봉으로 재건축 가능성을 가늠해요.' },
    { route: 'safety', icon: 'shield', title: '안심거래센터', desc: '부동산 사기 유형, 계약 전 체크리스트, 피해 대응 절차와 1:1 상담 안내.' }
  ];

  // How the tools are grouped on the 분석 도구 page and in the menu
  BP.TOOL_GROUPS = [
    { title: '단지 고르기', desc: '어떤 단지가 나에게 맞는지 살펴봐요.', routes: ['school', 'recommend', 'reviews'] },
    { title: '생활과 미래', desc: '매일의 출퇴근과 앞으로의 가치를 따져봐요.', routes: ['commute', 'rebuild'] },
    { title: '안전한 계약', desc: '계약 전에 확인할 것과 문제가 생겼을 때의 대응.', routes: ['safety'] }
  ];
  BP.tool = function (route) { return BP.TOOLS.filter(function (t) { return t.route === route; })[0]; };

  BP.page('tools', {
    title: '분석 도구 | 비교파트',
    render: function () {
      return '<div class="page">' +
        '<div class="page-head"><div><h1>분석 도구</h1><p>집을 고를 때 궁금한 질문마다 하나씩 답해 주는 도구들이에요. 알고 싶은 것을 골라 들어가 보세요.</p></div></div>' +
        BP.TOOL_GROUPS.map(function (g) {
          return '<section class="tool-group"><div class="tool-group-head"><h2>' + g.title + '</h2><p>' + g.desc + '</p></div>' +
            '<div class="tool-grid">' + g.routes.map(BP.tool).map(function (t) {
              return '<a class="tool-card" href="#/' + t.route + '"><span class="icon-tile">' + BP.icon(t.icon) + '</span><h3>' + t.title + '</h3><p>' + t.desc + '</p></a>';
            }).join('') + '</div></section>';
        }).join('') +
      '</div>';
    }
  });

  BP.page('notfound', {
    title: '페이지를 찾을 수 없어요 | 비교파트',
    render: function () {
      return '<div class="page narrow"><div class="panel empty"><strong>페이지를 찾을 수 없어요</strong>주소가 바뀌었거나 삭제된 페이지예요.<br><br><a class="btn btn-primary" href="#/">지도로 돌아가기</a></div></div>';
    }
  });
})();
