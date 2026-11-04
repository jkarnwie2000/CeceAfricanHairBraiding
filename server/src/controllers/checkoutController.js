import { env } from '../config/env.js';
import { getStripe } from '../config/stripe.js';
import { Order } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { randomToken, hashToken, tokenMatches, shortCode } from '../utils/tokens.js';
import { buildCart } from '../services/cartService.js';
import { markSessionExpired, publicOrder } from '../services/orderService.js';

/** POST /api/cart/quote — authoritative prices, stock and totals for the cart page. */
export async function quoteCart(req, res) {
  res.json(await buildCart(req.body.items));
}

const absoluteHttpsImage = (src) => {
  if (!src) return null;
  const url = src.startsWith('/') ? `${env.clientUrl}${src}` : src;
  return url.startsWith('https://') ? url : null; // Stripe can only display publicly reachable https images
};

/**
 * POST /api/checkout/session
 * 1. Re-price the cart from the database and validate stock
 * 2. Save a pending order
 * 3. Create a Stripe Checkout Session and return its hosted URL
 */
export async function createCheckoutSession(req, res) {
  const stripe = getStripe();
  if (!stripe) {
    throw new ApiError(503, 'Online payments are not configured yet. Please contact the salon to complete your order.');
  }

  const { items, customer, shippingAddress } = req.body;
  const { lines, issues, totals } = await buildCart(items);
  if (issues.length) {
    throw ApiError.conflict('Some items in your cart changed. Please review your cart before checking out.', issues);
  }
  if (!lines.length) throw ApiError.badRequest('Your cart is empty');

  const cancelToken = randomToken(24);
  const order = await Order.create({
    orderNumber: shortCode('CECE'),
    user: req.user?._id || null,
    customer,
    shippingAddress,
    items: lines.map((l) => ({
      product: l.productId,
      name: l.name,
      slug: l.slug,
      image: l.image,
      priceCents: l.priceCents,
      quantity: l.quantity,
    })),
    subtotalCents: totals.subtotalCents,
    taxCents: totals.taxCents,
    shippingCents: totals.shippingCents,
    totalCents: totals.totalCents,
    currency: env.currency,
    cancelTokenHash: hashToken(cancelToken),
    statusHistory: [{ status: 'pending_payment', note: 'Checkout started' }],
  });

  const lineItems = lines.map((l) => {
    const image = absoluteHttpsImage(l.image);
    return {
      quantity: l.quantity,
      price_data: {
        currency: env.currency,
        unit_amount: l.priceCents, // ← from MongoDB, never from the browser
        product_data: {
          name: l.name,
          ...(image ? { images: [image] } : {}),
          metadata: { productId: l.productId },
        },
      },
    };
  });
  if (totals.taxCents > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: env.currency,
        unit_amount: totals.taxCents,
        product_data: { name: `Sales tax (${(env.taxRate * 100).toFixed(2).replace(/\.?0+$/, '')}%)` },
      },
    });
  }

  let session;
  try {
    session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        line_items: lineItems,
        shipping_options: [
          {
            shipping_rate_data: {
              type: 'fixed_amount',
              display_name: totals.shippingCents ? 'Standard shipping' : 'Free standard shipping',
              fixed_amount: { amount: totals.shippingCents, currency: env.currency },
              delivery_estimate: {
                minimum: { unit: 'business_day', value: 3 },
                maximum: { unit: 'business_day', value: 7 },
              },
            },
          },
        ],
        customer_email: customer.email,
        client_reference_id: order._id.toString(),
        metadata: { orderId: order._id.toString(), orderNumber: order.orderNumber },
        payment_intent_data: {
          description: `Cece African Hair Braiding order ${order.orderNumber}`,
          metadata: { orderId: order._id.toString(), orderNumber: order.orderNumber },
          shipping: {
            name: `${customer.firstName} ${customer.lastName}`,
            phone: customer.phone,
            address: {
              line1: shippingAddress.line1,
              line2: shippingAddress.line2 || undefined,
              city: shippingAddress.city,
              state: shippingAddress.state,
              postal_code: shippingAddress.postalCode,
              country: shippingAddress.country,
            },
          },
        },
        success_url: `${env.clientUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.clientUrl}/checkout/cancel?order=${order._id}&token=${cancelToken}`,
        expires_at: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour to complete payment
      },
      { idempotencyKey: `checkout-${order._id}` }
    );
  } catch (err) {
    await Order.deleteOne({ _id: order._id });
    console.error('[stripe] Failed to create checkout session:', err.type || err.name, err.message);
    if (err.type === 'StripeAuthenticationError') {
      throw new ApiError(503, 'Payment configuration error: the Stripe secret key is invalid. Please contact the salon.');
    }
    throw new ApiError(502, 'We could not start the secure checkout. Please try again in a moment.');
  }

  order.stripeSessionId = session.id;
  await order.save();

  res.status(201).json({ url: session.url, sessionId: session.id, orderId: order._id, orderNumber: order.orderNumber });
}

/** GET /api/checkout/session/:sessionId — order confirmation page lookup. */
export async function getOrderBySession(req, res) {
  const { sessionId } = req.params;
  if (!/^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(sessionId)) throw ApiError.badRequest('Invalid session');
  const order = await Order.findOne({ stripeSessionId: sessionId });
  if (!order) throw ApiError.notFound('Order not found');
  res.json({ order: publicOrder(order) });
}

/** POST /api/checkout/cancel — shopper clicked "back" on Stripe Checkout. */
export async function cancelCheckout(req, res) {
  const { orderId, token } = req.body || {};
  if (!/^[a-f\d]{24}$/i.test(orderId || '') || typeof token !== 'string') throw ApiError.badRequest('Invalid request');
  const order = await Order.findById(orderId).select('+cancelTokenHash');
  if (!order || !tokenMatches(token, order.cancelTokenHash)) throw ApiError.notFound('Order not found');

  if (order.paymentStatus === 'unpaid' && order.stripeSessionId) {
    const stripe = getStripe();
    try {
      // Expire the session so it can no longer be paid; the webhook/expiry path stays consistent.
      if (stripe) await stripe.checkout.sessions.expire(order.stripeSessionId);
      await markSessionExpired({ id: order.stripeSessionId, metadata: { orderId: order._id.toString() } }, 'Checkout cancelled by customer');
    } catch (err) {
      // Session may have completed in the meantime — leave the order for the webhook to settle.
      console.warn('[stripe] Could not expire session', order.stripeSessionId, err.message);
    }
  }
  const fresh = await Order.findById(orderId);
  res.json({ order: { orderNumber: fresh.orderNumber, status: fresh.status, paymentStatus: fresh.paymentStatus } });
}

export function stripeConfig(_req, res) {
  res.json({
    enabled: Boolean(env.stripe.secretKey),
    testMode: /^(sk|rk)_test_/.test(env.stripe.secretKey),
    publishableKey: env.stripe.publishableKey || null,
    taxRate: env.taxRate,
    shippingFlatRateCents: env.shippingFlatRateCents,
    freeShippingThresholdCents: env.freeShippingThresholdCents,
    currency: env.currency,
  });
}
