# Nailsbyjoanersss

The production site lives on `main`. It uses Joane’s refined cream, blush, and wine design, the real-photo hero carousel, portfolio, custom booking page, and private studio dashboard. Vercel installs the locked dependencies, runs `npm run build`, and serves `dist`; `/api/booking` is a server function.

## Develop and verify

```sh
npm ci
npm test
npm run build
python scripts/check-portfolio.py
```

Node 22 or newer is required. The build checks JavaScript syntax and static asset paths, and keeps server/database/auth source outside `dist`. Do not serve the repository root as production static content.

## Booking status

Booking is connected but remains gated by server configuration and Joane’s dashboard setting. See [BOOKING-SETUP.md](BOOKING-SETUP.md) for the required database, admin, and activation steps. Deploying the design does not enable booking or migrate the database. The form reports setup status instead of inventing availability. Inspiration uploads are browser-only previews; persistent private image uploads and Square payment processing are not implemented.

## Opening signature

`index.html`, `intro.css`, and `intro.js` provide a 3.2-second wine and blush introduction using the unchanged transparent `White_NAILS_By_Joanersss_logo.png` (1524×1032). The logo fades and gently settles into place, followed by a masked gloss sweep, fine highlight, and fade into the pink homepage. The build explicitly includes the original PNG.

The signature plays once per tab session using `sessionStorage`, with a namespaced `window.name` marker when storage writes fail. Its pink-specific key lets visitors see the new signature once after the previous charcoal version. Reduced motion skips the intro; Tab or Escape dismisses it. Page exit clears the overlay before browser back/forward restoration. Failed/late logo loading exits early, and an independent 3.7-second watchdog restores the page if the controller fails. The overlay is hidden by default and independent of booking/API requests. Only transform and opacity animate; no animation libraries are added.

## Portfolio and carousel

All 22 unique archive photos (20 nails and 2 pedicures) remain available. Five exact duplicates from the ZIP are omitted. Each photo has 400px and 800px square thumbnails plus a larger display version capped at 1400×1800, with reviewed crops, responsive source sizes, alt text, and reserved dimensions. Rebuild using `python scripts/optimize-portfolio.py`; image audit details are in `scripts/portfolio-audit.json` and crop data in `portfolio-data.js`.

The compact hero photo frame is capped at 500px on desktop and 330px on mobile, with a clearly visible leopard-patterned frame. Photos gently zoom out from 1.065× to their normal crop and crossfade every 4.5 seconds (including the transition). Swipe and arrow keys remain available; reduced motion disables the zoom and autoplay. It pauses offscreen, in hidden tabs, and with reduced motion. `/portfolio` offers category filters, Load More, and a native dialog lightbox. Selecting a look passes the inspiration to `/book`. The fall promotion follows the America/Los_Angeles calendar and hides outside October 1–November 30, 2026.

## Branch consolidation

The production consolidation uses `preview/joane-refinement` at `c24adbe2b06bf7bb5baca55891c2a38bf39b77e6` as its site foundation, with the uploaded logo and restyled opening animation carried forward from `main` at `464ea4ab397d1975593a5dfda6c2721e66e27127`.

The consolidation commit retains both histories and `feature/custom-booking` at `950c46403867858d0d9ae99f53b637004c7da765` as parents. `preview/joane-mockup` at `654f1d07e51dad90b5659c8f1920308b8dd499b9` is already an ancestor of refinement. This preserves every branch’s commits after removing the extra branch references. The older booking branch’s separate file layout is historical; the refinement implementation is the active one.
