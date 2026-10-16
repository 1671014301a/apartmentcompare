"""Turn raw.json (sheet) + geo.json (geocoding) into docs/js/data/apartments.js.

Everything the sheet has is used as-is. Values the site needs but the sheet doesn't
have are filled in here and listed in each complex's `estimated` array, so the site
can mark them as 추정 (estimate).
"""
import json, re, sys, math, datetime

RAW = json.load(open(sys.argv[1]))
GEO = json.load(open(sys.argv[2]))
OUT = sys.argv[3]
STATIONS = json.load(open(sys.argv[4])) if len(sys.argv) > 4 else []
THIS_YEAR = 2026

AMEN = [('수영장', 'pool'), ('헬스장', 'gym'), ('놀이터', 'playground'), ('북카페', 'bookCafe'), ('노인정', 'seniorCenter'),
        ('도서관', 'library'), ('골프장', 'golf'), ('사우나', 'sauna'), ('GX룸', 'gx'), ('키즈카페', 'kidsCafe'),
        ('게스트하우스', 'guestHouse'), ('입주민회의실', 'meetingRoom'), ('조식 서비스', 'meals'), ('배드민턴장', 'badminton'),
        ('농구장', 'basketball'), ('카페', 'cafe'), ('야외 운동시설', 'outdoorGym')]
HOSP = [('종합병원', 'general'), ('약국', 'pharmacy'), ('내과', 'internal'), ('소아과', 'pediatric'), ('정형외과', 'ortho'),
        ('치과', 'dental'), ('안과', 'eye'), ('이비인후과', 'ent'), ('피부과', 'derm'), ('동물병원', 'vet')]
NEAR = [('편의점', 'convenience'), ('마트', 'mart'), ('다이소', 'daiso'), ('공원', 'park'), ('은행', 'bank'), ('우체국', 'post'),
        ('어린이집', 'daycare'), ('유치원', 'kindergarten'), ('문구점', 'stationery'), ('미용실', 'hair'), ('화장품매장', 'cosmetics'),
        ('안경점', 'optician'), ('필라테스', 'pilates'), ('사우나_2', 'sauna'), ('노래방', 'karaoke'), ('한의원', 'oriental'),
        ('요양원', 'nursing'), ('교회', 'church'), ('공영주차장', 'parking')]

# 주변 평균 시세 구간(재건축 '시장성' 1~5점) — 지역별 대략적인 수준으로 추정
MARKET = {'반포': 5, '대치': 5, '개포': 5, '잠실': 5, '여의도': 5, '목동': 4, '고덕': 4, '가락': 4, '흑석': 4, '왕십리': 4,
          '행당': 4, '응봉': 4, '신당': 4, '신금호청구': 4, '아현공덕': 4, '대흥': 4, '마곡': 4, '신길': 4, 'DMC가재울': 4,
          '길음': 3, '미아': 3}
# 대표 학원가가 가까운 지역 (교육 환경 점수 가산)
ACADEMY_BONUS = {'대치': 10, '목동': 10, '반포': 7, '개포': 8, '잠실': 4, '고덕': 2}
DEST = {'toGangnam': (37.4979, 127.0276), 'toYeouido': (37.5216, 126.9244), 'toGwanghwamun': (37.5710, 126.9768)}

