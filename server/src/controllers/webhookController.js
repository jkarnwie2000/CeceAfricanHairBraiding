import { env } from '../config/env.js';
import { getStripe } from '../config/stripe.js';
import { Order, ProcessedEvent } from '../models/index.js';
import { fulfillCheckoutSession, markSessionPaymentFailed, markSessionExpired } from '../services/orderService.js';

/**
 * POST /api/webhooks/stripe
 * Mounted with express.raw() BEFORE express.json() so the exact bytes Stripe signed are available.
 */
export async function stripeWebhook(req, res) {
  const stripe = getStripe();
  if (!stripe || !env.stripe.webhookSecret) {
    return res.status(503).json({ message: 'Stripe webhooks are not configured' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], env.stripe.webhookSecret);
  } catch (err) {
    console.warn('[webhook] Signature verification failed:', err.message);
    return res.status(400).json({ message: `Webhook signature verification failed` });
  }

  // Idempotency layer 1: skip events we've already fully processed (Stripe retries & duplicates).
  if (await ProcessedEvent.exists({ eventId: event.id })) {
    return res.json({ received: true, duplicate: true });
  }

  try {
    const obj = event.data.object;
    switch (event.type) {
      case 'checkout.session.completed':
        // Card payments are 'paid' immediately; bank debits etc. arrive later via async_payment_succeeded.
        if (obj.payment_status === 'paid' || obj.payment_status === 'no_payment_required') {
          await fulfillCheckoutSession(obj); // idempotency layer 2: atomic paymentStatus guard
        } else {
          await Order.updateOne(
            { _id: obj.metadata?.orderId, paymentStatus: 'unpaid' },
            { $push: { statusHistory: { status: 'pending_payment', note: 'Awaiting delayed payment confirmation' } } }
          );
        }
        break;
      case 'checkout.session.async_payment_succeeded':
        await fulfillCheckoutSession(obj);
        break;
      case 'checkout.session.async_payment_failed':
        await markSessionPaymentFailed(obj);
        break;
      case 'checkout.session.expired':
        await markSessionExpired(obj);
        break;
      case 'charge.refunded': {
        const pi = typeof obj.payment_intent === 'string' ? obj.payment_intent : obj.payment_intent?.id;
        if (pi && obj.refunded) {
          await Order.updateOne(
            { stripePaymentIntentId: pi, paymentStatus: 'paid' },
            {
              $set: { paymentStatus: 'refunded', status: 'cancelled' },
              $push: { statusHistory: { status: 'cancelled', note: 'Payment refunded' } },
            }
          );
        }
        break;
      }
      default:
        // Other events are acknowledged but not used.
        break;
    }
  } catch (err) {
    console.error(`[webhook] Error handling ${event.type} (${event.id}):`, err);
    // Non-2xx → Stripe will retry later. The atomic guards make retries safe.
    return res.status(500).json({ message: 'Webhook handler error' });
  }

  try {
    await ProcessedEvent.create({ eventId: event.id, type: event.type });
  } catch (err) {
    if (err.code !== 11000) throw err; // a concurrent delivery already recorded it
  }
  res.json({ received: true });
}
