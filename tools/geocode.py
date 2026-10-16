"""Geocode each complex with Nominatim and find its nearest rail station. Caches to geo.json."""
import json, re, sys, time, math, os, urllib.parse, urllib.request

RAW = json.load(open(sys.argv[1]))
CACHE_PATH = sys.argv[2]
cache = json.load(open(CACHE_PATH)) if os.path.exists(CACHE_PATH) else {}
UA = 'bigyopateu-build/1.0 (1671014301a@gmail.com)'
last = [0.0]

def get(params):
    wait = 1.1 - (time.time() - last[0])
    if wait > 0:
        time.sleep(wait)
    url = 'https://nominatim.openstreetmap.org/search?' + urllib.parse.urlencode(params)
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept-Language': 'ko'})
            with urllib.request.urlopen(req, timeout=30) as r:
                last[0] = time.time()
                return json.load(r)
        except Exception as e:
            last[0] = time.time()
            print('  retry', e, file=sys.stderr)
            time.sleep(3)
    return []

def dist(a, b, c, d):
    R = 6371000
    p1, p2 = math.radians(a), math.radians(c)
    dp, dl = p2 - p1, math.radians(d - b)
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))

def clean_addr(a):
    a = re.sub(r'\(.*?\)', '', a or '')
    a = re.sub(r'\s+', ' ', a).strip()
    # "서울 서대문구 증가로 150 남가좌동 388" -> keep up to building number
    m = re.match(r'^(서울(?:특별시)?\s+\S+구\s+\S+(?:로|길))\s*([\d-]+)', a)
    if m:
        return m.group(1) + ' ' + m.group(2)
    return a

SEOUL = dict(viewbox='126.76,37.43,127.19,37.70', bounded=1)

done = 0
for rec in RAW:
    if rec['area'] == '개포(이전)':
        continue
    key = rec['area'] + '|' + rec['name']
    if key in cache and cache[key].get('lat'):
        continue
    addr = rec['fields'].get('주소') or ''
    gu = (re.search(r'(\S+구)', addr) or [None, ''])[1] if addr else ''
    hit = None
    tries = []
    ca = clean_addr(addr)
    if ca:
        tries.append(dict(q=ca))
    jb = re.search(r'\((\S+동)\s*([\d-]+)\)', addr) or re.search(r'(\S+동)\s+([\d-]+)\s*$', addr)
    if jb:
        tries.append(dict(q='서울 %s %s %s' % (gu, jb.group(1), jb.group(2))))
    if ca and re.search(r'(로|길)\d', ca):
        # 무학로33 -> 무학로 33
        tries.append(dict(q=re.sub(r'(로|길)(\d+)$', r'\1 \2', ca)))
    nm = re.sub(r'아파트$', '', rec['name']).strip()
    tries.append(dict(q=(gu + ' ' + nm).strip()))
    tries.append(dict(q=(gu + ' ' + rec['name']).strip()))
    for t in tries:
        res = get(dict(format='jsonv2', addressdetails=1, countrycodes='kr', limit=1, **SEOUL, **t))
        if res:
            hit = res[0]
            hit['_q'] = t['q']
            break
    entry = {'lat': None}
    if hit:
        lat, lng = float(hit['lat']), float(hit['lon'])
        ad = hit.get('address', {})
        entry = {'lat': lat, 'lng': lng, 'q': hit['_q'], 'display': hit.get('display_name'),
                 'suburb': ad.get('quarter') or ad.get('suburb'), 'borough': ad.get('borough')}
        d = 0.018
        st = get(dict(format='jsonv2', limit=15, bounded=1, q='[railway=station]',
                      viewbox='%f,%f,%f,%f' % (lng - d * 1.25, lat + d, lng + d * 1.25, lat - d)))
        best = None
        for s in st:
            if s.get('category') != 'railway':
                continue
            dd = dist(lat, lng, float(s['lat']), float(s['lon']))
            if best is None or dd < best[0]:
                best = (dd, s.get('name'), float(s['lat']), float(s['lon']))
        if best:
            entry['station'] = {'name': best[1], 'm': round(best[0]), 'lat': best[2], 'lng': best[3]}
    cache[key] = entry
    done += 1
    print(done, key, entry.get('lat'), entry.get('station', {}).get('name'), entry.get('station', {}).get('m'), flush=True)
    json.dump(cache, open(CACHE_PATH, 'w'), ensure_ascii=False, indent=1)

json.dump(cache, open(CACHE_PATH, 'w'), ensure_ascii=False, indent=1)
print('done', len(cache), 'missing', [k for k, v in cache.items() if not v.get('lat')])