BUILDERS = [('디에이치', '현대건설'), ('힐스테이트', '현대건설'), ('래미안', '삼성물산'), ('자이', 'GS건설'), ('아이파크', 'HDC현대산업개발'),
            ('e편한세상', 'DL이앤씨'), ('e-편한세상', 'DL이앤씨'), ('아크로', 'DL이앤씨'), ('써밋', '대우건설'), ('푸르지오', '대우건설'),
            ('롯데캐슬', '롯데건설'), ('더샵', '포스코이앤씨'), ('SK뷰', 'SK에코플랜트'), ('SK VIEW', 'SK에코플랜트'), ('센트레빌', '동부건설'),
            ('두산위브', '두산건설'), ('위브', '두산건설'), ('호반', '호반건설'), ('더휴', '한신공영'), ('한신', '한신공영'),
            ('스위첸', 'KCC건설'), ('유보라', '반도건설'), ('리첸시아', '금호건설'), ('어울림', '금호건설'), ('금호', '금호건설'),
            ('하늘채', '코오롱글로벌'), ('코오롱', '코오롱글로벌'), ('벽산', '벽산건설'), ('아이원', '풍림산업'), ('풍림', '풍림산업'),
            ('해모로', '한진중공업'), ('한진', '한진중공업'), ('신동아', '신동아건설'), ('동아', '동아건설'), ('우성', '우성건설'),
            ('극동', '극동건설'), ('쌍용', '쌍용건설'), ('예가', '쌍용건설'), ('경남', '경남기업'), ('브라운스톤', '이수건설'),
            ('휴먼빌', '일신건영'), ('삼호', '삼호'), ('한양', '한양'), ('청구', '청구'), ('대림', '대림산업'), ('삼성', '삼성물산'),
            ('주공', '대한주택공사'), ('현대', '현대건설'), ('대우', '대우건설'), ('롯데', '롯데건설'), ('우방', '우방'),
            ('중앙하이츠', '중앙건설'), ('파크리오', '삼성물산'), ('엘스', '삼성물산'), ('리센츠', '삼성물산'), ('트리지움', '삼성물산'),
            ('헬리오시티', 'HDC현대산업개발 외'), ('그라시움', '삼성물산 외'), ('센트라스', '현대건설 외'), ('텐즈힐', 'GS건설 외'),
            ('라체르보', '대우건설'), ('트라지움', '삼성물산'), ('아너스빌', '경남기업'), ('경희궁', 'GS건설'), ('마포', '현대건설')]


def num(v):
    if v is None:
        return None
    s = str(v).replace(',', '').replace('%', '').strip()
    try:
        return float(s)
    except ValueError:
        return None


def pct(v):
    n = num(v)
    if n is None:
        return None
    return round(n * 100) if n < 10 else round(n)


def households(v):
    if not v:
        return None, None
    s = str(v)
    m = re.search(r'([\d,]+)\s*세대', s) or re.search(r'([\d,]+)', s)
    n = int(m.group(1).replace(',', '')) if m else None
    note = re.search(r'\((.*?)\)', s)
    return n, (note.group(1) if note else None)


def approved(v):
    if not v:
        return None, None
    s = str(v)
    m = re.search(r'(\d{4})\D+(\d{1,2})', s) or re.search(r'(\d{4})', s)
    if not m:
        return None, None
    y = int(m.group(1))
    mo = int(m.group(2)) if m.lastindex and m.lastindex > 1 else None
    return y, ('%d.%02d' % (y, mo) if mo else str(y))


def ox(v):
    if v is None:
        return None
    s = str(v).strip().upper()
    return True if s in ('O', 'Y', '있음', '○') else False if s in ('X', 'N', '없음', '×') else None


def place(v):
    """'SD동물의료센터 서울점(744m)' -> ('SD동물의료센터 서울점 (744m)', 744)"""
    if not v:
        return None, None
    s = re.sub(r'\s+', ' ', str(v)).strip()
    s = re.sub(r'\)+$', ')', s)
    m = re.match(r'^(.*?)\s*\(([^()]*)\)\s*$', s)
    if not m:
        return s, None
    name, dist = m.group(1).strip(), m.group(2).strip()
    d = re.search(r'([\d.]+)\s*(km|m)', dist.replace(',', ''), re.I)
    meters = None
    if d:
        meters = float(d.group(1)) * (1000 if d.group(2).lower() == 'km' else 1)
        meters = int(round(meters))
    return name + ' (' + dist.replace(' ', '') + ')', meters


def hav(a, b, c, d):
    R = 6371.0
    p1, p2 = math.radians(a), math.radians(c)
    h = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(math.radians(d - b) / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))


def norm(n):
    return re.sub(r'(아파트|\s)', '', n)


def tier(v, steps):
    """steps: list of (limit, score) checked in order with <="""
    for lim, sc in steps:
        if v <= lim:
            return sc
    return steps[-1][1]


