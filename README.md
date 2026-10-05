# Nailsbyjoanerss

Custom booking requests and a private appointment dashboard, built into Joane’s existing Vercel website. Setmore has been removed.

## Routes

- `/`: existing landing page and policies.
- `/book`: service, nail art, removal, length, location, date, contact details, policy acceptance, deposit instructions, and private status link.
- `/admin`: authenticated request management, deposit verification, manual confirmation/decline/cancellation, rescheduling and duration adjustment, shared calendar blocks, date/location assignments, and payment instructions.
- `/api/booking`: server-only validation and PostgreSQL persistence. Client details never appear in public availability or status responses.

## Activate production

Booking intentionally fails closed until setup is complete. No mock availability or localStorage bookings are used.

1. In the Vercel project `nailsbyjoanersss`, connect a Neon PostgreSQL database through Storage/Marketplace. Use the free plan if offered and review its terms. The integration sets `DATABASE_URL`. Do not use another project’s customer database.
2. Pull environment variables locally or run the migration with `DATABASE_URL` in your environment: `npm run setup:database`. This installs tables, indexes, atomic reservation functions and a closed booking configuration. It is idempotent and does not delete requests.
3. Run `npm run setup:admin` privately. Put `ADMIN_PASSWORD_HASH` and `SESSION_SECRET` into encrypted Vercel environment variables for production and preview. Share only the generated studio password privately with Joane. Never commit the values or paste them into public issues. To rotate access, generate fresh credentials and replace both environment variables.
4. Add `BOOKING_ENABLED=true` to production after the database and login work, then redeploy. This deployment gate is separate from Joane’s dashboard toggle.
5. Sign in at `/admin`, add verified Apple Pay/Zelle instructions, assign dates to San Bernardino or San Jacinto, and save. Review appointment durations with Joane. Enable “Accept online appointment requests” when ready.
6. Complete a test request, verify it appears in the dashboard, manually confirm it after checking the deposit, check the private client status link, and cancel the test visit to release the slot. Do not open bookings to clients until this production check passes.

Vercel uses the GitHub repository’s `main` branch and `public/` as its static output. Server implementation and SQL are outside the public directory. The Vercel API is in `api/booking.js`.

## Scheduling and payment

- One shared calendar for Joane across both locations. Overlap checks reserve the entire visit duration, not only the start time. PostgreSQL locks serialize reservations and changes to prevent simultaneous requests from taking overlapping times.
- Tuesday–Saturday, 6:00 AM / 8:30 AM / 11:30 AM / 2:30 PM / 5:00 PM / 7:30 PM Pacific. Saturday excludes 7:30 PM.
- One calendar month ahead, at least 24 hours before the visit. Same-day requests and house calls use Joane’s text contact.
- $20 deposit; 6 AM uses $35, including the $15 early fee. Apple Pay/Zelle deposits are manually verified; balance is cash. The website never charges a card or pretends to verify a transfer.
- Pending slots expire at midnight Pacific on the request day. Availability ignores expired holds, and management refuses to confirm an expired request. No background cron is needed to free a slot.
- Standard reservation: 150 minutes. Statement sets and removal plus a new set reserve 180 minutes. These are conservative initial allocations, not prices or durations claimed by the original website; Joane can change the total duration on a request before confirming it.
- The original website provides nail-art charges only: Tier 1 $10, Tier 2 $10, Tier 3 $25–35, Tier 4 $40+. Base prices, soak-off prices, and length surcharges are not invented. The form says “Price quoted by Joane.”
- Pedicure booking is deferred until packages, prices, and additional durations are supplied. No foreign fills. Clients attest that their fill is Joane’s work within 3½ weeks.
- No automated email/SMS sending is configured. Joane uses the dashboard’s text link to communicate; clients can check their private status link. Addresses and refunds are handled directly by Joane under the existing policies.
- Unassigned dates can request either location. Assign each working day to a location before opening; changes apply to new requests and do not move existing appointments. Block travel time as needed.

## Security

The studio password is checked using salted scrypt. Signed sessions expire in eight hours, with HttpOnly, Secure (production), SameSite=Strict cookies. Administrative actions enforce authentication and same-origin POSTs. Rate limits are shared in PostgreSQL for login and booking submissions. Availability responses include no client details; private receipt links use random 256-bit tokens, with only their hashes stored in the database. Receipt links put the token in the URL fragment; requests carrying it are no-store. No payment account is guessed.

## Local development and verification

`npm install`, `npm run dev`, `npm run build`, `npm test`.

Without environment configuration the local preview shows the real setup notice and cannot reserve anything. Tests use isolated PostgreSQL-compatible PGlite to exercise the actual schema and reservation functions, plus Pacific/DST rules, authentication and API access guards. They do not prove that an unconnected production database works. Verify the live database flow after provisioning.
