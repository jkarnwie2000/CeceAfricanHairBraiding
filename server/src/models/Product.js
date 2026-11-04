import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 140 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true, trim: true, maxlength: 4000 },
    brand: { type: String, trim: true, maxlength: 80, default: '' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    /** Price in the smallest currency unit (cents). Integer only — avoids floating-point money bugs. */
    priceCents: { type: Number, required: true, min: 0, validate: Number.isInteger },
    compareAtPriceCents: { type: Number, min: 0, default: null },
    images: { type: [String], default: [] },
    inventory: { type: Number, required: true, min: 0, default: 0, validate: Number.isInteger },
    tags: { type: [String], default: [] },
    featured: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
    soldCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

productSchema.index({ priceCents: 1 });
productSchema.index({ soldCount: -1 });

export const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