# ---------- dedupe (same complex listed in two area sheets) ----------
seen_name, seen_addr, recs = {}, {}, []
for r in RAW:
    if r['area'] == '개포(이전)':
        continue
    k = norm(r['name'])
    addr = re.sub(r'\s|\(.*?\)', '', r['fields'].get('주소') or '')
    if k in seen_name or (addr and addr in seen_addr and seen_addr[addr]['area'] != r['area']):
        other = seen_name.get(k) or seen_addr.get(addr)
        other.setdefault('alsoIn', []).append(r['area'])
        continue
    seen_name[k] = r
    if addr:
        seen_addr[addr] = r
    recs.append(r)

out, used_ids = [], set()
for r in recs:
    f = r['fields']
    g = GEO.get(r['area'] + '|' + r['name'], {})
    est = []
    a = {'id': r['name'], 'name': r['name'], 'dong': r['area']}
    if a['id'] in used_ids:
        a['id'] = r['name'] + '·' + r['area']
    used_ids.add(a['id'])
    if r.get('alsoIn'):
        a['alsoIn'] = r['alsoIn']
    addr = f.get('주소')
    a['address'] = re.sub(r'\s+', ' ', addr).strip() if addr else None
    gm = re.search(r'서울(?:특별시)?\s+(\S+구)', addr or '')
    a['gu'] = gm.group(1) if gm else (g.get('borough'))
    dm = re.search(r'(\S+동)\s*\d', addr or '') or re.search(r'\((\S+동)', addr or '')
    a['legalDong'] = dm.group(1) if dm else g.get('suburb')
    a['lat'] = round(g['lat'], 7) if g.get('lat') else None
    a['lng'] = round(g['lng'], 7) if g.get('lng') else None
    if g.get('manual'):
        est.append('location')
    a['image'] = None

    a['households'], a['householdsNote'] = households(f.get('세대수'))
    a['bcr'] = pct(f.get('건폐율'))
    a['far'] = pct(f.get('용적률'))
    a['approvedYear'], a['approved'] = approved(f.get('입주연차'))
    a['price'] = f.get('가격')

    # builder from the brand in the name
    b = None
    for key, who in BUILDERS:
        if key.lower() in r['name'].lower():
            b = who
            break
    a['builder'] = b
    if b:
        est.append('builder')

    for label, key in AMEN:
        a[key] = ox(f.get(label))

    hosp = {}
    for label, key in HOSP:
        txt, m = place(f.get(label))
        if txt:
            hosp[key] = {'text': txt, 'm': m}
    a['hospitals'] = hosp
    near = {}
    for label, key in NEAR:
        txt, m = place(f.get(label))
        if txt:
            near[key] = {'text': txt, 'm': m}
    a['nearby'] = near
    sch = {}
    for label, key in (('초등학교', 'elementary'), ('중학교', 'middle'), ('고등학교', 'high')):
        txt, m = place(f.get(label))
        a[key] = txt
        sch[key] = m
    # short aliases used across the site
    a['hospital'] = hosp.get('general', {}).get('text')
    a['pharmacy'] = hosp.get('pharmacy', {}).get('text')
    a['vet'] = hosp.get('vet', {}).get('text')
    a['convenience'] = near.get('convenience', {}).get('text')
    a['park'] = near.get('park', {}).get('text')

    # ---------- transport (estimated from map position) ----------
    st = g.get('station')
    if STATIONS and a['lat']:
        best = min(STATIONS, key=lambda x: hav(a['lat'], a['lng'], x['lat'], x['lng']))
        st = {'name': best['name'], 'lat': best['lat'], 'lng': best['lng'], 'm': hav(a['lat'], a['lng'], best['lat'], best['lng']) * 1000}
    if st and st.get('m') is not None and st['m'] <= 2600:
        sname = st['name'] or ''
        sname = re.sub(r'\s*\(.*?\)', '', sname).strip()
        if not sname.endswith('역'):
            sname += '역'
        walk_m = int(round(st['m'] * 1.3 / 10.0) * 10)
        a['subway'] = '%s (%s m)' % (sname, format(walk_m, ','))
        a['subwayName'] = sname
        a['subwayM'] = walk_m
        a['subwayMin'] = max(1, int(round(walk_m / 75.0)))
        base = (st['lat'], st['lng'])
        extra = 0
    else:
        a['subway'] = a['subwayName'] = a['subwayM'] = a['subwayMin'] = None
        base = (a['lat'], a['lng']) if a['lat'] else None
        extra = 12
    est += ['subway', 'subwayMin']
    for k, (la, lo) in DEST.items():
        if base and base[0]:
            km = hav(base[0], base[1], la, lo)
            t = 4 + 2.35 * km + (6 if km > 3.5 else 0) + extra
            a[k] = int(max(5, min(85, round(t))))
        else:
            a[k] = None
        est.append(k)

    # ---------- education score (0-100) from school distances ----------
    e = None
    if any(v is not None for v in sch.values()):
        e = 0
        e += tier(sch['elementary'], [(300, 38), (500, 33), (800, 26), (1200, 18), (99999, 10)]) if sch['elementary'] is not None else 15
        e += tier(sch['middle'], [(500, 24), (900, 20), (1400, 14), (99999, 8)]) if sch['middle'] is not None else 10
        e += tier(sch['high'], [(700, 18), (1200, 14), (2000, 10), (99999, 5)]) if sch['high'] is not None else 7
        e += 4 if a.get('library') else 0
        e += 3 if a.get('bookCafe') else 0
        e += 3 if (near.get('kindergarten', {}).get('m') or 9999) <= 500 else 0
        e += ACADEMY_BONUS.get(r['area'], 0)
        e = int(max(25, min(99, e)))
    a['eduScore'] = e
    est.append('eduScore')

    # ---------- rebuild potential (same 6 criteria as before) ----------
    age = THIS_YEAR - a['approvedYear'] if a['approvedYear'] else None
    rb = {
        'age': tier(age, [(24, 1), (29, 2), (34, 3), (39, 4), (999, 5)]) if age is not None else None,
        'market': MARKET.get(r['area'], 3),
        'far': (5 if a['far'] <= 150 else 4 if a['far'] <= 170 else 3 if a['far'] <= 190 else 2 if a['far'] <= 220 else 1) if a['far'] is not None else None,
        'scale': tier(a['households'], [(299, 1), (699, 2), (999, 3), (1499, 4), (10 ** 9, 5)]) if a['households'] else None,
        'location': (5 if a['subwayM'] <= 500 else 4 if a['subwayM'] <= 800 else 3 if a['subwayM'] <= 1000 else 2 if a['subwayM'] <= 1500 else 1) if a['subwayM'] is not None else 1,
        'finance': 3,
    }
    if all(v is not None for v in rb.values()):
        rb['total'] = sum(rb.values())
        rb['grade'] = next(i + 1 for i, (lo, hi) in enumerate([(26, 30), (21, 25), (16, 20), (11, 15), (0, 10)]) if lo <= rb['total'] <= hi)
    else:
        rb['total'] = rb['grade'] = None
    a['rebuild'] = rb
    est.append('rebuild')

    # ---------- recommendation (키워드 sheet) ----------
    kw = r.get('kw') or {}
    kws = []
    for src in (kw.get('keywords'), f.get('키워드')):
        for t in re.split(r'[,/·]', src or ''):
            t = t.strip()
            if t and t not in kws:
                kws.append(t)
    a['keywords'] = kws
    sc = num(kw.get('score')) or num(f.get('점수'))
    a['valueScore'] = int(round(sc)) if sc is not None else None
    a['recommendLevel'] = kw.get('level')
    a['link'] = kw.get('link')

    a['amenityCount'] = sum(1 for _, k in AMEN if a.get(k) is True)
    a['estimated'] = est
    a['_age'] = age
    out.append(a)

