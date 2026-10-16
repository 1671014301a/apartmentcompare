/* 홈: 지도 + 단지 검색 + 커뮤니티 시설·지역 필터 */
(function () {
  'use strict';
  var esc = BP.esc;
  var state = { amenities: [], area: '' };

  function mapSrc() {
    var base = (BP.inApp && BP.config.siteUrl) ? BP.config.siteUrl.replace(/\/?$/, '/') : '';
    var v = (window.BIGYO_DATA && window.BIGYO_DATA.generatedAt) || '';
    return base + 'map.html?v=' + encodeURIComponent(v);
  }

  function frame() { return document.getElementById('map-frame'); }
  function post(msg) { var f = frame(); if (f && f.contentWindow) { msg.source = 'bigyo-app'; f.contentWindow.postMessage(msg, '*'); } }
  function sendFilter(fit) { post({ type: 'filter', amenities: state.amenities, area: state.area, fit: !!fit }); }
  function sendCompare() { post({ type: 'compare-state', ids: BP.compare.list() }); }

  function matches() {
    return BP.apartments.filter(function (a) {
      return (!state.area || a.dong === state.area) && BP.hasAll(a, state.amenities);
    });
  }

  window.addEventListener('message', function (e) {
    var msg = e.data || {};
    if (msg.source !== 'bigyo-map') return;
    if (msg.type === 'open' && BP.get(msg.id)) BP.go(BP.aptUrl(BP.get(msg.id)));
    if (msg.type === 'ready') { sendFilter(false); sendCompare(); }
    if (msg.type === 'compare' && BP.get(msg.id)) { BP.compare.toggle(msg.id); sendCompare(); }
  });

  function amenityChips() {
    return BP.AMENITIES.map(function (m) { return BP.chip(m, state.amenities.indexOf(m.key) >= 0, 'data-amenity'); }).join('');
  }
  function areaChips() {
    return ['<button type="button" class="chip' + (!state.area ? ' is-on' : '') + '" data-area="">전체</button>'].concat(BP.areas().map(function (a) {
      return '<button type="button" class="chip' + (state.area === a ? ' is-on' : '') + '" data-area="' + esc(a) + '">' + esc(a) + ' <small>' + BP.inArea(a).length + '</small></button>';
    })).join('');
  }

  function searchResults(term) {
    term = term.trim().toLowerCase();
    if (!term) return '';
    var list = BP.apartments.filter(function (a) {
      return a.name.toLowerCase().indexOf(term) >= 0 || (a.address || '').toLowerCase().indexOf(term) >= 0 || (a.dong || '').indexOf(term) >= 0;
    }).slice(0, 8);
    if (!list.length) return '<p class="sr-empty">검색 결과가 없어요</p>';
    return list.map(function (a) {
      return '<button type="button" class="sr-item" data-focus="' + esc(a.id) + '"><b>' + esc(a.name) + '</b><small>' + esc(a.address || a.dong) + '</small></button>';
    }).join('');
  }

  function summary() {
    var n = matches().length;
    var parts = [];
    if (state.area) parts.push(esc(state.area));
    if (state.amenities.length) parts.push(state.amenities.length + '개 시설 조건');
    return (parts.length ? parts.join(' · ') + ' — ' : '') + '<b>' + n + '</b>개 단지';
  }

  BP.page('home', {
    title: '비교파트 · 아파트 단지 비교',
    render: function () {
      return '<div class="home">' +
        '<aside class="home-side" aria-label="검색과 필터">' +
          '<h1 class="side-title">아파트 단지 비교 · ' + BP.apartments.length + '개 단지</h1>' +
          '<div class="side-search">' +
            '<label class="search-box">' + BP.icon('search') + '<span class="sr-only">단지명 또는 주소 검색</span>' +
              '<input class="input" type="search" data-search placeholder="단지명 또는 주소 검색..." autocomplete="off"></label>' +
            '<div class="search-results" data-results hidden></div>' +
          '</div>' +
          '<h2>커뮤니티 시설</h2><div class="chip-row amenity-chips" data-amenity-chips>' + amenityChips() + '</div>' +
          '<h2>지역</h2><div class="chip-row area-chips" data-area-chips>' + areaChips() + '</div>' +
          '<div class="side-foot"><p data-summary>' + summary() + '</p>' +
            '<a class="btn btn-ghost btn-sm" data-list-link href="#/apartments">목록으로 보기</a></div>' +
        '</aside>' +
        '<section class="home-map" aria-label="아파트 지도">' +
          '<div class="map-count" aria-live="polite" data-map-count>' + summary() + '</div>' +
          '<iframe id="map-frame" title="아파트 위치 지도" src="' + mapSrc() + '" loading="eager"></iframe>' +
        '</section>' +
        '<div class="home-mobile-extra">' +
          '<h2>커뮤니티 시설</h2><div class="chip-row" data-amenity-chips>' + amenityChips() + '</div>' +
          '<h2>지역</h2><div class="chip-row" data-area-chips>' + areaChips() + '</div>' +
          '<h2>분석 도구</h2><div class="quick-grid">' + BP.TOOLS.map(function (t) {
            return '<a href="#/' + t.route + '"><span class="icon-tile">' + BP.icon(t.icon) + '</span>' + t.title + '</a>';
          }).join('') + '</div>' +
        '</div>' +
      '</div>';
    },
    mount: function (root) {
      document.querySelector('.app-footer').hidden = window.innerWidth > 760;
      var input = root.querySelector('[data-search]');
      var results = root.querySelector('[data-results]');
      function listLink() {
        var q = [];
        if (state.area) q.push('area=' + encodeURIComponent(state.area));
        if (state.amenities.length) q.push('amenities=' + state.amenities.join(','));
        return '#/apartments' + (q.length ? '?' + q.join('&') : '');
      }
      input.addEventListener('input', function () {
        results.innerHTML = searchResults(input.value);
        results.hidden = !input.value.trim();
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); BP.go('#/apartments?q=' + encodeURIComponent(input.value)); }
        if (e.key === 'Escape') { input.value = ''; results.hidden = true; }
      });
      root.addEventListener('click', function (e) {
        var f = e.target.closest('[data-focus]');
        if (f) {
          post({ type: 'focus', id: f.getAttribute('data-focus') });
          results.hidden = true;
          if (window.innerWidth <= 760) BP.go(BP.aptUrl(BP.get(f.getAttribute('data-focus'))));
          return;
        }
        var am = e.target.closest('[data-amenity]');
        var ar = e.target.closest('[data-area]');
        if (am) {
          var k = am.getAttribute('data-amenity'), i = state.amenities.indexOf(k);
          if (i >= 0) state.amenities.splice(i, 1); else state.amenities.push(k);
        } else if (ar) {
          state.area = ar.getAttribute('data-area');
        } else return;
        root.querySelectorAll('[data-amenity-chips]').forEach(function (el) { el.innerHTML = amenityChips(); });
        root.querySelectorAll('[data-area-chips]').forEach(function (el) { el.innerHTML = areaChips(); });
        root.querySelectorAll('[data-summary], [data-map-count]').forEach(function (el) { el.innerHTML = summary(); });
        var link = root.querySelector('[data-list-link]');
        link.setAttribute('href', listLink()); link.removeAttribute('data-route'); BP.linkify(link.parentNode);
        sendFilter(!!ar);
      });
      document.addEventListener('click', function (e) {
        if (!e.target.closest('.side-search')) results.hidden = true;
      });
    }
  });

  // restore the footer when leaving home
  function restoreFooter() { if (BP.parseHash().name !== 'home') document.querySelector('.app-footer').hidden = false; }
  window.addEventListener('hashchange', restoreFooter);
  window.addEventListener('popstate', restoreFooter);
  document.addEventListener('click', function () { setTimeout(restoreFooter, 0); });
})();
