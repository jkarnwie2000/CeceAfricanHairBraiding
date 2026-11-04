import { BUSINESS, BOOKING_POLICY } from '../../../shared/business.js';
import { env } from '../config/env.js';
import { Appointment, ACTIVE_APPOINTMENT_STATUSES, BlockedDate } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { buildSlots, dateUnavailableReason, maxConcurrent } from '../utils/slots.js';
import { zonedNow, addDays, minutesUntil, formatMinutes, formatDateLong } from '../utils/time.js';

export const salonNow = () => zonedNow(BUSINESS.timezone);

/* ── Per-date mutex ────────────────────────────────────────────────
 * Serializes booking writes for the same date inside this process so two
 * simultaneous requests can't both pass the availability check.
 * A post-write verification (below) also protects multi-instance deployments. */
const locks = new Map();
export async function withDateLock(date, fn) {
  const previous = locks.get(date) || Promise.resolve();
  let release;
  const current = new Promise((r) => (release = r));
  const chain = previous.then(() => current);
  locks.set(date, chain);
  await previous;
  try {
    return await fn();
  } finally {
    release();
    if (locks.get(date) === chain) locks.delete(date);
  }
}

export async function blockedDateSet(fromDate, toDate) {
  const rows = await BlockedDate.find({ date: { $gte: fromDate, $lte: toDate } }).lean();
  return new Set(rows.map((r) => r.date));
}

export function activeAppointmentsOn(date, excludeId) {
  return Appointment.find({
    date,
    status: { $in: ACTIVE_APPOINTMENT_STATUSES },
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  })
    .select('startMinutes endMinutes')
    .lean();
}

export async function getSlots(service, date, { excludeId } = {}) {
  const now = salonNow();
  const [appointments, blocked] = await Promise.all([activeAppointmentsOn(date, excludeId), blockedDateSet(date, date)]);
  const reason = dateUnavailableReason(date, now, blocked);
  const slots = buildSlots({
    date,
    durationMinutes: service.durationMinutes,
    appointments,
    capacity: env.bookingCapacity,
    now,
    blockedDates: blocked,
  });
  return { date, reason, slots };
}

/** Dates in the booking window with at least one open slot for this service. */
export async function getAvailableDates(service) {
  const now = salonNow();
  const last = addDays(now.date, BOOKING_POLICY.maxDaysAhead);
  const [blocked, appts] = await Promise.all([
    blockedDateSet(now.date, last),
    Appointment.find({ date: { $gte: now.date, $lte: last }, status: { $in: ACTIVE_APPOINTMENT_STATUSES } })
      .select('date startMinutes endMinutes')
      .lean(),
  ]);
  const byDate = new Map();
  for (const a of appts) {
    if (!byDate.has(a.date)) byDate.set(a.date, []);
    byDate.get(a.date).push(a);
  }
  const dates = [];
  for (let i = 0; i <= BOOKING_POLICY.maxDaysAhead; i++) {
    const date = addDays(now.date, i);
    const slots = buildSlots({
      date,
      durationMinutes: service.durationMinutes,
      appointments: byDate.get(date) || [],
      capacity: env.bookingCapacity,
      now,
      blockedDates: blocked,
    });
    const open = slots.filter((s) => s.available).length;
    if (open > 0) dates.push({ date, openSlots: open });
  }
  return { today: now.date, lastDate: last, dates };
}

/** Throws 409 unless (date, startMinutes) is currently an open slot for the service. */
export async function assertSlotOpen(service, date, startMinutes, excludeId) {
  const { reason, slots } = await getSlots(service, date, { excludeId });
  if (reason) throw ApiError.badRequest(reason);
  const slot = slots.find((s) => s.startMinutes === startMinutes);
  if (!slot) {
    throw ApiError.badRequest(
      `${formatMinutes(startMinutes)} is not a bookable start time for ${service.name} on ${formatDateLong(date)}.`
    );
  }
  if (!slot.available) throw ApiError.conflict('Sorry, that time was just booked. Please choose another time.');
}

/**
 * Optimistic post-insert check: count active appointments created BEFORE this one
 * that overlap it. If the salon would be over capacity, the later booking loses.
 * Guarantees no double booking even across multiple server instances.
 */
export async function verifyNoOverbooking(appointment) {
  const others = await Appointment.find({
    _id: { $lt: appointment._id },
    date: appointment.date,
    status: { $in: ACTIVE_APPOINTMENT_STATUSES },
    startMinutes: { $lt: appointment.endMinutes },
    endMinutes: { $gt: appointment.startMinutes },
  })
    .select('startMinutes endMinutes')
    .lean();
  return maxConcurrent(others, appointment.startMinutes, appointment.endMinutes) < env.bookingCapacity;
}

/** Whether a customer may still cancel/reschedule (per salon policy). */
export function withinCustomerChangeWindow(appointment) {
  const now = salonNow();
  return (
    minutesUntil(now.date, now.minutes, appointment.date, appointment.startMinutes) >=
    BOOKING_POLICY.cancellationWindowHours * 60
  );
}