# ---------- merge the curated 비교파트 data (names, areas, facilities, keywords ...) ----------
# tools/cache/ref_data.json comes from the 비교파트 page files (BP_DATA). Where it exists it wins
# over the raw sheet, because it has been cleaned by hand (names, 지역, 시설, 키워드, 용적률 메모).
REF = json.load(open(sys.argv[5])) if len(sys.argv) > 5 else []
AREA_NAME = {'DMC가재울': '가재울뉴타운', '신금호청구': '신금호·청구', '아현공덕': '아현·공덕'}
FAC_KEY = dict(AMEN)


def nkey(s):
    return re.sub(r'(아파트|\s|\(.*?\))', '', s or '')


by_name = {nkey(a['name']): a for a in out}
by_addr = {nkey(a['address']): a for a in out if a['address']}
matched = set()
for rf in REF:
    a = by_name.get(nkey(rf['name'])) or by_addr.get(nkey(rf['address']))
    if not a or id(a) in matched:
        print('  no match for', rf['name'])
        continue
    matched.add(id(a))
    a['id'] = rf['id']
    a['name'] = rf['name']
    a['areas'] = rf['areas']
    a['dong'] = rf['area']
    a['address'] = rf['address']
    a['households'] = rf['households']
    a['householdsNote'] = rf.get('hhNote')
    a['bcr'] = rf.get('bcr')
    a['far'] = rf.get('far')
    a['farNote'] = rf.get('farNote')
    mi = rf.get('moveIn') or ''
    p = mi.split('-')
    a['approvedYear'] = int(p[0]) if p and p[0].isdigit() else a['approvedYear']
    a['approved'] = (p[0] + '.' + p[1]) if len(p) > 1 else (p[0] or a['approved'])
    a['moveIn'] = mi
    a['priceMin'], a['priceMax'] = rf.get('priceMin'), rf.get('priceMax')
    if a['priceMin'] is not None:
        a['price'] = '매매 %s억 ~ %s억' % (a['priceMin'], a['priceMax'])
    for lab, key in AMEN:
        a[key] = lab in rf['facilities']
    a['facilities'] = rf['facilities']
    a['keywords'] = rf['keywords']
    a['link'] = rf.get('link') or a.get('link')
    a['image'] = rf.get('photo') or None
    a['amenityCount'] = len(rf['facilities'])
    a['_age'] = THIS_YEAR - a['approvedYear'] if a['approvedYear'] else None
    rb = a['rebuild']
    rb['age'] = tier(a['_age'], [(24, 1), (29, 2), (34, 3), (39, 4), (999, 5)]) if a['_age'] is not None else None
    rb['far'] = (5 if a['far'] <= 150 else 4 if a['far'] <= 170 else 3 if a['far'] <= 190 else 2 if a['far'] <= 220 else 1) if a['far'] is not None else None
    rb['scale'] = tier(a['households'], [(299, 1), (699, 2), (999, 3), (1499, 4), (10 ** 9, 5)]) if a['households'] else None
    keys = ['age', 'market', 'far', 'scale', 'location', 'finance']
    if all(rb.get(k) is not None for k in keys):
        rb['total'] = sum(rb[k] for k in keys)
        rb['grade'] = next(i + 1 for i, (lo, hi) in enumerate([(26, 30), (21, 25), (16, 20), (11, 15), (0, 10)]) if lo <= rb['total'] <= hi)
