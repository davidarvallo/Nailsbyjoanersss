"""Static portfolio asset checks. Requires Pillow; run from any directory."""
from pathlib import Path
from html.parser import HTMLParser
import json
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]

class Assets(HTMLParser):
    def handle_starttag(self, tag, attrs):
        attrs=dict(attrs)
        if tag in ('img','script') or (tag=='link' and attrs.get('rel')=='stylesheet'):
            src=attrs.get('src') or attrs.get('href')
            if src and not src.startswith(('https:','data:')):
                assert (ROOT/src.lstrip('/')).is_file(), f'Missing asset: {src}'
        if tag=='img' and 'public/images/' in attrs.get('src',''):
            assert attrs.get('width') and attrs.get('height') and attrs.get('alt')
            if attrs.get('fetchpriority')=='high': assert attrs.get('loading')!='lazy'
            else: assert attrs.get('loading')=='lazy'

for page in ('index.html','portfolio.html'):
    Assets().feed((ROOT/page).read_text())
photos=json.loads((ROOT/'portfolio-data.js').read_text().split('window.PORTFOLIO_PHOTOS = ')[1].rstrip(';\n'))
assert len(photos)==22
assert len({p['id'] for p in photos})==22
assert sum(p['category']=='nails' for p in photos)==20
assert sum(p['category']=='pedicures' for p in photos)==2
for photo in photos:
    for size in ('400','800','large'):
        p=ROOT/f"{photo['base'].lstrip('/')}-{size}.webp"
        with Image.open(p) as im:
            im.load()
            assert im.format=='WEBP'
            assert not im.getexif() and not im.info.get('xmp') and not im.info.get('icc_profile')
            if size!='large': assert im.size==(int(size),int(size))
            else: assert im.size==(photo['width'],photo['height'])
print('PASS: 22 photo sets / 66 WebP files, dimensions, metadata, HTML asset paths, alt text, lazy loading.')
