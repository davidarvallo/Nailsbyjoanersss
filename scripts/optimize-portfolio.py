"""Rebuild WebP derivatives from the repository ZIP. Requires Pillow.
Run from repository root: python scripts/optimize-portfolio.py
Only orientation, explicit crops, resizing, and WebP encoding are applied.
"""
from pathlib import Path
from zipfile import ZipFile
from io import BytesIO
import hashlib
import os
import json
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
# source, category, descriptive name, alt text, square crop top, optional display crop
PHOTOS = [
 ('IMG_1859.jpg','nails','nude-white-daisy-art','Nude nails with white daisies and delicate floral accents',.20,None),
 ('FullSizeRendersss.jpg','nails','green-black-halloween-art','Green and black nail art photographed outdoors',.26,None),
 ('15.jpg','nails','bright-red-colorful-charms','Long red and multicolor nails with raised decorative charms',.20,None),
 ('image4.jpg','nails','turquoise-pink-flowers','Turquoise nails with pink flowers and sparkling embellishments',.23,(0,240,1206,2380)),
 ('14.jpg','pedicures','pink-yellow-toe-art','Pedicure with bright pink and yellow accents on the big toes',.28,(0,240,1206,2380)),
 ('IMG_185.jpg','pedicures','pink-french-pedicure','Pink French pedicure photographed on a red towel',.26,(0,240,1206,2380)),
 ('16.jpg','nails','neon-green-patterns','Neon green nails with spirals, stripes, and contrasting black details',.23,None),
 ('image99.jpg','nails','orange-yellow-floral-art','Orange and yellow floral nail art with raised flower details',.22,None),
 ('12.jpg','nails','pink-character-details','Pink nails with illustrated characters and contrasting accent designs',.23,None),
 ('13.jpg','nails','pink-floral-french-art','Pink floral accents and French tips on a long nail set',.27,(0,240,1206,2380)),
 ('17.jpg','nails','blue-white-character-art','Blue and white character nail art on a long statement set',.30,None),
 ('18.jpg','nails','illustrated-character-set','Long nails with colorful illustrated characters and mixed accent designs',.24,None),
 ('19.jpg','nails','burgundy-black-graphic-art','Burgundy and black nail art with graphic lines and illustrated details',.24,None),
 ('20.jpg','nails','deep-blue-character-art','Deep blue nails with character art and pale blue accent designs',.31,None),
 ('21.jpg','nails','blue-mixed-design-set','Blue statement nails with mixed graphic and character designs',.26,None),
 ('FullSizeRender.jpg','nails','peach-floral-mixed-art','Peach and nude nails with colorful flowers and mixed accent patterns',.21,None),
 ('FullSizeRenders.jpg','nails','brown-nude-pattern-art','Brown and nude nail art with contrasting decorative accents',.22,None),
 ('image.jpg','nails','colorful-floral-accents','Nude nails with colorful flowers and decorative accent art',.23,None),
 ('image1.jpg','nails','pink-black-french-details','Pink nails with black French tips and fine contrasting details',.32,(0,500,1206,2220)),
 ('image2.jpg','nails','pink-striped-french-art','Pink and white striped French nail art with bright pink accents',.31,(0,240,1206,2380)),
 ('image3.jpg','nails','pastel-flower-charms','Long pastel nails with yellow and blue flower embellishments',.30,(0,240,1206,2380)),
 ('image5.jpg','nails','multicolor-floral-set','Multicolor floral nail art on a long nude base',.29,(0,240,1206,2380)),
]

def save_webp(image, target, quality):
    # Encode in memory, verify, then replace atomically; never publish a partial file.
    encoded = BytesIO()
    image.save(encoded, 'WEBP', quality=quality, method=6)
    content = encoded.getvalue()
    assert content, f'Empty encoder output for {target.name}'
    with Image.open(BytesIO(content)) as check: check.load()
    temporary = target.with_suffix('.tmp')
    with temporary.open('wb') as output:
        output.write(content)
        output.flush()
        os.fsync(output.fileno())
    temporary.replace(target)
    assert target.stat().st_size == len(content)

def main():
    output = ROOT / 'public/images'
    records = []
    with ZipFile(ROOT / 'NAILS & PEDICURE.zip') as archive:
        entries = {Path(n).name: n for n in archive.namelist() if not n.endswith('/')}
        hashes = {}; duplicates = []; originals = []
        for name, entry in entries.items():
            raw = archive.read(entry)
            with Image.open(BytesIO(raw)) as check: check.verify()
            digest = hashlib.sha256(raw).hexdigest()
            originals.append({'source': name, 'sha256': digest})
            if digest in hashes: duplicates.append({'source': name, 'sameAs': hashes[digest]})
            else: hashes[digest] = name
        assert len(hashes) == len(PHOTOS), 'Archive changed: curate new photos before processing'
        for source, category, slug, alt, top, display_box in PHOTOS:
            raw = archive.read(entries[source])
            original = ImageOps.exif_transpose(Image.open(BytesIO(raw))).convert('RGB')
            w, h = original.size
            side = min(w, h)
            y = min(round(h * top), h-side)
            square_box = (0,y,side,y+side)
            square = original.crop(square_box)
            display = original.crop(display_box) if display_box else original
            folder = output / category
            folder.mkdir(parents=True, exist_ok=True)
            for size in (400,800):
                thumb = square.copy(); thumb.thumbnail((size,size),Image.Resampling.LANCZOS)
                save_webp(thumb, folder / f'{slug}-{size}.webp', 86)
            full = display.copy(); full.thumbnail((1400,1800),Image.Resampling.LANCZOS)
            save_webp(full, folder / f'{slug}-large.webp', 89)
            records.append({'id':slug,'category':category,'alt':alt,'source':source,
                            'base':f'/public/images/{category}/{slug}',
                            'width':full.width,'height':full.height,
                            'squareCrop':list(square_box),'displayCrop':list(display_box) if display_box else None})
    (ROOT / 'portfolio-data.js').write_text('/* Generated by scripts/optimize-portfolio.py; do not edit asset paths by hand. */\nwindow.PORTFOLIO_PHOTOS = '+json.dumps(records,ensure_ascii=False,indent=2)+';\n')
    (ROOT / 'scripts/portfolio-audit.json').write_text(json.dumps({'archiveImages':len(originals),'uniqueImages':len(records),'duplicates':duplicates,'originals':originals},indent=2)+'\n')
    print(f'{len(originals)} images; {len(duplicates)} exact duplicates; {len(records)} unique WebP photo sets')

if __name__ == '__main__': main()
