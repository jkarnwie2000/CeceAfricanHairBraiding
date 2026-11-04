/**
 * End-to-end API tests against a real (in-memory) MongoDB.
 * Stripe: the real SDK is used for webhook signature generation/verification;
 * only the network call that creates a Checkout Session is stubbed.
 *
 *   npm test   (from /server)
 */
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy_key_for_tests';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
process.env.BOOKING_CAPACITY = '1';
process.env.TAX_RATE = '0.1';
process.env.SHIPPING_FLAT_RATE = '5';
process.env.FREE_SHIPPING_THRESHOLD = '75';
process.env.SMTP_HOST = '';

const { MongoMemoryServer } = await import('mongodb-memory-server');
const { default: request } = await import('supertest');
const { connectDB, disconnectDB } = await import('../src/config/db.js');
const { createApp } = await import('../src/app.js');
const { seedDatabase } = await import('../src/seed/runSeed.js');
const { getStripe } = await import('../src/config/stripe.js');
const { Product, Order, Service, Appointment } = await import('../src/models/index.js');
const { sentEmails } = await import('../src/services/emailService.js');

let mongod;
let app;
const createdSessions = [];

before(async () => {
  mongod = await MongoMemoryServer.create();
  await connectDB(mongod.getUri('cece-test'));
  await seedDatabase({ log: () => {} });
  app = createApp();
  // Stub only the outbound Stripe API call; keep the real SDK (webhooks.constructEvent etc.)
  const stripe = getStripe();
  stripe.checkout.sessions.create = async (params, opts) => {
    const id = `cs_test_${Math.random().toString(36).slice(2)}${Date.now()}`;
    createdSessions.push({ id, params, opts });
    return { id, url: `https://checkout.stripe.com/c/pay/${id}` };
  };
  stripe.checkout.sessions.expire = async (id) => ({ id, status: 'expired' });
});

after(async () => {
  await disconnectDB();
  await mongod.stop();
});

const agent = () => request.agent(app);

async function login(email, password) {
  const a = agent();
  const r = await a.post('/api/auth/login').send({ email, password });
  assert.equal(r.status, 200, r.text);
  return a;
}

function signedWebhook(event) {
  const payload = JSON.stringify(event);
  const header = getStripe().webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET });
  return request(app).post('/api/webhooks/stripe').set('stripe-signature', header).set('content-type', 'application/json').send(payload);
}

const customer = { firstName: 'Ada', lastName: 'Obi', email: 'ada@example.com', phone: '(404) 555-0100' };
const address = { line1: '1 Peachtree St', line2: '', city: 'Atlanta', state: 'GA', postalCode: '30303', country: 'US' };

describe('auth & role-based access', () => {
  test('register → me → logout; duplicate email rejected', async () => {
    const a = agent();
    const r = await a.post('/api/auth/register').send({ name: 'Test User', email: 'test@example.com', password: 'Password123' });
    assert.equal(r.status, 201);
    assert.equal(r.body.user.role, 'customer');
    assert.ok(!('password' in r.body.user));
    assert.match(r.headers['set-cookie'][0], /HttpOnly/i);
    assert.equal((await a.get('/api/auth/me')).status, 200);
    const dup = await request(app).post('/api/auth/register').send({ name: 'X Y', email: 'TEST@example.com', password: 'Password123' });
    assert.equal(dup.status, 409);
    await a.post('/api/auth/logout');
    assert.equal((await a.get('/api/auth/me')).status, 401);
  });

  test('wrong password → 401 with generic message', async () => {
    const r = await request(app).post('/api/auth/login').send({ email: 'test@example.com', password: 'nope-nope' });
    assert.equal(r.status, 401);
    assert.equal(r.body.message, 'Incorrect email or password');
  });

  test('customers cannot reach admin endpoints; admins can', async () => {
    const c = await login('test@example.com', 'Password123');
    assert.equal((await c.get('/api/admin/stats')).status, 403);
    assert.equal((await c.post('/api/products').send({})).status, 403);
    assert.equal((await request(app).get('/api/admin/stats')).status, 401);
    const admin = await login('admin@ceceafricanhair.com', 'ChangeMe123!');
    const s = await admin.get('/api/admin/stats');
    assert.equal(s.status, 200);
    assert.equal(s.body.salesSeries.length, 30);
  });

  test('password reset flow issues a working one-time token', async () => {
    const r = await request(app).post('/api/auth/forgot-password').send({ email: 'test@example.com' });
    assert.equal(r.status, 200);
    assert.ok(sentEmails.some((e) => e.to === 'test@example.com' && /Reset/.test(e.subject)));
    // invalid token rejected
    const bad = await request(app).post('/api/auth/reset-password').send({ token: 'a'.repeat(64), password: 'NewPassword1' });
    assert.equal(bad.status, 400);
  });
});

