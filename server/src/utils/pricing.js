import { env } from '../config/env.js';

/**
 * Server-side order math. All values are integer cents.
 * The browser displays these numbers but never supplies them.
 */
export function computeTotals(subtotalCents) {
  const subtotal = Math.max(0, Math.round(subtotalCents));
  const shippingCents =
    subtotal === 0 || subtotal >= env.freeShippingThresholdCents ? 0 : env.shippingFlatRateCents;
  const taxCents = Math.round(subtotal * env.taxRate);
  return {
    subtotalCents: subtotal,
    shippingCents,
    taxCents,
    totalCents: subtotal + shippingCents + taxCents,
    taxRate: env.taxRate,
    freeShippingThresholdCents: env.freeShippingThresholdCents,
    currency: env.currency,
  };
}