for a in out:
    if 'areas' not in a:
        a['dong'] = AREA_NAME.get(a['dong'], a['dong'])
        a['areas'] = [a['dong']] + [AREA_NAME.get(x, x) for x in a.get('alsoIn', [])]
    if 'facilities' not in a:
        a['facilities'] = [lab for lab, key in AMEN if a.get(key) is True]
    a.pop('alsoIn', None)
if REF:
    order = {rf['id']: i for i, rf in enumerate(REF)}
    out.sort(key=lambda a: order.get(a['id'], 10 ** 6))

# fill missing coordinates / scores sensibly
for a in out:
    if a['lat'] is None:
        peers = [b for b in out if b['dong'] == a['dong'] and b['lat']]
        if peers:
            a['lat'] = round(sum(b['lat'] for b in peers) / len(peers), 7)
            a['lng'] = round(sum(b['lng'] for b in peers) / len(peers), 7)
            a['estimated'].append('location')
    if a['valueScore'] is None:
        peers = [b['valueScore'] for b in out if b['dong'] == a['dong'] and b['valueScore'] is not None]
        a['valueScore'] = int(round(sum(peers) / len(peers))) if peers else 85
        a['recommendLevel'] = a['recommendLevel'] or ('추천' if a['valueScore'] >= 86 else '관심 후보')
        a['estimated'].append('valueScore')


# ---------- value features (맞춤 추천 조건) ----------
def m_of(a, group, key):
    return (a[group].get(key) or {}).get('m')


