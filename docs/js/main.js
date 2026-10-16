/* Boot: header nav, drawer menu, app-shell tweaks, first render. */
(function () {
  'use strict';
  if (BP.inApp) document.documentElement.classList.add('in-app');

  // 상단 메뉴 (캡처의 지도 · 비교 · 단지 목록 · 맞춤 추천 · 리뷰 + 분석 도구)
  BP.NAV = [
    { href: '#/', icon: 'pin', label: '지도', nav: 'home' },
    { href: '#/compare', icon: 'bars', label: '비교', nav: 'compare', count: true },
    { href: '#/apartments', icon: 'building', label: '단지 목록', nav: 'apartments apt' },
    { href: '#/recommend', icon: 'sparkle', label: '맞춤 추천', nav: 'recommend value' },
    { href: '#/reviews', icon: 'message', label: '리뷰', nav: 'reviews' },
    { href: '#/tools', icon: 'tools', label: '분석 도구', nav: 'tools school commute rebuild safety' },
    { href: '#/about', icon: 'info', label: '소개', nav: 'about' }
  ];
  document.getElementById('header-nav').innerHTML = BP.NAV.map(function (m) {
    return '<a href="' + m.href + '" data-nav="' + m.nav + '">' + BP.icon(m.icon) + '<span>' + m.label + '</span>' +
      (m.count ? '<b class="nav-count" data-compare-count></b>' : '') + '</a>';
  }).join('');

  function item(m) {
    return '<li><a href="' + m.href + '" data-nav="' + m.nav + '"><span class="icon-tile">' + BP.icon(m.icon) + '</span>' + m.label +
      (m.count ? '<b class="menu-count" data-compare-count></b>' : '') + '</a></li>';
  }
  var toolRoutes = BP.TOOLS.map(function (t) { return t.route; });

  // 분석 도구 is one group: tap it to open the list of tools, grouped like the 분석 도구 page
  var toolsGroup =
    '<li class="menu-group">' +
      '<button type="button" class="menu-toggle" aria-expanded="false" aria-controls="menu-tools" data-nav="tools ' + toolRoutes.join(' ') + '">' +
        '<span class="icon-tile">' + BP.icon('tools') + '</span>분석 도구' + BP.icon('chevron', 'sm chev') +
      '</button>' +
      '<div class="sub-menu" id="menu-tools" hidden>' +
        '<a class="sub-all" href="#/tools" data-nav="tools">전체 도구 한눈에 보기</a>' +
        BP.TOOL_GROUPS.map(function (g) {
          return '<p class="sub-label">' + g.title + '</p>' + g.routes.map(BP.tool).map(function (t) {
            return '<a href="#/' + t.route + '" data-nav="' + t.route + '">' + BP.icon(t.icon, 'sm') + t.title + '</a>';
          }).join('');
        }).join('') +
      '</div>' +
    '</li>';

  document.getElementById('drawer-menu').innerHTML =
    BP.NAV.slice(0, 5).map(item).join('') +
    toolsGroup +
    item({ href: '#/about', icon: 'info', label: '비교파트 소개', nav: 'about' });

  var toggle = document.querySelector('.menu-toggle');
  var sub = document.getElementById('menu-tools');
  function setOpen(open) { toggle.setAttribute('aria-expanded', open); sub.hidden = !open; }
  toggle.addEventListener('click', function () { setOpen(sub.hidden); });
  // open the group automatically whenever the drawer opens on a tool page
  var openDrawer = BP.openDrawer;
  BP.openDrawer = function () {
    if (toolRoutes.concat('tools').indexOf(BP.parseHash().name) >= 0) setOpen(true);
    openDrawer();
  };

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') BP.closeDrawer(); });

  BP.render();
})();
