import { env } from '../config/env.js';
import { User, Category, Product, Service, Review, Order, Appointment, ContactMessage } from '../models/index.js';
import { categories, products, services } from './data.js';
import { shortCode, randomToken, hashToken } from '../utils/tokens.js';
import { computeTotals } from '../utils/pricing.js';
import { addDays } from '../utils/time.js';
import { openingHoursFor } from '../utils/slots.js';
import { salonNow } from '../services/bookingService.js';

const cents = (d) => Math.round(d * 100);

/**
 * Idempotent seeder. Inserts anything missing; never overwrites the owner's edits.
 * @param {{reset?:boolean, demo?:boolean, log?:Function}} opts
 */
export async function seedDatabase({ reset = false, demo = false, log = console.log } = {}) {
  if (reset) {
    if (env.isProd) throw new Error('Refusing to --reset the catalog in production.');
    await Promise.all([Category.deleteMany({}), Product.deleteMany({}), Service.deleteMany({}), Review.deleteMany({})]);
    log('[seed] Catalog cleared');
  }

  // Admin account
  let admin = await User.findOne({ email: env.admin.email });
  if (!admin) {
    admin = await User.create({ name: env.admin.name, email: env.admin.email, password: env.admin.password, role: 'admin' });
    log(`[seed] Admin created: ${env.admin.email}`);
  } else if (admin.role !== 'admin') {
    admin.role = 'admin';
    await admin.save();
  }

  // Categories
  for (const c of categories) {
    await Category.updateOne({ slug: c.slug }, { $setOnInsert: c }, { upsert: true });
  }
  const catBySlug = new Map((await Category.find().lean()).map((c) => [c.slug, c._id]));

  // Products
  const { slugify } = await import('../utils/strings.js');
  let newProducts = 0;
  for (const p of products) {
    const slug = slugify(p.name);
    const doc = {
      name: p.name,
      slug,
      description: p.description,
      brand: p.brand,
      category: catBySlug.get(p.category),
      priceCents: cents(p.price),
      compareAtPriceCents: p.compareAt ? cents(p.compareAt) : null,
      images: p.images,
      inventory: p.inventory,
      tags: p.tags || [],
      featured: Boolean(p.featured),
      isActive: true,
      soldCount: p.soldCount || 0,
    };
    const r = await Product.updateOne({ slug }, { $setOnInsert: doc }, { upsert: true });
    newProducts += r.upsertedCount;
  }

  // Services
  let newServices = 0;
  for (const s of services) {
    const slug = slugify(s.name);
    const { price, ...rest } = s;
    const r = await Service.updateOne({ slug }, { $setOnInsert: { ...rest, slug, priceCents: cents(price), isActive: true } }, { upsert: true });
    newServices += r.upsertedCount;
  }
  log(`[seed] ${categories.length} categories, ${newProducts} new products, ${newServices} new services`);

  if (demo) await seedDemoData(log);
  return { admin };
}

const DEMO_CUSTOMERS = [
  { name: 'Amara Johnson', email: 'amara@example.com', phone: '(404) 555-0134' },
  { name: 'Keisha Williams', email: 'keisha@example.com', phone: '(404) 555-0177' },
  { name: 'Fatou Diallo', email: 'fatou@example.com', phone: '(678) 555-0102' },
  { name: 'Brianna Okafor', email: 'brianna@example.com', phone: '(770) 555-0149' },
];

const REVIEW_TEXT = [
  [5, 'Absolutely love it', 'My braids have never looked this neat. Will definitely buy again!'],
  [5, 'Holy grail product', 'I have tried so many — this is the one. Lasts all day and smells amazing.'],
  [4, 'Great quality', 'Really good quality for the price. Shipping was quick too.'],
  [5, 'Worth every penny', 'Soft, no itching, and it blended perfectly with my natural hair.'],
  [4, 'Very happy', 'Works well under my protective styles. Would love a bigger size.'],
];