for a in out:
    avg = None
    if all(a.get(k) is not None for k in DEST):
        avg = sum(a[k] for k in DEST) / 3.0
    near_cnt = sum(1 for v in a['nearby'].values() if v.get('m') is not None and v['m'] <= 500)
    feats = []
    if avg is not None and avg <= 30:
        feats.append('주요 업무지구 접근성')
    if a['eduScore'] is not None and a['eduScore'] >= 75:
        feats.append('학군·교육 환경')
    el = None
    mm = re.search(r'\(([\d.]+)(km|m)\)', a['elementary'] or '')
    if mm:
        el = float(mm.group(1)) * (1000 if mm.group(2) == 'km' else 1)
    if el is not None and el <= 500:
        feats.append('초등학교 도보권')
    if a['households'] and a['households'] >= 1000:
        feats.append('대단지')
    if a['subwayMin'] is not None and a['subwayMin'] <= 8:
        feats.append('역세권')
    if a['_age'] is not None and a['_age'] <= 10:
        feats.append('신축·준신축')
    pk = m_of(a, 'nearby', 'park')
    if pk is not None and pk <= 300:
        feats.append('공원·산책로 접근성')
    if near_cnt >= 12:
        feats.append('생활 편의시설 접근성')
    if a['amenityCount'] >= 8:
        feats.append('커뮤니티 시설이 풍부한 단지')
    dc, kg, pd = m_of(a, 'nearby', 'daycare'), m_of(a, 'nearby', 'kindergarten'), m_of(a, 'hospitals', 'pediatric')
    if a.get('playground') and dc is not None and dc <= 400 and kg is not None and kg <= 800 and pd is not None and pd <= 1000:
        feats.append('아이 키우기 좋은 단지')
    ph, im = m_of(a, 'hospitals', 'pharmacy'), m_of(a, 'hospitals', 'internal')
    if ph is not None and ph <= 300 and im is not None and im <= 500:
        feats.append('병원·약국 접근성')
    if (a['rebuild'].get('total') or 0) >= 21 or (a['_age'] or 0) >= 30:
        feats.append('재건축 기대 단지')
    a['valueFeatures'] = feats
    a['commuteAvg'] = round(avg, 1) if avg is not None else None


# ---------- 한줄평 (generated from the data) ----------
def has_batchim(word):
    ch = word[-1]
    if '가' <= ch <= '힣':
        return (ord(ch) - 0xAC00) % 28 != 0
    return ch in '0123456789LMNRlmnr'


def obj(word):
    return word + ('을' if has_batchim(word) else '를')


def ida(word, mid):
    """명사 + 이고/여서 ... : mid=True → '…이고', False → '…이에요'"""
    if mid:
        return word + ('이고' if has_batchim(word) else '고')
    return word + ('이에요' if has_batchim(word) else '예요')


