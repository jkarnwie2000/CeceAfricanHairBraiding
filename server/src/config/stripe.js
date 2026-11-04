import Stripe from 'stripe';
import { env } from './env.js';

/**
 * Lazily-created Stripe client. The secret key only ever lives on the server.
 * `getStripe()` returns null when no key is configured so routes can reply with a clear 503.
 */
let client = null;

export function getStripe() {
  if (client) return client;
  if (!env.stripe.secretKey) return null;
  client = new Stripe(env.stripe.secretKey, {
    appInfo: { name: 'Cece African Hair Braiding', version: '1.0.0' },
    maxNetworkRetries: 2,
  });
  return client;
}

/** Test hook: allows the test-suite to inject a stubbed Stripe client. */
export function setStripeClient(stub) {
  client = stub;
}
