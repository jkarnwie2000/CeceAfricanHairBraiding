import { z } from 'zod';
import { APPOINTMENT_STATUSES, ORDER_STATUSES } from '../models/index.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const email = z.string().trim().toLowerCase().pipe(z.email('Please enter a valid email address')).pipe(z.string().max(254));
const phone = z
  .string()
  .trim()
  .min(7, 'Please enter a valid phone number')
  .max(25)
  .regex(/^[0-9+().\-\s]+$/, 'Please enter a valid phone number');
const optionalPhone = z.union([z.literal(''), phone]).optional().default('');
const password = z.string().min(8, 'Password must be at least 8 characters').max(128);
const name = z.string().trim().min(2, 'Please enter your name').max(100);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');
const imagePath = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === '' || v.startsWith('/') || /^https:\/\//.test(v), 'Image must be an https URL or an uploaded image path');
const dollars = z.coerce.number().min(0, 'Price cannot be negative').max(100000);

const address = z.object({
  line1: z.string().trim().max(120).optional().default(''),
  line2: z.string().trim().max(120).optional().default(''),
  city: z.string().trim().max(80).optional().default(''),
  state: z.string().trim().max(40).optional().default(''),
  postalCode: z.string().trim().max(15).optional().default(''),
  country: z.string().trim().max(2).optional().default('US'),
});

// ── Auth ───────────────────────────────────────────────
export const registerSchema = z.object({ name, email, password, phone: optionalPhone });
export const adminRegisterSchema = registerSchema.extend({
  inviteCode: z.string().trim().min(1, 'Admin invite code is required').max(200),
});
export const loginSchema =z.object({ email, password: z.string().min(1, 'Password is required').max(128) });
export const forgotPasswordSchema = z.object({ email });
export const resetPasswordSchema = z.object({ token: z.string().length(64, 'Invalid reset link'), password });
export const profileSchema = z.object({ name: name.optional(), phone: optionalPhone, address: address.optional() });
export const changePasswordSchema = z.object({ currentPassword: z.string().min(1).max(128), newPassword: password });

// ── Catalog ────────────────────────────────────────────
export const productQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().trim().max(80).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z.enum(['featured', 'newest', 'price-asc', 'price-desc', 'rating', 'best-selling', 'name']).optional().default('featured'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(60).optional().default(12),
  featured: z.enum(['true', 'false']).optional(),
  inStock: z.enum(['true', 'false']).optional(),
  includeInactive: z.enum(['true', 'false']).optional(),
});

export const productSchema = z.object({
  name: z.string().trim().min(2).max(140),
  description: z.string().trim().min(10, 'Description should be at least 10 characters').max(4000),
  brand: z.string().trim().max(80).optional().default(''),
  category: objectId,
  price: dollars,
  compareAtPrice: z.union([z.literal(''), z.null(), dollars]).optional(),
  images: z.array(imagePath).max(8).optional().default([]),
  inventory: z.coerce.number().int().min(0).max(100000),
  tags: z.array(z.string().trim().max(40)).max(20).optional().default([]),
  featured: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});
export const productUpdateSchema = productSchema.partial();

export const inventorySchema = z
  .object({
    inventory: z.coerce.number().int().min(0).max(100000).optional(),
    adjust: z.coerce.number().int().min(-100000).max(100000).optional(),
  })
  .refine((v) => v.inventory !== undefined || v.adjust !== undefined, 'Provide inventory or adjust');

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional().default(''),
  sortOrder: z.coerce.number().int().optional().default(0),
});

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().default(''),
  comment: z.string().trim().min(5, 'Please write a few words about the product').max(2000),
});

export const serviceSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().min(10).max(2000),
  price: dollars,
  durationMinutes: z.coerce.number().int().min(15).max(720),
  image: imagePath.optional().default(''),
  imageAlt: z.string().trim().max(200).optional().default(''),
  featured: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().optional().default(0),
});
export const serviceUpdateSchema = serviceSchema.partial();

