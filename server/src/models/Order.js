import mongoose from 'mongoose';

export const ORDER_STATUSES = ['pending_payment', 'processing', 'shipped', 'delivered', 'cancelled'];
export const PAYMENT_STATUSES = ['unpaid', 'paid', 'failed', 'expired', 'refunded'];

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    image: { type: String, default: '' },
    priceCents: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    customer: {
      firstName: { type: String, required: true, trim: true },
      lastName: { type: String, required: true, trim: true },
      email: { type: String, required: true, lowercase: true, trim: true, index: true },
      phone: { type: String, trim: true, default: '' },
    },
    shippingAddress: {
      line1: { type: String, required: true },
      line2: { type: String, default: '' },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true, default: 'US' },
    },
    items: { type: [orderItemSchema], validate: (v) => Array.isArray(v) && v.length > 0 },
    subtotalCents: { type: Number, required: true },
    taxCents: { type: Number, required: true },
    shippingCents: { type: Number, required: true },
    totalCents: { type: Number, required: true },
    currency: { type: String, default: 'usd' },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending_payment', index: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'unpaid', index: true },
    stripeSessionId: { type: String, index: { unique: true, sparse: true } },
    stripePaymentIntentId: { type: String, default: '' },
    paidAt: { type: Date },
    /** Random secret embedded in the Stripe cancel URL so only the buyer can cancel the pending order. */
    cancelTokenHash: { type: String, select: false },
    inventoryAdjusted: { type: Boolean, default: false },
    stockIssue: { type: Boolean, default: false },
    stockIssueDetail: { type: String, default: '' },
    trackingNumber: { type: String, default: '' },
    carrier: { type: String, default: '' },
    confirmationEmailSent: { type: Boolean, default: false },
    statusHistory: [
      {
        _id: false,
        status: String,
        note: String,
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });

export const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
