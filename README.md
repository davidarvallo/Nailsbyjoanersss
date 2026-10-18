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

## Studio opening signature

The homepage uses `intro.css`, `intro.js`, and a small fail-open bootstrap in `index.html`. The original transparent `White_NAILS_By_Joanersss_logo.png` (1524×1032) is displayed unchanged over the existing charcoal and muted-gold palette. Its reveal, masked gloss, fine highlight, and homepage fade take 3.2 seconds. There are no new runtime dependencies or build steps.

The signature plays once per tab session, using `sessionStorage` and an appended, namespaced `window.name` marker only when storage writes fail. Reduced motion skips it. Tab or Escape dismisses it immediately. Page exit clears it before browser back/forward restoration. A 3.7-second independent watchdog clears the overlay if its controller fails; failed or late logo loads dismiss it sooner. The overlay is hidden by default, so disabled JavaScript or failed styles leave the homepage usable. The booking script does not control the intro timeline. Slow connections may skip the reveal rather than delay access to the site.

QA: desktop Chromium (1440×1000) and mobile Chromium emulation (390×844), first visit/reload, portfolio filters/lightbox/return, mobile menu, service dialog, reduced motion, unavailable storage, missing logo/controller, disabled JavaScript, keyboard dismissal, and slow booking script. Physical iOS Safari and WebKit have not been tested.