// ── Cart & checkout ────────────────────────────────────
const cartItems = z
  .array(z.object({ productId: objectId, quantity: z.coerce.number().int().min(1).max(99) }))
  .min(1, 'Your cart is empty')
  .max(50);

export const cartQuoteSchema = z.object({ items: z.array(z.object({ productId: objectId, quantity: z.coerce.number().int().min(0).max(99) })).max(50) });

export const checkoutSchema = z.object({
  items: cartItems,
  customer: z.object({
    firstName: z.string().trim().min(1, 'First name is required').max(60),
    lastName: z.string().trim().min(1, 'Last name is required').max(60),
    email,
    phone,
  }),
  shippingAddress: z.object({
    line1: z.string().trim().min(3, 'Street address is required').max(120),
    line2: z.string().trim().max(120).optional().default(''),
    city: z.string().trim().min(2, 'City is required').max(80),
    state: z.string().trim().min(2, 'State is required').max(40),
    postalCode: z.string().trim().regex(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code'),
    country: z.literal('US', { message: 'We currently ship within the United States only' }),
  }),
});

// ── Appointments ───────────────────────────────────────
export const availabilityQuerySchema = z.object({ serviceId: objectId, date });
export const availableDatesQuerySchema = z.object({ serviceId: objectId });

export const appointmentSchema = z.object({
  serviceId: objectId,
  date,
  startMinutes: z.coerce.number().int().min(0).max(1439),
  name,
  email,
  phone,
  notes: z.string().trim().max(1000).optional().default(''),
});

export const manageTokenSchema = z.object({ token: z.string().length(64, 'Invalid link') });
export const rescheduleSchema = z.object({
  token: z.string().length(64).optional(),
  date,
  startMinutes: z.coerce.number().int().min(0).max(1439),
});
export const cancelAppointmentSchema = z.object({
  token: z.string().length(64).optional(),
  reason: z.string().trim().max(300).optional().default(''),
});

export const adminAppointmentUpdateSchema = z.object({
  status: z.enum(APPOINTMENT_STATUSES).optional(),
  adminNotes: z.string().trim().max(1000).optional(),
  date: date.optional(),
  startMinutes: z.coerce.number().int().min(0).max(1439).optional(),
  notifyCustomer: z.boolean().optional().default(true),
});

export const adminAppointmentQuerySchema = z.object({
  status: z.enum([...APPOINTMENT_STATUSES, 'upcoming', 'all']).optional().default('upcoming'),
  from: date.optional(),
  to: date.optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export const blockedDateSchema = z.object({ date, reason: z.string().trim().max(200).optional().default('Closed') });

// ── Orders ─────────────────────────────────────────────
export const orderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  trackingNumber: z.string().trim().max(100).optional(),
  carrier: z.string().trim().max(60).optional(),
  note: z.string().trim().max(300).optional().default(''),
  notifyCustomer: z.boolean().optional().default(true),
});

export const adminOrderQuerySchema = z.object({
  status: z.enum([...ORDER_STATUSES, 'all']).optional().default('all'),
  paymentStatus: z.enum(['unpaid', 'paid', 'failed', 'expired', 'refunded', 'all']).optional().default('all'),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const paginationSchema = z.object({
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// ── Misc ───────────────────────────────────────────────
export const contactSchema = z.object({
  name,
  email,
  phone: optionalPhone,
  subject: z.string().trim().max(150).optional().default(''),
  message: z.string().trim().min(10, 'Please write a message of at least 10 characters').max(3000),
  // Honeypot field: real users never fill it in
  website: z.string().max(0, 'Spam detected').optional(),
});

export const newsletterSchema = z.object({ email, website: z.string().max(0, 'Spam detected').optional() });

export const userRoleSchema = z.object({ role: z.enum(['customer', 'admin']) });