describe('catalog', () => {
  test('search, category filter, price filter and sort', async () => {
    const all = await request(app).get('/api/products?limit=60');
    assert.equal(all.body.total, 34);
    const oils = await request(app).get('/api/products?category=hair-oils');
    assert.ok(oils.body.products.every((p) => p.category.slug === 'hair-oils'));
    const cheap = await request(app).get('/api/products?maxPrice=10&sort=price-asc');
    const prices = cheap.body.products.map((p) => p.priceCents);
    assert.ok(prices.every((p) => p <= 1000));
    assert.deepEqual(prices, [...prices].sort((a, b) => a - b));
    const q = await request(app).get('/api/products?q=chebe');
    assert.equal(q.body.products[0].slug, 'chebe-and-rosemary-growth-oil-4-oz');
    const regexy = await request(app).get('/api/products?q=' + encodeURIComponent('.*('));
    assert.equal(regexy.status, 200);
  });

  test('product detail includes related products', async () => {
    const r = await request(app).get('/api/products/chebe-and-rosemary-growth-oil-4-oz');
    assert.equal(r.status, 200);
    assert.ok(r.body.related.length > 0);
    assert.ok(r.body.related.every((p) => p._id !== r.body.product._id));
  });
});

describe('cart & checkout (Stripe)', () => {
  test('cart quote uses database prices and clamps to inventory', async () => {
    const p = await Product.findOne({ slug: 'braid-cleansing-foam-shampoo-8-oz' }); // inventory 3
    const r = await request(app).post('/api/cart/quote').send({ items: [{ productId: p._id.toString(), quantity: 10, priceCents: 1 }] });
    assert.equal(r.status, 200);
    assert.equal(r.body.lines[0].quantity, 3);
    assert.equal(r.body.lines[0].priceCents, p.priceCents);
    assert.equal(r.body.issues[0].type, 'insufficient_stock');
    assert.equal(r.body.totals.subtotalCents, p.priceCents * 3);
    assert.equal(r.body.totals.taxCents, Math.round(p.priceCents * 3 * 0.1));
    assert.equal(r.body.totals.shippingCents, 500);
  });

  test('checkout rejects out-of-stock and over-inventory carts', async () => {
    const out = await Product.findOne({ inventory: 0 });
    const r = await request(app).post('/api/checkout/session').send({ items: [{ productId: out._id.toString(), quantity: 1 }], customer, shippingAddress: address });
    assert.equal(r.status, 409);
    assert.equal(r.body.details[0].type, 'out_of_stock');
  });

  test('checkout validates customer + address', async () => {
    const p = await Product.findOne({ inventory: { $gt: 5 } });
    const r = await request(app)
      .post('/api/checkout/session')
      .send({ items: [{ productId: p._id.toString(), quantity: 1 }], customer: { ...customer, email: 'bad' }, shippingAddress: { ...address, postalCode: 'abc' } });
    assert.equal(r.status, 400);
  });

  let order;
  let sessionId;
  let product;
  test('creates a pending order + Stripe session with server-side prices', async () => {
    product = await Product.findOne({ slug: 'chebe-and-rosemary-growth-oil-4-oz' });
    const r = await request(app)
      .post('/api/checkout/session')
      .send({ items: [{ productId: product._id.toString(), quantity: 2, priceCents: 1, price: 0.01 }], customer, shippingAddress: address });
    assert.equal(r.status, 201, r.text);
    assert.match(r.body.url, /^https:\/\/checkout\.stripe\.com\//);
    sessionId = r.body.sessionId;
    const sent = createdSessions.at(-1);
    const productLine = sent.params.line_items[0];
    assert.equal(productLine.price_data.unit_amount, product.priceCents, 'unit price must come from DB');
    assert.equal(productLine.quantity, 2);
    const subtotal = product.priceCents * 2;
    const tax = Math.round(subtotal * 0.1);
    assert.equal(sent.params.line_items[1].price_data.unit_amount, tax);
    assert.equal(sent.params.shipping_options[0].shipping_rate_data.fixed_amount.amount, subtotal >= 7500 ? 0 : 500);
    assert.equal(sent.params.mode, 'payment');
    assert.match(sent.params.success_url, /\{CHECKOUT_SESSION_ID\}/);
    assert.ok(sent.opts.idempotencyKey);
    order = await Order.findById(r.body.orderId);
    assert.equal(order.paymentStatus, 'unpaid');
    assert.equal(order.status, 'pending_payment');
    assert.equal(order.totalCents, subtotal + tax + (subtotal >= 7500 ? 0 : 500));
    // inventory NOT touched before payment
    assert.equal((await Product.findById(product._id)).inventory, product.inventory);
  });

  test('webhook with a bad signature is rejected', async () => {
    const r = await request(app)
      .post('/api/webhooks/stripe')
      .set('stripe-signature', 't=1,v1=deadbeef')
      .set('content-type', 'application/json')
      .send(JSON.stringify({ id: 'evt_fake', type: 'checkout.session.completed', data: { object: {} } }));
    assert.equal(r.status, 400);
    assert.equal((await Order.findById(order._id)).paymentStatus, 'unpaid');
  });

  test('verified checkout.session.completed marks paid, decrements stock once (idempotent)', async () => {
    const event = {
      id: 'evt_test_paid_1',
      object: 'event',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: sessionId,
          object: 'checkout.session',
          payment_status: 'paid',
          amount_total: order.totalCents,
          payment_intent: 'pi_test_123',
          client_reference_id: order._id.toString(),
          metadata: { orderId: order._id.toString() },
        },
      },
    };
    const r1 = await signedWebhook(event);
    assert.equal(r1.status, 200, r1.text);
    const paid = await Order.findById(order._id);
    assert.equal(paid.paymentStatus, 'paid');
    assert.equal(paid.status, 'processing');
    assert.equal(paid.stripePaymentIntentId, 'pi_test_123');
    assert.equal(paid.stockIssue, false);
    const after1 = await Product.findById(product._id);
    assert.equal(after1.inventory, product.inventory - 2);
    assert.equal(after1.soldCount, product.soldCount + 2);
    assert.ok(sentEmails.some((e) => e.to === customer.email && /Order confirmed/.test(e.subject)));

    // Same event delivered again → no double processing
    const r2 = await signedWebhook(event);
    assert.equal(r2.body.duplicate, true);
    // A *different* event for the same session (e.g. async_payment_succeeded) → still no double decrement
    const r3 = await signedWebhook({ ...event, id: 'evt_test_paid_2', type: 'checkout.session.async_payment_succeeded' });
    assert.equal(r3.status, 200);
    assert.equal((await Product.findById(product._id)).inventory, product.inventory - 2);
  });

  test('order confirmation lookup by session id', async () => {
    const r = await request(app).get(`/api/checkout/session/${sessionId}`);
    assert.equal(r.status, 200);
    assert.equal(r.body.order.paymentStatus, 'paid');
    assert.ok(!('cancelTokenHash' in r.body.order));
  });

  test('expired session cancels unpaid order and never touches stock', async () => {
    const p = await Product.findOne({ slug: 'extra-hold-edge-control-2-5-oz' });
    const r = await request(app).post('/api/checkout/session').send({ items: [{ productId: p._id.toString(), quantity: 1 }], customer, shippingAddress: address });
    const ev = {
      id: 'evt_test_expired',
      type: 'checkout.session.expired',
      data: { object: { id: r.body.sessionId, payment_status: 'unpaid', metadata: { orderId: r.body.orderId } } },
    };
    assert.equal((await signedWebhook(ev)).status, 200);
    const o = await Order.findById(r.body.orderId);
    assert.equal(o.paymentStatus, 'expired');
    assert.equal(o.status, 'cancelled');
    assert.equal((await Product.findById(p._id)).inventory, p.inventory);
  });

  test('customer cancel link requires the secret token', async () => {
    const p = await Product.findOne({ slug: 'extra-hold-edge-control-2-5-oz' });
    const r = await request(app).post('/api/checkout/session').send({ items: [{ productId: p._id.toString(), quantity: 1 }], customer, shippingAddress: address });
    const token = new URL(createdSessions.at(-1).params.cancel_url).searchParams.get('token');
    assert.equal((await request(app).post('/api/checkout/cancel').send({ orderId: r.body.orderId, token: 'wrong' })).status, 404);
    const ok = await request(app).post('/api/checkout/cancel').send({ orderId: r.body.orderId, token });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.order.status, 'cancelled');
  });
});

