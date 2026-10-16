/* 안심거래센터 */
(function () {
  'use strict';
  var esc = BP.esc;

  var fraudTypes = [
    { title: '깡통전세·보증금 미반환', type: '전세·월세', summary: '주택 가치보다 보증금과 선순위 채무가 과도한 경우', sign: '주변 시세보다 보증금이 높거나 시세 확인이 어려운 신축 빌라', prevention: '실거래가, 등기부, 선순위 권리를 함께 확인하고 반환보증 가능 여부를 점검하세요.' },
    { title: '소유자 또는 임대인 사칭', type: '공통', summary: '실제 소유자가 아닌 사람이 계약 당사자로 나서는 경우', sign: '신분증 확인을 피하거나 소유자와 다른 명의의 계좌로 입금을 요구', prevention: '신분증, 최신 등기사항증명서, 계좌 명의를 서로 대조하세요.' },
    { title: '위조 위임장·대리계약', type: '공통', summary: '대리권이 없거나 범위를 벗어난 사람이 계약하는 경우', sign: '소유자와의 직접 확인을 막고 위임 관련 원본 제시를 거부', prevention: '위임장과 인감증명서, 대리권 범위를 확인하고 소유자에게 직접 확인하세요.' },
    { title: '이중·중복계약', type: '공통', summary: '같은 부동산을 여러 사람과 계약하고 금전을 받는 경우', sign: '계약과 입금을 지나치게 재촉하거나 계약서 교부를 미룸', prevention: '계약 당사자와 중개사를 확인하고 모든 지급 내역과 계약 원본을 보관하세요.' },
    { title: '신탁부동산 무권한 임대', type: '전세·월세', summary: '신탁사의 동의 없이 위탁자 등이 임의로 임대하는 경우', sign: '등기부에 신탁 표시가 있으나 신탁원부 확인을 만류', prevention: '신탁원부와 임대 권한, 필요한 동의 여부를 전문가와 확인하세요.' },
    { title: '근저당·압류 관계 은폐', type: '공통', summary: '보증금 회수에 영향을 주는 권리를 숨기는 경우', sign: '등기부 확인을 미루거나 오래된 등기부만 제시', prevention: '계약 전과 잔금 지급 직전에 최신 등기사항증명서를 다시 확인하세요.' },
    { title: '허위매물·시세 부풀리기', type: '매매', summary: '존재하지 않거나 조건이 다른 매물로 방문과 계약을 유도하는 경우', sign: '유사 매물보다 현저히 낮은 가격을 제시하거나 현장 확인 전에 계약금을 요구', prevention: '공식 실거래가와 여러 중개 채널을 비교하고 현장을 직접 확인하세요.' },
    { title: '불법·위반건축물 계약', type: '공통', summary: '건축물대장과 실제 이용 상태가 다른 부동산을 계약하는 경우', sign: '건축물대장 열람을 피하거나 실제 구조와 공부상 구조가 다름', prevention: '건축물대장, 주소, 용도, 실제 호수를 현장에서 함께 대조하세요.' }
  ];

  var checklistGroups = [
    { title: 'A. 계약 상대방 확인', items: [
      ['상대방의 신분과 등기상 소유자가 일치하는지 확인', '신분증·등기사항증명서 대조', ['전세', '월세', '매매']],
      ['공동소유자와 필요한 동의 여부 확인', '공동소유 지분과 계약 권한 확인', ['전세', '월세', '매매']],
      ['대리계약의 위임장과 대리권 범위 확인', '원본 서류와 소유자 직접 확인', ['전세', '월세', '매매']],
      ['입금 계좌의 예금주 확인', '계약 당사자와 계좌 명의 대조', ['전세', '월세', '매매']]
    ] },
    { title: 'B. 부동산 권리관계 확인', items: [
      ['최신 등기사항증명서의 소유권 확인', '갑구와 을구를 함께 확인', ['전세', '월세', '매매']],
      ['근저당권, 압류, 가압류 등 확인', '보증금 회수에 영향을 주는 권리 확인', ['전세', '월세', '매매']],
      ['토지대장과 건축물대장 확인', '주소·용도·위반건축물 표시 확인', ['전세', '월세', '매매']],
      ['신탁 표시와 계약 권한 확인', '신탁원부가 있다면 별도 확인', ['전세', '월세', '매매']]
    ] },
    { title: 'C. 가격과 자금 위험 확인', items: [
      ['공식 실거래가로 주변 시세 확인', '유사 면적과 최근 거래 비교', ['전세', '월세', '매매']],
      ['매매가 대비 보증금 수준 확인', '선순위 채무까지 함께 고려', ['전세', '월세']],
      ['보증금 반환보증 가입 가능 여부 확인', '계약 전에 가입 요건 확인', ['전세', '월세']],
      ['대금 지급 일정과 자금 조건 확인', '계약금·중도금·잔금 조건 확인', ['매매']]
    ] },
    { title: 'D. 계약서와 중개사 확인', items: [
      ['중개사무소와 공인중개사 등록 상태 확인', '등록 정보와 보증 관련 서류 확인', ['전세', '월세', '매매']],
      ['중개대상물 확인·설명서를 읽고 교부받기', '설명을 듣고 서류 보관', ['전세', '월세', '매매']],
      ['구두 약속을 계약서 또는 특약에 작성', '조건과 책임을 구체적으로 기록', ['전세', '월세', '매매']],
      ['지급 조건과 반환 조건 확인', '계좌와 지급 시점 재확인', ['전세', '월세', '매매']]
    ] },
    { title: 'E. 잔금 지급 전후 확인', items: [
      ['잔금 지급 직전에 등기사항증명서 재확인', '계약 후 권리 변동 여부 확인', ['전세', '월세', '매매']],
      ['임대차 신고와 확정일자 절차 확인', '계약 후 필요한 절차를 미루지 않기', ['전세', '월세']],
      ['입주 후 전입신고 등 필요한 절차 확인', '대항력 확보 관련 절차 확인', ['전세', '월세']],
      ['계약서와 송금·연락 기록 보관', '원본과 디지털 사본 정리', ['전세', '월세', '매매']]
    ] }
  ];

  var responseSteps = [
    ['추가 피해를 막으세요', ['추가 송금이나 새로운 합의 전에 전문가에게 확인하세요.', '상대방과의 연락은 가능한 한 기록이 남는 방식으로 진행하세요.', '계약 해제나 지급 중단은 법률상담 후 결정하세요.']],
    ['증거 자료를 보존하세요', ['계약서·특약과 중개대상물 확인·설명서를 보관하세요.', '송금 내역, 문자, 이메일, 통화 기록과 매물 광고 화면을 저장하세요.', '등기사항증명서, 건축물대장, 법원 통지서를 모아 두세요.']],
    ['상담하고 신고하세요', ['범죄 피해가 의심되면 경찰 112에 신고하세요.', '대한법률구조공단 132에서 법률상담을 받을 수 있습니다.', '전세 피해는 HUG 전세피해지원센터의 안내를 확인하세요.']],
    ['전문가의 검토를 받으세요', ['계약 내용과 진행 단계에 따라 대응 방법이 달라질 수 있습니다.', '관련 자료를 시간 순서대로 정리하고 중요한 기한부터 확인하세요.']]
  ];

  var TABS = [['fraud', '사기 유형'], ['checklist', '계약 체크리스트'], ['response', '피해 대응'], ['consult', '1:1 상담']];
  var state = { tab: 'fraud', type: '전세', checked: {} };

  function fraud() {
    return '<div class="section-head"><div><p>대표적인 부동산 사기 유형</p><h2>이런 신호가 보이면 계약을 서두르지 마세요</h2></div><span class="count-badge">' + fraudTypes.length + '가지 유형</span></div>' +
      '<div class="fraud-grid">' + fraudTypes.map(function (f) {
        return '<article class="fraud-card"><h3>' + f.title + '</h3><span class="deal">' + f.type + '</span><p>' + f.summary + '</p>' +
          '<div class="detail-row"><strong>의심 신호</strong><span>' + f.sign + '</span></div>' +
          '<div class="detail-row"><strong>계약 전 예방</strong><span>' + f.prevention + '</span></div></article>';
      }).join('') + '</div>';
  }

  function checklistBody() {
    return checklistGroups.map(function (g, gi) {
      var rows = g.items.map(function (it, ii) { return { it: it, key: gi + '-' + ii }; }).filter(function (x) { return x.it[2].indexOf(state.type) >= 0; });
      if (!rows.length) return '';
      return '<section class="check-group"><h3>' + g.title + '</h3>' + rows.map(function (x) {
        return '<label class="check-item"><input type="checkbox" data-key="' + x.key + '"' + (state.checked[x.key] ? ' checked' : '') + '>' +
          '<span><strong>' + x.it[0] + '</strong><small>' + x.it[1] + '</small></span>' +
          '<span class="use">' + (x.it[2].length === 3 ? '공통' : x.it[2].join('·')) + '</span></label>';
      }).join('') + '</section>';
    }).join('');
  }
  function checklist() {
    return '<div class="section-head"><div><p>계약 전 체크리스트</p><h2>거래 유형에 맞는 항목을 차례대로 확인하세요</h2></div>' +
      '<div class="seg-small" role="group" aria-label="거래 유형">' + ['전세', '월세', '매매'].map(function (t) {
        return '<button type="button" data-type="' + t + '" class="' + (state.type === t ? 'is-active' : '') + '" aria-pressed="' + (state.type === t) + '">' + t + '</button>';
      }).join('') + '</div></div>' +
      '<div class="progress-card" aria-live="polite"><div><strong data-prog-title></strong><span data-prog-detail></span></div><div class="progress-track" aria-hidden="true"><span data-prog-bar></span></div></div>' +
      '<div data-checklist>' + checklistBody() + '</div>' +
      '<p class="legal-note"><strong>안내</strong> 이 체크리스트는 확인이 필요한 항목을 정리한 보조 도구예요. 모든 항목을 확인해도 거래의 안전이 보장되는 것은 아니에요.</p>';
  }

  function response() {
    return '<div class="section-head"><div><p>피해가 의심될 때 대응 절차</p><h2>중요한 기록과 기한을 놓치지 않도록 순서대로 대응하세요</h2></div></div>' +
      '<div class="response-grid">' + responseSteps.map(function (s, i) {
        return '<article class="response-card"><header><span class="step-num">' + (i + 1) + '</span><h3>' + s[0] + '</h3></header><ul>' + s[1].map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></article>';
      }).join('') + '</div>' +
      '<div class="support-strip">' +
        '<a href="tel:112"><strong>긴급 신고</strong><span>범죄 피해가 의심되거나 즉시 도움이 필요하면 경찰 112</span></a>' +
        '<a href="tel:132"><strong>법률 상담</strong><span>대한법률구조공단 132</span></a>' +
        '<a href="https://www.khug.or.kr" target="_blank" rel="noopener"><strong>전세 피해</strong><span>HUG 전세피해지원센터 안내 확인</span></a>' +
      '</div>';
  }

  function consult() {
    var L = BP.config.lawyer || {};
    var tel = (L.phone || '').replace(/[^0-9]/g, '');
    return '<div class="section-head"><div><p>협력 변호사 1:1 상담</p><h2>현재 상황을 남기면 상담 가능한 방법을 안내해요</h2></div><span class="count-badge">비공개 상담</span></div>' +
      (L.name ? '<article class="lawyer"><img src="' + esc(L.photo) + '" alt="' + esc(L.firm + ' ' + L.name) + ' 변호사">' +
        '<div class="copy"><p class="kicker">비교파트 법률상담 협력</p><h3>' + esc(L.name) + ' <span>변호사</span></h3><p class="firm">' + esc(L.firm) + '</p>' +
        '<p class="desc">비교파트 안심거래센터의 1:1 법률상담을 지원해요. 상담 가능 여부와 일정은 직접 문의해 확인해 주세요.</p>' +
        '<a class="phone-btn" href="tel:' + tel + '">' + BP.icon('phone') + '<span><small>상담 문의</small><strong>' + esc(L.phone) + '</strong></span></a></div></article>' : '') +
      '<form class="panel" data-consult>' +
        '<div class="form-grid">' +
          '<label class="field"><span>상담 제목</span><input class="input" name="title" required placeholder="예: 잔금 지급 전 등기부가 변경되었습니다"></label>' +
          '<label class="field"><span>거래 유형</span><select class="select" name="dealType" required><option value="">선택해 주세요</option><option>매매</option><option>전세</option><option>월세</option><option>기타</option></select></label>' +
          '<label class="field"><span>현재 단계</span><select class="select" name="stage" required><option value="">선택해 주세요</option><option>계약 전</option><option>계약금 지급</option><option>잔금 지급</option><option>입주 후</option><option>보증금 미반환</option><option>경매·공매 진행</option></select></label>' +
          '<label class="field"><span>긴급도</span><select class="select" name="urgency"><option>일반</option><option>빠른 확인 필요</option><option>기한이 임박함</option></select></label>' +
          '<label class="field full"><span>문의 내용</span><textarea class="textarea" name="message" rows="6" required placeholder="계약 시점, 지급한 금액, 현재 문제가 된 상황을 시간 순서대로 작성해 주세요."></textarea></label>' +
          '<label class="field"><span>이름</span><input class="input" name="name" required autocomplete="name" placeholder="홍길동"></label>' +
          '<label class="field"><span>답변 받을 연락처</span><input class="input" name="contact" required autocomplete="email" placeholder="이메일 또는 전화번호"></label>' +
          '<input type="text" name="_honey" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0">' +
        '</div>' +
        '<p class="privacy-note">주민등록번호, 계좌 비밀번호, 인증번호 등 불필요한 개인정보는 적지 마세요. 자료가 있다면 답변 메일에 회신으로 보내 주세요.</p>' +
        '<label class="consent"><input type="checkbox" required><span>개인정보 수집 및 이용(<a href="privacy.html">개인정보처리방침</a>)에 동의하며, 상담 요청이 공식적인 사건 수임을 의미하지 않음을 확인합니다.</span></label>' +
        '<div class="form-actions"><button class="btn btn-primary" type="submit" data-send>' + BP.icon('send', 'sm') + '상담 요청 보내기</button><span class="form-status" role="status" aria-live="polite" data-status></span></div>' +
      '</form>';
  }

  var VIEWS = { fraud: fraud, checklist: checklist, response: response, consult: consult };

  function updateProgress(root) {
    var boxes = root.querySelectorAll('[data-checklist] input');
    var done = Array.prototype.filter.call(boxes, function (b) { return b.checked; }).length;
    root.querySelector('[data-prog-title]').textContent = '확인한 항목 ' + done + '개';
    root.querySelector('[data-prog-detail]').textContent = '전체 ' + boxes.length + '개 중 ' + done + '개를 확인했어요.';
    root.querySelector('[data-prog-bar]').style.width = (boxes.length ? done / boxes.length * 100 : 0) + '%';
  }

  BP.page('safety', {
    title: '안심거래센터 | 비교파트',
    render: function (ctx) {
      if (VIEWS[ctx.query.tab]) state.tab = ctx.query.tab;
      return '<div class="page"><section class="panel" style="padding-top:40px">' +
        '<div class="safety-hero"><h1>부동산 계약, 확인할수록 안전해집니다</h1>' +
        '<p>계약 전 확인부터 피해가 의심될 때의 대응, 전문가 상담 준비까지 한곳에서 살펴보세요.</p></div>' +
        '<div class="seg" role="tablist" aria-label="안심거래센터 메뉴">' + TABS.map(function (t) {
          var on = state.tab === t[0];
          return '<button type="button" role="tab" id="tab-' + t[0] + '" aria-controls="safety-panel" aria-selected="' + on + '" tabindex="' + (on ? 0 : -1) + '" class="' + (on ? 'is-active' : '') + '" data-tab="' + t[0] + '">' + t[1] + '</button>';
        }).join('') + '</div>' +
        '<div class="safety-panel" id="safety-panel" role="tabpanel" aria-labelledby="tab-' + state.tab + '">' + VIEWS[state.tab]() + '</div>' +
      '</section></div>';
    },
    mount: function (root) {
      if (state.tab === 'checklist') updateProgress(root);
      var tabs = root.querySelector('.seg');
      tabs.addEventListener('click', function (e) {
        var b = e.target.closest('[data-tab]'); if (!b) return;
        state.tab = b.getAttribute('data-tab'); BP.setQuery({ tab: state.tab });
        var y = window.scrollY; BP.pages.safety._rerender(root); window.scrollTo(0, y);
        var nt = document.querySelector('#view [data-tab="' + state.tab + '"]'); if (nt) nt.focus();
      });
      tabs.addEventListener('keydown', function (e) {
        var keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
        if (keys.indexOf(e.key) < 0) return;
        e.preventDefault();
        var i = TABS.findIndex(function (t) { return t[0] === state.tab; });
        i = e.key === 'ArrowRight' ? (i + 1) % 4 : e.key === 'ArrowLeft' ? (i + 3) % 4 : e.key === 'Home' ? 0 : 3;
        tabs.querySelectorAll('[data-tab]')[i].click();
      });
      root.addEventListener('change', function (e) {
        if (e.target.matches('[data-checklist] input')) { state.checked[e.target.getAttribute('data-key')] = e.target.checked; updateProgress(root); }
      });
      root.addEventListener('click', function (e) {
        var t = e.target.closest('[data-type]'); if (!t) return;
        state.type = t.getAttribute('data-type');
        root.querySelectorAll('[data-type]').forEach(function (b) { var on = b === t; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', on); });
        root.querySelector('[data-checklist]').innerHTML = checklistBody();
        updateProgress(root);
      });
      root.addEventListener('submit', function (e) {
        var form = e.target.closest('[data-consult]'); if (!form) return;
        e.preventDefault();
        var status = form.querySelector('[data-status]');
        var button = form.querySelector('[data-send]');
        var to = BP.config.formSubmitEmail;
        if (form._honey.value) return;                        // spam bot filled the hidden field
        if (!to) { status.textContent = '상담 접수 주소가 아직 설정되지 않았어요. 위의 전화번호로 문의해 주세요.'; return; }

        var payload = {
          _subject: '[비교파트 상담] ' + form.title.value,
          _template: 'table',
          _captcha: 'false',
          '이름': form.name.value,
          '연락처': form.contact.value,
          '상담 제목': form.title.value,
          '거래 유형': form.dealType.value,
          '현재 단계': form.stage.value,
          '긴급도': form.urgency.value,
          '문의 내용': form.message.value
        };
        if (/@/.test(form.contact.value)) payload._replyto = form.contact.value.trim();

        button.disabled = true;
        status.className = 'form-status';
        status.textContent = '보내는 중이에요…';
        fetch('https://formsubmit.co/ajax/' + encodeURIComponent(to), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        }).then(function (res) { return res.json().catch(function () { return {}; }).then(function (data) { return { ok: res.ok, data: data }; }); })
          .then(function (r) {
            if (!r.ok || String(r.data.success) === 'false') throw new Error(r.data.message || 'send failed');
            form.reset();
            status.className = 'form-status is-done';
            status.textContent = '상담 요청을 보냈어요. 남겨 주신 연락처로 답변드릴게요.';
          })
          .catch(function () {
            status.className = 'form-status is-error';
            status.textContent = '요청을 보내지 못했어요. 인터넷 연결을 확인하고 다시 시도하거나 위의 전화번호로 문의해 주세요.';
          })
          .then(function () { button.disabled = false; });
      });
    },
    _rerender: function (root) {
      var page = BP.pages.safety;
      var fresh = document.createElement('div');
      fresh.className = root.className;
      fresh.innerHTML = page.render({ query: {} });
      root.replaceWith(fresh);
      page.mount(fresh);
    }
  });
})();
