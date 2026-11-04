import { BOOKING_POLICY } from '../../../shared/business.js';
import { env } from '../config/env.js';
import { Appointment, Service, BlockedDate, ACTIVE_APPOINTMENT_STATUSES } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { randomToken, hashToken, tokenMatches, shortCode } from '../utils/tokens.js';
import { escapeRegex } from '../utils/strings.js';
import { formatMinutes, formatDateLong } from '../utils/time.js';
import {
  getSlots,
  getAvailableDates,
  assertSlotOpen,
  verifyNoOverbooking,
  withDateLock,
  withinCustomerChangeWindow,
  salonNow,
} from '../services/bookingService.js';
import { sendEmail, notifyOwner } from '../services/emailService.js';
import { appointmentEmail, ownerNewAppointmentEmail } from '../emails/templates.js';

async function loadActiveService(id) {
  const service = await Service.findById(id).lean();
  if (!service || !service.isActive) throw ApiError.notFound('Service not found');
  return service;
}

const manageUrl = (a, token) => `${env.clientUrl}/appointments/${a._id}?token=${token}`;

function publicAppointment(a) {
  const o = a.toObject ? a.toObject() : a;
  const canChange = ACTIVE_APPOINTMENT_STATUSES.includes(o.status) && withinCustomerChangeWindow(o);
  return {
    id: o._id.toString(),
    confirmationCode: o.confirmationCode,
    service: o.service?.toString?.() || o.service,
    serviceName: o.serviceName,
    priceCents: o.priceCents,
    durationMinutes: o.durationMinutes,
    date: o.date,
    startMinutes: o.startMinutes,
    endMinutes: o.endMinutes,
    timeLabel: `${formatMinutes(o.startMinutes)} – ${formatMinutes(o.endMinutes)}`,
    dateLabel: formatDateLong(o.date),
    customer: o.customer,
    notes: o.notes,
    status: o.status,
    canCancel: canChange,
    canReschedule: canChange,
    cancellationWindowHours: BOOKING_POLICY.cancellationWindowHours,
    createdAt: o.createdAt,
  };
}

// ── Public availability ─────────────────────────────────────────

export async function availability(req, res) {
  const { serviceId, date } = req.validatedQuery;
  const service = await loadActiveService(serviceId);
  const result = await getSlots(service, date, { excludeId: req.query.exclude && /^[a-f\d]{24}$/i.test(req.query.exclude) ? req.query.exclude : undefined });
  res.json({ ...result, service: { id: service._id, name: service.name, durationMinutes: service.durationMinutes } });
}

export async function availableDates(req, res) {
  const service = await loadActiveService(req.validatedQuery.serviceId);
  res.json(await getAvailableDates(service));
}

// ── Booking ─────────────────────────────────────────────────────

export async function createAppointment(req, res) {
  const { serviceId, date, startMinutes, name, email, phone, notes } = req.body;
  const service = await loadActiveService(serviceId);
  const token = randomToken(32);

  const appointment = await withDateLock(date, async () => {
    await assertSlotOpen(service, date, startMinutes);
    const created = await Appointment.create({
      confirmationCode: shortCode('APT'),
      service: service._id,
      serviceName: service.name,
      priceCents: service.priceCents,
      durationMinutes: service.durationMinutes,
      date,
      startMinutes,
      endMinutes: startMinutes + service.durationMinutes,
      customer: { name, email, phone },
      user: req.user?._id || null,
      notes,
      status: 'pending',
      manageTokenHash: hashToken(token),
      history: [{ action: 'requested', detail: 'Booked online' }],
    });
    if (!(await verifyNoOverbooking(created))) {
      await Appointment.deleteOne({ _id: created._id });
      throw ApiError.conflict('Sorry, that time was just booked by someone else. Please choose another time.');
    }
    return created;
  });

  const link = manageUrl(appointment, token);
  sendEmail({ to: email, ...appointmentEmail(appointment, { manageUrl: link }) });
  const owner = ownerNewAppointmentEmail(appointment);
  notifyOwner(owner.subject, owner.html, owner.text);

  res.status(201).json({ appointment: publicAppointment(appointment), manageToken: token });
}

/**
 * Customers can manage an appointment either with the secret token from their email link
 * or while logged in to the account that booked it.
 */
