# Nailsbyjoanersss — pink review mockup

This branch (`preview/joane-mockup`) preserves Joane's pink, wine, cream, floral, and leopard design, pedicure/fall menus, prices, and existing booking preview behavior. Booking submissions remain disabled as in the original mockup.

## Portfolio

The homepage has four portfolio favorites, two nail examples near the artistry content, and two pedicure examples below the pedicure menu. `/portfolio` uses the existing Vercel clean URLs and includes All Work / Nails / Pedicures filters, 12 initial photos, Load More, and a native dialog lightbox with arrow navigation, Escape dismissal, and focus restoration.

The ZIP contains 27 JPEGs (23 nails, 4 pedicures), including five exact duplicates. All 22 unique photos (20 nails, 2 pedicures) have 400px and 800px square thumbnails plus a larger display version capped at 1400×1800. Individually reviewed crops keep the artwork visible and remove screenshot controls. No color changes, sharpening, stretching, or artwork alterations are applied. No photo is classified as a pricing tier.

Images use responsive `srcset`, reserved dimensions, alt text, and lazy loading. Large display copies load only when a photo opens. Native dialog supplies focus containment and Escape support; no animation is required. Asset URLs use `/public/images/` because the existing deployment serves the repository root.

Source hashes and exact duplicates are in `scripts/portfolio-audit.json`. Crop coordinates are in `portfolio-data.js`. Source extraction is in memory; no extracted photographs are tracked.

To rebuild and check (Python with Pillow required):

```sh
python scripts/optimize-portfolio.py
python scripts/check-portfolio.py
node --check portfolio.js
node --check portfolio-data.js
```

This static mockup has no configured lint, TypeScript, or application build command. Keep the existing Vercel project and preview branch deployment; do not create another project or promote over production without a request.
