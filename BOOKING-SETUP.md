# Booking integration status

The pink design, portfolio, carousel, in-page policies, and current service menu are connected to the booking API and admin dashboard in this branch.

## Required before opening

1. Connect a dedicated Neon PostgreSQL database to this Vercel project, with DATABASE_URL configured for the intended environment.
2. Run npm run setup:database in a trusted environment with DATABASE_URL set.
3. Run npm run setup:admin privately. Save its generated ADMIN_PASSWORD_HASH and SESSION_SECRET to Vercel, and give Joane her studio password privately.
4. Deploy, sign into /admin, set verified Apple Pay/Zelle instructions and location availability.
5. Set BOOKING_ENABLED=true in the intended environment and enable requests in the admin dashboard only after testing the complete flow.
6. Test a reservation, overlap blocking, deposit instructions, manual confirmation, private receipt, and cancellation.

Until configured, /api/booking?action=config reports ready:false and open:false. The client shows no sample availability and cannot submit.

## Remaining work

- Inspiration images currently remain browser-only previews; durable private uploads and admin image viewing are not implemented.
- Square environment variable names exist in production, but this integration does not create Square checkout sessions or verify Square payments.
- Apple Pay/Zelle instructions are manual transfer instructions entered by Joane; this site does not verify transfers automatically.
- Live database and admin login need verification after setup.

## Build

npm ci
npm test
npm run build

Only the generated dist directory is served as static content. API and database/auth sources stay outside it.
