import mongoose from 'mongoose';

/** Stripe webhook events we have fully processed — guarantees idempotency across retries. */
const processedEventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  processedAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 90 }, // auto-purge after 90 days
});
export const ProcessedEvent =
  mongoose.models.ProcessedEvent || mongoose.model('ProcessedEvent', processedEventSchema);

/** Dates the salon is closed (holidays, vacations) — blocks booking. */
const blockedDateSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, unique: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    reason: { type: String, trim: true, maxlength: 200, default: 'Closed' },
  },
  { timestamps: true }
);
export const BlockedDate = mongoose.models.BlockedDate || mongoose.model('BlockedDate', blockedDateSchema);

const subscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  },
  { timestamps: true }
);
export const Subscriber = mongoose.models.Subscriber || mongoose.model('Subscriber', subscriberSchema);

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    subject: { type: String, trim: true, maxlength: 150, default: '' },
    message: { type: String, required: true, trim: true, maxlength: 3000 },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);
export const ContactMessage =
  mongoose.models.ContactMessage || mongoose.model('ContactMessage', contactMessageSchema);
