/* 소개 + 리뷰 */
(function () {
  'use strict';
  var esc = BP.esc;

  // 비교파트 소개 — 첨부된 '비교파트 소개' 페이지 그대로
  var ABOUT = "<section class=\"bp-about\" aria-labelledby=\"bp-title\">\n\n  <!-- HERO -->\n  <header class=\"bp-hero\">\n    <div class=\"bp-wrap bp-hero__grid\">\n      <div>\n        <span class=\"bp-eyebrow\">비교파트 소개</span>\n        <h1 class=\"bp-h1\" id=\"bp-title\">같은 아파트도<br><em>내 기준</em>으로 비교해요</h1>\n        <p class=\"bp-lead\">비교파트는 실제 거주자 데이터로 아파트 단지의 커뮤니티 시설을 비교하고, 내 생활에 맞는 단지를 찾도록 돕는 서비스예요.</p>\n        <div class=\"bp-actions\">\n          <a class=\"bp-btn bp-btn--primary\" href=\"#/apartments\">아파트 비교하기</a>\n          <a class=\"bp-btn bp-btn--ghost\" href=\"#bp-story\" data-scroll>비교파트 이야기</a>\n        </div>\n      </div>\n\n      <div class=\"bp-card bp-demo\" aria-label=\"커뮤니티 시설 비교 화면 예시\">\n        <div class=\"bp-demo__top\">\n          <span class=\"bp-demo__title\">커뮤니티 시설 비교</span>\n          <span class=\"bp-chip\">예시</span>\n        </div>\n        <table>\n          <thead><tr><th scope=\"col\">시설</th><th scope=\"col\">A단지</th><th scope=\"col\">B단지</th></tr></thead>\n          <tbody>\n            <tr><td>피트니스</td><td class=\"bp-yes\" aria-label=\"있음\">✓</td><td class=\"bp-yes\" aria-label=\"있음\">✓</td></tr>\n            <tr><td>실내 수영장</td><td class=\"bp-yes\" aria-label=\"있음\">✓</td><td class=\"bp-no\" aria-label=\"없음\">–</td></tr>\n            <tr><td>사우나</td><td class=\"bp-yes\" aria-label=\"있음\">✓</td><td class=\"bp-no\" aria-label=\"없음\">–</td></tr>\n            <tr><td>독서실</td><td class=\"bp-no\" aria-label=\"없음\">–</td><td class=\"bp-yes\" aria-label=\"있음\">✓</td></tr>\n          </tbody>\n        </table>\n        <div class=\"bp-demo__score\">\n          <p class=\"bp-demo__label\">내 우선순위 반영</p>\n          <div class=\"bp-bar\"><span>A단지</span><span class=\"bp-bar__track\"><span class=\"bp-bar__fill\" style=\"width:82%\"></span></span></div>\n          <div class=\"bp-bar\"><span>B단지</span><span class=\"bp-bar__track\"><span class=\"bp-bar__fill bp-bar__fill--b\" style=\"width:64%\"></span></span></div>\n        </div>\n      </div>\n    </div>\n  </header>\n\n\n  <!-- STORY -->\n  <div class=\"bp-sec\" id=\"bp-story\">\n    <div class=\"bp-wrap\">\n      <div class=\"bp-head\">\n        <h2 class=\"bp-h2\">비교파트는 이렇게 시작했어요</h2>\n        <p class=\"bp-sub\">가족의 임장 메모에서 동네 중개사무소가 추천하는 서비스가 되기까지</p>\n      </div>\n      <div class=\"bp-story\">\n        <article class=\"bp-card bp-chapter\">\n          <p class=\"bp-chapter__no\">01 · 시작</p>\n          <h3>임장 메모가 첫 데이터였어요</h3>\n          <p>가족과 아파트 임장을 다니며 단지마다 무엇이 다른지 묻기 시작했어요. 부모님이 단지별로 적어 둔 비교 메모를 바탕으로, 서대문구 가재울뉴타운 단지를 직접 돌며 커뮤니티 시설 정보를 모았어요.</p>\n        </article>\n        <article class=\"bp-card bp-chapter\">\n          <p class=\"bp-chapter__no\">02 · 전환점</p>\n          <h3>중개사님 피드백으로 다시 만들었어요</h3>\n          <p>처음 연 사이트는 거의 쓰이지 않았어요. 동네 공인중개사님의 조언을 중심으로 서비스를 다시 만들고, 손님의 필요에 맞춰 단지를 추천하는 기능을 넣었어요. 그 뒤로 중개사님이 손님들께 직접 추천해 주셨고, 주변 중개사무소로 입소문이 퍼졌어요.</p>\n        </article>\n      </div>\n    </div>\n  </div>\n\n  <!-- FEATURES -->\n  <div class=\"bp-sec\">\n    <div class=\"bp-wrap\">\n      <div class=\"bp-head\">\n        <h2 class=\"bp-h2\">비교파트가 하는 일</h2>\n        <p class=\"bp-sub\">시설이 있는지 없는지를 넘어, 내 생활에 맞는지를 보여 드려요</p>\n      </div>\n      <div class=\"bp-features\">\n        <article class=\"bp-card bp-feature\">\n          <span class=\"bp-icon\" aria-hidden=\"true\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 21h18\"/><path d=\"M5 21V8l7-4 7 4v13\"/><path d=\"M9 21v-5h6v5\"/><path d=\"M9 11h.01M15 11h.01\"/></svg></span>\n          <div>\n            <h3>커뮤니티 시설 비교</h3>\n            <p>피트니스, 수영장, 사우나 같은 단지별 커뮤니티 시설을 실제 거주자 데이터로 한눈에 비교해요.</p>\n          </div>\n        </article>\n        <article class=\"bp-card bp-feature\">\n          <span class=\"bp-icon\" aria-hidden=\"true\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0\"/><circle cx=\"16\" cy=\"6\" r=\"2\"/><circle cx=\"10\" cy=\"12\" r=\"2\"/><circle cx=\"18\" cy=\"18\" r=\"2\"/></svg></span>\n          <div>\n            <h3>내 우선순위로 비교</h3>\n            <p>같은 아파트도 사람마다 다르게 평가해요. 정해진 점수 대신 내가 중요하게 여기는 항목에 가중치를 두고 비교할 수 있어요.</p>\n          </div>\n        </article>\n        <article class=\"bp-card bp-feature\">\n          <span class=\"bp-icon\" aria-hidden=\"true\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><circle cx=\"12\" cy=\"12\" r=\"5\"/><circle cx=\"12\" cy=\"12\" r=\"1\"/></svg></span>\n          <div>\n            <h3>니즈 맞춤 단지 추천</h3>\n            <p>단지마다 특징 키워드를 조사해 두었어요. 원하는 생활 방식을 고르면 그에 맞는 단지를 추천해요.</p>\n          </div>\n        </article>\n        <article class=\"bp-card bp-feature\">\n          <span class=\"bp-icon\" aria-hidden=\"true\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"9\" cy=\"8\" r=\"3\"/><path d=\"M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6\"/><path d=\"M16 4.5a3 3 0 0 1 0 6M18 14c2 .7 3 2.7 3 6\"/></svg></span>\n          <div>\n            <h3>세대당 시설 공급량 <span class=\"bp-badge bp-badge--soon\">준비 중</span></h3>\n            <p>시설이 있는지보다 세대수 대비 얼마나 여유 있게 쓸 수 있는지가 중요해요. 세대당 시설 수와 면적을 기준으로 붐빔 정도를 보여 주는 지표를 만들고 있어요.</p>\n          </div>\n        </article>\n      </div>\n    </div>\n  </div>\n\n  <!-- PRINCIPLES -->\n  <div class=\"bp-sec\">\n    <div class=\"bp-wrap\">\n      <div class=\"bp-head\">\n        <h2 class=\"bp-h2\">우리가 지키는 기준</h2>\n      </div>\n      <div class=\"bp-card bp-principles\">\n        <div class=\"bp-principle\">\n          <h3>발로 모은 데이터</h3>\n          <p>단지를 직접 확인하고 실제 거주자의 이야기를 바탕으로 정리해요. 확인되지 않은 정보는 올리지 않아요.</p>\n        </div>\n        <div class=\"bp-principle\">\n          <h3>기준은 사용자가</h3>\n          <p>주거 설문과 워크숍에서 같은 단지도 사람마다 평가가 다르다는 걸 확인했어요. 그래서 정답 대신 비교할 수 있는 도구를 만들어요.</p>\n        </div>\n        <div class=\"bp-principle\">\n          <h3>동네와 계속 대화</h3>\n          <p>중개사무소 방문, 네이버 지식iN 답변, 매주 올리는 스포티파이 팟캐스트로 현장의 질문을 듣고 서비스에 반영해요.</p>\n        </div>\n      </div>\n    </div>\n  </div>\n\n  <!-- TEAM -->\n  <div class=\"bp-sec\" id=\"bp-team\">\n    <div class=\"bp-wrap\">\n      <div class=\"bp-head\">\n        <h2 class=\"bp-h2\">팀</h2>\n        <p class=\"bp-sub\">비교파트는 지금 한 사람이 만들고 있어요</p>\n      </div>\n      <article class=\"bp-card bp-founder\">\n        <!-- 프로필 사진: 사이트에 올릴 때는 src를 호스팅한 이미지 경로로 바꿔도 돼요. 예) images/about/founder.jpg -->\n        <img class=\"bp-founder__photo\" src=\"images/about/founder.jpg\" alt=\"박소율 프로필 사진\" width=\"220\" height=\"220\" loading=\"lazy\">\n        <div>\n          <span class=\"bp-role\">Founder &amp; CEO</span>\n          <h3 class=\"bp-name\">박소율<span>Soyool Park</span></h3>\n          <p class=\"bp-bio\">비교파트를 기획하고 데이터 수집, 서비스 설계, 지역 홍보까지 직접 맡고 있어요. 가족 임장에서 시작한 질문을 누구나 쓸 수 있는 비교 도구로 만드는 중이에요.</p>\n          <ul class=\"bp-tags\" aria-label=\"맡고 있는 일\">\n            <li class=\"bp-tag\">데이터 수집</li>\n            <li class=\"bp-tag\">서비스 기획</li>\n            <li class=\"bp-tag\">중개사무소 파트너십</li>\n            <li class=\"bp-tag\">팟캐스트 진행</li>\n          </ul>\n          <p class=\"bp-quote\">같은 집도 사는 사람에 따라 다르게 보여요. 그래서 비교의 기준은 사용자가 정해야 한다고 믿어요.</p>\n        </div>\n      </article>\n    </div>\n  </div>\n\n  <!-- CTA -->\n  <div class=\"bp-sec\">\n    <div class=\"bp-wrap\">\n      <div class=\"bp-cta\">\n        <div>\n          <h2>내 기준으로 아파트를 비교해 보세요</h2>\n          <p>관심 있는 단지를 골라 커뮤니티 시설부터 비교해 볼 수 있어요.</p>\n        </div>\n        <a class=\"bp-btn\" href=\"#/compare\">비교 시작하기</a>\n      </div>\n    </div>\n  </div>\n\n</section>";

  BP.page('about', {
    title: '비교파트 소개',
    render: function () { return ABOUT; },
    mount: function (root) {
      root.addEventListener('click', function (e) {
        var a = e.target.closest('[data-scroll]');
        if (!a) return;
        e.preventDefault();
        var t = root.querySelector(a.getAttribute('href'));
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  });

  // 리뷰: 단지 카드 + 한줄평 + 키워드 (단지 목록과 같은 카드)
  BP.page('reviews', {
    title: '리뷰 | 비교파트',
    render: function () {
      return '<div class="bp-root pg-list"><main class="page">' +
        '<div class="page-head"><div><h1>리뷰</h1><p>단지마다 꼭 알아야 할 장점과 아쉬운 점, 키워드를 한눈에 정리했어요.</p></div></div>' +
        '<div class="controls">' +
          '<label class="search">' + BP.icon('search') + '<span class="sr">단지 검색</span><input type="search" data-q placeholder="단지명, 지역, 주소로 검색" autocomplete="off"></label>' +
          '<label class="sr" for="rvArea">지역</label><select class="select" id="rvArea" data-area></select>' +
          '<label class="sr" for="rvSort">정렬</label><select class="select" id="rvSort" data-sort><option value="score">추천 점수 높은 순</option><option value="name">이름순</option><option value="new">입주 최신순</option></select>' +
        '</div>' +
        '<div class="res-bar"><p class="res-count" data-count></p></div>' +
        '<div class="grid" data-cards></div>' +
        '<div class="more-wrap" data-more-wrap hidden><p data-more-info></p><button type="button" class="btn more-btn" data-more>더 보기</button></div>' +
        '<p class="footnote" style="margin-top:20px">한줄평은 시트의 시설·학교·주변 시설 데이터와 위치로 정리한 요약이에요. 실제 거주 후기와는 다를 수 있어요.</p>' +
      '</main></div>';
    },
    mount: function (root, ctx) {
      var $ = function (s) { return root.querySelector(s); };
      var PAGE = 24;
      var state = { q: '', area: BP.areas().indexOf(ctx.query.area) >= 0 ? ctx.query.area : '', sort: 'score', shown: PAGE };
      var SORT = {
        score: function (a, b) { return (b.valueScore || 0) - (a.valueScore || 0) || a.name.localeCompare(b.name, 'ko'); },
        name: function (a, b) { return a.name.localeCompare(b.name, 'ko'); },
        'new': function (a, b) { return BP.moveKey(b) - BP.moveKey(a); }
      };
      function body(a) {
        return '<p class="review-text">' + esc(a.review) + '</p><p class="review-by">비교파트 한줄평' + (a.valueScore != null ? ' · 추천 점수 ' + a.valueScore + '점' : '') + '</p>' +
          ((a.keywords || []).length ? '<div class="tags">' + a.keywords.map(function (k) { return '<span class="tag"># ' + esc(k) + '</span>'; }).join('') + '</div>' : '');
      }
      function render() {
        var t = state.q.trim().toLowerCase().replace(/\s+/g, '');
        var list = BP.inArea(state.area).filter(function (a) {
          return a.review && (!t || (a.name + BP.areasOf(a).join('') + (a.address || '') + a.review).toLowerCase().replace(/\s+/g, '').indexOf(t) >= 0);
        }).sort(SORT[state.sort]);
        $('[data-count]').innerHTML = '<b>' + BP.n(list.length) + '</b>개 단지';
        var shown = list.slice(0, state.shown);
        $('[data-cards]').innerHTML = shown.length ? shown.map(function (a) { return BP.card(a, body(a)); }).join('') : '<p class="no-result">조건에 맞는 단지가 없어요.</p>';
        $('[data-more-wrap]').hidden = list.length <= shown.length;
        $('[data-more-info]').textContent = shown.length + ' / ' + list.length + '개';
        BP.setQuery({ area: state.area });
        BP.linkify(root);
      }
      $('[data-area]').innerHTML = BP.areaOptions(state.area);
      $('[data-q]').addEventListener('input', function () { state.q = this.value; state.shown = PAGE; render(); });
      $('[data-area]').addEventListener('change', function () { state.area = this.value; state.shown = PAGE; render(); });
      $('[data-sort]').addEventListener('change', function () { state.sort = this.value; state.shown = PAGE; render(); });
      $('[data-more]').addEventListener('click', function () { state.shown += PAGE; render(); });
      BP.compare.on(function () { if (document.body.contains(root)) render(); });
      render();
    }
  });
})();
