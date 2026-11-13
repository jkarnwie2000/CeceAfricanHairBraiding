# Cece African Hair Braiding — notes for Claude

Full-stack salon booking + beauty-supply e-commerce app. See README.md for setup.

## Layout
- `shared/business.js` — business info, opening hours, booking policy. Imported by BOTH server and client (`@shared` alias in Vite).
- `server/` — Express 5 + Mongoose 9 (ESM). Layers: routes → controllers → services → models. Zod schemas in `src/validators`.
- `client/` — React 19 + Vite 8 + React Router 7. Plain CSS in `src/styles` with tokens in `base.css`.

## Commands
- `npm run dev:memory` (root) — API with in-memory MongoDB + demo data, plus Vite. Admin `admin@ceceafricanhair.com` / `ChangeMe123!`.
- `npm test` (root or server) — 24 API tests (mongodb-memory-server + supertest).
- `npm run build` — client production build.

## Conventions / invariants
- Money is always integer **cents** in the DB and API (`priceCents`, `totalCents`). Admin forms send dollars; controllers convert.
- Never trust client prices: cart/checkout re-price via `services/cartService.buildCart`.
- Orders become `paid` ONLY in `services/orderService.fulfillCheckoutSession`, called from the verified Stripe webhook. It is idempotent (atomic `paymentStatus != 'paid'` guard + `ProcessedEvent`).
- Stripe webhook route is mounted with `express.raw` BEFORE `express.json` in `app.js` — keep it that way.
- Appointments store salon-local `date` (YYYY-MM-DD) + `startMinutes`/`endMinutes`; capacity = `BOOKING_CAPACITY`. Double booking prevented by per-date lock + post-insert `verifyNoOverbooking`.
- Express 5: `req.query` is read-only → validated query lives on `req.validatedQuery`.
- Mongoose 9: use `{ returnDocument: 'after' }`, not `{ new: true }`; pre-hooks are async without `next`.
- Admin auth pages: `/admin/login` + `/admin/register` (public routes declared before the protected `/admin/*` tree). `POST /api/auth/register-admin` requires `ADMIN_SIGNUP_CODE` (empty = disabled). `RequireAdmin` redirects to `/admin/login`.
- Auth: JWT in httpOnly cookie `cece_token`; client checks session via `GET /api/auth/session` (returns `{user:null}` instead of 401).
- Don't put `backdrop-filter`/`transform` on `.site-header` — it traps the fixed mobile menu.
