import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    /** Starting price in cents */
    priceCents: { type: Number, required: true, min: 0, validate: Number.isInteger },
    /** Estimated chair time, used to block the calendar */
    durationMinutes: { type: Number, required: true, min: 15, max: 720 },
    image: { type: String, default: '' },
    imageAlt: { type: String, default: '' },
    featured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Service = mongoose.models.Service || mongoose.model('Service', serviceSchema);
