# Cece African Hair Braiding — Salon & Beauty Supply Platform

A production-ready web application for **Cece African Hair Braiding**, an African-owned hair braiding salon and beauty supply store. It combines:

- a **salon website** (services, about, FAQ, contact, policies),
- a real-time **appointment booking system** with double-booking protection,
- an **online beauty supply store** with cart, search and filters,
- a **real Stripe Checkout** integration with verified webhooks,
- **customer accounts** (orders, appointments, profile, password reset), and
- a protected **admin dashboard** for the business owner.

---

## Table of contents

1. [Tech stack](#tech-stack)
2. [Features](#features)
3. [Project structure](#project-structure)
4. [Quick start (5 minutes, no database install)](#quick-start-5-minutes-no-database-install)
5. [Full installation](#full-installation)
6. [Environment variables](#environment-variables)
7. [MongoDB setup](#mongodb-setup)
8. [Stripe setup (test mode)](#stripe-setup-test-mode)
9. [Stripe webhooks](#stripe-webhooks)
10. [Testing the checkout end-to-end](#testing-the-checkout-end-to-end)
11. [Email setup](#email-setup)
12. [Running the frontend and backend](#running-the-frontend-and-backend)
13. [Automated tests](#automated-tests)
14. [Deployment](#deployment)
15. [Before you launch: checklist](#before-you-launch-checklist)
16. [Security notes](#security-notes)

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router 7, Vite 8, Axios, Context API, plain CSS (design tokens, mobile-first) |
| Backend | Node.js 20+, Express 5, REST API, Zod validation, Helmet, rate limiting |
| Database | MongoDB with Mongoose 9 |
| Payments | Stripe Checkout (hosted), Stripe Node SDK, Stripe webhooks with signature verification |
| Auth | JWT in an **httpOnly** cookie, bcrypt password hashing, role-based access control |
| Email | Nodemailer (any SMTP provider) |
| Tooling | npm, Git, dotenv, Node test runner + Supertest + mongodb-memory-server |

Everything is JavaScript (no TypeScript).

## Features

**Customers**
- Home page with hero, featured services, best sellers, testimonials, "why choose us", hours, contact and social links
- Services page (10 braiding styles with photo, description, starting price, duration, Book Now)
- Booking: choose service → calendar of *available* dates → open time slots → details → review → confirm
- Booking confirmation email with a secure **manage link** to cancel/reschedule (up to 24h before)
- Shop with search, category filter, price filter, in-stock filter, sorting and pagination
- Product pages with stock status, quantity selector capped at inventory, reviews & ratings, related products
- Cart saved in the browser (survives refresh), live server-calculated subtotal, tax, shipping and total
- Checkout form (contact + shipping) → **Stripe-hosted payment page** → order confirmation page + email
- Accounts: register, log in/out, forgot/reset password, profile & address, order history with tracking, appointments
- Contact form, newsletter signup, FAQ, Privacy Policy, Terms, Shipping & Returns

**Business owner (Admin → `/admin`)**
- Dashboard: total sales, 30-day revenue chart, average order, pending bookings, customers, reviews, recent orders, upcoming appointments, low stock, best sellers
- Orders: filter/search, see items & address, update status (processing → shipped → delivered), tracking numbers, customer emails
- Appointments: approve, reschedule, complete, no-show, cancel (client is emailed), private notes, **closed dates/holidays**
- Products: add/edit/delete, upload photos, inline inventory editing, hide/feature products
- Categories, Services (names, descriptions, prices, durations, photos), Customers (promote to admin), Reviews (hide/delete), Messages & newsletter export (CSV)

## Project structure

```
cece-african-hair-store/
├── package.json            ← root scripts (run both apps together)
├── shared/business.js      ← business name, address, phone, HOURS, booking policy (used by client AND server)
├── server/                 ← Express API
│   ├── .env.example
│   ├── src/
│   │   ├── app.js          ← Express app (security, webhook raw body, routes, static client in production)
│   │   ├── server.js       ← entry point            bootstrap.js ← connect DB + listen
│   │   ├── dev-memory.js   ← zero-install dev mode (in-memory MongoDB + demo data)
│   │   ├── config/         ← env, db, stripe
│   │   ├── models/         ← User, Product, Category, Review, Service, Appointment, Order, misc
│   │   ├── controllers/    ← request handlers (auth, products, checkout, webhook, appointments, admin…)
│   │   ├── routes/         ← REST routes
│   │   ├── middleware/     ← auth/RBAC, validation, security, uploads, errors
│   │   ├── services/       ← cart pricing, booking/slots, order fulfillment, email
│   │   ├── validators/     ← Zod request schemas
│   │   ├── emails/         ← HTML email templates
│   │   ├── utils/          ← pricing, time zones, slots, tokens, strings
│   │   └── seed/           ← starter catalog + demo data
│   ├── tests/api.test.js   ← end-to-end API tests
│   └── uploads/            ← admin-uploaded images
└── client/                 ← React app (Vite)
    ├── .env.example
    ├── public/images/      ← optimized WebP photography (see CREDITS.md)
    └── src/
        ├── api/            ← axios instance + API services
        ├── context/        ← Auth, Cart, Toast providers
        ├── layouts/        ← MainLayout, AdminLayout
        ├── components/     ← Navbar, Footer, ProductCard, ServiceCard, booking/, admin/, ui primitives
        ├── pages/          ← public pages, auth/, account/, admin/
        ├── hooks/          ← useAsync, useCartQuote
        ├── data/           ← testimonials, FAQ, policy text
        ├── utils/          ← formatting helpers
        └── styles/         ← base (tokens), components, layout, pages, admin
```

## Quick start (5 minutes, no database install)

Requirements: **Node.js 20.19+** (check with `node -v`).

```bash
# 1. Install everything (root, server and client)
npm run install:all

# 2. Start API (with a temporary in-memory MongoDB + demo data) and the website
npm run dev:memory
```

Open **http://localhost:5173**.

| Login | Email | Password |
|---|---|---|
| Admin | `admin@ceceafricanhair.com` | `ChangeMe123!` |
| Demo customer | `amara@example.com` | `Customer123!` |

> The in-memory database is wiped every time you stop the server. The first run downloads a MongoDB binary (~100 MB). Checkout will say "payments are not configured" until you add Stripe keys (below).

## Full installation

```bash
git clone <your-repo-url> cece-african-hair-store
cd cece-african-hair-store
npm run install:all

# Create your environment file
cp server/.env.example server/.env      # Windows PowerShell: Copy-Item server/.env.example server/.env
```

Edit `server/.env` (see below), then:

```bash
npm run seed          # creates categories, 34 products, 10 services and the admin account
npm run seed:demo     # OPTIONAL: adds demo customers, reviews, orders and appointments
npm run dev           # API on :5000 + website on :5173
```

## Environment variables

All secrets live in **`server/.env`** (never commit it — it's in `.gitignore`).

| Variable | Required | Example / notes |
|---|---|---|
| `NODE_ENV` | | `development` or `production` |
| `PORT` | | `5000` |
| `CLIENT_URL` | ✔ | `http://localhost:5173` — used for CORS, Stripe redirect URLs and email links |
| `SERVER_URL` | | `http://localhost:5000` |
| `MONGODB_URI` | ✔ | `mongodb://127.0.0.1:27017/cece` or an Atlas URI |
| `JWT_SECRET` | ✔ (prod) | long random string: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | | `7d` |
| `STRIPE_SECRET_KEY` | ✔ for payments | `sk_test_…` (test) / `sk_live_…` (live) |
| `STRIPE_PUBLISHABLE_KEY` | | `pk_test_…` (not required by hosted Checkout; stored for future use) |
| `STRIPE_WEBHOOK_SECRET` | ✔ for payments | `whsec_…` |
| `CURRENCY` | | `usd` |
| `TAX_RATE` | | `0.089` = 8.9% (applied to the product subtotal) |
| `SHIPPING_FLAT_RATE` | | `7.99` |
| `FREE_SHIPPING_THRESHOLD` | | `75` |
| `BOOKING_CAPACITY` | | number of braiders working at once (`2`) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | for real email | leave `SMTP_HOST` empty in development → emails print in the server console |
| `EMAIL_FROM` | | `"Cece African Hair Braiding <hello@yourdomain.com>"` |
| `NOTIFY_EMAIL` | | where new booking/order/contact alerts go |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | | used by `npm run seed` to create the first admin |

The client normally needs **no** env file. `client/.env.example` documents the two optional values (`VITE_API_PROXY`, `VITE_API_URL`).

**Business details, hours and booking rules** are in `shared/business.js` — update the address, phone, email, social links and opening hours there once and they change everywhere (website, booking calendar, emails).

## MongoDB setup

**Option A — MongoDB Atlas (recommended, free tier):**
1. Create an account at <https://www.mongodb.com/cloud/atlas> and a free **M0** cluster.
2. *Database Access* → add a database user + password.
3. *Network Access* → add your IP (or `0.0.0.0/0` for hosted servers).
4. *Connect → Drivers* → copy the URI and put it in `MONGODB_URI`, adding the database name: `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/cece?retryWrites=true&w=majority`

**Option B — local MongoDB:** install MongoDB Community Server and use `MONGODB_URI=mongodb://127.0.0.1:27017/cece`.

**Option C — no install:** `npm run dev:memory` (temporary data, development only).

## Stripe setup (test mode)

1. Create a free account at <https://dashboard.stripe.com/register>. You don't need to activate payments to use **test mode**.
2. Make sure the **Test mode** toggle (top right of the Dashboard) is ON.
3. Go to **Developers → API keys** and copy:
   - *Secret key* `sk_test_…` → `STRIPE_SECRET_KEY`
   - *Publishable key* `pk_test_…` → `STRIPE_PUBLISHABLE_KEY`
4. Optional: **Settings → Payment methods** — enable Apple Pay, Google Pay, Cash App Pay, Klarna, etc. Checkout automatically shows every method enabled on your account (we don't hard-code card-only).
5. Optional: **Settings → Branding** — upload the logo and set brand colors (brown `#3B2416`, gold `#B8862F`) so the hosted checkout page matches the site.

### How the payment flow works

```
Browser                         Express API                          Stripe
───────                         ───────────                          ──────
Cart (product ids + qty) ─────► POST /api/checkout/session
                                 • load prices & stock from MongoDB
                                 • compute subtotal, tax, shipping
                                 • save Order (pending_payment)
                                 • create Checkout Session ─────────► hosted payment page
◄──────────── redirect to session.url ◄────────────────────────────
Customer pays on checkout.stripe.com ───────────────────────────────►
                                 POST /api/webhooks/stripe ◄──────── checkout.session.completed (signed)
                                 • verify signature
                                 • mark order PAID (atomic, once)
                                 • decrement inventory
                                 • send confirmation email
/checkout/success?session_id ──► GET /api/checkout/session/:id → order details
```

The browser **never** sends prices. An order only becomes `paid` after a **signature-verified** webhook.

## Stripe webhooks

### Local development (Stripe CLI)

1. Install the Stripe CLI: <https://docs.stripe.com/stripe-cli> (Windows: `scoop install stripe`, or download the `.zip` from GitHub releases; macOS: `brew install stripe/stripe-cli/stripe`).
2. `stripe login`
3. In a separate terminal run:
   ```bash
   npm run stripe:listen
   # same as: stripe listen --forward-to localhost:5000/api/webhooks/stripe
   ```
4. It prints `Your webhook signing secret is whsec_…` → copy it to `STRIPE_WEBHOOK_SECRET` in `server/.env` and **restart the API**.
5. Keep `stripe listen` running while you test checkout.

### Production

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. Endpoint URL: `https://YOUR-DOMAIN/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired`
   - `charge.refunded`
4. Copy the endpoint's **Signing secret** (`whsec_…`) into the production `STRIPE_WEBHOOK_SECRET`.

Idempotency is guaranteed twice: processed event IDs are stored (`ProcessedEvent`), and the order is marked paid with an atomic "only if not already paid" update — so retries or duplicate events never double-charge stock or re-send emails.

## Testing the checkout end-to-end

With `npm run dev` (or `dev:memory`) and `stripe listen` running:

1. Add products to the cart → **Proceed to checkout** → fill in the form → **Secure checkout**.
2. On Stripe's page use a test card:

| Scenario | Card number |
|---|---|
| Successful payment | `4242 4242 4242 4242` |
| Requires 3-D Secure authentication | `4000 0025 0000 3155` |
| Declined (insufficient funds) | `4000 0000 0000 9995` |
| Declined (generic) | `4000 0000 0000 0002` |

   Use any future expiry (e.g. `12/34`), any 3-digit CVC and any ZIP.
3. **Success:** you land on `/checkout/success` → "Thank you for your order!" with the order number. The `stripe listen` terminal shows `checkout.session.completed [200]`, stock goes down in Admin → Products, the order appears in Admin → Orders as *Paid / Processing*, and a confirmation email is printed/sent.
4. **Cancel:** click the back arrow on the Stripe page → `/checkout/cancel` explains no payment was taken and your cart is still saved. The pending order is cancelled.
5. **Declined cards** show an error on Stripe's page; nothing is charged and the order stays unpaid (it expires automatically after 1 hour).
6. **Refund:** refund the payment in the Stripe Dashboard → the `charge.refunded` webhook marks the order *refunded/cancelled*.

You can also replay events: `stripe trigger checkout.session.completed` (note: triggered events have no matching order and are safely ignored).

## Email setup

Without SMTP settings, every email (booking confirmations, order confirmations, password resets, owner alerts) is **printed in the API terminal** — handy for development.

For real delivery, fill the `SMTP_*` variables with any provider:

| Provider | Host | Port | Notes |
|---|---|---|---|
| Gmail / Google Workspace | `smtp.gmail.com` | 587 | requires 2-Step Verification + an **App Password** |
| SendGrid | `smtp.sendgrid.net` | 587 | user `apikey`, pass = API key |
| Mailgun, Postmark, Resend, Brevo | see provider docs | 587 | recommended for production deliverability |

Use an `EMAIL_FROM` address on a domain you've verified with the provider.

## Running the frontend and backend

| Command (from the project root) | What it does |
|---|---|
| `npm run dev` | API (`:5000`, auto-restarts on changes) + website (`:5173`) |
| `npm run dev:memory` | Same, but with an in-memory database pre-filled with demo data |
| `npm run dev --prefix server` | API only |
| `npm run dev --prefix client` | Website only (proxies `/api` to `:5000`) |
| `npm run seed` / `npm run seed:demo` | Insert starter catalog (+ demo data). Safe to re-run; never overwrites your edits |
| `npm run build` | Production build of the React app into `client/dist` |
| `npm start` | Start the API; with `NODE_ENV=production` it also serves `client/dist` |
| `npm test` | Run the API test suite |

## Automated tests

`npm test` runs 22 end-to-end API tests against a real in-memory MongoDB, using the real Stripe SDK for webhook signing (only the network call that creates a Checkout Session is stubbed). They cover:

- registration, login, httpOnly cookies, password reset, admin-only routes (customers get 403)
- search/filter/sort, regex-injection safety, product detail + related products
- cart re-pricing from the database (tampered prices ignored), inventory limits, tax/shipping math
- checkout rejection for out-of-stock items and invalid addresses
- Stripe session parameters use **database** prices; inventory untouched before payment
- webhook: bad signatures rejected; verified payment marks order paid, decrements stock **once** even if the event is re-delivered or a second event arrives; expired sessions cancel the order; cancel links need the secret token
- **two simultaneous bookings for the same slot → exactly one succeeds**; overlapping times blocked; closed hours rejected; token-protected cancel frees the slot; admin approval emails the client
- admin product CRUD, inventory can't go negative, MongoDB operator injection stripped

## Deployment

The simplest setup is **one Node web service** (Express serves both the API and the built React app on the same domain, so the auth cookie and Stripe redirects just work) + **MongoDB Atlas**.

### Render (example — Railway, Fly.io, Heroku, DigitalOcean App Platform work the same way)

1. Push this project to GitHub.
2. Render → **New → Web Service** → connect the repo.
3. Settings:
   - **Build command:** `npm run install:all && npm run build`
   - **Start command:** `npm start`
   - **Node version:** 20.19+ (set env `NODE_VERSION=20.19.0` or newer)
4. Environment variables: everything from `server/.env.example`, with
   - `NODE_ENV=production`
   - `CLIENT_URL=https://your-domain.com` and `SERVER_URL=https://your-domain.com`
   - your Atlas `MONGODB_URI`, a strong `JWT_SECRET`, Stripe keys, SMTP settings
5. Deploy, then run the seed once (Render **Shell**: `npm run seed`). Log in to `/admin` and **change the admin password** (Account → Change password).
6. Add the production Stripe webhook endpoint (see [Production](#production)).
7. Add your custom domain in the host's settings (HTTPS is automatic).

**Image uploads:** uploaded files are stored in `server/uploads`. Many hosts have an *ephemeral* disk — attach a persistent disk mounted at `server/uploads` (Render "Disks"), or paste image URLs from a CDN/Cloudinary in the admin forms.

**Going live with real payments:** activate your Stripe account, switch the Dashboard to live mode, replace `sk_test_`/`pk_test_` with live keys, and create a live-mode webhook endpoint (its secret differs from the test one).

### Split hosting (optional)

If you host the React app separately (e.g. Netlify/Vercel), set `VITE_API_URL=https://api.your-domain.com/api` when building the client, set `CLIENT_URL` on the API to the website URL, and use sub-domains of the **same** parent domain so the auth cookie is first-party.

## Before you launch: checklist

- [ ] Update `shared/business.js` — the address, phone, email, map link and social URLs are **placeholders**.
- [ ] Review the **testimonials** (`client/src/data/content.js`) and the **About page story** (`client/src/pages/About.jsx`) — they are sample copy written for the template. Replace them with real client quotes (with permission) and the owner's real story.
- [ ] Replace the starter Pexels photos (`client/public/images`, see `CREDITS.md`) with photos of the salon's own work, and review the sample products/prices.
- [ ] Have the policies (Privacy, Terms, Shipping & Returns) reviewed for your state and business.
- [ ] Set your real `TAX_RATE` (or consider Stripe Tax for multi-state sales tax), shipping rate and free-shipping threshold.
- [ ] Set `BOOKING_CAPACITY` to the number of braiders, and the opening hours in `shared/business.js`.
- [ ] Change the default admin password; use a strong `JWT_SECRET`.
- [ ] Configure SMTP and send yourself a test booking + order.
- [ ] Complete one full live-mode purchase with a real card and refund it.

## Security notes

- Stripe **secret key and webhook secret exist only on the server**; the browser only ever receives a Checkout URL.
- Card numbers and CVCs are entered on Stripe's PCI-compliant page and **never touch this server or database**.
- All prices, taxes, shipping and totals are calculated **server-side from MongoDB**; the webhook additionally checks the charged amount against the order total.
- Webhook signatures are verified with the raw request body; duplicate deliveries are ignored.
- Passwords are hashed with bcrypt (12 rounds); sessions use httpOnly, SameSite=Lax cookies (Secure in production); tokens are invalidated after a password change.
- Password-reset and appointment-manage links use random 256-bit tokens stored only as SHA-256 hashes; reset links expire in 1 hour.
- Every request body/query is validated with Zod; MongoDB operator keys are stripped; search input is regex-escaped.
- Helmet security headers + Content-Security-Policy, CORS restricted to `CLIENT_URL`, rate limiting on login, password reset, booking, contact and checkout.
- Admin APIs are protected by role checks on the server (the React route guard is only for UX).
- Uploads: images only (JPG/PNG/WebP/AVIF), 5 MB max, random file names, admin-only.
