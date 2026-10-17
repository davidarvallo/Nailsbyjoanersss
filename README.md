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

## Soft palette and full-archive hero

The refinement now uses cream for the main page and nail-art section, lighter blush for the hero and final invitation, and wine for the header, footer, headings, and actions. The hero keeps a thinner leopard frame. The booking summary is blush rather than a large wine block. These changes only affect presentation; service content, prices, appointment rules, and booking behavior remain unchanged.

`hero-carousel.js` cycles through all 22 unique archive photographs (20 nails, 2 pedicures); five exact duplicate ZIP entries are omitted. It uses the individually cropped 400/800px WebP versions and maintains two image layers for an 850ms crossfade, with a 6.5-second reading interval between transitions. Only the initial image has high fetch priority. The next image is prefetched after the first loads; all 22 photos are not eagerly requested. The photo frame reserves a square aspect ratio, and controls sit below the artwork.

Controls include previous/next, pause/play, arrow keys, and touch swipe. Keyboard focus/manual navigation pause automatic cycling; autoplay also pauses while hovered, offscreen, or in a hidden tab. Reduced-motion visitors start paused with transitions disabled. Each photo links to its larger portfolio view. Failed subsequent loads keep the previous photo visible. Without JavaScript the initial photo and portfolio link remain usable, and slideshow controls stay hidden.

Checks cover all 22 photos and loop boundaries, image prefetch behavior, controls, reduced motion, offscreen/background handling, focus pause, swipe, rapid clicks, and failed-image recovery. Primary new text/background pairs exceed 4.5:1 contrast. Native visual browser checks remain unavailable.