async function seedDemoData(log) {
  if (await User.exists({ email: DEMO_CUSTOMERS[0].email })) {
    log('[seed] Demo data already present — skipped');
    return;
  }
  const users = [];
  for (const c of DEMO_CUSTOMERS) {
    users.push(
      await User.create({
        ...c,
        password: 'Customer123!',
        role: 'customer',
        address: { line1: '100 Peachtree St NW', city: 'Atlanta', state: 'GA', postalCode: '30303', country: 'US' },
      })
    );
  }

  // Reviews on featured products
  const featured = await Product.find({ featured: true });
  for (const [pi, p] of featured.entries()) {
    const count = 2 + (pi % 3);
    for (let i = 0; i < count && i < users.length; i++) {
      const [rating, title, comment] = REVIEW_TEXT[(pi + i) % REVIEW_TEXT.length];
      await Review.create({ product: p._id, user: users[i]._id, name: users[i].name, rating, title, comment, verifiedPurchase: i % 2 === 0 });
    }
    await Review.recalculateForProduct(p._id);
  }

  // Paid orders spread over the last 30 days (for the dashboard)
  const all = await Product.find({ inventory: { $gt: 0 } }).lean();
  const statuses = ['delivered', 'delivered', 'shipped', 'processing'];
  for (let i = 0; i < 18; i++) {
    const u = users[i % users.length];
    const picks = [all[(i * 7) % all.length], all[(i * 11 + 3) % all.length]];
    const items = picks.map((p, k) => ({ product: p._id, name: p.name, slug: p.slug, image: p.images[0], priceCents: p.priceCents, quantity: 1 + ((i + k) % 2) }));
    const subtotal = items.reduce((s, it) => s + it.priceCents * it.quantity, 0);
    const t = computeTotals(subtotal);
    const paidAt = new Date(Date.now() - ((i * 37) % 29) * 86400000 - 3600000 * (i % 9));
    const [firstName, lastName] = u.name.split(' ');
    const status = statuses[i % statuses.length];
    await Order.create({
      orderNumber: shortCode('CECE'),
      user: u._id,
      customer: { firstName, lastName, email: u.email, phone: u.phone },
      shippingAddress: { line1: '100 Peachtree St NW', city: 'Atlanta', state: 'GA', postalCode: '30303', country: 'US' },
      items,
      subtotalCents: t.subtotalCents,
      taxCents: t.taxCents,
      shippingCents: t.shippingCents,
      totalCents: t.totalCents,
      status,
      paymentStatus: 'paid',
      paidAt,
      inventoryAdjusted: true,
      trackingNumber: status === 'processing' ? '' : `1Z999AA1${String(10000000 + i * 7919).slice(0, 8)}`,
      carrier: status === 'processing' ? '' : 'UPS',
      createdAt: paidAt,
      statusHistory: [{ status: 'processing', note: 'Demo order', at: paidAt }],
    });
  }

  // Upcoming appointments
  const svc = await Service.find().lean();
  const now = salonNow();
  let made = 0;
  for (let d = 1; d <= 14 && made < 8; d++) {
    const date = addDays(now.date, d);
    const hours = openingHoursFor(date);
    if (!hours) continue;
    const s = svc[(d * 3) % svc.length];
    const start = hours.open + (d % 2) * 60;
    if (start + s.durationMinutes > hours.close) continue;
    const u = users[made % users.length];
    await Appointment.create({
      confirmationCode: shortCode('APT'),
      service: s._id,
      serviceName: s.name,
      priceCents: s.priceCents,
      durationMinutes: s.durationMinutes,
      date,
      startMinutes: start,
      endMinutes: start + s.durationMinutes,
      customer: { name: u.name, email: u.email, phone: u.phone },
      user: u._id,
      status: made % 3 === 0 ? 'pending' : 'confirmed',
      notes: made % 2 ? 'Mid-back length, color 1B please.' : '',
      manageTokenHash: hashToken(randomToken()),
      history: [{ action: 'requested', detail: 'Demo booking' }],
    });
    made++;
  }

  await ContactMessage.create({
    name: 'Tiana Brooks',
    email: 'tiana@example.com',
    subject: 'Bridal party braids',
    message: 'Hi! Do you offer group bookings for a bridal party of 5 in June? We would love goddess braids for everyone.',
  });

  log(`[seed] Demo data: ${users.length} customers (password Customer123!), reviews, 18 orders, ${made} appointments`);
}
