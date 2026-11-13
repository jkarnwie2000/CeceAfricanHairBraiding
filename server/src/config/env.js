import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const SERVER_ROOT = path.resolve(__dirname, '..', '..');
export const PROJECT_ROOT = path.resolve(SERVER_ROOT, '..');

dotenv.config({ path: path.join(SERVER_ROOT, '.env'), quiet: true });

const str = (v, d = '') => (v === undefined || v === '' ? d : String(v).trim());
const num = (v, d) => {
  if (v === undefined || v === '') return d;
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};
const bool = (v, d = false) => (v === undefined || v === '' ? d : ['1', 'true', 'yes'].includes(String(v).toLowerCase()));

const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

let jwtSecret = str(process.env.JWT_SECRET);
if (!jwtSecret) {
  if (isProd) throw new Error('JWT_SECRET is required in production.');
  jwtSecret = crypto.randomBytes(48).toString('hex');
  if (!isTest) console.warn('[env] JWT_SECRET not set — using a random secret (logins reset on restart).');
}

export const env = {
  nodeEnv: str(process.env.NODE_ENV, 'development'),
  isProd,
  isTest,
  port: num(process.env.PORT, 5000),
  clientUrl: str(process.env.CLIENT_URL, 'http://localhost:5173').replace(/\/$/, ''),
  serverUrl: str(process.env.SERVER_URL, 'http://localhost:5000').replace(/\/$/, ''),
  mongoUri: str(process.env.MONGODB_URI),
  jwtSecret,
  jwtExpiresIn: str(process.env.JWT_EXPIRES_IN, '7d'),
  stripe: {
    secretKey: str(process.env.STRIPE_SECRET_KEY),
    publishableKey: str(process.env.STRIPE_PUBLISHABLE_KEY),
    webhookSecret: str(process.env.STRIPE_WEBHOOK_SECRET),
  },
  currency: str(process.env.CURRENCY, 'usd').toLowerCase(),
  taxRate: num(process.env.TAX_RATE, 0.089),
  shippingFlatRateCents: Math.round(num(process.env.SHIPPING_FLAT_RATE, 7.99) * 100),
  freeShippingThresholdCents: Math.round(num(process.env.FREE_SHIPPING_THRESHOLD, 75) * 100),
  bookingCapacity: Math.max(1, Math.floor(num(process.env.BOOKING_CAPACITY, 2))),
  smtp: {
    host: str(process.env.SMTP_HOST),
    port: num(process.env.SMTP_PORT, 587),
    secure: bool(process.env.SMTP_SECURE, false),
    user: str(process.env.SMTP_USER),
    pass: str(process.env.SMTP_PASS),
  },
  emailFrom: str(process.env.EMAIL_FROM, 'Cece African Hair Braiding <hello@ceceafricanhair.com>'),
  notifyEmail: str(process.env.NOTIFY_EMAIL),
  /** Secret code required to create a new administrator account from /admin/register. Empty = admin sign-up disabled. */
  adminSignupCode: str(process.env.ADMIN_SIGNUP_CODE),
  admin: {
    name: str(process.env.ADMIN_NAME, 'Cece Owner'),
    email: str(process.env.ADMIN_EMAIL, 'admin@ceceafricanhair.com').toLowerCase(),
    password: str(process.env.ADMIN_PASSWORD, 'ChangeMe123!'),
  },
};

/** Fail fast on missing production configuration. */
export function assertRuntimeEnv() {
  const missing = [];
  if (!env.mongoUri) missing.push('MONGODB_URI');
  if (isProd) {
    if (!env.stripe.secretKey) missing.push('STRIPE_SECRET_KEY');
    if (!env.stripe.webhookSecret) missing.push('STRIPE_WEBHOOK_SECRET');
  }
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}. See server/.env.example`);
  }
  if (!env.stripe.secretKey) {
    console.warn('[env] STRIPE_SECRET_KEY not set — checkout will return "payments not configured" until you add it.');
  } else if (!/^(sk|rk)_test_/.test(env.stripe.secretKey) && !isProd) {
    console.warn('[env] You are using a LIVE Stripe key outside production. Use sk_test_… keys for development.');
  }
}
