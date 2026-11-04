import { BUSINESS, BOOKING_POLICY } from '../../../shared/business.js';
import { parseHHMM, weekdayOf, minutesUntil, dayDiff, formatMinutes } from './time.js';

/**
 * Highest number of `intervals` that overlap at any instant inside [start, end).
 * Intervals are { startMinutes, endMinutes } on the same date.
 */
export function maxConcurrent(intervals, start, end) {
  const overlapping = intervals.filter((a) => a.startMinutes < end && a.endMinutes > start);
  if (!overlapping.length) return 0;
  const points = [start, ...overlapping.map((a) => a.startMinutes).filter((p) => p > start && p < end)];
  let max = 0;
  for (const p of points) {
    const n = overlapping.filter((a) => a.startMinutes <= p && a.endMinutes > p).length;
    if (n > max) max = n;
  }
  return max;
}

export function openingHoursFor(date) {
  const h = BUSINESS.hours[weekdayOf(date)];
  return h ? { open: parseHHMM(h.open), close: parseHHMM(h.close) } : null;
}

/**
 * Why a given date can't be booked (or null if it can).
 */
export function dateUnavailableReason(date, now, blockedDates = new Set()) {
  const diff = dayDiff(now.date, date);
  if (diff < 0) return 'This date is in the past.';
  if (diff > BOOKING_POLICY.maxDaysAhead) return `Bookings open up to ${BOOKING_POLICY.maxDaysAhead} days ahead.`;
  if (blockedDates.has(date)) return 'The salon is closed on this date.';
  if (!openingHoursFor(date)) return 'The salon is closed on this day of the week.';
  return null;
}

/**
 * Build every bookable start time for a date.
 * @param {object} p
 * @param {string} p.date               salon-local YYYY-MM-DD
 * @param {number} p.durationMinutes    service duration
 * @param {Array}  p.appointments       active appointments that day ({startMinutes, endMinutes})
 * @param {number} p.capacity           simultaneous clients the salon can serve
 * @param {{date:string, minutes:number}} p.now  salon-local "now"
 * @param {Set<string>} p.blockedDates
 */
export function buildSlots({ date, durationMinutes, appointments, capacity, now, blockedDates }) {
  if (dateUnavailableReason(date, now, blockedDates)) return [];
  const { open, close } = openingHoursFor(date);
  const step = BOOKING_POLICY.slotIntervalMinutes;
  const minLead = BOOKING_POLICY.minLeadHours * 60;
  const slots = [];
  for (let start = open; start + durationMinutes <= close; start += step) {
    const end = start + durationMinutes;
    if (minutesUntil(now.date, now.minutes, date, start) < minLead) continue;
    const available = maxConcurrent(appointments, start, end) < capacity;
    slots.push({ startMinutes: start, endMinutes: end, label: formatMinutes(start), available });
  }
  return slots;
}
