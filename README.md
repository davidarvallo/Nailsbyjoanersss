# Nailsbyjoanerss

Static luxury nail studio landing-page mockup. Deploy repository root using Vercel Other preset; no build command required. Online booking and payment links are not connected.

## Portfolio photography

`portfolio.html` adds `/portfolio` using the existing Vercel clean URLs. The homepage shows four portfolio favorites, two nail examples, and two pedicure examples. Service prices and booking behavior are unchanged. Production currently uses `main`; separate booking/design branches are not merged by this change.

The ZIP contains 27 JPEG entries: 23 nails and 4 pedicures, including five exact duplicates. The portfolio contains 20 unique nail photos and 2 unique pedicure photos. Source names and duplicate hashes are recorded in `scripts/portfolio-audit.json`; individual crops and display dimensions are in `portfolio-data.js`. All 22 unique images are retained; some originals are dark but the artwork remains visible. No photo is labeled as a pricing tier.

Each photo has 400px and 800px square thumbnails, plus a larger view capped at 1400×1800. Gallery thumbnails use responsive `srcset`, reserved dimensions, and lazy loading. Larger images load only when the native dialog opens. The 12-photo initial gallery supports category filters and Load More. Native dialog supplies Escape dismissal and focus containment; arrow keys and buttons navigate, with focus restored on close. The homepage links directly to the relevant photo.

Rebuild images with Python and Pillow:

```sh
python scripts/optimize-portfolio.py
python scripts/check-portfolio.py
node --check portfolio.js
node --check portfolio-data.js
```

The source archive remains intact. Extraction happens in memory; no temporary source photos are tracked. Image processing corrects EXIF orientation, applies reviewed crops, resizes without stretching, and encodes metadata-free WebP. Screenshot borders and controls are removed from larger display copies where present. This is a static site with no configured lint, TypeScript, or application build command. Vercel serves the repository root, so asset URLs intentionally include `/public/images/`.
