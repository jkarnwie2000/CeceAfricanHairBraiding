const moneyFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export const money = (cents) => moneyFmt.format((cents || 0) / 100);

/** Whole-dollar display for starting prices: $180 rather than $180.00 */
export const moneyShort = (cents) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: cents % 100 ? 2 : 0 }).format(
    (cents || 0) / 100
  );

export function formatMinutes(total) {
  const h24 = Math.floor(total / 60);
  const m = total % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${h24 >= 12 ? 'PM' : 'AM'}`;
}

export function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h} hr ${m} min` : `${h} hr${h > 1 ? 's' : ''}`;
}

const parseYMD = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

/** "2026-11-04" → "Wednesday, November 4, 2026" (calendar dates are salon-local, so format in UTC) */
export const formatDateLong = (ymd) =>
  new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(parseYMD(ymd));

export const formatDateShort = (ymd) =>
  new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(parseYMD(ymd));

/** ISO timestamp → "Nov 4, 2026" */
export const formatTimestamp = (iso, withTime = false) =>
  iso
    ? new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
      }).format(new Date(iso))
    : '—';

export const titleCase = (s = '') => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const ORDER_STATUS_BADGE = {
  pending_payment: 'badge-warning',
  processing: 'badge-info',
  shipped: 'badge-gold',
  delivered: 'badge-success',
  cancelled: 'badge-danger',
};
export const PAYMENT_STATUS_BADGE = {
  unpaid: 'badge-warning',
  paid: 'badge-success',
  failed: 'badge-danger',
  expired: '',
  refunded: 'badge-danger',
};
export const APPOINTMENT_STATUS_BADGE = {
  pending: 'badge-warning',
  confirmed: 'badge-success',
  completed: 'badge-info',
  cancelled: 'badge-danger',
  no_show: '',
};
