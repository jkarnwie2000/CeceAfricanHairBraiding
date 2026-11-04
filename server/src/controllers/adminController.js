import { BUSINESS } from '../../../shared/business.js';
import { Order, User, Product, Appointment, Review, ContactMessage, Subscriber, ACTIVE_APPOINTMENT_STATUSES } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex } from '../utils/strings.js';
import { addDays, formatMinutes } from '../utils/time.js';
import { salonNow } from '../services/bookingService.js';

export async function dashboardStats(_req, res) {
  const now = salonNow();
  const from30 = addDays(now.date, -29);
  const monthStart = `${now.date.slice(0, 7)}-01`;
  const paid = { paymentStatus: 'paid' };

  const [totals, daily, statusCounts, recentOrders, upcoming, pendingAppts, lowStock, topProducts, customers, newCustomers, reviewStats, unreadMessages, subscribers] =
    await Promise.all([
      Order.aggregate([{ $match: paid }, { $group: { _id: null, revenue: { $sum: '$totalCents' }, orders: { $sum: 1 } } }]),
      Order.aggregate([
        { $match: { ...paid, paidAt: { $gte: new Date(Date.now() - 31 * 86400000) } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt', timezone: BUSINESS.timezone } },
            revenue: { $sum: '$totalCents' },
            orders: { $sum: 1 },
          },
        },
      ]),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Order.find({ paymentStatus: { $in: ['paid', 'refunded'] } }).sort({ createdAt: -1 }).limit(6).lean(),
      Appointment.find({ status: { $in: ACTIVE_APPOINTMENT_STATUSES }, date: { $gte: now.date } })
        .sort({ date: 1, startMinutes: 1 })
        .limit(6)
        .lean(),
      Appointment.countDocuments({ status: 'pending', date: { $gte: now.date } }),
      Product.find({ isActive: true, inventory: { $lte: 5 } }).sort({ inventory: 1 }).limit(8).select('name slug inventory images').lean(),
      Product.find({ soldCount: { $gt: 0 } }).sort({ soldCount: -1 }).limit(5).select('name slug soldCount priceCents images').lean(),
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'customer', createdAt: { $gte: new Date(Date.now() - 30 * 86400000) } }),
      Review.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }]),
      ContactMessage.countDocuments({ isRead: false }),
      Subscriber.countDocuments(),
    ]);

  const byDay = new Map(daily.map((d) => [d._id, d]));
  const series = [];
  for (let d = from30; d <= now.date; d = addDays(d, 1)) {
    series.push({ date: d, revenueCents: byDay.get(d)?.revenue || 0, orders: byDay.get(d)?.orders || 0 });
  }
  const sumFrom = (start) => series.filter((s) => s.date >= start).reduce((a, s) => a + s.revenueCents, 0);

  res.json({
    revenueCents: totals[0]?.revenue || 0,
    paidOrders: totals[0]?.orders || 0,
    averageOrderCents: totals[0]?.orders ? Math.round(totals[0].revenue / totals[0].orders) : 0,
    revenueLast30Cents: sumFrom(from30),
    revenueThisMonthCents: sumFrom(monthStart),
    salesSeries: series,
    ordersByStatus: Object.fromEntries(statusCounts.map((s) => [s._id, s.count])),
    recentOrders,
    upcomingAppointments: upcoming.map((a) => ({ ...a, timeLabel: formatMinutes(a.startMinutes) })),
    pendingAppointments: pendingAppts,
    lowStock,
    topProducts,
    customers,
    newCustomers,
    reviews: { average: reviewStats[0] ? Math.round(reviewStats[0].avg * 10) / 10 : 0, count: reviewStats[0]?.count || 0 },
    unreadMessages,
    subscribers,
  });
}

export async function listCustomers(req, res) {
  const { q, page, limit } = req.validatedQuery;
  const filter = {};
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filter),
  ]);
  const emails = users.map((u) => u.email);
  const [orderAgg, apptAgg] = await Promise.all([
    Order.aggregate([
      { $match: { paymentStatus: 'paid', 'customer.email': { $in: emails } } },
      { $group: { _id: '$customer.email', orders: { $sum: 1 }, spent: { $sum: '$totalCents' }, last: { $max: '$createdAt' } } },
    ]),
    Appointment.aggregate([{ $match: { 'customer.email': { $in: emails } } }, { $group: { _id: '$customer.email', count: { $sum: 1 } } }]),
  ]);
  const o = new Map(orderAgg.map((r) => [r._id, r]));
  const a = new Map(apptAgg.map((r) => [r._id, r.count]));
  res.json({
    customers: users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      address: u.address,
      createdAt: u.createdAt,
      orders: o.get(u.email)?.orders || 0,
      spentCents: o.get(u.email)?.spent || 0,
      lastOrderAt: o.get(u.email)?.last || null,
      appointments: a.get(u.email) || 0,
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}

export async function setUserRole(req, res) {
  if (req.params.id === req.user._id.toString()) throw ApiError.badRequest('You cannot change your own role.');
  const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { returnDocument: 'after' });
  if (!user) throw ApiError.notFound('User not found');
  res.json({ user: user.toSafeJSON() });
}

export async function listMessages(req, res) {
  const { page, limit } = req.validatedQuery;
  const [messages, total] = await Promise.all([
    ContactMessage.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ContactMessage.countDocuments(),
  ]);
  res.json({ messages, total, page, pages: Math.ceil(total / limit) });
}

export async function markMessageRead(req, res) {
  const msg = await ContactMessage.findByIdAndUpdate(req.params.id, { isRead: req.body.isRead !== false }, { returnDocument: 'after' });
  if (!msg) throw ApiError.notFound('Message not found');
  res.json({ message: msg });
}

export async function listSubscribers(_req, res) {
  res.json({ subscribers: await Subscriber.find().sort({ createdAt: -1 }).limit(1000).lean() });
}
