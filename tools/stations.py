"""Collect every rail/subway station in Seoul from OpenStreetMap (Nominatim), tile by tile."""
import json, sys, time, urllib.parse, urllib.request

UA = 'bigyopateu-build/1.0 (1671014301a@gmail.com)'
OUT = sys.argv[1]
stations = {}
lat0, lat1, lng0, lng1, step = 37.42, 37.71, 126.76, 127.20, 0.03
lat = lat0
while lat < lat1:
    lng = lng0
    while lng < lng1:
        q = dict(format='jsonv2', limit=50, bounded=1, q='[railway=station]',
                 viewbox='%f,%f,%f,%f' % (lng, lat + step, lng + step, lat))
        url = 'https://nominatim.openstreetmap.org/search?' + urllib.parse.urlencode(q)
        for attempt in range(3):
            try:
                with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA, 'Accept-Language': 'ko'}), timeout=30) as r:
                    res = json.load(r)
                break
            except Exception as e:
                print('retry', e, file=sys.stderr)
                time.sleep(4)
                res = []
        for s in res:
            if s.get('category') != 'railway' or not s.get('name'):
                continue
            key = s['name'] + '|%.3f|%.3f' % (float(s['lat']), float(s['lon']))
            stations[key] = {'name': s['name'], 'lat': float(s['lat']), 'lng': float(s['lon'])}
        print('%.2f %.2f -> %d (total %d)' % (lat, lng, len(res), len(stations)), flush=True)
        time.sleep(1.1)
        lng += step
    lat += step
json.dump(list(stations.values()), open(OUT, 'w'), ensure_ascii=False, indent=0)
print('stations', len(stations))