describe('appointments', () => {
  let service;
  let slot;
  before(async () => {
    service = await Service.findOne({ slug: 'cornrows' });
    const dates = await request(app).get(`/api/appointments/available-dates?serviceId=${service._id}`);
    assert.equal(dates.status, 200);
    // choose a date at least 3 days out so the 24h cancellation window applies cleanly
    const d = dates.body.dates.find((x) => x.date >= dates.body.dates[3].date);
    const av = await request(app).get(`/api/appointments/availability?serviceId=${service._id}&date=${d.date}`);
    slot = { date: d.date, startMinutes: av.body.slots.find((s) => s.available).startMinutes };
  });

  const booking = (extra = {}) => ({ serviceId: service._id.toString(), ...slot, name: 'Zara K', email: 'zara@example.com', phone: '404-555-0111', ...extra });

  test('two simultaneous bookings for the same slot: exactly one wins (no double booking)', async () => {
    const [a, b] = await Promise.all([
      request(app).post('/api/appointments').send(booking()),
      request(app).post('/api/appointments').send(booking({ email: 'other@example.com' })),
    ]);
    const statuses = [a.status, b.status].sort();
    assert.deepEqual(statuses, [201, 409]);
    const count = await Appointment.countDocuments({ date: slot.date, startMinutes: slot.startMinutes, status: { $in: ['pending', 'confirmed'] } });
    assert.equal(count, 1);
  });

  test('booked slot shows as unavailable; overlapping start also blocked', async () => {
    const av = await request(app).get(`/api/appointments/availability?serviceId=${service._id}&date=${slot.date}`);
    assert.equal(av.body.slots.find((s) => s.startMinutes === slot.startMinutes).available, false);
    const overlap = await request(app).post('/api/appointments').send(booking({ startMinutes: slot.startMinutes + 30 }));
    assert.equal(overlap.status, 409);
  });

  test('rejects times outside opening hours / closed days', async () => {
    const bad = await request(app).post('/api/appointments').send(booking({ startMinutes: 23 * 60 }));
    assert.equal(bad.status, 400);
  });

  test('customer can view/cancel with emailed token, not without', async () => {
    const appt = await Appointment.findOne({ date: slot.date, startMinutes: slot.startMinutes, status: 'pending' });
    // re-create to obtain a raw token (only returned at creation time)
    await Appointment.deleteOne({ _id: appt._id });
    const created = await request(app).post('/api/appointments').send(booking());
    assert.equal(created.status, 201);
    const { id } = created.body.appointment;
    const token = created.body.manageToken;
    assert.equal((await request(app).get(`/api/appointments/${id}`)).status, 403);
    const view = await request(app).get(`/api/appointments/${id}?token=${token}`);
    assert.equal(view.status, 200);
    assert.equal(view.body.appointment.canCancel, true);
    const cancel = await request(app).post(`/api/appointments/${id}/cancel`).send({ token, reason: 'Change of plans' });
    assert.equal(cancel.status, 200);
    assert.equal(cancel.body.appointment.status, 'cancelled');
    // slot freed again
    const av = await request(app).get(`/api/appointments/availability?serviceId=${service._id}&date=${slot.date}`);
    assert.equal(av.body.slots.find((s) => s.startMinutes === slot.startMinutes).available, true);
  });

  test('admin can approve; customer is emailed', async () => {
    const created = await request(app).post('/api/appointments').send(booking({ email: 'approve@example.com' }));
    const admin = await login('admin@ceceafricanhair.com', 'ChangeMe123!');
    const r = await admin.patch(`/api/appointments/admin/${created.body.appointment.id}`).send({ status: 'confirmed' });
    assert.equal(r.status, 200);
    assert.equal(r.body.appointment.status, 'confirmed');
    assert.ok(sentEmails.some((e) => e.to === 'approve@example.com' && /confirmed/i.test(e.subject)));
  });
});

describe('admin product management', () => {
  test('create, update inventory, reject negative stock, delete', async () => {
    const admin = await login('admin@ceceafricanhair.com', 'ChangeMe123!');
    const cats = await request(app).get('/api/categories');
    const create = await admin.post('/api/products').send({
      name: 'Test Edge Brush',
      description: 'A brush used only in automated tests.',
      category: cats.body.categories[0]._id,
      price: 7.5,
      inventory: 4,
      images: ['/images/products/combs.webp'],
    });
    assert.equal(create.status, 201, create.text);
    assert.equal(create.body.product.priceCents, 750);
    const id = create.body.product._id;
    assert.equal((await admin.patch(`/api/products/${id}/inventory`).send({ adjust: -10 })).status, 400);
    const inv = await admin.patch(`/api/products/${id}/inventory`).send({ inventory: 12 });
    assert.equal(inv.body.product.inventory, 12);
    assert.equal((await admin.delete(`/api/products/${id}`)).status, 200);
  });

  test('mongo operator injection in body is stripped', async () => {
    const r = await request(app).post('/api/auth/login').send({ email: { $gt: '' }, password: { $gt: '' } });
    assert.equal(r.status, 400);
  });
});