async function loadForCustomer(req) {
  const appt = await Appointment.findById(req.params.id).select('+manageTokenHash');
  if (!appt) throw ApiError.notFound('Appointment not found');
  const token = req.body?.token || req.query?.token;
  const ownsIt = req.user && (appt.user?.equals(req.user._id) || appt.customer.email === req.user.email);
  if (!(token && tokenMatches(token, appt.manageTokenHash)) && !ownsIt && req.user?.role !== 'admin') {
    throw ApiError.forbidden('This appointment link is invalid. Please use the link from your confirmation email or log in.');
  }
  return appt;
}

export async function getManagedAppointment(req, res) {
  const appt = await loadForCustomer(req);
  res.json({ appointment: publicAppointment(appt) });
}

function assertCustomerCanChange(appt) {
  if (!ACTIVE_APPOINTMENT_STATUSES.includes(appt.status)) throw ApiError.badRequest(`This appointment is already ${appt.status.replace('_', ' ')}.`);
  if (!withinCustomerChangeWindow(appt)) {
    throw ApiError.badRequest(
      `Appointments can only be changed online up to ${BOOKING_POLICY.cancellationWindowHours} hours in advance. Please call the salon.`
    );
  }
}

export async function cancelAppointment(req, res) {
  const appt = await loadForCustomer(req);
  assertCustomerCanChange(appt);
  appt.status = 'cancelled';
  appt.cancelledAt = new Date();
  appt.cancelReason = req.body.reason || 'Cancelled by client';
  appt.history.push({ action: 'cancelled', detail: appt.cancelReason });
  await appt.save();
  sendEmail({ to: appt.customer.email, ...appointmentEmail(appt, { headline: 'Your appointment has been cancelled' }) });
  notifyOwner(`Appointment cancelled: ${appt.confirmationCode}`, `<p>${appt.customer.name} cancelled ${appt.serviceName} on ${appt.date}.</p>`, `${appt.customer.name} cancelled ${appt.confirmationCode}`);
  res.json({ appointment: publicAppointment(appt) });
}

export async function rescheduleAppointment(req, res) {
  const appt = await loadForCustomer(req);
  assertCustomerCanChange(appt);
  const { date, startMinutes } = req.body;
  const service = (await Service.findById(appt.service).lean()) || { name: appt.serviceName, durationMinutes: appt.durationMinutes };
  const durationMinutes = appt.durationMinutes;

  await withDateLock(date, async () => {
    await assertSlotOpen({ ...service, durationMinutes }, date, startMinutes, appt._id);
    const before = `${appt.date} ${formatMinutes(appt.startMinutes)}`;
    appt.date = date;
    appt.startMinutes = startMinutes;
    appt.endMinutes = startMinutes + durationMinutes;
    appt.status = 'pending'; // salon re-confirms the new time
    appt.history.push({ action: 'rescheduled', detail: `From ${before} to ${date} ${formatMinutes(startMinutes)}` });
    await appt.save();
  });

  const token = req.body.token;
  sendEmail({
    to: appt.customer.email,
    ...appointmentEmail(appt, { headline: 'Your appointment has been rescheduled', manageUrl: token ? manageUrl(appt, token) : `${env.clientUrl}/account/appointments` }),
  });
  notifyOwner(`Appointment rescheduled: ${appt.confirmationCode}`, `<p>${appt.customer.name} moved ${appt.serviceName} to ${appt.date} at ${formatMinutes(appt.startMinutes)}.</p>`, 'Appointment rescheduled');
  res.json({ appointment: publicAppointment(appt) });
}

export async function myAppointments(req, res) {
  const appts = await Appointment.find({ $or: [{ user: req.user._id }, { 'customer.email': req.user.email }] })
    .sort({ date: -1, startMinutes: -1 })
    .limit(100);
  const now = salonNow();
  const list = appts.map(publicAppointment);
  res.json({
    upcoming: list.filter((a) => a.date >= now.date && ACTIVE_APPOINTMENT_STATUSES.includes(a.status)).reverse(),
    past: list.filter((a) => !(a.date >= now.date && ACTIVE_APPOINTMENT_STATUSES.includes(a.status))),
  });
}

// ── Admin ───────────────────────────────────────────────────────

