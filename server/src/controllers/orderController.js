import { Order } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex } from '../utils/strings.js';
import { publicOrder } from '../services/orderService.js';
import { sendEmail } from '../services/emailService.js';
import { orderStatusEmail } from '../emails/templates.js';

const ownerFilter = (user) => ({ $or: [{ user: user._id }, { 'customer.email': user.email }] });

export async function myOrders(req, res) {
  const orders = await Order.find({ ...ownerFilter(req.user), paymentStatus: { $in: ['paid', 'refunded'] } })
    .sort({ createdAt: -1 })
    .limit(100);
  res.json({ orders: orders.map(publicOrder) });
}

export async function getOrder(req, res) {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');
  const isOwner = order.user?.equals(req.user._id) || order.customer.email === req.user.email;
  if (!isOwner && req.user.role !== 'admin') throw ApiError.notFound('Order not found');
  res.json({ order: req.user.role === 'admin' ? order : publicOrder(order) });
}

export async function adminListOrders(req, res) {
  const { status, paymentStatus, q, page, limit } = req.validatedQuery;
  const filter = {};
  if (status !== 'all') filter.status = status;
  if (paymentStatus !== 'all') filter.paymentStatus = paymentStatus;
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ orderNumber: rx }, { 'customer.email': rx }, { 'customer.firstName': rx }, { 'customer.lastName': rx }];
  }
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);
  res.json({ orders, total, page, pages: Math.ceil(total / limit) });
}

const ALLOWED_TRANSITIONS = {
  pending_payment: ['cancelled'],
  processing: ['shipped', 'delivered', 'cancelled'],
  shipped: ['delivered', 'processing'],
  delivered: ['shipped'],
  cancelled: [],
};

export async function adminUpdateOrder(req, res) {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');
  const { status, trackingNumber, carrier, note, notifyCustomer } = req.body;

  if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
  if (carrier !== undefined) order.carrier = carrier;

  let statusChanged = false;
  if (status && status !== order.status) {
    if (!ALLOWED_TRANSITIONS[order.status]?.includes(status)) {
      throw ApiError.badRequest(`Cannot change an order from "${order.status}" to "${status}".`);
    }
    if (status !== 'cancelled' && order.paymentStatus !== 'paid') {
      throw ApiError.badRequest('Only paid orders can be fulfilled.');
    }
    order.status = status;
    statusChanged = true;
  }
  if (statusChanged || note) order.statusHistory.push({ status: order.status, note: note || 'Updated by admin' });
  await order.save();

  if (statusChanged && notifyCustomer && order.paymentStatus === 'paid') {
    sendEmail({ to: order.customer.email, ...orderStatusEmail(order) });
  }
  res.json({ order });
}
