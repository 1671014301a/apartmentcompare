"""비교파트 단지 사진 도구

세 단계로 써요.

1) 후보 찾기 (네이버 검색 API · 이미지)
   python3 tools/photos.py search --id <클라이언트ID> --secret <클라이언트시크릿>
   → tools/cache/photo_candidates.json 과 tools/photo_review.html 을 만들어요.
     키는 https://developers.naver.com → Application 등록 → '검색' API 를 고르면 바로 나와요(무료, 하루 25,000건).

2) 고르기
   tools/photo_review.html 을 브라우저로 열고, 단지마다 쓸 사진 하나를 누르세요(허락받은 사진만).
   다 고르면 [선택 저장] 을 눌러 photo_choices.json 을 내려받아 tools/cache/ 에 넣어 주세요.

3) 내려받아 사이트에 넣기
   python3 tools/photos.py download --choices tools/cache/photo_choices.json
   → docs/images/apts/<단지id>.jpg (가로 1000px 이하로 줄임) 와 docs/images/apts/credits.json(출처) 을 만들어요.
   그다음 build_data.py 를 다시 돌리면 카드와 상세 화면에 사진과 출처가 붙어요.

   직접 모은 사진 주소가 있으면 CSV(단지명,사진주소[,출처]) 로도 넣을 수 있어요:
   python3 tools/photos.py download --csv 내사진목록.csv

이미 사진이 있는 단지는 건너뛰어요(--force 로 덮어쓰기).
"""
import argparse, csv, html, io, json, os, re, sys, time, urllib.parse, urllib.request

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
DATA_JS = os.path.join(ROOT, 'docs', 'js', 'data', 'apartments.js')
IMG_DIR = os.path.join(ROOT, 'docs', 'images', 'apts')
CACHE = os.path.join(ROOT, 'tools', 'cache')
UA = 'Mozilla/5.0 (compatible; bigyopateu-photos/1.0)'


def load_apts():
    src = open(DATA_JS, encoding='utf-8').read()
    return json.loads(src[src.index('{'):src.rindex('}') + 1])['apartments']


def has_photo(a):
    return any(os.path.exists(os.path.join(IMG_DIR, a['id'] + ext)) for ext in ('.jpg', '.jpeg', '.png', '.webp'))