for a in out:
    hh = a['households']
    age = (THIS_YEAR - a['approvedYear']) if a['approvedYear'] else None
    top = [lab for lab, k in AMEN if a.get(k) is True and k not in ('playground', 'outdoorGym', 'seniorCenter')]
    if hh and hh >= 1500:
        lead = '%s세대 대단지' % format(hh, ',')
    elif hh and hh >= 700:
        lead = '%s세대 규모 단지' % format(hh, ',')
    elif hh:
        lead = '%s세대 아담한 단지' % format(hh, ',')
    else:
        lead = '%s 생활권 단지' % a['dong']
    if age is not None and age <= 7:
        lead = '%d년 입주한 %s' % (a['approvedYear'], lead)
    pros = []  # (mid form, end form)
    if a['amenityCount'] >= 8 and len(top) >= 3:
        pros.append(('%s 등 커뮤니티 시설이 %d가지나 되고' % ('·'.join(top[:3]), a['amenityCount']),
                     '%s 등 커뮤니티 시설이 %d가지나 돼요' % ('·'.join(top[:3]), a['amenityCount'])))
    elif len(top) >= 2:
        pros.append(('%s 갖췄고' % obj('·'.join(top[:3])), '%s 갖췄어요' % obj('·'.join(top[:3]))))
    if a['subwayMin'] is not None and a['subwayMin'] <= 7:
        t = '%s까지 걸어서 %d분' % (a['subwayName'], a['subwayMin'])
        pros.append((ida(t, True), ida(t, False)))
    school = '초등학교 도보권' in a['valueFeatures']
    park = '공원·산책로 접근성' in a['valueFeatures']
    if school and park:
        pros.append(('초등학교와 공원이 가깝고', '초등학교와 공원이 가까워요'))
    elif school:
        pros.append(('초등학교가 가깝고', '초등학교가 가까워요'))
    elif park:
        pros.append(('공원이 가깝고', '공원이 가까워요'))
    if len(pros) < 2 and '생활 편의시설 접근성' in a['valueFeatures']:
        pros.append(('마트·은행 같은 생활 편의시설이 가깝고', '마트·은행 같은 생활 편의시설도 가까이 있어요'))
    if len(pros) < 2 and '병원·약국 접근성' in a['valueFeatures']:
        pros.append(('병원·약국이 가깝고', '병원·약국도 가까이 있어요'))
    pros = pros[:3]
    cons = None
    if age is not None and age >= 30:
        cons = '%d년식이라 노후했지만 그만큼 재건축 기대감이 있어요' % a['approvedYear']
    elif a['subwayMin'] is not None and a['subwayMin'] >= 13:
        cons = '지하철역까지 걸어서 %d분으로 다소 멀어요' % a['subwayMin']
    elif age is not None and age >= 20:
        cons = '%d년식이라 연차가 꽤 쌓였어요' % a['approvedYear']
    elif a['amenityCount'] <= 2:
        cons = '단지 안 커뮤니티 시설은 적은 편이에요'
    elif a['far'] and a['far'] >= 300:
        cons = '용적률이 %d%%로 동 간격이 촘촘한 편이에요' % a['far']
    if pros:
        first = lead + ('으로 ' if has_batchim(lead) else '로 ') + ', '.join([p[0] for p in pros[:-1]] + [pros[-1][1]]) + '.'
        first = first.replace('으로 ,', '으로').replace('로 ,', '로')
    else:
        first = ida(lead, False) + '.'
    if cons:
        second = ' 다만 ' + cons + '.'
    else:
        second = ' ' + {'매우 강한 추천': '실거주 만족도가 특히 높은 단지예요.', '강한 추천': '실거주 만족도가 높은 단지예요.',
                        '추천': '두루 무난하게 살기 좋은 단지예요.', '관심 후보': '조건을 꼼꼼히 비교해 볼 만한 단지예요.'}.get(a['recommendLevel'] or '', '두루 무난한 단지예요.')
    a['review'] = first + second
    a['estimated'].append('review')
    del a['_age']

# ---------- photos: docs/images/apts/<단지 id 또는 단지 이름>.jpg|jpeg|png|webp ----------
import os
IMG_DIR = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(OUT)), '..', '..', 'images', 'apts'))
if os.path.isdir(IMG_DIR):
    files = {os.path.splitext(f)[0]: f for f in os.listdir(IMG_DIR) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))}
    for a in out:
        f = files.get(a['id']) or files.get(a['name']) or files.get(re.sub(r'\s', '', a['name']))
        if f:
            a['image'] = 'images/apts/' + f
    cred_path = os.path.join(IMG_DIR, 'credits.json')
    credits = json.load(open(cred_path)) if os.path.exists(cred_path) else {}
    for a in out:
        c = credits.get(a['id'])
        if c and a.get('image'):
            a['imageCredit'] = {'label': c.get('label'), 'source': c.get('source')}
    print('photos', sum(1 for a in out if a.get('image')), 'with credit', sum(1 for a in out if a.get('imageCredit')))

data = {'generatedAt': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'), 'source': '비교파트 구글 시트', 'apartments': out}
with open(OUT, 'w') as fh:
    fh.write('/* Generated by tools/build_data.py from the 비교파트 Google Sheet — re-run it instead of editing this file. */\n')
    fh.write('window.BIGYO_DATA = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
print(len(out), 'apartments,', sum(1 for a in out if a['lat']), 'with coordinates')
from collections import Counter
print(Counter(a['dong'] for a in out))