export async function adminListAppointments(req, res) {
  const { status, from, to, q, page, limit } = req.validatedQuery;
  const filter = {};
  const today = salonNow().date;
  if (status === 'upcoming') {
    filter.status = { $in: ACTIVE_APPOINTMENT_STATUSES };
    filter.date = { $gte: today };
  } else if (status !== 'all') filter.status = status;
  if (from || to) filter.date = { ...(filter.date || {}), ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ 'customer.name': rx }, { 'customer.email': rx }, { 'customer.phone': rx }, { confirmationCode: rx }, { serviceName: rx }];
  }
  const sort = status === 'upcoming' ? { date: 1, startMinutes: 1 } : { date: -1, startMinutes: -1 };
  const [items, total, pendingCount] = await Promise.all([
    Appointment.find(filter).sort(sort).skip((page - 1) * limit).limit(limit),
    Appointment.countDocuments(filter),
    Appointment.countDocuments({ status: 'pending', date: { $gte: today } }),
  ]);
  res.json({
    appointments: items.map((a) => ({ ...publicAppointment(a), adminNotes: a.adminNotes, history: a.history, user: a.user })),
    total,
    page,
    pages: Math.ceil(total / limit),
    pendingCount,
  });
}

export async function adminUpdateAppointment(req, res) {
  const appt = await Appointment.findById(req.params.id);
  if (!appt) throw ApiError.notFound('Appointment not found');
  const { status, adminNotes, date, startMinutes, notifyCustomer } = req.body;
  const changes = [];

  if (date !== undefined || startMinutes !== undefined) {
    const newDate = date ?? appt.date;
    const newStart = startMinutes ?? appt.startMinutes;
    await withDateLock(newDate, async () => {
      // Admins may book any valid slot (including within the cancellation window) but never overbook.
      const { slots } = await getSlots({ durationMinutes: appt.durationMinutes, name: appt.serviceName }, newDate, { excludeId: appt._id });
      const slot = slots.find((s) => s.startMinutes === newStart);
      if (!slot) throw ApiError.badRequest('That time is outside opening hours or too soon to book.');
      if (!slot.available) throw ApiError.conflict('That time is fully booked.');
      appt.date = newDate;
      appt.startMinutes = newStart;
      appt.endMinutes = newStart + appt.durationMinutes;
      changes.push(`Rescheduled to ${newDate} ${formatMinutes(newStart)}`);
      await appt.save();
    });
  }
  if (status && status !== appt.status) {
    changes.push(`Status: ${appt.status} → ${status}`);
    appt.status = status;
    if (status === 'cancelled') appt.cancelledAt = new Date();
  }
  if (adminNotes !== undefined) appt.adminNotes = adminNotes;
  if (changes.length) appt.history.push({ action: 'admin_update', detail: changes.join('; ') });
  await appt.save();

  if (changes.length && notifyCustomer && ['confirmed', 'cancelled', 'pending', 'completed', 'no_show'].includes(appt.status)) {
    const headline =
      appt.status === 'confirmed'
        ? 'Your appointment is confirmed'
        : appt.status === 'cancelled'
          ? 'Your appointment has been cancelled'
          : changes.some((c) => c.startsWith('Rescheduled'))
            ? 'Your appointment time has changed'
            : 'Appointment update';
    await sendEmail({ to: appt.customer.email, ...appointmentEmail(appt, { headline, manageUrl: `${env.clientUrl}/account/appointments` }) });
  }
  res.json({ appointment: { ...publicAppointment(appt), adminNotes: appt.adminNotes, history: appt.history } });
}

export async function listBlockedDates(_req, res) {
  const today = salonNow().date;
  res.json({ blockedDates: await BlockedDate.find({ date: { $gte: today } }).sort({ date: 1 }).lean() });
}

export async function addBlockedDate(req, res) {
  const blocked = await BlockedDate.findOneAndUpdate({ date: req.body.date }, req.body, { upsert: true, returnDocument: 'after' });
  const affected = await Appointment.countDocuments({ date: req.body.date, status: { $in: ACTIVE_APPOINTMENT_STATUSES } });
  res.status(201).json({ blockedDate: blocked, affectedAppointments: affected });
}

export async function removeBlockedDate(req, res) {
  await BlockedDate.findByIdAndDelete(req.params.id);
  res.json({ message: 'Date reopened for booking' });
}