# ---------- 1) search ----------
def naver_image_search(query, cid, secret, n):
    url = 'https://openapi.naver.com/v1/search/image?' + urllib.parse.urlencode({'query': query, 'display': n, 'sort': 'sim', 'filter': 'large'})
    req = urllib.request.Request(url, headers={'X-Naver-Client-Id': cid, 'X-Naver-Client-Secret': secret, 'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.load(r).get('items', [])


def cmd_search(args):
    apts = load_apts()
    os.makedirs(CACHE, exist_ok=True)
    out_path = os.path.join(CACHE, 'photo_candidates.json')
    cand = json.load(open(out_path, encoding='utf-8')) if os.path.exists(out_path) else {}
    todo = [a for a in apts if (args.force or not has_photo(a)) and (args.force or a['id'] not in cand)]
    if args.limit:
        todo = todo[:args.limit]
    print('검색할 단지 %d개' % len(todo))
    for i, a in enumerate(todo, 1):
        gu = (re.search(r'(\S+구)', a.get('address') or '') or [None, ''])[1]
        q = '%s %s 아파트 단지' % (gu, a['name'])
        try:
            items = naver_image_search(q, args.id, args.secret, args.n)
        except urllib.error.HTTPError as e:
            if e.code == 401:
                sys.exit('네이버 API 키가 맞지 않아요. developers.naver.com 에서 클라이언트 ID/시크릿을 확인해 주세요.')
            print('  %s: 오류 %s, 건너뜀' % (a['name'], e.code))
            continue
        cand[a['id']] = {'name': a['name'], 'query': q, 'items': [
            {'image': it.get('link'), 'thumb': it.get('thumbnail'), 'title': re.sub('<[^>]+>', '', it.get('title', '')),
             'w': it.get('sizewidth'), 'h': it.get('sizeheight')} for it in items]}
        print('[%d/%d] %s → 후보 %d개' % (i, len(todo), a['name'], len(items)))
        json.dump(cand, open(out_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        time.sleep(0.12)
    write_review(apts, cand)


def write_review(apts, cand):
    order = [a for a in apts if a['id'] in cand]
    rows = []
    for a in order:
        c = cand[a['id']]
        pics = ''.join(
            '<label class="pic"><input type="radio" name="%s" value="%d"><img loading="lazy" src="%s" alt=""><span>%s</span></label>'
            % (html.escape(a['id']), k, html.escape(it['thumb'] or it['image']), html.escape(urllib.parse.urlparse(it['image'] or '').netloc))
            for k, it in enumerate(c['items']))
        rows.append('<section data-id="%s"><h2>%s <small>%s</small></h2><div class="pics"><label class="pic none"><input type="radio" name="%s" value="-1" checked><b>사용 안 함</b></label>%s</div></section>'
                    % (html.escape(a['id']), html.escape(a['name']), html.escape(a.get('address') or ''), html.escape(a['id']), pics))
    page = """<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>단지 사진 고르기</title>
<style>body{font-family:-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif;margin:0;background:#f7f8fa;color:#191f28}
header{position:sticky;top:0;background:#fff;border-bottom:1px solid #e8ebef;padding:14px 24px;display:flex;gap:16px;align-items:center;z-index:2}
header p{margin:0;color:#4e5968;font-size:14px;flex:1}button{height:42px;padding:0 20px;border-radius:999px;border:0;background:#343E7A;color:#fff;font-weight:700;cursor:pointer}
main{padding:16px 24px 80px;max-width:1300px;margin:0 auto}section{background:#fff;border:1px solid #e8ebef;border-radius:16px;padding:16px;margin-bottom:12px}
h2{margin:0 0 10px;font-size:17px}h2 small{color:#8b95a1;font-weight:500;font-size:13px;margin-left:6px}
.pics{display:flex;gap:10px;overflow-x:auto;padding-bottom:4px}.pic{flex:none;width:170px;cursor:pointer;border-radius:12px;border:2px solid transparent;padding:4px}
.pic input{display:none}.pic img{width:160px;height:110px;object-fit:cover;border-radius:8px;display:block;background:#eceef6}.pic span{display:block;font-size:11px;color:#8b95a1;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pic.none{width:110px;display:grid;place-items:center;background:#f2f4f6;min-height:120px}.pic:has(input:checked){border-color:#343E7A;background:#eceef6}</style></head><body>
<header><p>단지마다 <b>허락받은 사진</b> 하나를 고르세요. 사진을 누르면 선택돼요. 다 고르면 저장을 눌러 <code>photo_choices.json</code>을 <code>tools/cache/</code>에 넣어 주세요.</p><button id="save">선택 저장</button></header>
<main>""" + ''.join(rows) + """</main>
<script>var CAND=""" + json.dumps(cand, ensure_ascii=False) + """;
document.getElementById('save').onclick=function(){var out={};document.querySelectorAll('section').forEach(function(s){var id=s.dataset.id,c=s.querySelector('input:checked');
if(c&&c.value!=='-1'){var it=CAND[id].items[+c.value];out[id]={name:CAND[id].name,image:it.image,source:it.image,title:it.title};}});
var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(out,null,1)],{type:'application/json'}));a.download='photo_choices.json';a.click();
alert(Object.keys(out).length+'개 단지를 저장했어요');};</script></body></html>"""
    path = os.path.join(ROOT, 'tools', 'photo_review.html')
    open(path, 'w', encoding='utf-8').write(page)
    print('고르기 화면: %s (%d개 단지)' % (path, len(order)))


# ---------- 2) download ----------
def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Referer': ''})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def save_image(data, dest, max_w):
    from PIL import Image
    im = Image.open(io.BytesIO(data))
    im = im.convert('RGB')
    if im.width < 400:
        raise ValueError('사진이 너무 작아요 (%dpx)' % im.width)
    im.thumbnail((max_w, max_w))
    im.save(dest, 'JPEG', quality=82, optimize=True, progressive=True)
    return im.size


def cmd_download(args):
    apts = load_apts()
    by_id = {a['id']: a for a in apts}
    by_name = {re.sub(r'\s', '', a['name']): a for a in apts}
    jobs = []
    if args.choices:
        for aid, c in json.load(open(args.choices, encoding='utf-8')).items():
            if aid in by_id:
                jobs.append((by_id[aid], c['image'], c.get('source') or c['image']))
    if args.csv:
        with open(args.csv, encoding='utf-8-sig') as fh:
            for row in csv.reader(fh):
                if len(row) < 2 or row[0].strip() in ('단지명', ''):
                    continue
                a = by_name.get(re.sub(r'\s', '', row[0])) or by_id.get(row[0].strip())
                if not a:
                    print('  목록에 없는 단지: %s' % row[0]); continue
                jobs.append((a, row[1].strip(), (row[2].strip() if len(row) > 2 and row[2].strip() else row[1].strip())))
    if not jobs:
        sys.exit('--choices 또는 --csv 를 넣어 주세요.')
    os.makedirs(IMG_DIR, exist_ok=True)
    cred_path = os.path.join(IMG_DIR, 'credits.json')
    credits = json.load(open(cred_path, encoding='utf-8')) if os.path.exists(cred_path) else {}
    ok = 0
    for a, url, source in jobs:
        dest = os.path.join(IMG_DIR, a['id'] + '.jpg')
        if os.path.exists(dest) and not args.force:
            print('  %s: 이미 있음, 건너뜀' % a['name']); continue
        try:
            if os.path.exists(url):
                data = open(url, 'rb').read()
            else:
                data = fetch(url)
            size = save_image(data, dest, args.max_width)
            host = urllib.parse.urlparse(source).netloc or '직접 제공'
            credits[a['id']] = {'name': a['name'], 'source': source, 'label': args.credit or host}
            ok += 1
            print('  %s: %dx%d 저장' % (a['name'], size[0], size[1]))
        except Exception as e:
            print('  %s: 실패 (%s)' % (a['name'], e))
        time.sleep(0.2)
    json.dump(credits, open(cred_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('완료: %d개 저장 → %s' % (ok, IMG_DIR))
    print('이제 build_data.py 를 다시 돌리면 사이트에 반영돼요.')


def main():
    p = argparse.ArgumentParser(description='비교파트 단지 사진 도구')
    sub = p.add_subparsers(dest='cmd', required=True)
    s = sub.add_parser('search', help='네이버 검색 API로 단지별 사진 후보 찾기')
    s.add_argument('--id', required=True, help='네이버 개발자센터 클라이언트 ID')
    s.add_argument('--secret', required=True, help='클라이언트 시크릿')
    s.add_argument('--n', type=int, default=8, help='단지당 후보 수 (기본 8)')
    s.add_argument('--limit', type=int, default=0, help='이번에 검색할 단지 수 (0 = 전부)')
    s.add_argument('--force', action='store_true', help='사진이 있는 단지도 다시 검색')
    d = sub.add_parser('download', help='고른 사진을 내려받아 사이트에 넣기')
    d.add_argument('--choices', help='photo_review.html 에서 저장한 photo_choices.json')
    d.add_argument('--csv', help='단지명,사진주소(또는 파일 경로)[,출처] CSV')
    d.add_argument('--credit', help='출처 문구를 직접 지정 (예: "사진 제공: ○○부동산")')
    d.add_argument('--max-width', type=int, default=1000)
    d.add_argument('--force', action='store_true', help='이미 있는 사진도 덮어쓰기')
    args = p.parse_args()
    {'search': cmd_search, 'download': cmd_download}[args.cmd](args)


if __name__ == '__main__':
    main()
