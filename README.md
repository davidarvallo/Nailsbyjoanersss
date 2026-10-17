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

## Refined review concept

The `preview/joane-refinement` concept uses Joane's real floral set in the hero, clearer appointment and portfolio actions, a Services dropdown, compact menu cards with expandable inclusions, a deposit/payment/confirmation summary, and mobile booking/text shortcuts. Original prices and full menu descriptions remain available. Fill/removal reminders are expandable; the full policies stay visible in their original section.

Portfolio lightboxes link a selected look into the booking preview. The booking form previews up to three JPG/PNG/WebP images (10 MB each), validates selection, and supports removing images. These image previews are browser-only: no image upload service or appointment submission is enabled. Existing booking logic and configuration remain unchanged.

The homepage fall promotion and its navigation links hide outside October 1–November 30, 2026 using the America/Los_Angeles calendar date. Booking's existing seasonal validation remains unchanged.

A portrait of Joane and client testimonials are intentionally deferred until real, approved content is supplied. No fabricated portrait, testimonial, rating, or client quote is shown. Native browser rendering across desktop/tablet/iPhone has not been checked in this environment; DOM interaction, image, static path, and JavaScript checks are run before deployment.
