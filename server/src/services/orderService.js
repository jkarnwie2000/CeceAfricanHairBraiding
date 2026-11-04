import { Order, Product } from '../models/index.js';
import { sendEmail, notifyOwner } from './emailService.js';
import { orderConfirmationEmail, ownerNewOrderEmail } from '../emails/templates.js';

/**
 * Mark an order as paid and decrement inventory — exactly once.
 * The atomic `paymentStatus: { $ne: 'paid' }` guard means a duplicate webhook delivery
 * (or two different events for the same payment) can never double-count stock or re-send email.
 *
 * @param {object} session  Stripe Checkout Session object (from a verified webhook event)
 * @returns {Promise<{order: object|null, alreadyProcessed: boolean}>}
 */
export async function fulfillCheckoutSession(session) {
  const orderId = session.metadata?.orderId || session.client_reference_id;
  if (!orderId) {
    console.warn(`[orders] Checkout session ${session.id} has no orderId metadata — ignoring.`);
    return { order: null, alreadyProcessed: false };
  }

  const order = await Order.findOneAndUpdate(
    { _id: orderId, paymentStatus: { $ne: 'paid' } },
    {
      $set: {
        paymentStatus: 'paid',
        status: 'processing',
        paidAt: new Date(),
        stripeSessionId: session.id,
        stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || '',
      },
      $push: { statusHistory: { status: 'processing', note: 'Payment confirmed by Stripe' } },
    },
    { returnDocument: 'after' }
  );

  if (!order) {
    const existing = await Order.findById(orderId);
    return { order: existing, alreadyProcessed: Boolean(existing) };
  }

  const problems = [];

  // Sanity check: the amount Stripe collected must match the server-calculated total.
  if (typeof session.amount_total === 'number' && session.amount_total !== order.totalCents) {
    problems.push(`Amount mismatch: Stripe charged ${session.amount_total} but order total is ${order.totalCents}.`);
  }

  // Decrement inventory atomically per item; never allow stock to go negative.
  if (!order.inventoryAdjusted) {
    for (const item of order.items) {
      const res = await Product.updateOne(
        { _id: item.product, inventory: { $gte: item.quantity } },
        { $inc: { inventory: -item.quantity, soldCount: item.quantity } }
      );
      if (res.modifiedCount === 0) {
        // Someone else bought the last units between checkout and payment.
        const p = await Product.findById(item.product).select('inventory');
        const available = Math.max(0, p?.inventory || 0);
        if (p && available > 0) {
          await Product.updateOne({ _id: item.product }, { $inc: { inventory: -available, soldCount: available } });
        }
        problems.push(`${item.name}: ordered ${item.quantity}, only ${available} were in stock.`);
      }
    }
    order.inventoryAdjusted = true;
  }

  if (problems.length) {
    order.stockIssue = true;
    order.stockIssueDetail = problems.join(' ');
    order.statusHistory.push({ status: order.status, note: `Needs attention: ${order.stockIssueDetail}` });
  }
  await order.save();

  // Emails (best effort, never throw)
  const confirmation = orderConfirmationEmail(order);
  const sent = await sendEmail({ to: order.customer.email, ...confirmation });
  if (sent) await Order.updateOne({ _id: order._id }, { confirmationEmailSent: true });
  const ownerMail = ownerNewOrderEmail(order);
  await notifyOwner(ownerMail.subject, ownerMail.html, ownerMail.text);

  return { order, alreadyProcessed: false };
}

/** Payment failed (e.g. delayed bank debit was declined). */
export async function markSessionPaymentFailed(session) {
  const orderId = session.metadata?.orderId || session.client_reference_id;
  if (!orderId) return null;
  return Order.findOneAndUpdate(
    { _id: orderId, paymentStatus: 'unpaid' },
    {
      $set: { paymentStatus: 'failed', status: 'cancelled' },
      $push: { statusHistory: { status: 'cancelled', note: 'Payment failed' } },
    },
    { returnDocument: 'after' }
  );
}

/** Checkout session expired or the customer abandoned it. */
export async function markSessionExpired(session, note = 'Checkout session expired') {
  const orderId = session.metadata?.orderId || session.client_reference_id;
  if (!orderId) return null;
  return Order.findOneAndUpdate(
    { _id: orderId, paymentStatus: 'unpaid' },
    {
      $set: { paymentStatus: 'expired', status: 'cancelled' },
      $push: { statusHistory: { status: 'cancelled', note } },
    },
    { returnDocument: 'after' }
  );
}

/** Shape an order for the customer-facing API. */
export function publicOrder(order) {
  const o = order.toObject ? order.toObject() : order;
  return {
    id: o._id.toString(),
    orderNumber: o.orderNumber,
    status: o.status,
    paymentStatus: o.paymentStatus,
    customer: o.customer,
    shippingAddress: o.shippingAddress,
    items: o.items.map((i) => ({ ...i, product: i.product?.toString?.() || i.product })),
    subtotalCents: o.subtotalCents,
    taxCents: o.taxCents,
    shippingCents: o.shippingCents,
    totalCents: o.totalCents,
    currency: o.currency,
    trackingNumber: o.trackingNumber,
    carrier: o.carrier,
    statusHistory: o.statusHistory,
    paidAt: o.paidAt,
    createdAt: o.createdAt,
  };
}
